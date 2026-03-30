import { useState, useMemo, useCallback } from "react";
import {
  Bot,
  Plus,
  Circle,
  Upload,
  FileText,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { SearchBar } from "@/shared/ui/SearchBar";
import { Button } from "@/shared/ui/button";
import { useAgentStore } from "@/features/agents/stores/agentStore";
import { useAgentConfigStore } from "@/stores/agentConfigStore";
import { PersonaGallery } from "@/features/agents/ui/PersonaGallery";
import { PersonaEditor } from "@/features/agents/ui/PersonaEditor";
import { BatchImportDialog } from "@/features/agents/ui/BatchImportDialog";
import { useFileImport } from "@/shared/hooks/useFileImport";
import {
  parsePersonaFiles,
  exportPersonaToJson,
  createPersona,
} from "@/shared/api/agents";
import type {
  Persona,
  Agent,
  AgentStatus,
  CreatePersonaRequest,
  UpdatePersonaRequest,
} from "@/shared/types/agents";
import type { ParsedPersona, SkippedFile } from "@/shared/api/agents";

const STATUS_STYLES: Record<AgentStatus, { dot: string; label: string }> = {
  online: { dot: "text-green-500", label: "Online" },
  offline: { dot: "text-foreground-secondary/40", label: "Offline" },
  starting: { dot: "text-yellow-500", label: "Starting" },
  error: { dot: "text-red-500", label: "Error" },
};

function AgentRow({ agent }: { agent: Agent }) {
  const status = STATUS_STYLES[agent.status];
  return (
    <li className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-background-secondary/50">
      <div className="flex items-center gap-3 min-w-0">
        <Bot className="h-5 w-5 shrink-0 text-foreground-secondary" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{agent.name}</p>
          {agent.persona && (
            <p className="text-xs text-foreground-secondary truncate">
              {agent.persona.displayName}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Circle
          className={cn("h-2.5 w-2.5 fill-current", status.dot)}
          aria-hidden="true"
        />
        <span className="text-xs text-foreground-secondary">
          {status.label}
        </span>
      </div>
    </li>
  );
}

function AgentConfigRow({
  config,
  onDelete,
}: {
  config: {
    id: string;
    name: string;
    description?: string;
    instructions: string;
    filePath: string;
    source: string;
  };
  onDelete: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const filename = config.filePath.split("/").pop() ?? config.filePath;

  return (
    <li className="rounded-lg border border-border transition-colors hover:bg-background-secondary/50">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-3 min-w-0 flex-1 text-left"
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 text-foreground-secondary transition-transform",
              expanded && "rotate-90",
            )}
          />
          <FileText className="h-5 w-5 shrink-0 text-foreground-secondary" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{config.name}</p>
            {config.description && (
              <p className="text-xs text-foreground-secondary truncate">
                {config.description}
              </p>
            )}
          </div>
        </button>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="inline-flex items-center rounded-md bg-background-secondary px-2 py-0.5 text-[10px] text-foreground-secondary">
            {filename}
          </span>
          <button
            type="button"
            aria-label={`Delete ${config.name}`}
            onClick={() => onDelete(config.id)}
            className="rounded-md p-1 text-foreground-secondary/60 hover:bg-background-secondary hover:text-foreground-danger transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-border px-4 py-3">
          <pre className="text-xs text-foreground-secondary whitespace-pre-wrap break-words leading-relaxed max-h-48 overflow-y-auto">
            {config.instructions}
          </pre>
        </div>
      )}
    </li>
  );
}

