import { useState, useEffect, useCallback, useRef } from "react";
import * as api from "@/shared/api/agentConfigs";
import type { AgentConfig } from "@/shared/api/agentConfigs";

const REFRESH_INTERVAL = 30_000; // 30 seconds

export function useAgentConfigs() {
  const [configs, setConfigs] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await api.listAgentConfigs();
      setConfigs(result);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load agent configs",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const result = await api.refreshAgentConfigs();
      setConfigs(result);
      setError(null);
    } catch (err) {
      console.error("Failed to refresh agent configs:", err);
    }
  }, []);

  // Load on mount and set up periodic refresh
  useEffect(() => {
    load();
    intervalRef.current = setInterval(refresh, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load, refresh]);

  const createConfig = useCallback(
    async (req: api.CreateAgentConfigRequest) => {
      const config = await api.createAgentConfig(req);
      setConfigs((prev) => [...prev, config]);
      return config;
    },
    [],
  );

  const updateConfig = useCallback(
    async (id: string, req: api.UpdateAgentConfigRequest) => {
      const config = await api.updateAgentConfig(id, req);
      setConfigs((prev) => prev.map((c) => (c.id === id ? config : c)));
      return config;
    },
    [],
  );

  const deleteConfig = useCallback(async (id: string) => {
    await api.deleteAgentConfig(id);
    setConfigs((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return {
    configs,
    loading,
    error,
    refresh,
    createConfig,
    updateConfig,
    deleteConfig,
  };
}
