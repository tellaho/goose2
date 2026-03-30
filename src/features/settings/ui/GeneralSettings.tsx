import { Folder } from "lucide-react";

const DATA_PATHS = [
  {
    label: "Personas",
    path: "~/.goose/personas.json",
    description: "Custom persona configurations",
  },
  {
    label: "Agent Configs",
    path: "~/.goose/agents/",
    description: "Agent definition files (.md with YAML frontmatter)",
  },
  {
    label: "Skills",
    path: "~/.goose/skills/",
    description: "Skill definitions (SKILL.md files)",
  },
  {
    label: "Sessions",
    path: "~/.goose/sessions/",
    description: "Chat session history and messages",
  },
];

export function GeneralSettings() {
  return (
    <div>
      <h3 className="text-lg font-semibold">General</h3>
      <p className="mt-1 text-sm text-foreground-secondary">
        Application configuration and data storage
      </p>

      <div className="my-4 border-t" />

      <div className="space-y-1">
        <h4 className="text-sm font-medium">Data Directory</h4>
        <p className="text-xs text-foreground-secondary">
          All Goose data is stored under{" "}
          <code className="px-1 py-0.5 rounded bg-background-secondary text-[11px] font-mono">
            ~/.goose/
          </code>
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {DATA_PATHS.map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-3 rounded-lg border border-border px-4 py-3"
          >
            <Folder className="h-4 w-4 shrink-0 mt-0.5 text-foreground-secondary" />
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-foreground-secondary">
                {item.description}
              </p>
              <code className="mt-1 inline-block text-[11px] font-mono text-foreground-secondary/70">
                {item.path}
              </code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
