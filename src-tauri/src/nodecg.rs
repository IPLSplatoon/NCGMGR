use std::sync::Mutex;
use tauri::api::process::{Command, CommandChild, CommandEvent};
use tauri::async_runtime::Receiver;
use unwrap_or::unwrap_ok_or;
use std::path::{PathBuf};
use git2::Repository;

use crate::log::{format_error, emit, emit_tauri_process_output};
use crate::{err_to_string, log_npm_install, npm};

const NODECG_GIT_PATH: &str = "https://github.com/nodecg/nodecg.git";
const NODECG_TAG: &str = "v1.8.1";

pub struct ManagedNodecg {
    process: Mutex<Option<CommandChild>>
}

impl ManagedNodecg {
    pub fn new() -> ManagedNodecg {
        ManagedNodecg {
            process: Mutex::new(None)
        }
    }

    pub fn start(&self, nodecg_path: &str) -> Result<Receiver<CommandEvent>, String> {
        let mut process = unwrap_ok_or!(self.process.lock(), e, { return format_error("Failed to access process", e) });

        if process.is_some() {
            return Err("NodeCG is already running.".to_string())
        }

        let child = unwrap_ok_or!(
            Command::new("node")
                .args([format!("{}/index.js", nodecg_path)])
                .current_dir(PathBuf::from(nodecg_path))
                .spawn(), e,
            { return format_error("Failed to start NodeCG", e) });
        *process = Some(child.1);

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

fn clone_nodecg(path: &str) -> Result<String, String> {
    let repository = match Repository::clone(NODECG_GIT_PATH, path) {
        Ok(repo) => repo,
        Err(e) => return format_error("Failed to clone NodeCG", e)
    };
    let (object, reference) = match repository.revparse_ext(NODECG_TAG) {
        Ok(parsed) => parsed,
        Err(e) => return format_error("Could not parse revision", e)
    };

    unwrap_ok_or!(repository.checkout_tree(&object, None), e, { return format_error(&format!("Could not check out NodeCG {}", NODECG_TAG), e) });

    match reference {
        Some(gref) => repository.set_head(gref.name().unwrap()),
        None => repository.set_head_detached(object.id())
    }
        .or_else(|e| return format_error("Failed to set HEAD", e))
        .and_then(|_| return Ok("OK".to_string()))
}

#[tauri::command(async)]
pub fn install_nodecg(handle: tauri::AppHandle, path: String) -> Result<(), String> {
    let log_key = "install-nodecg";
    emit(&handle, log_key, "Starting NodeCG install...");
    match clone_nodecg(&path).and_then(|_result| {
        npm::install_npm_dependencies(&path).and_then(|child| {
            log_npm_install(&handle, child, log_key);
            Ok(())
        })
    }) {
        Err(e) => format_error("Failed to install NodeCG", e),
        Ok(_) => Ok(())
    }
}

#[tauri::command(async)]
pub fn start_nodecg(handle: tauri::AppHandle, nodecg: tauri::State<'_, ManagedNodecg>, path: String) -> Result<String, String> {
    let log_key = "run-nodecg";
    let output = unwrap_ok_or!(nodecg.start(&path), e, { return format_error("Failed to start NodeCG", e) });
    emit_tauri_process_output(&handle, log_key, output);

    Ok("Started successfully".to_string())
}

#[tauri::command(async)]
pub fn stop_nodecg(handle: tauri::AppHandle, nodecg: tauri::State<ManagedNodecg>) -> Result<(), String> {
    let log_key = "run-nodecg";

    match nodecg.stop() {
        Ok(_) => {
            emit(&handle, log_key, "Stopped successfully");
            Ok(())
        },
        Err(e) => {
            emit(&handle, log_key, &err_to_string("Failed to stop NodeCG", e.clone()));
            Err(e)
        }
    }
}
