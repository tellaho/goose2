import { invoke } from "@tauri-apps/api/core";

export interface AppSettings {
  theme: string;
  accentColor: string;
  density: string;
}

export interface UpdateSettingsRequest {
  theme?: string;
  accentColor?: string;
  density?: string;
}

export async function getSettings(): Promise<AppSettings> {
  return invoke("get_settings");
}

export async function updateSettings(
  request: UpdateSettingsRequest,
): Promise<AppSettings> {
  return invoke("update_settings", { request });
}