export function AgentsView() {
  const [search, setSearch] = useState("");

  // Persona state
  const personas = useAgentStore((s) => s.personas);
  const personasLoading = useAgentStore((s) => s.personasLoading);
  const agents = useAgentStore((s) => s.agents);
  const personaEditorOpen = useAgentStore((s) => s.personaEditorOpen);
  const editingPersona = useAgentStore((s) => s.editingPersona);
  const openPersonaEditor = useAgentStore((s) => s.openPersonaEditor);
  const closePersonaEditor = useAgentStore((s) => s.closePersonaEditor);
  const addPersona = useAgentStore((s) => s.addPersona);
  const updatePersona = useAgentStore((s) => s.updatePersona);
  const removePersona = useAgentStore((s) => s.removePersona);

  // Agent configs from disk
  const agentConfigs = useAgentConfigStore((s) => s.agents);
  const agentConfigsLoading = useAgentConfigStore((s) => s.loading);
  const deleteAgentConfig = useAgentConfigStore((s) => s.deleteAgent);

  // Import state
  const [batchImportOpen, setBatchImportOpen] = useState(false);
  const [importPersonas, setImportPersonas] = useState<ParsedPersona[]>([]);
  const [importSkipped, setImportSkipped] = useState<SkippedFile[]>([]);

  const lowerSearch = search.toLowerCase();

  const filteredPersonas = useMemo(
    () =>
      personas.filter(
        (p) =>
          p.displayName.toLowerCase().includes(lowerSearch) ||
          p.systemPrompt.toLowerCase().includes(lowerSearch),
      ),
    [personas, lowerSearch],
  );

  const filteredAgents = useMemo(
    () =>
      agents.filter(
        (a) =>
          a.name.toLowerCase().includes(lowerSearch) ||
          a.persona?.displayName.toLowerCase().includes(lowerSearch),
      ),
    [agents, lowerSearch],
  );

  const filteredConfigs = useMemo(
    () =>
      agentConfigs.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerSearch) ||
          (c.description?.toLowerCase().includes(lowerSearch) ?? false),
      ),
    [agentConfigs, lowerSearch],
  );

  // ── Import handling ──

  const handleFilesSelected = useCallback(
    async (files: { data: number[]; filename: string }[]) => {
      for (const file of files) {
        try {
          const result = await parsePersonaFiles(file.data, file.filename);
          if (result.personas.length === 1 && result.skipped.length === 0) {
            // Single persona — import directly
            const p = result.personas[0];
            const created = await createPersona({
              displayName: p.displayName,
              systemPrompt: p.systemPrompt,
              avatarUrl: p.avatarUrl,
              provider: p.provider as undefined,
              model: p.model,
            });
            addPersona(created);
          } else {
            // Multiple or with skipped — show batch dialog
            setImportPersonas(result.personas);
            setImportSkipped(result.skipped);
            setBatchImportOpen(true);
          }
        } catch (err) {
          console.error("Import failed:", err);
        }
      }
    },
    [addPersona],
  );

  const { isDragOver, onDragOver, onDragLeave, onDrop, openFilePicker } =
    useFileImport({
      accept: ".json,.zip",
      onFilesSelected: handleFilesSelected,
    });

  const handleBatchImported = useCallback(
    (imported: Persona[]) => {
      for (const p of imported) {
        addPersona(p);
      }
    },
    [addPersona],
  );

  // ── Export handling ──

  const handleExportPersona = useCallback(async (persona: Persona) => {
    try {
      const json = await exportPersonaToJson(persona.id);
      const slug = persona.displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}.persona.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  }, []);

  // ── Persona CRUD ──

  const handleSavePersona = useCallback(
    (data: CreatePersonaRequest | UpdatePersonaRequest) => {
      if (editingPersona) {
        updatePersona(editingPersona.id, data as Partial<Persona>);
      } else {
        const newPersona: Persona = {
          id: crypto.randomUUID(),
          displayName: (data as CreatePersonaRequest).displayName,
          avatarUrl: data.avatarUrl,
          systemPrompt: (data as CreatePersonaRequest).systemPrompt,
          provider: data.provider,
          model: data.model,
          isBuiltin: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addPersona(newPersona);
      }
      closePersonaEditor();
    },
    [editingPersona, addPersona, updatePersona, closePersonaEditor],
  );

  const handleDuplicatePersona = useCallback(
    (persona: Persona) => {
      const duplicate: Persona = {
        ...persona,
        id: crypto.randomUUID(),
        displayName: `${persona.displayName} (Copy)`,
        isBuiltin: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addPersona(duplicate);
    },
    [addPersona],
  );

  const handleDeletePersona = useCallback(
    (persona: Persona) => {
      if (persona.isBuiltin) return;
      removePersona(persona.id);
    },
    [removePersona],
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop zone for file import
    <div
      className={cn(
        "flex-1 overflow-y-auto",
        isDragOver && "ring-2 ring-inset ring-blue-400/50",
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="max-w-5xl mx-auto w-full px-6 py-8 space-y-5 page-transition">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Agents</h1>
            <p className="text-xs text-foreground-secondary">
              Custom agent configurations for specific workflows
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openFilePicker}
            >
              <Upload className="w-3.5 h-3.5" />
              Import
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openPersonaEditor()}
            >
              <Plus className="w-3.5 h-3.5" />
              New Persona
            </Button>
          </div>
        </div>

        {/* Drag overlay hint */}
        {isDragOver && (
          <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/10 py-8">
            <p className="text-sm text-blue-400 font-medium">
              Drop .persona.json or .zip to import
            </p>
          </div>
        )}

        {/* Search */}
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search personas, agents, and configs..."
        />

        {/* Personas section */}
        <section aria-labelledby="personas-heading">
          <h2 id="personas-heading" className="text-sm font-semibold mb-3">
            Personas
          </h2>
          <PersonaGallery
            personas={filteredPersonas}
            onSelectPersona={(p) => openPersonaEditor(p)}
            onEditPersona={(p) => openPersonaEditor(p)}
            onDuplicatePersona={handleDuplicatePersona}
            onDeletePersona={handleDeletePersona}
            onExportPersona={handleExportPersona}
            onCreatePersona={() => openPersonaEditor()}
            isLoading={personasLoading}
          />
        </section>

        {/* Agent Configs from disk */}
        <section aria-labelledby="configs-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="configs-heading" className="text-sm font-semibold">
              Agent Configs
            </h2>
            <span className="text-xs text-foreground-secondary">
              from ~/.goose/agents/
            </span>
          </div>

          {agentConfigsLoading ? (
            <p className="text-xs text-foreground-secondary py-4 text-center">
              Loading...
            </p>
          ) : filteredConfigs.length === 0 ? (
            <p className="text-xs text-foreground-secondary py-4 text-center">
              No agent configs found. Add .md files to ~/.goose/agents/
            </p>
          ) : (
            <ul
              className="space-y-2"
              aria-label="Agent configurations from disk"
            >
              {filteredConfigs.map((config) => (
                <AgentConfigRow
                  key={config.id}
                  config={config}
                  onDelete={deleteAgentConfig}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Active Agents section */}
        <section aria-labelledby="agents-heading">
          <h2 id="agents-heading" className="text-sm font-semibold mb-3">
            Active Agents
          </h2>
          {filteredAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-foreground-secondary">
              <Bot className="h-10 w-10 opacity-30" />
              <div className="text-center">
                <p className="text-sm font-medium">No active agents</p>
                <p className="text-xs text-foreground-secondary/60 mt-1">
                  Create an agent from a persona to get started.
                </p>
              </div>
            </div>
          ) : (
            <ul className="space-y-2" aria-label="Active agents">
              {filteredAgents.map((agent) => (
                <AgentRow key={agent.id} agent={agent} />
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Persona editor modal */}
      <PersonaEditor
        persona={editingPersona ?? undefined}
        isOpen={personaEditorOpen}
        onClose={closePersonaEditor}
        onSave={handleSavePersona}
        onDuplicate={handleDuplicatePersona}
      />

      {/* Batch import dialog */}
      <BatchImportDialog
        isOpen={batchImportOpen}
        onClose={() => setBatchImportOpen(false)}
        personas={importPersonas}
        skipped={importSkipped}
        onImported={handleBatchImported}
      />
    </div>
  );
}
