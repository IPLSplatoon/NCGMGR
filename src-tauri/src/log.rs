use std::{fmt};
use tauri::api::process::{CommandEvent, TerminatedPayload};
use tauri::async_runtime::{Receiver, spawn};
use tauri::{Manager};

#[derive(Clone, serde::Serialize)]
struct LogPayload {
    message: String,
}

#[derive(Clone, serde::Serialize)]
struct ProcessClosurePayload {
    code: Option<i32>,
    success: bool,
}

fn process_termination_successful(payload: &TerminatedPayload) -> bool {
    return payload.signal.is_some() ||
        payload.code.is_none() ||
        (payload.code.is_some() && payload.code.unwrap().eq(&0));
}

fn emit_process_closure(handle: &tauri::AppHandle, key: &str, payload: &TerminatedPayload) -> () {
    handle.emit_all(&format!("process-exit:{}", key),
                    ProcessClosurePayload { code: payload.code, success: process_termination_successful(payload) })
        .expect("Failed to emit log message for process closure");
}

pub fn emit(handle: &tauri::AppHandle, key: &str, msg: &str) -> () {
    handle.emit_all(&format!("log:{}", key), LogPayload { message: msg.to_string() })
        .expect("Failed to emit log message");
}

pub fn emit_tauri_process_output(handle: &tauri::AppHandle, log_key: &'static str, mut receiver: Receiver<CommandEvent>) {
    let handle_clone = handle.clone();
    spawn(async move {
        while let Some(item) = receiver.recv().await {
            emit(&handle_clone, log_key, &*match item {
                CommandEvent::Stderr(msg) => msg,
                CommandEvent::Stdout(msg) => msg,
                CommandEvent::Error(msg) => msg,
                CommandEvent::Terminated(payload) => {
                    emit_process_closure(&handle_clone, log_key, &payload);
                    match payload.code {
                        Some(code) => format!("Process exited with code {}", code.to_string()),
                        None => "Process exited".to_string()
                    }
                }
                _ => { "".to_string() }
            })
        }
    });
}

pub fn err_to_string<T: fmt::Display>(msg: &str, err: T) -> String {
    format!("{}: {}", msg, err.to_string())
}

pub fn format_error<F, T: fmt::Display>(msg: &str, err: T) -> Result<F, String> {
    Err(err_to_string(msg, err))
}
