use std::process::Command;

pub fn install_npm_dependencies(path: &str) -> Result<String, String> {
    match Command::new("npm")
        .args(["i", "--production"])
        .current_dir(path)
        .status() {
        Ok(status) => Ok(format!("Installing npm dependencies succeeded with code \"{}\"", status)),
        Err(e) => Err(format!("Failed to install npm dependencies: {}", e.to_string()))
    }
}
