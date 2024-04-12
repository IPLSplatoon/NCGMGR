# Development

## Versioning bundles

For your bundle's versions to show up on NCGMGR, add your releases as tags in your remote git repository.

Read more about tagging and releases here: [GitHub](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases),
[Git](https://git-scm.com/book/en/v2/Git-Basics-Tagging)

Where it is applicable, releases following a `x.y.z` pattern for version numbers will be automatically ordered. For example,
release number `1.2.0` will be counted as newer than release number `1.1.0`.  
Parsing version numbers is done by the [semver-parser package.](https://crates.io/crates/semver-parser)

## Building and running NCGMGR

Before building NCGMGR, you must install development dependencies for Tauri. [Read more here](https://tauri.studio/v1/guides/getting-started/prerequisites)

To build the project for production use, run `yarn tauri:build`.  
On Windows, the build will create an MSI installer in the `src-tauri/target/release/bundle/msi` directory.  
On macOS, the build will create a DMG package in the `src-tauri/target/release/bundle/dmg` directory and a .app executable in the `src-tauri/target/release/bundle/macos` directory.

During development, use the `yarn tauri:serve` command to take advantage of hot-reloading and faster build times.

## Code style

NCGMGR uses ESLint to automatically enforce a consistent code style. ESLint is run automatically by GitHub Actions
when new commits are pushed to the repository, and can be used manually by running `yarn lint`

## Writing documentation

NCGMGR's documentation is powered by [MkDocs](https://www.mkdocs.org/) and hosted on [Read the Docs.](https://readthedocs.org/)  
Documentation pages are built automatically when a new pull request is created in the repository.

To preview edits made to documentation before pushing them to GitHub, [install MkDocs locally](https://www.mkdocs.org/user-guide/installation/)
and run the `mkdocs serve` command in the project root.  
To create a new documentation page, create a new `.md` file in the `docs` directory and add a reference to it under the `nav` section in the `mkdocs.yml`
configuration file.
