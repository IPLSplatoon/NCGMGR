use std::process::{Child, Command, Stdio};

pub fn install_npm_dependencies(path: &str) -> Result<Child, String> {
    Command::new("npm")
        .args(["i", "--production", "--no-progress"])
        .current_dir(path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .or_else(|_| Err("Failed to spawn npm process".to_string()))
}
