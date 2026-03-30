import { useState, useMemo, useCallback } from "react";
import { AtSign, Plus, Trash2, FileText } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { SearchBar } from "@/shared/ui/SearchBar";
import { Button } from "@/shared/ui/button";
import { useSkillStore } from "@/stores/skillStore";
import { CreateSkillDialog } from "@/features/skills/ui/CreateSkillDialog";

export function SkillsView() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const skills = useSkillStore((s) => s.skills);
  const loading = useSkillStore((s) => s.loading);
  const createSkill = useSkillStore((s) => s.createSkill);
  const deleteSkill = useSkillStore((s) => s.deleteSkill);

  const lowerSearch = search.toLowerCase();
  const filtered = useMemo(
    () =>
      skills.filter(
        (s) =>
          s.name.toLowerCase().includes(lowerSearch) ||
          s.description.toLowerCase().includes(lowerSearch),
      ),
    [skills, lowerSearch],
  );

  const handleCreateSkill = useCallback(
    async (name: string, description: string, instructions: string) => {
      await createSkill({ name, description, instructions });
    },
    [createSkill],
  );

  const handleDeleteSkill = useCallback(
    async (id: string) => {
      await deleteSkill(id);
    },
    [deleteSkill],
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full px-6 py-8 space-y-5 page-transition">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Skills</h1>
            <p className="text-xs text-foreground-secondary">
              Reusable instructions for your AI agents
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              New Skill
            </Button>
          </div>
        </div>

        {/* Search */}
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search skills by name or description..."
        />

        {/* Skills list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg border border-border motion-safe:animate-pulse bg-background-secondary/50"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-foreground-secondary">
            <AtSign className="h-10 w-10 opacity-30" />
            <div className="text-center">
              <p className="text-sm font-medium">
                {skills.length === 0 ? "No skills yet" : "No matching skills"}
              </p>
              <p className="text-xs text-foreground-secondary/60 mt-1">
                {skills.length === 0
                  ? "Create a skill to get started. Skills are stored in ~/.goose/skills/."
                  : "Try a different search term."}
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-2" aria-label="Skills">
            {filtered.map((skill) => (
              <li key={skill.id}>
                <div
                  className={cn(
                    "rounded-lg border border-border transition-colors hover:bg-background-secondary/50",
                    expandedId === skill.id && "bg-background-secondary/30",
                  )}
                >
                  <div className="flex items-center justify-between px-4 py-3">
                    <button
                      type="button"
                      className="flex items-center gap-3 min-w-0 flex-1 text-left"
                      onClick={() =>
                        setExpandedId(expandedId === skill.id ? null : skill.id)
                      }
                    >
                      <FileText className="h-5 w-5 shrink-0 text-foreground-secondary" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate font-mono">
                          {skill.name}
                        </p>
                        <p className="text-xs text-foreground-secondary truncate">
                          {skill.description}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-foreground-secondary/60">
                        {skill.source}
                      </span>
                      <button
                        type="button"
                        aria-label={`Delete skill ${skill.name}`}
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="rounded-md p-1 text-foreground-secondary/60 hover:text-foreground-danger hover:bg-background-secondary transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {expandedId === skill.id && (
                    <div className="border-t border-border px-4 py-3">
                      {skill.content ? (
                        <pre className="text-xs text-foreground-secondary whitespace-pre-wrap font-mono leading-relaxed">
                          {skill.content}
                        </pre>
                      ) : (
                        <p className="text-xs text-foreground-secondary/60 italic">
                          No instructions.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CreateSkillDialog
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreateSkill={handleCreateSkill}
      />
    </div>
  );
}
