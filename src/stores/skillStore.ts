import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface Skill {
  id: string;
  name: string;
  description: string;
  source: string;
  path: string;
  content: string;
}

export interface CreateSkillRequest {
  name: string;
  description: string;
  instructions: string;
}

interface SkillStore {
  skills: Skill[];
  loading: boolean;
  error: string | null;
  loadSkills: () => Promise<void>;
  createSkill: (request: CreateSkillRequest) => Promise<Skill>;
  deleteSkill: (id: string) => Promise<void>;
  refreshSkills: () => Promise<void>;
}

export const useSkillStore = create<SkillStore>()((set) => ({
  skills: [],
  loading: false,
  error: null,

  loadSkills: async () => {
    set({ loading: true, error: null });
    try {
      const skills = await invoke<Skill[]>("list_skills");
      set({ skills, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load skills",
        loading: false,
      });
    }
  },

  createSkill: async (request) => {
    const skill = await invoke<Skill>("create_skill", { request });
    set((state) => ({
      skills: [...state.skills, skill].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }));
    return skill;
  },

  deleteSkill: async (id) => {
    await invoke("delete_skill", { id });
    set((state) => ({ skills: state.skills.filter((s) => s.id !== id) }));
  },

  refreshSkills: async () => {
    try {
      const skills = await invoke<Skill[]>("refresh_skills");
      set({ skills });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to refresh skills",
      });
    }
  },
}));
