use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use flate2::read::GzDecoder;
use sysinfo::{Pid, ProcessRefreshKind, RefreshKind, System};
use tar::Archive;
use tauri::{AppHandle, Manager};
use tauri_plugin_http::reqwest;
use tauri_plugin_shell::process::CommandChild;
use tauri_plugin_shell::ShellExt;

use crate::{config, npm};
use crate::error::Error;
use crate::log::{emit_tauri_process_output, LogEmitter};
use crate::npm::NPMPackageMetadata;

#[derive(Clone, serde::Serialize)]
pub enum NodecgStatus {
  NotRunning,
  Running
}

pub struct ManagedNodecg {
  process: Mutex<Option<CommandChild>>,
  app_handle: AppHandle,
}

impl ManagedNodecg {
  pub fn new(app_handle: AppHandle) -> Self {
    ManagedNodecg {
      process: Mutex::new(None),
      app_handle,
    }
  }

  pub fn start(&self) -> Result<(), Error> {
    let nodecg_path = config::with_config(self.app_handle.clone(), |c| Ok(c.nodecg_install_dir))?
      .ok_or(Error::MissingInstallDir)?;
    let mut lock = self
      .process
      .lock()
      .map_err(|e| Error::NodeCGLaunch(e.to_string()))?;
    let sys = System::new_with_specifics(RefreshKind::new().with_processes(ProcessRefreshKind::new()));

    if lock.is_some() && sys.process(Pid::from_u32(lock.as_ref().unwrap().pid())).is_some() {
      return Err(Error::NodeCGLaunch(
        "NodeCG is already running.".to_string(),
      ));
    }

    let logger = LogEmitter::new(&self.app_handle, "run-nodecg");
    let shell = self.app_handle.shell();
    let child = shell
      .command("node")
      .args([format!("{}/index.js", nodecg_path)])
      .current_dir(PathBuf::from(nodecg_path))
      .spawn()?;

    *lock = Some(child.1);
    emit_tauri_process_output(&logger, child.0);

    self.app_handle.emit("nodecg-status-change", NodecgStatus::Running)?;
    Ok(())
  }

  pub fn stop(&self) -> Result<(), Error> {
    let mut process = self.process.lock()
        .map_err(|e| Error::NodeCGStop(e.to_string()))?;

    if process.is_none() {
      return Ok(());
    }

    process.take().unwrap().kill()?;
    *process = None;

    self.app_handle.emit("nodecg-status-change", NodecgStatus::NotRunning)?;

    Ok(())
  }
}

#[tauri::command]
pub async fn install_nodecg(handle: AppHandle, use_default_directory: bool) -> Result<(), Error> {
  let logger = LogEmitter::stepped(&handle, "install-nodecg", 4);
  logger.emit_progress_stepped(0, "Installing NodeCG...");

  let install_dir = if use_default_directory {
    handle.path().app_local_data_dir()
      .map_err(|_| Error::CannotCreateDefaultInstallDir)?
      .join("nodecg")
      .to_str()
      .ok_or(Error::CannotCreateDefaultInstallDir)?
      .to_string()
  } else {
    config::with_config(handle.clone(), |c| Ok(c.nodecg_install_dir))?.ok_or(Error::MissingInstallDir)?
  };
  logger.emit_log(&format!("NodeCG will be installed in {}", install_dir));

  if use_default_directory {
    logger.emit_log("Cleaning install directory...");
    let install_dir_path = Path::new(&install_dir);
    rm_rf::ensure_removed(install_dir_path)?;
    fs::create_dir_all(install_dir_path)?;
    config::update_install_dir(handle.clone(), install_dir.clone())?;
  }

  logger.emit_progress("Loading version list...");
  let client = reqwest::Client::builder().build()?;
  let npm_metadata = client
    .get("https://registry.npmjs.org/nodecg/")
    .send()
    .await?
    .json::<NPMPackageMetadata>()
    .await?;

  let latest_version = match npm_metadata.dist_tags.get("latest") {
    Some(version) => version,
    None => {
      // https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md#full-metadata-format
      return Err(Error::NodeCGInstall(
        "Couldn't find latest version of NodeCG (This should never happen!)".to_string(),
      ));
    }
  };
  let tarball_url = match npm_metadata.versions.get(latest_version) {
    Some(metadata) => metadata.dist.tarball.clone(),
    None => {
      return Err(Error::NodeCGInstall(format!(
        "Latest NodeCG version ({}) was not found in npm metadata",
        latest_version
      )));
    }
  };

  logger.emit_progress_stepped(1, &format!("Downloading NodeCG {}...", latest_version));
  let tarball = client.get(tarball_url).send().await?.bytes().await?;

  logger.emit_progress_stepped(2, "Extracting archive...");
  let gz = GzDecoder::new(tarball.iter().as_slice());
  let mut archive = Archive::new(gz);
  match archive.entries().map(|entries| {
    entries
      .filter_map(|e| e.ok())
      .map(|mut entry| -> Result<(), Box<dyn std::error::Error + '_>> {
        // Skips the first directory of the archive.
        let entry_path = entry.path()?.components().skip(1).collect::<PathBuf>();
        let unpack_dir = Path::new(&install_dir).join(entry_path);
        if entry.header().entry_type() != tar::EntryType::Directory {
          if let Some(p) = unpack_dir.parent() {
            if !p.exists() {
              fs::create_dir_all(p)?;
            }
          }
        }
        entry.unpack(&unpack_dir)?;
        Ok(())
      })
  }) {
    Ok(results) => {
      let mut has_err = false;
      results.for_each(|r| {
        if let Err(err) = r {
          logger.emit_log(&format!("Error unpacking file: {}", err.to_string()));
          has_err = true;
        }
      });
      if has_err {
        return Err(Error::NodeCGInstall(
          "Received one or more errors unpacking NodeCG archive".to_string(),
        ));
      }
    }
    Err(e) => return Err(Error::Io(e)),
  }

  logger.emit_progress_stepped(3, "Installing npm dependencies...");
  let shell = handle.shell();
  let child = npm::install_npm_dependencies(shell, &install_dir)?;
  emit_tauri_process_output(&logger, child).await?;
  logger.emit_progress_stepped(4, "Done!");
  Ok(())
}

#[tauri::command(async)]
pub fn start_nodecg(
  nodecg: tauri::State<'_, ManagedNodecg>,
) -> Result<String, Error> {
  nodecg.start()?;
  Ok("Started successfully".to_string())
}

#[tauri::command(async)]
pub fn stop_nodecg(
  nodecg: tauri::State<ManagedNodecg>,
) -> Result<(), Error> {
  nodecg.stop()?;
  Ok(())
}
