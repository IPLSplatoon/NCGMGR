use tauri_plugin_shell::ShellExt;

#[tauri::command]
pub async fn get_nodejs_version(app: tauri::AppHandle) -> Option<String> {
    let shell = app.shell();
    let output = shell
        .command("node")
        .args(["-v"])
        .output()
        .await;

    return match output {
        Ok(output) => Some(
            String::from_utf8(output.stdout)
                .unwrap_or_else(|e| format!("Failed to decode command output: {}", e.to_string()))
                .trim()
                .to_string()),
        Err(_) => None
    }
}
