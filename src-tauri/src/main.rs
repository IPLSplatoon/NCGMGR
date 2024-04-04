#![cfg_attr(
all(not(debug_assertions), target_os = "windows"),
windows_subsystem = "windows"
)]

use tauri::{Manager, RunEvent};
use tauri_plugin_shell::process::CommandEvent;
use tauri::async_runtime::{JoinHandle, Receiver};
use crate::log::{err_to_string, format_error, LogEmitter};

mod npm;
mod log;
mod error;
mod git;
mod bundles;
mod nodecg;
mod dependencies;

use nodecg::ManagedNodecg;

fn log_npm_install(logger: LogEmitter, receiver: Receiver<CommandEvent>) -> JoinHandle<Option<i32>> {
    logger.emit("Installing npm dependencies...");
    log::emit_tauri_process_output(logger, receiver)
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
    let _ = fix_path_env::fix();

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            app.manage(ManagedNodecg::new(app.handle().clone()));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            nodecg::install_nodecg,
            nodecg::start_nodecg,
            nodecg::stop_nodecg,
            open_path_in_terminal,
            bundles::install_bundle,
            bundles::fetch_bundle_versions,
            bundles::set_bundle_version,
            bundles::uninstall_bundle,
            bundles::get_bundle_git_tag,
            dependencies::get_nodejs_version
        ]);

    // if cfg!(target_os = "macos") {
        // let menu_app = Menu::new()
        //     .add_native_item(MenuItem::About("NCGMGR".to_string(), AboutMetadata::new()))
        //     .add_native_item(MenuItem::Quit);
        // 
        // let menu_edit = Menu::new()
        //     .add_native_item(MenuItem::Cut)
        //     .add_native_item(MenuItem::Copy)
        //     .add_native_item(MenuItem::Paste)
        //     .add_native_item(MenuItem::SelectAll)
        //     .add_native_item(MenuItem::Undo)
        //     .add_native_item(MenuItem::Redo);
        // 
        // builder = builder.menu(Menu::new()
        //     .add_submenu(Submenu::new("NCGMGR", menu_app))
        //     .add_submenu(Submenu::new("Edit", menu_edit)));
    // }

    let app = builder
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

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
