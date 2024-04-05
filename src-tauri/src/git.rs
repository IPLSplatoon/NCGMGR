use git2::{Direction, ErrorCode, Remote, Repository};
use itertools::Itertools;
use std::cmp::Ordering;
use std::collections::BTreeMap;
use std::path::Path;

/*
 * Returns:
 * Ok(Some(Repository)) if the repository is found
 * Ok(None) if the repository is not found
 * Err if opening the repository causes a different error
 */
pub fn try_open_repository<P: AsRef<Path>>(path: P) -> Result<Option<Repository>, git2::Error> {
  match Repository::open(path) {
    Ok(repo) => Ok(Some(repo)),
    Err(e) => {
      if ErrorCode::NotFound.eq(&e.code()) {
        Ok(None)
      } else {
        Err(e)
      }
    }
  }
}

pub fn fetch_versions_for_url(remote_url: &str) -> Result<Vec<String>, git2::Error> {
  let remote = Remote::create_detached(&*remote_url)?;
  fetch_versions(remote)
}

pub fn fetch_versions(mut remote: Remote) -> Result<Vec<String>, git2::Error> {
  let connection = remote.connect_auth(Direction::Fetch, None, None)?;

  Ok(
    connection
      .list()?
      .iter()
      .filter(|item| item.name().starts_with("refs/tags/"))
      .map(|item| item.name().split("refs/tags/").last().unwrap().to_string())
      .sorted_by(|item1, item2| {
        let version1 = semver_parser::version::parse(item1);
        let version2 = semver_parser::version::parse(item2);

        if version1.is_err() || version2.is_err() {
          Ordering::Less
        } else {
          version2.unwrap().cmp(&version1.unwrap())
        }
      })
      .collect_vec(),
  )
}

pub fn checkout_version(repo: &Repository, version: String) -> Result<(), git2::Error> {
  let (object, reference) = repo.revparse_ext(&version)?;
  repo.checkout_tree(&object, None)?;
  match reference {
    Some(gref) => repo.set_head(gref.name().unwrap()),
    None => repo.set_head_detached(object.id()),
  }?;

  Ok(())
}

pub fn get_remote(repo: &Repository) -> Result<Remote, git2::Error> {
  let remotes = repo.remotes()?;
  let remote_name = remotes
    .iter()
    .filter(|remote| remote.is_some())
    .map(|remote| remote.unwrap())
    .find_or_first(|remote| remote == &"origin")
    .expect("Could not find any remotes.");

  let remote = repo.find_remote(&remote_name)?;

  Ok(remote)
}

pub fn get_tag_name_at_head(repo: &Repository) -> Result<Option<String>, git2::Error> {
  let tag_names = repo.tag_names(None)?;

  let tag_and_refs = tag_names.iter().flat_map(|name| name).flat_map(|name| {
    let full_tag = format!("refs/tags/{}", name);
    repo
      .find_reference(&full_tag)
      .map(|reference| (name, reference))
  });

  let mut refs_to_tags = BTreeMap::new();
  for (name, reference) in tag_and_refs {
    refs_to_tags
      .entry(reference)
      .or_insert_with(Vec::new)
      .push(name);
  }

  let git_ref = repo.head()?;

  Ok(
    refs_to_tags
      .get(&git_ref)
      .and_then(|tags| tags.first().and_then(|tag| Some(tag.to_string()))),
  )
}
