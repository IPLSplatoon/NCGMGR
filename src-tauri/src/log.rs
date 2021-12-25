use std::io::{BufRead, BufReader, Read};
use std::thread;
use tauri::Manager;

#[derive(Clone, serde::Serialize)]
struct LogPayload {
    message: String,
}

pub fn emit(handle: &tauri::AppHandle, msg: &str) -> () {
    handle.emit_all("log", LogPayload { message: msg.to_string() })
        .expect("Failed to emit log message");
}

pub fn emit_process_output(handle: &tauri::AppHandle, child: std::process::Child) -> () {
    emit_reader(handle, BufReader::new(child.stdout.unwrap()));
    emit_reader(handle, BufReader::new(child.stderr.unwrap()));
}

fn emit_reader<T: 'static + Read + Send>(handle: &tauri::AppHandle, reader: BufReader<T>) -> () {
    let handle_clone = handle.clone();
    thread::spawn(move || {
        reader
            .lines()
            .filter_map(|line| line.ok())
            .for_each(|line| emit(&handle_clone, &line));
    });
}
