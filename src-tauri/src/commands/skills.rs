use crate::services::skills::SkillStore;
use crate::types::skills::{CreateSkillRequest, Skill};
use tauri::State;

#[tauri::command]
pub fn list_skills(store: State<'_, SkillStore>) -> Vec<Skill> {
    store.list()
}

#[tauri::command]
pub fn create_skill(
    store: State<'_, SkillStore>,
    request: CreateSkillRequest,
) -> Result<Skill, String> {
    store.create(request)
}

#[tauri::command]
pub fn delete_skill(store: State<'_, SkillStore>, id: String) -> Result<(), String> {
    store.delete(&id)
}

#[tauri::command]
pub fn refresh_skills(store: State<'_, SkillStore>) -> Vec<Skill> {
    store.refresh()
}
