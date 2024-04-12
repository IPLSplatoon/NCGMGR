use crate::error::Error;
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::async_runtime::Receiver;
use tauri::Wry;
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::Shell;

#[derive(serde::Deserialize)]
pub struct NPMPackageMetadata {
  #[serde(rename = "dist-tags")]
  pub dist_tags: HashMap<String, String>,
  pub versions: HashMap<String, NPMPackageVersion>,
}

#[derive(serde::Deserialize)]
pub struct NPMPackageVersion {
  pub dist: NPMPackageVersionDist,
}

#[derive(serde::Deserialize)]
pub struct NPMPackageVersionDist {
  pub tarball: String,
}

#[cfg(target_os = "windows")]
pub fn install_npm_dependencies(
  shell: &Shell<Wry>,
  path: &str,
) -> Result<Receiver<CommandEvent>, Error> {
  let command = shell
    .command("cmd")
    .args(["/c", "npm", "i", "--omit=dev", "--no-progress", "--save=false"])
    .current_dir(PathBuf::from(path))
    .spawn();
  match command {
    Ok(cmd) => Ok(cmd.0),
    Err(e) => Err(Error::NPMInstall(e.to_string())),
  }
}

#[cfg(not(target_os = "windows"))]
pub fn install_npm_dependencies(
  shell: &Shell<Wry>,
  path: &str,
) -> Result<Receiver<CommandEvent>, Error> {
  let command = shell
    .command("npm")
    .args(["i", "--omit=dev", "--no-progress", "--save=false"])
    .current_dir(PathBuf::from(path))
    .spawn();
  match command {
    Ok(cmd) => Ok(cmd.0),
    Err(e) => Err(Error::NPMInstall(e.to_string())),
  }
}
