#![cfg_attr(
all(not(debug_assertions), target_os = "windows"),
windows_subsystem = "windows"
)]

use git2::Repository;

mod npm;

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
fn install_nodecg(path: String) -> Result<String, String> {
    clone_nodecg(&path).and_then(|_result| npm::install_npm_dependencies(&path))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![install_nodecg])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
