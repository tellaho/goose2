import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/shared/ui/button";
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
import type {
  Agent,
  Persona,
  ProviderType,
  AgentConnectionType,
  CreateAgentRequest,
} from "@/shared/types/agents";

interface AgentConfigProps {
  agent?: Agent;
  personas: Persona[];
  onSave: (config: CreateAgentRequest) => void;
  onCancel: () => void;
}

const PROVIDER_OPTIONS: { value: ProviderType; label: string }[] = [
  { value: "goose", label: "Goose" },
  { value: "claude", label: "Claude" },
  { value: "openai", label: "OpenAI" },
  { value: "ollama", label: "Ollama" },
  { value: "custom", label: "Custom" },
];

export function AgentConfig({
  agent,
  personas,
  onSave,
  onCancel,
}: AgentConfigProps) {
  const [name, setName] = useState(agent?.name ?? "");
  const [personaId, setPersonaId] = useState(agent?.personaId ?? "");
  const connectionType: AgentConnectionType = "builtin";
  const [provider, setProvider] = useState<ProviderType>(
    agent?.provider ?? "goose",
  );
  const [model, setModel] = useState(agent?.model ?? "");
  const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt ?? "");
  const [promptExpanded, setPromptExpanded] = useState(false);

  const selectedPersona = useMemo(
    () => personas.find((p) => p.id === personaId),
    [personas, personaId],
  );

  // Sync inherited fields when persona changes
  useEffect(() => {
    if (selectedPersona) {
      setProvider(selectedPersona.provider ?? "goose");
      setModel(selectedPersona.model ?? "");
      setSystemPrompt(selectedPersona.systemPrompt);
    }
  }, [selectedPersona]);

  const isValid = name.trim().length > 0 && !!provider;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValid) return;

      const config: CreateAgentRequest = {
        name: name.trim(),
        personaId: personaId || undefined,
        provider,
        model: model.trim(),
        systemPrompt: systemPrompt.trim() || undefined,
        connectionType,
      };
      onSave(config);
    },
    [isValid, name, personaId, provider, model, systemPrompt, onSave],
  );

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Agent configuration"
      className="space-y-4"
    >
      {/* Name */}
      <div className="space-y-1">
        <Label className="text-xs font-medium text-text-muted">
          Name <span className="text-text-danger">*</span>
        </Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="My Agent"
        />
      </div>

      {/* Persona selector */}
      <div className="space-y-1">
        <Label className="text-xs font-medium text-text-muted">Persona</Label>
        <Select
          value={personaId || "__none__"}
          onValueChange={(val) => setPersonaId(val === "__none__" ? "" : val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {personas.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.displayName}
                {p.isBuiltin ? " (built-in)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Provider */}
      <div className="space-y-1">
        <Label className="text-xs font-medium text-text-muted">
          Provider
          {selectedPersona?.provider && (
            <span className="ml-1 text-text-muted/50">
              (from persona: {selectedPersona.provider})
            </span>
          )}
        </Label>
        <Select
          value={provider}
          onValueChange={(val) => setProvider(val as ProviderType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROVIDER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model override */}
      <div className="space-y-1">
        <Label className="text-xs font-medium text-text-muted">
          Model
          {selectedPersona?.model && (
            <span className="ml-1 text-text-muted/50">
              (from persona: {selectedPersona.model})
            </span>
          )}
        </Label>
        <Input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="e.g. claude-sonnet-4-20250514"
        />
      </div>

      {/* System prompt override */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setPromptExpanded((v) => !v)}
          className="text-xs font-medium text-text-muted hover:text-text-default transition-colors"
        >
          System Prompt Override {promptExpanded ? "[-]" : "[+]"}
        </button>
        {promptExpanded && (
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={5}
            placeholder="Override the persona system prompt..."
            className="resize-y leading-relaxed"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!isValid}>
          {agent ? "Update Agent" : "Create Agent"}
        </Button>
      </div>
    </form>
  );
}
