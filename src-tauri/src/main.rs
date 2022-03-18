#![cfg_attr(
all(not(debug_assertions), target_os = "windows"),
windows_subsystem = "windows"
)]

extern crate core;

use git2::{AutotagOption, FetchOptions, Remote, Repository};
use tauri::{Manager, Menu, MenuItem, RunEvent, Submenu};
use tauri::api::process::{Command, CommandChild, CommandEvent};
use tauri::async_runtime::Receiver;
use std::{fs};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use unwrap_or::unwrap_ok_or;
#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
#[cfg(target_os = "windows")]
use window_vibrancy::{apply_mica};
use crate::log::{err_to_string, format_error};

mod npm;
mod log;
mod git;

const NODECG_GIT_PATH: &str = "https://github.com/nodecg/nodecg.git";
const NODECG_TAG: &str = "v1.8.1";

struct ManagedNodecg {
    process: Mutex<Option<CommandChild>>
}

impl ManagedNodecg {
    pub fn new() -> ManagedNodecg {
        ManagedNodecg {
            process: Mutex::new(None)
        }
    }

    fn start(&self, nodecg_path: &str) -> Result<Receiver<CommandEvent>, String> {
        let mut process = unwrap_ok_or!(self.process.lock(), e, { return format_error("Failed to access process", e) });

        if process.is_some() {
            return Err("NodeCG is already running.".to_string())
        }

        let child = unwrap_ok_or!(
            Command::new("node")
                .args([format!("{}/index.js", nodecg_path)])
                .current_dir(PathBuf::from(nodecg_path))
                .spawn(), e,
            { return format_error("Failed to start NodeCG", e) });
        *process = Some(child.1);

        Ok(child.0)
    }

    fn stop(&self) -> Result<(), String> {
        let mut process = unwrap_ok_or!(self.process.lock(), e, { return format_error("Failed to access process", e) });

        if process.is_none() {
            return Ok(())
        }

        unwrap_ok_or!(process.take().unwrap().kill(), e, { return format_error("Failed to kill process", e) });
        *process = None;

        Ok(())
    }
}

fn clone_nodecg(path: &str) -> Result<String, String> {
    let repository = match Repository::clone(NODECG_GIT_PATH, path) {
        Ok(repo) => repo,
        Err(e) => return format_error("Failed to clone NodeCG", e)
    };
    let (object, reference) = match repository.revparse_ext(NODECG_TAG) {
        Ok(parsed) => parsed,
        Err(e) => return format_error("Could not parse revision", e)
    };

    unwrap_ok_or!(repository.checkout_tree(&object, None), e, { return format_error(&format!("Could not check out NodeCG {}", NODECG_TAG), e) });

    match reference {
        Some(gref) => repository.set_head(gref.name().unwrap()),
        None => repository.set_head_detached(object.id())
    }
        .or_else(|e| return format_error("Failed to set HEAD", e))
        .and_then(|_| return Ok("OK".to_string()))
}

fn log_npm_install(handle: &tauri::AppHandle, receiver: Receiver<CommandEvent>, log_key: &'static str) -> () {
    log::emit(&handle, log_key, "Installing npm dependencies...");
    log::emit_tauri_process_output(&handle, log_key, receiver);
}

#[tauri::command(async)]
fn install_nodecg(handle: tauri::AppHandle, path: String) -> Result<(), String> {
    let log_key = "install-nodecg";
    log::emit(&handle, log_key, "Starting NodeCG install...");
    match clone_nodecg(&path).and_then(|_result| {
        npm::install_npm_dependencies(&path).and_then(|child| {
            log_npm_install(&handle, child, log_key);
            Ok(())
        })
    }) {
        Err(e) => format_error("Failed to install NodeCG", e),
        Ok(_) => Ok(())
    }
}

#[tauri::command(async)]
fn install_bundle(handle: tauri::AppHandle, bundle_name: String, bundle_url: String, nodecg_path: String) -> Result<(), String> {
    let log_key = "install-bundle";
    log::emit(&handle, log_key, &format!("Installing {}...", bundle_name));

    let dir_bundles = format!("{}/bundles", nodecg_path);
    if !Path::new(&dir_bundles).exists() {
        log::emit(&handle, log_key, "Creating missing bundles directory");
        unwrap_ok_or!(fs::create_dir(dir_bundles), e, { return format_error("Failed to create bundles directory", e) });
    }

    log::emit(&handle, log_key, "Fetching version list...");
    let remote = match Remote::create_detached(&bundle_url) {
        Ok(remote) => remote,
        Err(e) => return format_error("Could not create remote", e)
    };
    let versions = unwrap_ok_or!(git::fetch_versions(remote), e, { return Err(e) });

    log::emit(&handle, log_key, "Cloning repository...");
    let bundle_path = format!("{}/bundles/{}", nodecg_path, bundle_name);
    match Repository::clone(&bundle_url, bundle_path.clone()) {
        Ok(repo) => {
            if versions.len() > 1 {
                let latest_version = versions.first().unwrap();
                log::emit(&handle, log_key, &format!("Checking out version {}...", latest_version));

                unwrap_ok_or!(git::checkout_version(&repo, latest_version.to_string()), e, { return format_error("Failed to check out latest version", e) })
            }
        },
        Err(e) => return format_error(&format!("Failed to clone bundle '{}'", bundle_name), e)
    }

    match npm::install_npm_dependencies(&bundle_path).and_then(|child| {
        log_npm_install(&handle, child, log_key);
        Ok(())
    }) {
        Err(e) => format_error("Failed to install bundle", e),
        Ok(_) => Ok(())
    }
}

