use std::cmp::Ordering;
use git2::Direction;
use itertools::Itertools;
use crate::{format_error};

pub fn fetch_versions(mut remote: git2::Remote) -> Result<Vec<String>, String> {
    let connection = match remote.connect_auth(Direction::Fetch, None, None) {
        Ok(connection) => connection,
        Err(e) => return format_error("Could not connect to remote", e)
    };

    match connection.list() {
        Ok(list) => Ok(
            list.iter()
                .filter(|item| { item.name().starts_with("refs/tags/") })
                .map(|item| item.name().split("refs/tags/").last().unwrap().to_string())
                .sorted_by(|item1, item2| {
                    let version1 = semver_parser::version::parse(item1);
                    let version2 = semver_parser::version::parse(item2);

                    if version1.is_err() || version2.is_err() {
                        Ordering::Less
                    } else {
                        version2.unwrap().cmp(&version1.unwrap())
                    }
                }).collect_vec()),
        Err(e) => format_error("Could not get version list", e)
    }
}

pub fn checkout_version(repo: &git2::Repository, version: String) -> Result<(), Box<dyn std::error::Error>> {
    let (object, reference) = repo.revparse_ext(&version)?;
    repo.checkout_tree(&object, None)?;
    match reference {
        Some(gref) => repo.set_head(gref.name().unwrap()),
        None => repo.set_head_detached(object.id())
    }?;

    Ok(())
}

pub fn get_remote(repo: &git2::Repository) -> Result<git2::Remote, Box<dyn std::error::Error>> {
    let remotes = repo.remotes()?;
    let remote_name = remotes.iter()
        .filter(|remote| { remote.is_some() })
        .map(|remote| { remote.unwrap() })
        .find_or_first(|remote| { remote == &"origin" })
        .expect("Could not find any remotes.");

    let remote = repo.find_remote(&remote_name)?;

    Ok(remote)
}