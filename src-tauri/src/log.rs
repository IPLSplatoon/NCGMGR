use std::io::{BufRead, BufReader, Read};
use std::process::{ChildStderr, ChildStdout};
use std::thread;
use tauri::Manager;

#[derive(Clone, serde::Serialize)]
struct LogPayload {
    message: String,
}

pub fn emit(handle: &tauri::AppHandle, key: &str, msg: &str) -> () {
    handle.emit_all(&format!("log:{}", key), LogPayload { message: msg.to_string() })
        .expect("Failed to emit log message");
}

pub fn emit_process_output(handle: &tauri::AppHandle, log_key: &str, stdout: ChildStdout, stderr: ChildStderr) -> () {
    emit_reader(handle, log_key.clone().to_string(), BufReader::new(stdout));
    emit_reader(handle, log_key.clone().to_string(), BufReader::new(stderr));
}

fn emit_reader<T: 'static + Read + Send>(handle: &tauri::AppHandle, log_key: String, reader: BufReader<T>) -> () {
    let handle_clone = handle.clone();
    thread::spawn(move || {
        reader
            .lines()
            .filter_map(|line| line.ok())
            .for_each(|line| emit(&handle_clone, &log_key, &line));
    });
}
