use crate::services::settings::{AppSettings, SettingsStore, UpdateSettingsRequest};
use tauri::State;

#[tauri::command]
pub fn get_settings(store: State<'_, SettingsStore>) -> AppSettings {
    store.get()
}

#[tauri::command]
pub fn update_settings(
    store: State<'_, SettingsStore>,
    request: UpdateSettingsRequest,
) -> AppSettings {
    store.update(request)
}
