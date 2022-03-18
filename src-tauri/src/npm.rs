use std::path::PathBuf;
use tauri::api::process::{Command, CommandEvent};
use tauri::async_runtime::Receiver;

pub fn install_npm_dependencies(path: &str) -> Result<Receiver<CommandEvent>, String> {
    let command = Command::new("npm")
        .args(["ci", "--production", "--no-progress"])
        .current_dir(PathBuf::from(path))
        .spawn();
    match command {
        Ok(cmd) => Ok(cmd.0),
        Err(e) => Err(format!("Failed to spawn npm process: {}", e.to_string()))
    }
}
