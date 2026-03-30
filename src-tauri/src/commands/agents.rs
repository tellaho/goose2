use crate::services::persona_card;
use crate::services::personas::PersonaStore;
use crate::types::agents::*;
use tauri::State;

// ── Personas ──

#[tauri::command]
pub fn list_personas(store: State<'_, PersonaStore>) -> Vec<Persona> {
    store.list()
}

#[tauri::command]
pub fn create_persona(
    store: State<'_, PersonaStore>,
    request: CreatePersonaRequest,
) -> Result<Persona, String> {
    store.create(request)
}

#[tauri::command]
pub fn update_persona(
    store: State<'_, PersonaStore>,
    id: String,
    request: UpdatePersonaRequest,
) -> Result<Persona, String> {
    store.update(&id, request)
}

#[tauri::command]
pub fn delete_persona(store: State<'_, PersonaStore>, id: String) -> Result<(), String> {
    store.delete(&id)
}

#[tauri::command]
pub fn parse_persona_files(
    data: Vec<u8>,
    filename: String,
) -> Result<persona_card::ParseResult, String> {
    persona_card::parse_persona_bytes(&data, &filename)
}

#[tauri::command]
pub fn export_persona_to_json(
    store: State<'_, PersonaStore>,
    id: String,
) -> Result<String, String> {
    let persona = store
        .get(&id)
        .ok_or_else(|| format!("Persona '{}' not found", id))?;
    persona_card::export_persona_to_json(&persona)
}
