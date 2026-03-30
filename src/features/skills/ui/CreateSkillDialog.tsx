import { useState, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

interface CreateSkillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSkill: (
    name: string,
    description: string,
    instructions: string,
  ) => Promise<void>;
}

const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function toKebab(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CreateSkillDialog({
  isOpen,
  onClose,
  onCreateSkill,
}: CreateSkillDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const formattedName = toKebab(name);
  const isNameValid = formattedName.length > 0 && KEBAB_RE.test(formattedName);
  const isValid = isNameValid && description.trim().length > 0;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Auto-format: lowercase, replace invalid chars with hyphens
    setName(
      raw
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/--+/g, "-"),
    );
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValid) return;

      setIsPending(true);
      setError("");

      try {
        await onCreateSkill(
          formattedName,
          description.trim(),
          instructions.trim(),
        );
        // Reset and close
        setName("");
        setDescription("");
        setInstructions("");
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create skill");
      } finally {
        setIsPending(false);
      }
    },
    [isValid, formattedName, description, instructions, onCreateSkill, onClose],
  );

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create skill"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        className="absolute inset-0 bg-black/40 motion-safe:animate-in motion-safe:fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-xl border border-border bg-background shadow-xl",
          "max-h-[85vh] overflow-y-auto",
          "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">New Skill</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-1 text-foreground-secondary hover:bg-background-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {/* Name */}
          <label className="block space-y-1">
            <span className="text-xs font-medium text-foreground-secondary">
              Name <span className="text-foreground-danger">*</span>
            </span>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              required
              placeholder="my-skill-name"
              className={cn(
                "w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm font-mono",
                "placeholder:text-foreground-secondary/40",
                "focus:outline-none focus:ring-1 focus:ring-ring transition-colors",
              )}
            />
            <p className="text-[10px] text-foreground-secondary/60">
              Kebab-case only (e.g. my-skill-name). Stored at ~/.goose/skills/
              {formattedName || "..."}/SKILL.md
            </p>
          </label>

          {/* Description */}
          <label className="block space-y-1">
            <span className="text-xs font-medium text-foreground-secondary">
              Description <span className="text-foreground-danger">*</span>
            </span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="What this skill does"
              className={cn(
                "w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm",
                "placeholder:text-foreground-secondary/40",
                "focus:outline-none focus:ring-1 focus:ring-ring transition-colors",
              )}
            />
          </label>

          {/* Instructions */}
          <label className="block space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-secondary">
                Instructions
              </span>
              <span className="text-[10px] text-foreground-secondary/60">
                Markdown supported
              </span>
            </div>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={8}
              placeholder="Detailed instructions for how the AI should use this skill..."
              className={cn(
                "w-full resize-y rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm leading-relaxed font-mono",
                "placeholder:text-foreground-secondary/40",
                "focus:outline-none focus:ring-1 focus:ring-ring transition-colors",
              )}
            />
          </label>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!isValid || isPending}>
              {isPending ? "Creating..." : "Create Skill"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
