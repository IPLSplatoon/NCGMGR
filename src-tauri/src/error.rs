use serde::Serializer;
use std::{fmt, io};
use tauri_plugin_http::reqwest;

pub trait MgrErrorCause: fmt::Display + fmt::Debug {}
impl<T: fmt::Display + fmt::Debug> MgrErrorCause for T {}

#[derive(Debug, thiserror::Error)]
pub enum Error {
  #[error(transparent)]
  Request(#[from] reqwest::Error),
  #[error(transparent)]
  Io(#[from] io::Error),
  #[error("Error installing NodeCG: {0}")]
  NodeCGInstall(String),
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

#[derive(Debug)]
pub struct MgrError {
  pub description: String,
  pub cause: Option<Box<dyn MgrErrorCause>>,
}

impl MgrError {
  pub fn new(msg: &str) -> MgrError {
    MgrError {
      description: msg.to_string(),
      cause: None,
    }
  }

  pub fn boxed(self) -> Box<MgrError> {
    Box::new(self)
  }
}

impl fmt::Display for MgrError {
  fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
    if self.cause.is_none() {
      write!(f, "{}", self.description)
    } else {
      write!(f, "{}: {}", self.description, self.cause.as_ref().unwrap())
    }
  }
}

impl std::error::Error for MgrError {}
