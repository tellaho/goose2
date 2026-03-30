use crate::services::agent_configs::AgentConfigStore;
use crate::types::agents::{AgentConfig, CreateAgentConfigRequest, UpdateAgentConfigRequest};
use tauri::State;

#[tauri::command]
pub fn list_agent_configs(store: State<'_, AgentConfigStore>) -> Vec<AgentConfig> {
    store.list()
}

#[tauri::command]
pub fn get_agent_config(
    store: State<'_, AgentConfigStore>,
    id: String,
) -> Result<AgentConfig, String> {
    store
        .get(&id)
        .ok_or_else(|| format!("Agent config '{}' not found", id))
}

#[tauri::command]
pub fn create_agent_config(
    store: State<'_, AgentConfigStore>,
    request: CreateAgentConfigRequest,
) -> Result<AgentConfig, String> {
    store.create(request)
}

#[tauri::command]
pub fn update_agent_config(
    store: State<'_, AgentConfigStore>,
    id: String,
    request: UpdateAgentConfigRequest,
) -> Result<AgentConfig, String> {
    store.update(&id, request)
}

#[tauri::command]
pub fn delete_agent_config(
    store: State<'_, AgentConfigStore>,
    id: String,
) -> Result<(), String> {
    store.delete(&id)
}

#[tauri::command]
pub fn refresh_agent_configs(store: State<'_, AgentConfigStore>) -> Vec<AgentConfig> {
    store.refresh()
}
