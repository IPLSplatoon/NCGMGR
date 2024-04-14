use std::fmt;
use std::fmt::{Display, Formatter};
use tauri::async_runtime::{spawn, JoinHandle, Receiver};
use tauri::Manager;
use tauri_plugin_shell::process::{CommandEvent, TerminatedPayload};

#[derive(Clone)]
pub struct LogEmitter {
  handle: tauri::AppHandle,
  key: String,
  max_progress_step: Option<u32>,
}

impl LogEmitter {
  pub fn new(handle: &tauri::AppHandle, key: &str) -> LogEmitter {
    LogEmitter {
      handle: handle.clone(),
      key: key.to_string(),
      max_progress_step: None,
    }
  }

  pub fn stepped(handle: &tauri::AppHandle, key: &str, max_progress_step: u32) -> LogEmitter {
    let mut emitter = LogEmitter::new(handle, key);
    emitter.max_progress_step = Some(max_progress_step);
    emitter
  }

  pub fn emit_log(&self, msg: &str) -> () {
    self
      .handle
      .emit(
        &format!("log:{}", self.key),
        LogPayload {
          message: msg.to_string(),
        },
      )
      .expect("Failed to emit log message");
  }
  
  pub fn emit_progress(&self, message: &str) -> () {
    self
      .handle
      .emit(
        &format!("progress:{}", self.key),
        ProgressPayload {
          message: message.to_string(),
          step: None,
          max_step: self.max_progress_step
        }
      )
      .expect("Failed to emit progress message");
  }

  pub fn emit_progress_stepped(&self, step: u32, message: &str) -> () {
    self
      .handle
      .emit(
        &format!("progress:{}", self.key),
        ProgressPayload {
          message: message.to_string(),
          step: Some(step),
          max_step: self.max_progress_step,
        },
      )
      .expect("Failed to emit progress message");
  }

  pub fn emit_process_closure(&self, payload: &ProcessResult) -> () {
    self
      .handle
      .emit(
        &format!("process-exit:{}", self.key),
        payload,
      )
      .expect("Failed to emit log message for process closure");
  }
}

#[derive(Clone, serde::Serialize)]
struct LogPayload {
  message: String,
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ProgressPayload {
  message: String,
  step: Option<u32>,
  max_step: Option<u32>,
}

#[derive(Clone, serde::Serialize)]
pub struct ProcessResult {
  pub code: Option<i32>,
  pub success: bool,
}

impl ProcessResult {
  fn from_terminated_payload(payload: &TerminatedPayload) -> Self {
    ProcessResult {
      code: payload.code,
      success: is_process_termination_successful(payload)
    }
  }
}

impl Display for ProcessResult {
  fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
    if let Some(code) = self.code {
      write!(f, "Process exited with code {}", code) 
    } else {
      write!(f, "Process exited")
    }
  }
}

fn is_process_termination_successful(payload: &TerminatedPayload) -> bool {
  return payload.signal.is_some()
    || payload.code.is_none()
    || (payload.code.is_some() && payload.code.unwrap().eq(&0));
}

pub fn emit_tauri_process_output(
  logger: &LogEmitter,
  mut receiver: Receiver<CommandEvent>,
) -> JoinHandle<Option<ProcessResult>> {
  let process_logger = logger.clone();
  spawn(async move {
    let mut result: Option<ProcessResult> = None;
    while let Some(item) = receiver.recv().await {
      process_logger.emit_log(&*match item {
        CommandEvent::Stderr(msg) => String::from_utf8(msg)
          .unwrap_or_else(|e| format!("Failed to decode output: {}", e.to_string())),
        CommandEvent::Stdout(msg) => String::from_utf8(msg)
          .unwrap_or_else(|e| format!("Failed to decode output: {}", e.to_string())),
        CommandEvent::Error(msg) => msg,
        CommandEvent::Terminated(payload) => {
          let process_result = ProcessResult::from_terminated_payload(&payload);
          process_logger.emit_process_closure(&process_result);
          let log_line = process_result.to_string();
          result = Some(process_result);
          log_line
        }
        _ => "".to_string(),
      })
    }
    result
  })
}

pub fn err_to_string<T: fmt::Display>(msg: &str, err: T) -> String {
  format!("{}: {}", msg, err.to_string())
}

pub fn format_error<F, T: fmt::Display>(msg: &str, err: T) -> Result<F, String> {
  Err(err_to_string(msg, err))
}
