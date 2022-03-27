#![cfg_attr(
all(not(debug_assertions), target_os = "windows"),
windows_subsystem = "windows"
)]

extern crate core;

use tauri::{Manager, Menu, MenuItem, RunEvent, Submenu};
use tauri::api::process::{CommandEvent};
use tauri::async_runtime::Receiver;
#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
#[cfg(target_os = "windows")]
use window_vibrancy::{apply_mica};
use crate::log::{err_to_string, format_error, LogEmitter};

mod npm;
mod log;
mod git;
mod bundles;
mod nodecg;
mod dependencies;

use nodecg::ManagedNodecg;

fn log_npm_install(logger: LogEmitter, receiver: Receiver<CommandEvent>) -> () {
    logger.emit("Installing npm dependencies...");
    log::emit_tauri_process_output(logger, receiver);
}

#[tauri::command(async)]
fn open_path_in_terminal(path: String) -> Result<(), String> {
    if cfg!(target_os = "windows") {
        return match std::process::Command::new("cmd")
            .args(["/c", "start", "cmd.exe", "/k", &format!("cd /D {}", path)])
            .spawn() {
            Ok(_) => { Ok(()) }
            Err(e) => { format_error("Failed to open path", e) }
        };
    } else if cfg!(target_os = "macos") {
        return match std::process::Command::new("open")
            .arg("-a")
            .arg("Terminal")
            .arg(path)
            .spawn() {
            Ok(_) => { Ok(()) }
            Err(e) => { format_error("Failed to open path", e) }
        };
    } else {
        // After some deliberation, I was not able to find a way to open a path in the user's
        // default terminal emulator when running Linux.
        Err("Cannot open path in terminal outside MacOS or Windows.".to_string())
    }
}

fn main() {
    let mut builder = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            nodecg::install_nodecg,
            nodecg::start_nodecg,
            nodecg::stop_nodecg,
            open_path_in_terminal,
            bundles::install_bundle,
            bundles::fetch_bundle_versions,
            bundles::set_bundle_version,
            bundles::uninstall_bundle,
            dependencies::get_nodejs_version
        ])
        .manage(ManagedNodecg::new());

    if cfg!(target_os = "macos") {
        let menu_app = Menu::new()
            .add_native_item(MenuItem::About("NCGMGR".to_string()))
            .add_native_item(MenuItem::Quit);

        let menu_edit = Menu::new()
            .add_native_item(MenuItem::Cut)
            .add_native_item(MenuItem::Copy)
            .add_native_item(MenuItem::Paste)
            .add_native_item(MenuItem::SelectAll)
            .add_native_item(MenuItem::Undo)
            .add_native_item(MenuItem::Redo);

        builder = builder.menu(Menu::new()
            .add_submenu(Submenu::new("NCGMGR", menu_app))
            .add_submenu(Submenu::new("Edit", menu_edit)));
    }

    let app = builder
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    let window = app.get_window("main").unwrap();

    #[cfg(target_os = "macos")]
    apply_vibrancy(&window, NSVisualEffectMaterial::ContentBackground).unwrap();

    if cfg!(target_os = "windows") {
        let info = os_info::get();

        let build_no = info.version().to_string().split(".").last().unwrap().to_string().parse::<i32>().unwrap();
        if build_no >= 22000 {
            #[cfg(target_os = "windows")]
            apply_mica(&window).unwrap();
        }
    }

    app.run(|handle, e| match e {
        RunEvent::ExitRequested { api, .. } => {
            let managed_nodecg = handle.state::<ManagedNodecg>();
            match managed_nodecg.stop() {
                Ok(_) => {}
                Err(e) => {
                    let logger = LogEmitter::new(&handle, "run-nodecg");
                    logger.emit(&err_to_string("Failed to shut down NodeCG", e));
                    api.prevent_exit();
                }
            }
        }
        _ => {}
    });
}
