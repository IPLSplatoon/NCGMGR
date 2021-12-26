#![cfg_attr(
all(not(debug_assertions), target_os = "windows"),
windows_subsystem = "windows"
)]

use git2::Repository;
use tauri::{Menu, MenuItem, Submenu};

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
        },
        Err(e) => Err(format!("Failed to clone NodeCG: {}", e.to_string()))
    }
}

#[tauri::command(async)]
fn install_nodecg(handle: tauri::AppHandle, path: String) -> Result<String, String> {
    log::emit(&handle, "Starting NodeCG install...");
    clone_nodecg(&path).and_then(|_result| {
        log::emit(&handle, "Installing npm dependencies...");
        npm::install_npm_dependencies(&path).and_then(|mut child| {
            log::emit_process_output(&handle, child.stdout.take().unwrap(), child.stderr.take().unwrap());
            match child.wait_with_output() {
                Ok(result) => {
                    if result.status.success() {
                        Ok("OK".to_string())
                    } else {
                        let code = result.status.code();
                        if code.is_some() {
                            Err(format!("Installing npm dependencies failed with status code {}", code.unwrap().to_string()).to_string())
                        } else {
                            Err("Failed to install npm dependencies".to_string())
                        }
                    }
                },
                Err(_) => Err(format!("Failed to install npm dependencies"))
            }
        })
    })
}

fn main() {
    let menu = Menu::new()
        .add_native_item(MenuItem::About("NCGMGR".to_string()))
        .add_native_item(MenuItem::Quit);

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![install_nodecg])
        .menu(Menu::new().add_submenu(Submenu::new("NCGMGR", menu)))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
