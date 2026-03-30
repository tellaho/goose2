mod commands;
mod services;
mod types;

use commands::sidecar::SidecarState;
use services::agent_configs::AgentConfigStore;
use services::personas::PersonaStore;
use services::sessions::SessionStore;
use services::settings::SettingsStore;
use services::skills::SkillStore;
use tauri_plugin_window_state::StateFlags;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(StateFlags::all() & !StateFlags::VISIBLE)
                .build(),
        )
        .manage(SidecarState::default())
        .manage(PersonaStore::new())
        .manage(SessionStore::new())
        .manage(AgentConfigStore::new())
        .manage(SkillStore::new())
        .manage(SettingsStore::new())
        .invoke_handler(tauri::generate_handler![
            commands::sidecar::start_sidecar,
            commands::sidecar::stop_sidecar,
            commands::sidecar::get_sidecar_url,
            commands::sidecar::get_sidecar_secret,
            commands::sidecar::sidecar_health,
            commands::agents::list_personas,
            commands::agents::create_persona,
            commands::agents::update_persona,
            commands::agents::delete_persona,
            commands::agents::parse_persona_files,
            commands::agents::export_persona_to_json,
            commands::agent_configs::list_agent_configs,
            commands::agent_configs::get_agent_config,
            commands::agent_configs::create_agent_config,
            commands::agent_configs::update_agent_config,
            commands::agent_configs::delete_agent_config,
            commands::agent_configs::refresh_agent_configs,
            commands::skills::list_skills,
            commands::skills::create_skill,
            commands::skills::delete_skill,
            commands::skills::refresh_skills,
            commands::sessions::create_session,
            commands::sessions::list_sessions,
            commands::sessions::get_session_messages,
            commands::sessions::delete_session,
            commands::chat::chat_send_message,
            commands::settings::get_settings,
            commands::settings::update_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
