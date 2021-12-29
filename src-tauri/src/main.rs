#![cfg_attr(
all(not(debug_assertions), target_os = "windows"),
windows_subsystem = "windows"
)]

use std::cmp::Ordering;
use git2::{Direction, Remote, Repository};
use tauri::{Menu, MenuItem, Submenu};
use std::fs;
use std::path::Path;
use std::process::Child;
use itertools::Itertools;

mod npm;
mod log;

const NODECG_GIT_PATH: &str = "https://github.com/nodecg/nodecg.git";
const NODECG_TAG: &str = "v1.8.1";

fn clone_nodecg(path: &str) -> Result<String, String> {
    match Repository::clone(NODECG_GIT_PATH, path) {
        Ok(repo) => {
            let (object, reference) = repo.revparse_ext(NODECG_TAG).expect("Object not found");

            repo.checkout_tree(&object, None).expect("Could not checkout");

            match reference {
                Some(gref) => repo.set_head(gref.name().unwrap()),
                None => repo.set_head_detached(object.id())
            }
                .expect("Failed to set HEAD");

            Ok("OK".to_string())
        }
        Err(e) => Err(format!("Failed to clone NodeCG: {}", e.to_string()))
    }
}

fn log_npm_install(handle: &tauri::AppHandle, mut child: Child, log_key: &str) -> Result<String, String> {
    log::emit(&handle, log_key, "Installing npm dependencies...");
    log::emit_process_output(&handle, log_key, child.stdout.take().unwrap(), child.stderr.take().unwrap());
    match child.wait_with_output() {
        Ok(result) => {
            if result.status.success() {
                Ok("OK".to_string())
            } else {
                let code = result.status.code();
                if code.is_some() {
                    Err(format!("Installing npm dependencies failed with status code {}", code.unwrap().to_string()))
                } else {
                    Err("Failed to install npm dependencies".to_string())
                }
            }
        }
        Err(_) => Err(format!("Failed to install npm dependencies"))
    }
}

#[tauri::command(async)]
fn install_nodecg(handle: tauri::AppHandle, path: String) -> Result<String, String> {
    let log_key = "install-nodecg";
    log::emit(&handle, log_key, "Starting NodeCG install...");
    clone_nodecg(&path).and_then(|_result| {
        npm::install_npm_dependencies(&path).and_then(|child| {
            log_npm_install(&handle, child, log_key)
        })
    })
}

#[tauri::command(async)]
fn uninstall_bundle(bundle_name: String, nodecg_path: String) -> Result<String, String> {
    match fs::remove_dir_all(format!("{}/bundles/{}", nodecg_path, bundle_name)) {
        Ok(_) => Ok("OK".to_string()),
        Err(e) => Err(format!("Uninstalling bundle {} failed: {}", bundle_name, e.to_string()))
    }
}

#[tauri::command(async)]
fn install_bundle(handle: tauri::AppHandle, bundle_name: String, bundle_url: String, nodecg_path: String) -> Result<String, String> {
    let log_key = "install-bundle";
    log::emit(&handle, log_key, &format!("Installing {}...", bundle_name));

    let dir_bundles = format!("{}/bundles", nodecg_path);
    if !Path::new(&dir_bundles).exists() {
        log::emit(&handle, log_key, "Creating missing bundles directory");
        fs::create_dir(dir_bundles).expect("Failed to create bundles directory");
    }

    log::emit(&handle, log_key, "Fetching version list...");
    let mut remote = Remote::create_detached(&bundle_url).expect("Could not create remote");
    let connection = remote.connect_auth(Direction::Fetch, None, None).expect("Could not connect to remote");
    let versions = connection
        .list().expect("Could not get version list")
        .iter()
        .filter(|item| { item.name().starts_with("refs/tags/") })
        .map(|item| item.name().split("refs/tags/").last().unwrap())
        .sorted_by(|item1, item2| {
            let version1 = semver_parser::version::parse(item1);
            let version2 = semver_parser::version::parse(item2);

            if version1.is_err() || version2.is_err() {
                Ordering::Less
            } else {
                version2.unwrap().cmp(&version1.unwrap())
            }
        }).collect_vec();

    log::emit(&handle, log_key, "Cloning repository...");
    let bundle_path = format!("{}/bundles/{}", nodecg_path, bundle_name);
    match Repository::clone(&bundle_url, bundle_path.clone()) {
        Ok(repo) => {
            if versions.len() > 1 {
                let latest_version = versions.first().unwrap();
                log::emit(&handle, log_key, &format!("Checking out version {}...", latest_version));

                let (object, reference) = repo.revparse_ext(latest_version).expect("Object not found");

                repo.checkout_tree(&object, None).expect("Could not checkout");

                match reference {
                    Some(gref) => repo.set_head(gref.name().unwrap()),
                    None => repo.set_head_detached(object.id())
                }.expect("Failed to set HEAD");
            }
        },
        Err(e) => panic!("Failed to clone bundle '{}': {}", bundle_name, e.to_string())
    }

    npm::install_npm_dependencies(&bundle_path).and_then(|child| {
        log_npm_install(&handle, child, log_key)
    })
}

fn main() {
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

    let menu = Menu::new()
        .add_submenu(Submenu::new("NCGMGR", menu_app))
        .add_submenu(Submenu::new("Edit", menu_edit));

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![install_nodecg, uninstall_bundle, install_bundle])
        .menu(menu)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
