use tauri::{AppHandle, Manager, Runtime};
use tauri_plugin_store::{Store, StoreCollection, with_store};

use crate::error::Error;

static STORE_CONFIG_KEY: &str = "config";

#[derive(serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserConfig {
    pub nodecg_install_path: Option<String>,
    pub enable_error_log: bool,
}

impl Default for UserConfig {
    fn default() -> Self {
        UserConfig {
            nodecg_install_path: None,
            enable_error_log: false,
        }
    }
}

fn with_config_store<R: Runtime, T, F: FnOnce(&mut Store<R>) -> tauri_plugin_store::Result<T>>(app: AppHandle<R>, f: F) -> Result<T, Error> {
    let stores = app.state::<StoreCollection<R>>();
    let path = app.path().app_config_dir()?.join("config.json");
    with_store(app.clone(), stores, path, f).map_err(|e| Error::TauriStore(e))
}

pub fn check_config(app: AppHandle) -> Result<(), Error> {
    with_config_store(app, |store| {
        if let Some(config_value) = store.get(STORE_CONFIG_KEY) {
            if let Err(e) = serde_json::from_value::<UserConfig>(config_value.clone()) {
                println!("Error reading application config: {:?}", e);
                store.insert(STORE_CONFIG_KEY.to_string(), serde_json::to_value(UserConfig::default())?)?;
                store.save()?;
            }
        }

        Ok(())
    })
}

pub fn with_config<R: Runtime, T, F: FnOnce(UserConfig) -> tauri_plugin_store::Result<T>>(app: AppHandle<R>, f: F) -> Result<T, Error> {
    with_config_store(app, |store| {
        let config_value = store.get(STORE_CONFIG_KEY);
        let config = config_value.map_or_else(
            || Ok(UserConfig::default()),
            |c| serde_json::from_value::<UserConfig>(c.clone()))?;

        f(config)
    })
}

#[tauri::command]
pub fn update_config(app: AppHandle, config: UserConfig) -> Result<(), Error> {
    with_config_store(app, |store| {
        store.insert(STORE_CONFIG_KEY.to_string(), serde_json::to_value(config)?)?;
        store.save()?;
        Ok(())
    })
}
