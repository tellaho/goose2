import { useState, useMemo, useCallback } from "react";
import { Bot, Plus, Circle, Upload } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { SearchBar } from "@/shared/ui/SearchBar";
import { Button } from "@/shared/ui/button";
import { useAgentStore } from "@/features/agents/stores/agentStore";
import { PersonaGallery } from "@/features/agents/ui/PersonaGallery";
import { PersonaEditor } from "@/features/agents/ui/PersonaEditor";
import { BatchImportDialog } from "@/features/agents/ui/BatchImportDialog";
import { useFileImport } from "@/shared/hooks/useFileImport";
import {
  parsePersonaFiles,
  exportPersonaToJson,
  createPersona,
} from "@/shared/api/agents";
import { updateAgentConfig } from "@/shared/api/agentConfigs";
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

  // ── Import handling ──

  const handleFilesSelected = useCallback(
    async (files: { data: number[]; filename: string }[]) => {
      for (const file of files) {
        try {
          const result = await parsePersonaFiles(file.data, file.filename);
          if (result.personas.length === 1 && result.skipped.length === 0) {
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
    async (data: CreatePersonaRequest | UpdatePersonaRequest) => {
      if (editingPersona?.id?.startsWith("agent-config-")) {
        const configId = editingPersona.id.replace("agent-config-", "");
        await updateAgentConfig(configId, {
          name: (data as CreatePersonaRequest).displayName,
          instructions: (data as CreatePersonaRequest).systemPrompt,
        });
        updatePersona(editingPersona.id, data as Partial<Persona>);
        closePersonaEditor();
        return;
      }
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
        "flex-1 min-h-0 overflow-y-auto",
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
              Custom agent personas for specific workflows
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
          placeholder="Search personas and agents..."
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
