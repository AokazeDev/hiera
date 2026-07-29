"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  type PermissionContext,
  validatePermissionContext,
} from "@/lib/luckperms";

type ContextEntry = { key: string; value: string };

function formatValue(value: string | string[]): string {
  return Array.isArray(value) ? JSON.stringify(value) : value;
}

function parseValue(value: string): string | string[] | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("[")) return trimmed;

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function entriesFromContext(
  context: PermissionContext | undefined,
): ContextEntry[] {
  return Object.entries(context ?? {}).map(([key, value]) => ({
    key,
    value: formatValue(value),
  }));
}

type PermissionContextEditorProps = {
  context: PermissionContext | undefined;
  nodeKey: string;
  validateContext: (context: PermissionContext) => string | null;
  onSave: (context: PermissionContext) => void;
  onClose: () => void;
};

export function PermissionContextEditor({
  context,
  nodeKey,
  validateContext,
  onSave,
  onClose,
}: PermissionContextEditorProps) {
  const [entries, setEntries] = useState<ContextEntry[]>(() =>
    entriesFromContext(context),
  );
  const [error, setError] = useState<string | null>(null);

  function updateEntry(
    index: number,
    field: keyof ContextEntry,
    value: string,
  ) {
    setEntries((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextContext: PermissionContext = Object.create(
      null,
    ) as PermissionContext;
    for (const entry of entries) {
      const value = parseValue(entry.value);
      if (!value) {
        setError(
          "Usa texto o una lista JSON de textos como valor de contexto.",
        );
        return;
      }
      if (Object.hasOwn(nextContext, entry.key)) {
        setError("Cada clave de contexto solo puede aparecer una vez.");
        return;
      }
      nextContext[entry.key] = value;
    }

    const validationError =
      validatePermissionContext(nextContext) ?? validateContext(nextContext);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave(nextContext);
    onClose();
  }

  return (
    <form className="permission-context-editor" onSubmit={submit}>
      <div className="permission-context-heading">
        <div>
          <p>Contexto de {nodeKey}</p>
          <span>Vacío equivale a permiso global.</span>
        </div>
        <button type="button" className="text-button" onClick={onClose}>
          Cerrar
        </button>
      </div>
      {entries.map((entry, index) => (
        <div className="permission-context-row" key={`${entry.key}-${index}`}>
          <label>
            <span>Clave</span>
            <input
              value={entry.key}
              onChange={(event) =>
                updateEntry(index, "key", event.target.value)
              }
              placeholder="world"
            />
          </label>
          <label>
            <span>Valor</span>
            <input
              value={entry.value}
              onChange={(event) =>
                updateEntry(index, "value", event.target.value)
              }
              placeholder="nether"
            />
          </label>
          <button
            type="button"
            className="remove-permission"
            aria-label={`Quitar contexto ${entry.key || index + 1}`}
            onClick={() =>
              setEntries((current) =>
                current.filter((_, entryIndex) => entryIndex !== index),
              )
            }
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      ))}
      <div className="permission-context-actions">
        <button
          type="button"
          className="transfer-permission"
          onClick={() =>
            setEntries((current) => [...current, { key: "", value: "" }])
          }
        >
          <Plus size={13} aria-hidden="true" /> Añadir condición
        </button>
        <button type="submit" className="primary-action">
          Guardar contexto
        </button>
      </div>
      <p className="permission-context-help">
        Para conservar un valor en lista, escribe JSON, por ejemplo
        <code>[&quot;lobby&quot;,&quot;survival&quot;]</code>.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
