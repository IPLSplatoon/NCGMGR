use serde::Serializer;
use std::io;
use tauri_plugin_http::reqwest;

#[derive(Debug, thiserror::Error)]
pub enum Error {
  #[error(transparent)]
  Request(#[from] reqwest::Error),
  #[error(transparent)]
  Io(#[from] io::Error),
  #[error(transparent)]
  Tauri(#[from] tauri::Error),
  #[error(transparent)]
  TauriStore(#[from] tauri_plugin_store::Error),
  #[error(transparent)]
  TauriShell(#[from] tauri_plugin_shell::Error),
  #[error(transparent)]
  Git(#[from] git2::Error),
  #[error(transparent)]
  RmRf(#[from] rm_rf::Error),

  #[error("Error installing NodeCG: {0}")]
  NodeCGInstall(String),
  #[error("Error launching NodeCG: {0}")]
  NodeCGLaunch(String),
  #[error("NodeCG install directory is not configured")]
  MissingInstallDir,
  #[error("Could not determine default install directory for NodeCG. Please select one manually.")]
  CannotCreateDefaultInstallDir,
  #[error("Bundle {0} is not installed.")]
  MissingBundle(String),
  #[error("Failed to uninstall bundle {0}: {1}")]
  BundleUninstall(String, String),
  #[error("Invalid bundle URL provided.")]
  InvalidBundleURL,

  #[error("Error installing npm dependencies: {0}")]
  NPMInstall(String),
}

impl serde::Serialize for Error {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    serializer.serialize_str(self.to_string().as_ref())
  }
}
