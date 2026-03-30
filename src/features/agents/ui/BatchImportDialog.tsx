import { useState, useCallback } from "react";
import { X, ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { createPersona } from "@/shared/api/agents";
import type { ParsedPersona, SkippedFile } from "@/shared/api/agents";
import type { Persona } from "@/shared/types/agents";

interface BatchImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  personas: ParsedPersona[];
  skipped: SkippedFile[];
  onImported: (personas: Persona[]) => void;
}

type ImportStatus = "idle" | "importing" | "done" | "error";

function makeKey(p: ParsedPersona): string {
  return `${p.displayName}::${p.systemPrompt.slice(0, 40)}`;
}

export function BatchImportDialog({
  isOpen,
  onClose,
  personas,
  skipped,
  onImported,
}: BatchImportDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(personas.map(makeKey)),
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const toggleSelected = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleImport = useCallback(async () => {
    setStatus("importing");
    setErrorMsg("");
    const imported: Persona[] = [];

    try {
      for (const p of personas) {
        if (!selected.has(makeKey(p))) continue;
        const created = await createPersona({
          displayName: p.displayName,
          systemPrompt: p.systemPrompt,
          avatarUrl: p.avatarUrl,
          provider: p.provider as undefined,
          model: p.model,
        });
        imported.push(created);
      }
      setStatus("done");
      onImported(imported);
      onClose();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Import failed");
    }
  }, [selected, personas, onImported, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Import personas"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-background shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">
            Import Personas ({personas.length} found)
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-1 text-foreground-secondary hover:bg-background-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {personas.map((p) => {
            const key = makeKey(p);
            return (
              <div key={key} className="rounded-lg border border-border">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(key)}
                    onChange={() => toggleSelected(key)}
                    className="rounded"
                  />
                  <button
                    type="button"
                    className="flex-1 flex items-center gap-2 text-left min-w-0"
                    onClick={() => toggleExpanded(key)}
                  >
                    {expanded.has(key) ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-foreground-secondary" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-foreground-secondary" />
                    )}
                    <span className="text-sm font-medium truncate">
                      {p.displayName}
                    </span>
                  </button>
                </div>
                {expanded.has(key) && (
                  <div className="border-t border-border px-3 py-2.5">
                    <p className="text-xs text-foreground-secondary whitespace-pre-wrap line-clamp-6">
                      {p.systemPrompt}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {skipped.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground-secondary">
                Skipped files
              </p>
              {skipped.map((s) => (
                <div
                  key={s.filename}
                  className="flex items-start gap-2 text-xs text-foreground-secondary/70"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    {s.filename}: {s.reason}
                  </span>
                </div>
              ))}
            </div>
          )}

          {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={selected.size === 0 || status === "importing"}
              onClick={handleImport}
            >
              {status === "importing"
                ? "Importing..."
                : `Import ${selected.size} Persona${selected.size !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
