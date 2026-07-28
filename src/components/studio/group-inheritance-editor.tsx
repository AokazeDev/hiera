"use client";

import { Link2, Trash2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { getParents, validateGroupInheritance } from "@/lib/luckperms";
import type { LuckPermsBackup, LuckPermsNode } from "@/lib/permissions";

type GroupInheritanceEditorProps = {
  backup: LuckPermsBackup;
  groupName: string;
  onAdd: (parentName: string) => void;
  onRemove: (nodeIndex: number) => void;
  onSelectGroup: (groupName: string) => void;
};

function contextLabel(node: LuckPermsNode): string | null {
  if (!node.context || Object.keys(node.context).length === 0) return null;
  return Object.entries(node.context)
    .map(
      ([key, value]) =>
        `${key}=${Array.isArray(value) ? value.join(",") : value}`,
    )
    .join(" · ");
}

export function GroupInheritanceEditor({
  backup,
  groupName,
  onAdd,
  onRemove,
  onSelectGroup,
}: GroupInheritanceEditorProps) {
  const [parentName, setParentName] = useState("");
  const group = backup.groups[groupName];
  const inheritances = group.nodes.flatMap((node, index) =>
    node.type === "inheritance" ? [{ node, index }] : [],
  );
  const error = validateGroupInheritance(backup, groupName, parentName);
  const canSubmit = parentName.trim().length > 0 && !error;
  const knownParents = new Set(getParents(group));

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    onAdd(parentName.trim());
    setParentName("");
  }

  return (
    <section className="inheritance-editor" aria-labelledby="inheritance-title">
      <div className="inheritance-heading">
        <p id="inheritance-title" className="inheritance-label">
          Herencias directas
        </p>
        <span>{knownParents.size} activas</span>
      </div>
      {inheritances.length ? (
        <ul className="inheritance-list">
          {inheritances.map(({ node, index }) => {
            const parent = node.key.replace(/^group\./, "");
            const exists = Boolean(backup.groups[parent]);
            const context = contextLabel(node);
            return (
              <li key={`${index}-${node.key}`}>
                <div>
                  {exists && node.value ? (
                    <button type="button" onClick={() => onSelectGroup(parent)}>
                      <Link2 size={13} aria-hidden="true" /> {parent}
                    </button>
                  ) : (
                    <span className="inheritance-name">
                      <TriangleAlert size={13} aria-hidden="true" /> {parent}
                    </span>
                  )}
                  <small>
                    {!node.value
                      ? "Desactivada"
                      : !exists
                        ? "Grupo inexistente"
                        : "Activa"}
                    {context && ` · Contexto: ${context}`}
                  </small>
                </div>
                <button
                  type="button"
                  className="remove-inheritance"
                  aria-label={`Quitar herencia de ${parent}`}
                  onClick={() => onRemove(index)}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="inheritance-empty">Este grupo no hereda de otro grupo.</p>
      )}
      <form className="inheritance-form" onSubmit={submit}>
        <label htmlFor="parent-group">Añadir grupo padre</label>
        <div>
          <input
            id="parent-group"
            list="backup-groups"
            value={parentName}
            onChange={(event) => setParentName(event.target.value)}
            aria-describedby={
              parentName.trim() ? "parent-group-error" : undefined
            }
            aria-invalid={parentName.trim().length > 0 && Boolean(error)}
            placeholder="nombre-del-grupo"
          />
          <button
            type="submit"
            className="primary-action"
            disabled={!canSubmit}
          >
            Añadir padre
          </button>
        </div>
        <datalist id="backup-groups">
          {Object.keys(backup.groups).map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        {parentName.trim() && error && (
          <p id="parent-group-error" className="form-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
