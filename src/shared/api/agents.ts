import { invoke } from "@tauri-apps/api/core";
import type {
  Persona,
  CreatePersonaRequest,
  UpdatePersonaRequest,
} from "@/shared/types/agents";

export async function listPersonas(): Promise<Persona[]> {
  return invoke("list_personas");
}

export async function createPersona(
  request: CreatePersonaRequest,
): Promise<Persona> {
  return invoke("create_persona", { request });
}

export async function updatePersona(
  id: string,
  request: UpdatePersonaRequest,
): Promise<Persona> {
  return invoke("update_persona", { id, request });
}

export async function deletePersona(id: string): Promise<void> {
  return invoke("delete_persona", { id });
}

// ── Import / Export ──

export interface ParsedPersona {
  displayName: string;
  systemPrompt: string;
  avatarUrl?: string;
  provider?: string;
  model?: string;
}

export interface SkippedFile {
  filename: string;
  reason: string;
}

export interface ParseResult {
  personas: ParsedPersona[];
  skipped: SkippedFile[];
}

export async function parsePersonaFiles(
  data: number[],
  filename: string,
): Promise<ParseResult> {
  return invoke("parse_persona_files", { data, filename });
}

export async function exportPersonaToJson(id: string): Promise<string> {
  return invoke("export_persona_to_json", { id });
}
