use std::fs;
use std::sync::Mutex;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri::async_runtime::Receiver;
use unwrap_or::unwrap_ok_or;
use std::path::{Path, PathBuf};
use flate2::read::GzDecoder;
use sysinfo::{Pid, ProcessRefreshKind, RefreshKind, System};
use tauri_plugin_http::reqwest;
use tar::Archive;
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;

use crate::log::{format_error, emit_tauri_process_output, LogEmitter};
use crate::{err_to_string, log_npm_install, npm};
use crate::error::{MgrError, Error};
use crate::npm::NPMPackageMetadata;

pub struct ManagedNodecg {
    process: Mutex<Option<CommandChild>>,
    app_handle: AppHandle,
}

impl ManagedNodecg {
    pub fn new(app_handle: AppHandle) -> Self {
        ManagedNodecg {
            process: Mutex::new(None),
            app_handle
        }
    }

    pub fn start(&self, nodecg_path: &str) -> Result<Receiver<CommandEvent>, Box<dyn std::error::Error + '_>> {
        let mut lock = self.process.lock()?;
        let process = lock.take();
        let sys = System::new_with_specifics(RefreshKind::new().with_processes(ProcessRefreshKind::new()));

        if process.is_some() && sys.process(Pid::from_u32(process.unwrap().pid())).is_some() {
            return Err(MgrError::new("NodeCG is already running.").boxed())
        }

        let shell = self.app_handle.shell();
        let child = shell
            .command("node")
            .args([format!("{}/index.js", nodecg_path)])
            .current_dir(PathBuf::from(nodecg_path))
            .spawn()?;

        *lock = Some(child.1);

        Ok(child.0)
    }

    pub fn stop(&self) -> Result<(), String> {
        let mut process = unwrap_ok_or!(self.process.lock(), e, { return format_error("Failed to access process", e) });

        if process.is_none() {
            return Ok(())
        }

        unwrap_ok_or!(process.take().unwrap().kill(), e, { return format_error("Failed to kill process", e) });
        *process = None;

        Ok(())
    }
}

#[tauri::command(async)]
pub async fn install_nodecg(handle: AppHandle, path: String) -> Result<(), Error> {
    let logger = LogEmitter::with_progress(&handle, "install-nodecg", 4);

    logger.emit("Starting NodeCG install...");

    logger.emit("Loading version list...");
    let client = reqwest::Client::builder().build()?;
    let npm_metadata = client.get("https://registry.npmjs.org/nodecg/").send().await?.json::<NPMPackageMetadata>().await?;

    let latest_version = match npm_metadata.dist_tags.get("latest") {
        Some(version) => version,
        None => {
            // https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md#full-metadata-format
            return Err(Error::NodeCGInstall("Couldn't find latest version of NodeCG (This should never happen!)".to_string()));
        }
    };
    let tarball_url = match npm_metadata.versions.get(latest_version) {
        Some(metadata) => metadata.dist.tarball.clone(),
        None => {
            return Err(Error::NodeCGInstall(format!("Latest NodeCG version ({}) was not found in npm metadata", latest_version)));
        }
    };

    logger.emit_progress(1);

    logger.emit(&format!("Downloading NodeCG {}...", latest_version));
    let tarball = client.get(tarball_url).send().await?.bytes().await?;
    logger.emit_progress(2);

    logger.emit("Extracting archive...");
    let gz = GzDecoder::new(tarball.iter().as_slice());
    let mut archive = Archive::new(gz);
    let base_unpack_path = Path::new(&path);
    match archive.entries().map(|entries| {
        entries
            .filter_map(|e| e.ok())
            .map(|mut entry| -> Result<(), Box<dyn std::error::Error + '_>> {
                // Skips the first directory of the archive.
                let entry_path = entry.path()?.components().skip(1).collect::<PathBuf>();
                let unpack_path = base_unpack_path.join(entry_path);
                if entry.header().entry_type() != tar::EntryType::Directory {
                    if let Some(p) = unpack_path.parent() {
                        if !p.exists() {
                            fs::create_dir_all(p)?;
                        }
                    }
                }
                entry.unpack(&unpack_path)?;
                Ok(())
            })
    }) {
        Ok(results) => {
            let mut has_err = false;
            results.for_each(|r| {
                if let Err(err) = r {
                    logger.emit(&format!("Error unpacking file: {}", err.to_string()));
                    has_err = true;
                }
            });
            if has_err {
                return Err(Error::NodeCGInstall("Received one or more errors unpacking NodeCG archive".to_string()))
            }
        },
        Err(e) => return Err(Error::Io(e))
    }
    logger.emit_progress(3);

    let shell = handle.shell();
    npm::install_npm_dependencies(shell, &path).and_then(|child| {
        log_npm_install(logger, child);
        Ok(())
    })
}

#[tauri::command(async)]
pub fn start_nodecg(handle: AppHandle, nodecg: tauri::State<'_, ManagedNodecg>, path: String) -> Result<String, String> {
    let logger = LogEmitter::new(&handle, "run-nodecg");
    let output = unwrap_ok_or!(nodecg.start(&path), e, { return format_error("Failed to start NodeCG", e) });
    emit_tauri_process_output(logger, output);

    Ok("Started successfully".to_string())
}

#[tauri::command(async)]
pub fn stop_nodecg(handle: tauri::AppHandle, nodecg: tauri::State<ManagedNodecg>) -> Result<(), String> {
    let logger = LogEmitter::new(&handle, "run-nodecg");

    match nodecg.stop() {
        Ok(_) => {
            logger.emit("Stopped successfully");
            Ok(())
        },
        Err(e) => {
            logger.emit(&err_to_string("Failed to stop NodeCG", e.clone()));
            Err(e)
        }
    }
}