#[tauri::command(async)]
fn start_nodecg(handle: tauri::AppHandle, nodecg: tauri::State<'_, ManagedNodecg>, path: String) -> Result<String, String> {
    let log_key = "run-nodecg";
    let output = unwrap_ok_or!(nodecg.start(&path), e, { return format_error("Failed to start NodeCG", e) });
    log::emit_tauri_process_output(&handle, log_key, output);

    Ok("Started successfully".to_string())
}

#[tauri::command(async)]
fn stop_nodecg(handle: tauri::AppHandle, nodecg: tauri::State<ManagedNodecg>) -> Result<(), String> {
    let log_key = "run-nodecg";

    match nodecg.stop() {
        Ok(_) => {
            log::emit(&handle, log_key, "Stopped successfully");
            Ok(())
        },
        Err(e) => {
            log::emit(&handle, log_key, &err_to_string("Failed to stop NodeCG", e.clone()));
            Err(e)
        }
    }
}

#[tauri::command(async)]
fn fetch_bundle_versions(bundle_name: String, nodecg_path: String) -> Result<Vec<String>, String> {
    let bundle_dir = format!("{}/bundles/{}", nodecg_path, bundle_name);
    let path = Path::new(&bundle_dir);

    if !path.exists() {
        return Err(format!("Bundle '{}' is not installed.", bundle_name))
    }

    match Repository::open(path) {
        Ok(repo) => {
            let remote = unwrap_ok_or!(git::get_remote(&repo), e, { return format_error("Failed to get remote info", e) });

            git::fetch_versions(remote)
        },
        Err(e) => return format_error(&format!("Failed to open git repository for bundle '{}'", bundle_name), e)
    }
}

#[tauri::command(async)]
fn set_bundle_version(handle: tauri::AppHandle, bundle_name: String, version: String, nodecg_path: String) -> Result<(), String> {
    let log_key = "change-bundle-version";
    let bundle_dir = format!("{}/bundles/{}", nodecg_path, bundle_name);
    let path = Path::new(&bundle_dir);

    if !path.exists() {
        return Err(format!("Bundle '{}' is not installed.", bundle_name))
    }

    log::emit(&handle, log_key, &format!("Installing {} {}...", bundle_name, version));
    match Repository::open(path) {
        Ok(repo) => {
            let mut remote = unwrap_ok_or!(git::get_remote(&repo), e, { return format_error("Failed to get remote repository", e) });
            unwrap_ok_or!(remote.fetch(&[""], Some(FetchOptions::new().download_tags(AutotagOption::All)), None), e, return format_error("Failed to fetch version data", e));

            unwrap_ok_or!(git::checkout_version(&repo, version.clone()), e, { return format_error(&format!("Failed to checkout version {}", version), e) });
        },
        Err(e) => return format_error(&format!("Failed to open git repository for bundle '{}'", bundle_name), e)
    }

    match npm::install_npm_dependencies(&bundle_dir).and_then(|child| {
        log_npm_install(&handle, child, log_key);
        Ok(())
    }) {
        Err(e) => format_error("Failed to set bundle version", e),
        Ok(_) => Ok(())
    }
}

#[tauri::command(async)]
fn open_path_in_terminal(path: String) -> Result<(), String> {
    if cfg!(target_os = "windows") {
        return match std::process::Command::new("start")
            .arg("cmd")
            .arg("/k")
            .arg(format!("cd /d {}", path))
            .spawn() {
            Ok(_) => { Ok(()) },
            Err(e) => { format_error("Failed to open path", e) }
        }
    } else if cfg!(target_os = "macos") {
        return match std::process::Command::new("open")
            .arg("-a")
            .arg("Terminal")
            .arg(path)
            .spawn() {
            Ok(_) => { Ok(()) },
            Err(e) => { format_error("Failed to open path", e) }
        }
    } else {
        // After some deliberation, I was not able to find a way to open a path in the user's
        // default terminal emulator when running Linux.
        Err("Cannot open path in terminal outside MacOS or Windows.".to_string())
    }
}

fn main() {
    let mut builder = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            install_nodecg,
            install_bundle,
            start_nodecg,
            stop_nodecg,
            fetch_bundle_versions,
            set_bundle_version,
            open_path_in_terminal
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
                Ok(_) => {},
                Err(e) => {
                    log::emit(&handle, "run-nodecg", &err_to_string("Failed to shut down NodeCG", e));
                    api.prevent_exit();
                }
            }
        }
        _ => {}
    });
}
