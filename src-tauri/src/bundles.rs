use std::path::Path;
use git2::{AutotagOption, FetchOptions, Repository};
use unwrap_or::unwrap_ok_or;
use std::{fs};

use crate::git;
use crate::{format_error, log_npm_install, npm};
use crate::log::LogEmitter;

#[tauri::command(async)]
pub fn install_bundle(handle: tauri::AppHandle, bundle_name: String, bundle_url: String, nodecg_path: String) -> Result<(), String> {
    let logger = LogEmitter::new(&handle, "install-bundle");
    logger.emit(&format!("Installing {}...", bundle_name));

    let dir_bundles = format!("{}/bundles", nodecg_path);
    if !Path::new(&dir_bundles).exists() {
        logger.emit("Creating missing bundles directory");
        unwrap_ok_or!(fs::create_dir(dir_bundles), e, { return format_error("Failed to create bundles directory", e) });
    }

    logger.emit("Fetching version list...");
    let versions = unwrap_ok_or!(git::fetch_versions_for_url(&bundle_url), e, { return format_error("Failed to get version list", e) });

    logger.emit("Cloning repository...");
    let bundle_path = format!("{}/bundles/{}", nodecg_path, bundle_name);
    match Repository::clone(&bundle_url, bundle_path.clone()) {
        Ok(repo) => {
            if versions.len() > 1 {
                let latest_version = versions.first().unwrap();
                logger.emit(&format!("Checking out version {}...", latest_version));

                unwrap_ok_or!(git::checkout_version(&repo, latest_version.to_string()), e, { return format_error("Failed to check out latest version", e) })
            }
        },
        Err(e) => return format_error(&format!("Failed to clone bundle '{}'", bundle_name), e)
    }

    match npm::install_npm_dependencies(&bundle_path).and_then(|child| {
        log_npm_install(logger, child);
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

    let repo = unwrap_ok_or!(Repository::open(path), e, { return format_error("Failed to open repository", e) });
    let remote = unwrap_ok_or!(git::get_remote(&repo), e, { return format_error("Failed to get remote info", e) });

    match git::fetch_versions(remote) {
        Ok(versions) => Ok(versions),
        Err(e) => format_error("Failed to get version list", e)
    }
}

#[tauri::command(async)]
pub fn set_bundle_version(handle: tauri::AppHandle, bundle_name: String, version: String, nodecg_path: String) -> Result<(), String> {
    let logger = LogEmitter::new(&handle, "change-bundle-version");
    let bundle_dir = format!("{}/bundles/{}", nodecg_path, bundle_name);
    let path = Path::new(&bundle_dir);

    if !path.exists() {
        return Err(format!("Bundle '{}' is not installed.", bundle_name))
    }

    logger.emit(&format!("Installing {} {}...", bundle_name, version));
    match Repository::open(path) {
        Ok(repo) => {
            let mut remote = unwrap_ok_or!(git::get_remote(&repo), e, { return format_error("Failed to get remote repository", e) });
            unwrap_ok_or!(remote.fetch(&[""], Some(FetchOptions::new().download_tags(AutotagOption::All)), None), e, return format_error("Failed to fetch version data", e));

            unwrap_ok_or!(git::checkout_version(&repo, version.clone()), e, { return format_error(&format!("Failed to checkout version {}", version), e) });
        },
        Err(e) => return format_error(&format!("Failed to open git repository for bundle '{}'", bundle_name), e)
    }

    match npm::install_npm_dependencies(&bundle_dir).and_then(|child| {
        log_npm_install(logger, child);
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
