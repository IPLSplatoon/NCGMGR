use std::path::Path;
use std::{fs};
use git2::{AutotagOption, FetchOptions, Repository};
use unwrap_or::unwrap_ok_or;

use crate::git;
use crate::{format_error, log_npm_install, npm};
use crate::git::{get_tag_name_at_head, try_open_repository};
use crate::log::LogEmitter;

#[tauri::command(async)]
pub fn install_bundle(handle: tauri::AppHandle, bundle_name: String, bundle_url: String, nodecg_path: String) -> Result<(), String> {
    let logger = LogEmitter::with_progress(handle, "install-bundle", 5);
    logger.emit(&format!("Installing {}...", bundle_name));

    let dir_bundles = format!("{}/bundles", nodecg_path);
    if !Path::new(&dir_bundles).exists() {
        logger.emit("Creating missing bundles directory");
        unwrap_ok_or!(fs::create_dir(dir_bundles), e, { return format_error("Failed to create bundles directory", e) });
    }
    logger.emit_progress(1);

    logger.emit("Fetching version list...");
    let versions = unwrap_ok_or!(git::fetch_versions_for_url(&bundle_url), e, { return format_error("Failed to get version list", e) });
    logger.emit_progress(2);

    logger.emit("Cloning repository...");
    let bundle_path = format!("{}/bundles/{}", nodecg_path, bundle_name);
    match Repository::clone(&bundle_url, bundle_path.clone()) {
        Ok(repo) => {
            logger.emit_progress(3);
            if versions.len() > 1 {
                let latest_version = versions.first().unwrap();
                logger.emit(&format!("Checking out version {}...", latest_version));

                unwrap_ok_or!(git::checkout_version(&repo, latest_version.to_string()), e, { return format_error("Failed to check out latest version", e) })
            }
        },
        Err(e) => return format_error(&format!("Failed to clone bundle '{}'", bundle_name), e)
    }
    logger.emit_progress(4);

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

    let repo = unwrap_ok_or!(try_open_repository(path), e, { return format_error("Failed to open repository", e) });

    if repo.is_none() {
        return Ok(Vec::new())
    } else {
        let unwrapped_repo = repo.unwrap();
        let remote = unwrap_ok_or!(git::get_remote(&unwrapped_repo), e, { return format_error("Failed to get remote info", e) });

        match git::fetch_versions(remote) {
            Ok(versions) => Ok(versions),
            Err(e) => format_error("Failed to get version list", e)
        }
    }
}

#[tauri::command(async)]
pub fn set_bundle_version(handle: tauri::AppHandle, bundle_name: String, version: String, nodecg_path: String) -> Result<(), String> {
    let logger = LogEmitter::with_progress(handle, "change-bundle-version", 4);
    let bundle_dir = format!("{}/bundles/{}", nodecg_path, bundle_name);
    let path = Path::new(&bundle_dir);

    if !path.exists() {
        return Err(format!("Bundle '{}' is not installed.", bundle_name))
    }

    logger.emit_progress(1);
    logger.emit(&format!("Installing {} {}...", bundle_name, version));
    match Repository::open(path) {
        Ok(repo) => {
            logger.emit_progress(2);
            let mut remote = unwrap_ok_or!(git::get_remote(&repo), e, { return format_error("Failed to get remote repository", e) });
            unwrap_ok_or!(remote.fetch(&[""], Some(FetchOptions::new().download_tags(AutotagOption::All)), None), e, return format_error("Failed to fetch version data", e));
            unwrap_ok_or!(git::checkout_version(&repo, version.clone()), e, { return format_error(&format!("Failed to checkout version {}", version), e) });
            logger.emit_progress(3);
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

#[tauri::command(async)]
pub fn get_bundle_git_tag(bundle_name: String, nodecg_path: String) -> Result<Option<String>, String> {
    let bundle_dir = format!("{}/bundles/{}", nodecg_path, bundle_name);
    let path = Path::new(&bundle_dir);

    if !path.exists() {
        return Err(format!("Bundle '{}' is not installed.", bundle_name))
    }

    match try_open_repository(path) {
        Ok(repo) => {
            if repo.is_some() {
                match get_tag_name_at_head(&repo.unwrap()) {
                    Ok(result) => Ok(result),
                    Err(e) => return format_error(&format!("Failed to get version for bundle '{}'", bundle_name), e)
                }
            } else {
                Ok(None)
            }
        },
        Err(e) => return format_error(&format!("Failed to open git repository for bundle '{}'", bundle_name), e)
    }
}
