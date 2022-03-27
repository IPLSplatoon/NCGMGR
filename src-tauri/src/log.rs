use std::{fmt};
use tauri::api::process::{CommandEvent, TerminatedPayload};
use tauri::async_runtime::{JoinHandle, Receiver, spawn};
use tauri::{Manager};

pub struct LogEmitter {
    handle: tauri::AppHandle,
    key: String,
}

impl LogEmitter {
    pub fn new(handle: &tauri::AppHandle, key: &str) -> LogEmitter {
        LogEmitter {
            handle: handle.clone(),
            key: key.to_string(),
        }
    }

    pub fn emit(&self, msg: &str) -> () {
        self.handle.emit_all(
            &format!("log:{}", self.key),
            LogPayload { message: msg.to_string() }
        ).expect("Failed to emit log message");
    }

    pub fn emit_process_closure(&self, payload: &TerminatedPayload) -> () {
        self.handle.emit_all(
            &format!("process-exit:{}", self.key),
            ProcessClosurePayload { code: payload.code, success: is_process_termination_successful(payload) }
        ).expect("Failed to emit log message for process closure");
    }
}

#[derive(Clone, serde::Serialize)]
struct LogPayload {
    message: String,
}

#[derive(Clone, serde::Serialize)]
struct ProcessClosurePayload {
    code: Option<i32>,
    success: bool,
}

fn is_process_termination_successful(payload: &TerminatedPayload) -> bool {
    return payload.signal.is_some() || payload.code.is_none() ||
        (payload.code.is_some() && payload.code.unwrap().eq(&0));
}

pub fn emit_tauri_process_output(logger: LogEmitter, mut receiver: Receiver<CommandEvent>) -> JoinHandle<Option<i32>> {
    spawn(async move {
        let mut exit_code: Option<i32> = None;
        while let Some(item) = receiver.recv().await {
            logger.emit(&*match item {
                CommandEvent::Stderr(msg) => msg,
                CommandEvent::Stdout(msg) => msg,
                CommandEvent::Error(msg) => msg,
                CommandEvent::Terminated(payload) => {
                    logger.emit_process_closure(&payload);
                    match payload.code {
                        Some(code) => {
                            exit_code = Some(code);
                            format!("Process exited with code {}", code.to_string())
                        }
                        None => "Process exited".to_string()
                    }
                }
                _ => { "".to_string() }
            })
        }
        exit_code
    })
}

pub fn err_to_string<T: fmt::Display>(msg: &str, err: T) -> String {
    format!("{}: {}", msg, err.to_string())
}

pub fn format_error<F, T: fmt::Display>(msg: &str, err: T) -> Result<F, String> {
    Err(err_to_string(msg, err))
}
