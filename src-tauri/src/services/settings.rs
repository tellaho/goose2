use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    #[serde(default = "default_theme")]
    pub theme: String,

    #[serde(default = "default_accent")]
    pub accent_color: String,

    #[serde(default = "default_density")]
    pub density: String,
}

fn default_theme() -> String {
    "system".to_string()
}
fn default_accent() -> String {
    "#6366f1".to_string()
}
fn default_density() -> String {
    "comfortable".to_string()
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: default_theme(),
            accent_color: default_accent(),
            density: default_density(),
        }
    }
}

pub struct SettingsStore {
    settings: Mutex<AppSettings>,
    store_path: PathBuf,
}

impl SettingsStore {
    pub fn new() -> Self {
        let store_path = dirs::home_dir()
            .expect("home dir")
            .join(".goose")
            .join("settings.json");
        let settings = Self::load_from_disk(&store_path);
        Self {
            settings: Mutex::new(settings),
            store_path,
        }
    }

    fn load_from_disk(path: &PathBuf) -> AppSettings {
        match std::fs::read_to_string(path) {
            Ok(contents) => serde_json::from_str(&contents).unwrap_or_default(),
            Err(_) => AppSettings::default(),
        }
    }

    fn save_to_disk(&self, settings: &AppSettings) {
        if let Some(parent) = self.store_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        if let Ok(json) = serde_json::to_string_pretty(settings) {
            let _ = std::fs::write(&self.store_path, json);
        }
    }

    pub fn get(&self) -> AppSettings {
        self.settings.lock().unwrap().clone()
    }

    pub fn update(&self, updates: UpdateSettingsRequest) -> AppSettings {
        let mut settings = self.settings.lock().unwrap();
        if let Some(theme) = updates.theme {
            settings.theme = theme;
        }
        if let Some(accent) = updates.accent_color {
            settings.accent_color = accent;
        }
        if let Some(density) = updates.density {
            settings.density = density;
        }
        self.save_to_disk(&settings);
        settings.clone()
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSettingsRequest {
    pub theme: Option<String>,
    pub accent_color: Option<String>,
    pub density: Option<String>,
}
