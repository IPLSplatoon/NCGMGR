use git2::{AutotagOption, FetchOptions, Repository};
use std::fs;
use std::path::Path;
use tauri_plugin_shell::ShellExt;

use crate::error::Error;
use crate::git::{get_tag_name_at_head, try_open_repository};
use crate::log::LogEmitter;
use crate::{config, git, log, npm};

#[derive(PartialEq, Debug)]
struct ParsedBundleUrl {
  bundle_name: String,
  bundle_url: String,
}

fn parse_bundle_url(url: String) -> Result<ParsedBundleUrl, Error> {
  let split_url = url.split("/").collect::<Vec<&str>>();
  if split_url.len() <= 1 {
    Err(Error::InvalidBundleURL)
  } else {
    let bundle_name = split_url.last().unwrap().replace(".git", "");
    let normalized_bundle_url = if !url.ends_with(".git") {
      format!("https://github.com/{}.git", url)
    } else {
      url
    };

    Ok(ParsedBundleUrl {
      bundle_name: bundle_name.to_string(),
      bundle_url: normalized_bundle_url,
    })
  }
}

#[tauri::command]
pub async fn install_bundle(handle: tauri::AppHandle, bundle_url: String) -> Result<(), Error> {
  let logger = LogEmitter::stepped(&handle, "install-bundle", 5);
  let parsed_url = parse_bundle_url(bundle_url)?;
  logger.emit_progress_stepped(0, &format!("Installing {}...", parsed_url.bundle_name));

  let install_dir = config::with_config(handle.clone(), |c| Ok(c.nodecg_install_dir))?
    .ok_or(Error::MissingInstallDir)?;
  let dir_bundles = format!("{}/bundles", install_dir);
  if !Path::new(&dir_bundles).exists() {
    logger.emit_log("Creating missing bundles directory");
    fs::create_dir(dir_bundles)?;
  }

  logger.emit_progress_stepped(1, "Loading version list...");
  let versions = git::fetch_versions_for_url(&parsed_url.bundle_url)?;

  logger.emit_progress_stepped(2, "Cloning repository...");
  let bundle_path = format!("{}/bundles/{}", install_dir, parsed_url.bundle_name);
  let repo = Repository::clone(&parsed_url.bundle_url, bundle_path.clone())?;
  if versions.len() > 1 {
    let latest_version = versions.first().unwrap();
    logger.emit_progress_stepped(3, &format!("Checking out version {}...", latest_version));

    git::checkout_version(&repo, latest_version.to_string())?;
  }

  logger.emit_progress_stepped(4, "Installing npm dependencies...");
  let shell = handle.shell();
  let child = npm::install_npm_dependencies(shell, &bundle_path)?;
  log::emit_tauri_process_output(&logger, child).await?;
  logger.emit_progress_stepped(5, "Done!");
  Ok(())
}

#[tauri::command(async)]
pub fn fetch_bundle_versions(
  handle: tauri::AppHandle,
  bundle_name: String,
) -> Result<Vec<String>, Error> {
  let install_dir = config::with_config(handle.clone(), |c| Ok(c.nodecg_install_dir))?
    .ok_or(Error::MissingInstallDir)?;
  let bundle_dir = format!("{}/bundles/{}", install_dir, bundle_name);
  let path = Path::new(&bundle_dir);

  if !path.exists() {
    return Err(Error::MissingBundle(bundle_name));
  }

  let repo = try_open_repository(path)?;

  if repo.is_none() {
    return Ok(Vec::new());
  } else {
    let unwrapped_repo = repo.unwrap();
    let remote = git::get_remote(&unwrapped_repo)?;

    Ok(git::fetch_versions(remote)?)
  }
}

#[tauri::command(async)]
pub async fn set_bundle_version(
  handle: tauri::AppHandle,
  bundle_name: String,
  version: String,
) -> Result<(), Error> {
  let install_dir = config::with_config(handle.clone(), |c| Ok(c.nodecg_install_dir))?
    .ok_or(Error::MissingInstallDir)?;
  let logger = LogEmitter::stepped(&handle, "change-bundle-version", 2);
  logger.emit_progress_stepped(0, &format!("Installing {} {}...", bundle_name, version));
  let bundle_dir = format!("{}/bundles/{}", install_dir, bundle_name);
  let path = Path::new(&bundle_dir);

  if !path.exists() {
    return Err(Error::MissingBundle(bundle_name));
  }

  {
    let repo = Repository::open(path)?;
    let mut remote = git::get_remote(&repo)?;
    remote.fetch(
      &[""],
      Some(FetchOptions::new().download_tags(AutotagOption::All)),
      None,
    )?;
    git::checkout_version(&repo, version.clone())?;
  }

  let shell = handle.shell();
  let child = npm::install_npm_dependencies(shell, &bundle_dir)?;
  logger.emit_progress_stepped(1, "Installing npm dependencies...");
  log::emit_tauri_process_output(&logger, child).await?;
  logger.emit_progress_stepped(2, "Done!");
  Ok(())
}

#[tauri::command(async)]
pub fn uninstall_bundle(handle: tauri::AppHandle, bundle_name: String) -> Result<(), Error> {
  let install_dir = config::with_config(handle.clone(), |c| Ok(c.nodecg_install_dir))?
    .ok_or(Error::MissingInstallDir)?;

  rm_rf::remove(format!("{}/bundles/{}", install_dir, bundle_name))
    .map_err(|e| Error::BundleUninstall(bundle_name, e.to_string()))?;
  Ok(())
}

#[tauri::command(async)]
pub fn get_bundle_git_tag(
  handle: tauri::AppHandle,
  bundle_name: String,
) -> Result<Option<String>, Error> {
  let install_dir = config::with_config(handle.clone(), |c| Ok(c.nodecg_install_dir))?
    .ok_or(Error::MissingInstallDir)?;
  let bundle_dir = format!("{}/bundles/{}", install_dir, bundle_name);
  let path = Path::new(&bundle_dir);

  if !path.exists() {
    return Err(Error::MissingBundle(bundle_name));
  }

  let repo = try_open_repository(path)?;
  match repo {
    Some(repo) => get_tag_name_at_head(&repo).map_err(|e| Error::Git(e)),
    None => Ok(None),
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn parse_bundle_url_name_repo_pair() {
    assert_eq!(
      ParsedBundleUrl {
        bundle_name: "test-bundle".to_string(),
        bundle_url: "https://github.com/test-user/test-bundle.git".to_string()
      },
      parse_bundle_url("test-user/test-bundle".to_string()).unwrap()
    );
  }

  #[test]
  fn parse_bundle_url_https() {
    assert_eq!(
      ParsedBundleUrl {
        bundle_name: "NCGMGR".to_string(),
        bundle_url: "https://github.com/IPLSplatoon/NCGMGR.git".to_string()
      },
      parse_bundle_url("https://github.com/IPLSplatoon/NCGMGR.git".to_string()).unwrap()
    );
  }

  #[test]
  fn parse_bundle_url_ssh() {
    assert_eq!(
      ParsedBundleUrl {
        bundle_name: "repo".to_string(),
        bundle_url: "git@github.com:user/repo.git".to_string()
      },
      parse_bundle_url("git@github.com:user/repo.git".to_string()).unwrap()
    );
  }
}
