# NCGMGR

A NodeCG ManaGeR, built with [Tauri](https://tauri.studio/) and Vue.js.

## Features

- Install NodeCG in a specified folder or manage an existing NodeCG installation
- Launch NodeCG and view its logs in a friendly UI
- Automatically navigate to the NodeCG dashboard in a web browser
- Manage bundles in a NodeCG installation
    - Install bundles
    - Upgrade or downgrade a bundle's version
    - Automatically create and open configuration files for bundles
    - Open a bundle's path in a file explorer or terminal automatically

## Planned features

Items marked with ❓ are lower priority and still need more planning before development can be started on them, while
items marked with ❗️ are more likely to make it into releases in the near future.

- Detailed bundle configuration management
    - ❗️ Manage configuration parameters in-app by reading the config schema
- Replicant management
    - Read replicant values for the selected NodeCG instance
    - Delete replicant values, replacing them with their default values if present
    - Manually modify replicant values (following the bundle's schema)
- More support for multiple NodeCG installations
    - Save multiple NodeCG installation directories
    - Move bundles between NodeCG installs
- More options for managing bundles
    - Disable bundles without uninstalling them
- ❓ Create a directory of NodeCG bundles
    - Host a directory listing public NodeCG bundles
    - Allow hosting private directories of NodeCG bundles
