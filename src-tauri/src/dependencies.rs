use tauri::api::process::Command;

#[tauri::command(async)]
pub fn get_nodejs_version() -> Option<String> {
    let output = Command::new("node").args(["-v"]).output();

    return match output {
        Ok(output) => Some(output.stdout.trim().to_string()),
        Err(_) => None
    }
}
