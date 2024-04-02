use std::fs;
use std::sync::Mutex;
use tauri::api::process::{Command, CommandChild, CommandEvent};
use tauri::async_runtime::Receiver;
use unwrap_or::unwrap_ok_or;
use std::path::{Path, PathBuf};
use flate2::read::GzDecoder;
use sysinfo::{Pid, PidExt, ProcessRefreshKind, RefreshKind, System, SystemExt};
use tauri::api::http::{ClientBuilder, HttpRequestBuilder, ResponseType};
use futures_util::TryFutureExt;
use tar::Archive;

use crate::log::{format_error, emit_tauri_process_output, LogEmitter};
use crate::{err_to_string, log_npm_install, npm};
use crate::error::MgrError;
use crate::npm::NPMPackageMetadata;

pub struct ManagedNodecg {
    process: Mutex<Option<CommandChild>>
}

impl ManagedNodecg {
    pub fn new() -> ManagedNodecg {
        ManagedNodecg {
            process: Mutex::new(None)
        }
    }

    pub fn start(&self, nodecg_path: &str) -> Result<Receiver<CommandEvent>, Box<dyn std::error::Error + '_>> {
        let mut lock = self.process.lock()?;
        let process = lock.take();
        let sys = System::new_with_specifics(RefreshKind::new().with_processes(ProcessRefreshKind::new()));

        if process.is_some() && sys.process(Pid::from_u32(process.unwrap().pid())).is_some() {
            return Err(MgrError::new("NodeCG is already running.").boxed())
        }

        let child = unwrap_ok_or!(
            Command::new("node")
                .args([format!("{}/index.js", nodecg_path)])
                .current_dir(PathBuf::from(nodecg_path))
                .spawn(), e,
            { return Err(MgrError::with_cause("Failed to start NodeCG", e).boxed()) });

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
pub async fn install_nodecg(handle: tauri::AppHandle, path: String) -> Result<(), String> {
    let logger = LogEmitter::with_progress(handle, "install-nodecg", 4);

    logger.emit("Starting NodeCG install...");

    logger.emit("Loading version list...");
    let client = match ClientBuilder::new().build() {
        Ok(client) => client,
        Err(e) => return format_error("Failed to create HTTP client", e)
    };
    let package_info_request = HttpRequestBuilder::new("GET", "https://registry.npmjs.org/nodecg/")
        .unwrap()
        .response_type(ResponseType::Json);
    let tarball_url_and_version = match client.send(package_info_request).and_then(|response| async move {
        response.read().await.and_then(|data| {
            Ok(serde_json::from_value::<NPMPackageMetadata>(data.data)?)
        })
    }).await {
        Ok(response) => {
            // According to npm, this shouldn't happen...
            // https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md#full-metadata-format
            if !response.dist_tags.contains_key("latest") {
                return Err("Couldn't find latest version of NodeCG".to_string())
            }

            let latest_version = response.dist_tags.get("latest").unwrap();
            if !response.versions.contains_key(latest_version) {
                return Err(format!("Latest NodeCG version ({}) was not found in npm metadata", latest_version))
            }
            let latest_version_metadata = response.versions.get(latest_version).unwrap();
            (latest_version_metadata.dist.tarball.clone(), latest_version.clone())
        },
        Err(e) => return format_error("Failed to get NodeCG version list", e)
    };
    logger.emit_progress(1);

    logger.emit(&format!("Downloading NodeCG {}...", tarball_url_and_version.1));
    let tarball_request = HttpRequestBuilder::new("GET", tarball_url_and_version.0)
        .unwrap()
        .response_type(ResponseType::Binary);
    let tarball_response = match client.send(tarball_request).and_then(|response| async move {
        response.bytes().await
    }).await {
        Ok(response) => response,
        Err(e) => return format_error("Failed to download NodeCG", e)
    };
    logger.emit_progress(2);

    logger.emit("Extracting archive...");
    let gz = GzDecoder::new(tarball_response.data.as_slice());
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
            .for_each(|x| {
                if let Err(err) = x {
                    logger.emit(&format!("Error unpacking file: {}", err.to_string()));
                }
            });
    }) {
        Ok(_) => { },
        Err(e) => return format_error("Failed to unpack archive", e)
    }
    logger.emit_progress(3);

    match npm::install_npm_dependencies(&path).and_then(|child| {
        log_npm_install(logger, child);
        Ok(())
    }) {
        Err(e) => format_error("Failed to install NodeCG dependencies", e),
        Ok(_) => Ok(())
    }
}

#[tauri::command(async)]
pub fn start_nodecg(handle: tauri::AppHandle, nodecg: tauri::State<'_, ManagedNodecg>, path: String) -> Result<String, String> {
    let logger = LogEmitter::new(handle, "run-nodecg");
    let output = unwrap_ok_or!(nodecg.start(&path), e, { return format_error("Failed to start NodeCG", e) });
    emit_tauri_process_output(logger, output);

    Ok("Started successfully".to_string())
}

#[tauri::command(async)]
pub fn stop_nodecg(handle: tauri::AppHandle, nodecg: tauri::State<ManagedNodecg>) -> Result<(), String> {
    let logger = LogEmitter::new(handle, "run-nodecg");

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
