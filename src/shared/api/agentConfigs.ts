import { invoke } from "@tauri-apps/api/core";

// Types

export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  instructions: string;
  filePath: string;
  source: string;
  lastModified: string;
}

export interface CreateAgentConfigRequest {
  name: string;
  description?: string;
  instructions: string;
}

export interface UpdateAgentConfigRequest {
  name?: string;
  description?: string;
  instructions?: string;
}

export async function listAgentConfigs(): Promise<AgentConfig[]> {
  return invoke("list_agent_configs");
}

export async function getAgentConfig(id: string): Promise<AgentConfig> {
  return invoke("get_agent_config", { id });
}

export async function createAgentConfig(
  request: CreateAgentConfigRequest,
): Promise<AgentConfig> {
  return invoke("create_agent_config", { request });
}

export async function updateAgentConfig(
  id: string,
  request: UpdateAgentConfigRequest,
): Promise<AgentConfig> {
  return invoke("update_agent_config", { id, request });
}

export async function deleteAgentConfig(id: string): Promise<void> {
  return invoke("delete_agent_config", { id });
}

export async function refreshAgentConfigs(): Promise<AgentConfig[]> {
  return invoke("refresh_agent_configs");
}
