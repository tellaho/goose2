import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  instructions: string;
  filePath: string;
  source: string;
  lastModified: string;
}

interface AgentConfigStore {
  agents: AgentConfig[];
  loading: boolean;
  error: string | null;
  loadAgents: () => Promise<void>;
  refreshAgents: () => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
}

const REFRESH_INTERVAL_MS = 30_000; // 30 seconds
let refreshTimer: ReturnType<typeof setInterval> | null = null;

export const useAgentConfigStore = create<AgentConfigStore>()((set) => ({
  agents: [],
  loading: false,
  error: null,

  loadAgents: async () => {
    set({ loading: true, error: null });
    try {
      const agents = await invoke<AgentConfig[]>("list_agent_configs");
      set({ agents, loading: false });

      // Set up periodic refresh if not already running
      if (!refreshTimer) {
        refreshTimer = setInterval(async () => {
          try {
            const refreshed = await invoke<AgentConfig[]>(
              "refresh_agent_configs",
            );
            set({ agents: refreshed });
          } catch {
            // Silent refresh failure — don't overwrite existing data
          }
        }, REFRESH_INTERVAL_MS);
      }
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : "Failed to load agent configs",
        loading: false,
      });
    }
  },

  refreshAgents: async () => {
    try {
      const agents = await invoke<AgentConfig[]>("refresh_agent_configs");
      set({ agents });
    } catch (err) {
      set({
        error:
          err instanceof Error
            ? err.message
            : "Failed to refresh agent configs",
      });
    }
  },

  deleteAgent: async (id) => {
    await invoke("delete_agent_config", { id });
    set((state) => ({ agents: state.agents.filter((a) => a.id !== id) }));
  },
}));
