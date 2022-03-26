use std::path::Path;
use git2::{AutotagOption, FetchOptions, Remote, Repository};
use unwrap_or::unwrap_ok_or;
use std::{fs};

use crate::git;
use crate::{format_error, log, log_npm_install, npm};

#[tauri::command(async)]
pub fn install_bundle(handle: tauri::AppHandle, bundle_name: String, bundle_url: String, nodecg_path: String) -> Result<(), String> {
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
pub fn fetch_bundle_versions(bundle_name: String, nodecg_path: String) -> Result<Vec<String>, String> {
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
pub fn set_bundle_version(handle: tauri::AppHandle, bundle_name: String, version: String, nodecg_path: String) -> Result<(), String> {
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
pub fn uninstall_bundle(bundle_name: String, nodecg_path: String) -> Result<String, String> {
    match rm_rf::remove(format!("{}/bundles/{}", nodecg_path, bundle_name)) {
        Ok(_) => Ok("OK".to_string()),
        Err(e) => Err(format!("Uninstalling bundle {} failed: {}", bundle_name, e.to_string()))
    }
}
