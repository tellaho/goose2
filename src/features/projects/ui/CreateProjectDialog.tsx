import { useState, useEffect } from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Checkbox } from "@/shared/ui/checkbox";
import { createProject, updateProject } from "../api/projects";
import { discoverAcpProviders, type AcpProvider } from "@/shared/api/acp";

const COLOR_OPTIONS = [
  "#64748b",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
];

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  editingProject?: {
    id: string;
    name: string;
    description: string;
    prompt: string;
    icon: string;
    color: string;
    preferredProvider: string | null;
    preferredModel: string | null;
    workingDir: string | null;
    useWorktrees: boolean;
  };
}

export function CreateProjectDialog({
  isOpen,
  onClose,
  onCreated,
  editingProject,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const icon = "\u{1F4C1}";
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [preferredProvider, setPreferredProvider] = useState<string | null>(
    null,
  );
  const preferredModel: string | null = null;
  const [workingDir, setWorkingDir] = useState<string | null>(null);
  const [useWorktrees, setUseWorktrees] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acpProviders, setAcpProviders] = useState<AcpProvider[]>([]);

  const isEditing = !!editingProject;

  useEffect(() => {
    discoverAcpProviders()
      .then(setAcpProviders)
      .catch(() => setAcpProviders([]));
  }, []);

  const handleBrowseFolder = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Working Directory",
      });
      if (selected && typeof selected === "string") {
        setWorkingDir(selected);
      }
    } catch {
      // Dialog plugin not available — user can type manually
    }
  };

  // Pre-fill fields when editing, reset to defaults for new
  useEffect(() => {
    if (isOpen && editingProject) {
      setName(editingProject.name);
      setPrompt(editingProject.prompt);
      setColor(editingProject.color);
      setPreferredProvider(editingProject.preferredProvider ?? null);
      setWorkingDir(editingProject.workingDir ?? null);
      setUseWorktrees(editingProject.useWorktrees);
      setError(null);
    } else if (isOpen) {
      setName("");
      setPrompt("");
      setColor(COLOR_OPTIONS[0]);
      setPreferredProvider(null);
      setWorkingDir(null);
      setUseWorktrees(false);
      setError(null);
    }
  }, [isOpen, editingProject]);

  const canSave = name.trim().length > 0 && !saving;

  const handleClose = () => {
    setName("");
    setPrompt("");
    setColor(COLOR_OPTIONS[0]);
    setPreferredProvider(null);
    setWorkingDir(null);
    setUseWorktrees(false);
    setError(null);
    onClose();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      if (isEditing) {
        await updateProject(
          editingProject.id,
          name.trim(),
          "",
          prompt,
          icon,
          color,
          preferredProvider || null,
          preferredModel,
          workingDir?.trim() || null,
          useWorktrees,
        );
      } else {
        await createProject(
          name.trim(),
          "",
          prompt,
          icon,
          color,
          preferredProvider || null,
          preferredModel,
          workingDir?.trim() || null,
          useWorktrees,
        );
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b px-5 py-4">
          <DialogTitle className="text-sm font-semibold">
            {isEditing ? "Edit Project" : "New Project"}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable content */}
        <form
          id="project-form"
          onSubmit={handleSave}
          className="min-h-0 flex-1 overflow-y-auto space-y-4 p-5"
        >
          {/* Name */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-text-muted">
              Name <span className="text-text-danger">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="My Project"
            />
          </div>

          {/* Prompt */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-text-muted">
              Prompt
            </Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={8}
              placeholder="System prompt or context for agents working in this project..."
              className="resize-y text-xs font-mono leading-relaxed"
            />
          </div>

          {/* Color */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-text-muted">Color</Label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-transform",
                    color === c
                      ? "border-foreground scale-110"
                      : "border-transparent hover:scale-105",
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Provider */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-text-muted">
              Provider
            </Label>
            <Select
              value={preferredProvider ?? "__none__"}
              onValueChange={(val) =>
                setPreferredProvider(val === "__none__" ? null : val)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="None (use default)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None (use default)</SelectItem>
                {acpProviders.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Working Directory */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-text-muted">
              Working Directory
            </Label>
            <div className="flex gap-2">
              <Input
                value={workingDir ?? ""}
                onChange={(e) => setWorkingDir(e.target.value || null)}
                placeholder="/path/to/project"
                className="flex-1"
              />
              <button
                type="button"
                onClick={handleBrowseFolder}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border border-border-default hover:bg-background-muted transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Browse
              </button>
            </div>
          </div>

          {/* Use Worktrees */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="use-worktrees"
              checked={useWorktrees}
              onCheckedChange={(checked) => setUseWorktrees(checked === true)}
            />
            <Label
              htmlFor="use-worktrees"
              className="text-xs font-medium text-text-muted cursor-pointer"
            >
              Use git worktrees for branch isolation
            </Label>
          </div>

          {/* Error */}
          {error && <p className="text-xs text-text-danger">{error}</p>}
        </form>

        {/* Footer */}
        <DialogFooter className="shrink-0 border-t px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="project-form"
            size="sm"
            disabled={!canSave}
          >
            {saving
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
                ? "Save Changes"
                : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
