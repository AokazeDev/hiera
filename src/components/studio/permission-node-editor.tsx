"use client";

import { CopyPlus, Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { PermissionFilterBar } from "@/components/studio/permission-filter-bar";
import { PermissionGroupingControl } from "@/components/studio/permission-grouping-control";
import {
  defaultPermissionFilter,
  filterPermissionNodes,
  groupPermissions,
  isValidPermissionKey,
} from "@/lib/luckperms";
import type { LuckPermsNode } from "@/lib/permissions";

type PermissionNodeEditorProps = {
  nodes: LuckPermsNode[];
  subjectLabel: string;
  onAdd: (key: string, value: boolean) => void;
  onSetValue: (nodeIndex: number, value: boolean) => void;
  onRemove: (nodeIndex: number) => void;
  onPrepareTransfer?: (nodeIndex: number) => void;
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

export function PermissionNodeEditor({
  nodes,
  subjectLabel,
  onAdd,
  onSetValue,
  onRemove,
  onPrepareTransfer,
}: PermissionNodeEditorProps) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState(true);
  const [filters, setFilters] = useState(defaultPermissionFilter);
  const [grouping, setGrouping] = useState<"flat" | "plugin" | "segment">(
    "flat",
  );
  const permissions = filterPermissionNodes(nodes, filters);
  const permissionGroups = groupPermissions(
    permissions,
    (permission) => permission.node.key,
    grouping,
  );
  const invalidKey = key.length > 0 && !isValidPermissionKey(key);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidPermissionKey(key)) return;
    onAdd(key, value);
    setKey("");
  }

  return (
    <>
      <form className="permission-form" onSubmit={submit}>
        <label>
          <span>Permiso personalizado</span>
          <input
            aria-describedby={invalidKey ? "permission-key-error" : undefined}
            aria-invalid={invalidKey}
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder="plugin.permiso"
          />
        </label>
        <label>
          <span>Resultado</span>
          <select
            value={String(value)}
            onChange={(event) => setValue(event.target.value === "true")}
          >
            <option value="true">Conceder</option>
            <option value="false">Denegar</option>
          </select>
        </label>
        <button
          type="submit"
          className="primary-action"
          disabled={!isValidPermissionKey(key)}
        >
          Añadir
        </button>
        {invalidKey && (
          <p id="permission-key-error" className="form-error" role="alert">
            Escribe un nodo sin espacios.
          </p>
        )}
      </form>
      <PermissionFilterBar
        nodes={nodes}
        filters={filters}
        onChange={setFilters}
      />
      <PermissionGroupingControl value={grouping} onChange={setGrouping} />
      <section
        className="direct-permission-list"
        aria-label="Permisos directos"
      >
        {permissions.length ? (
          permissionGroups.map((group) => (
            <div className="permission-group" key={group.id}>
              {grouping !== "flat" && (
                <h3>
                  <code>{group.label}</code>
                  <span>{group.items.length}</span>
                </h3>
              )}
              {group.items.map(({ node, index }) => {
                const context = contextLabel(node);
                return (
                  <article
                    className="direct-permission"
                    key={`${index}-${node.key}`}
                  >
                    <div>
                      <code>{node.key}</code>
                      {context && <small>Contexto: {context}</small>}
                    </div>
                    <div className="permission-actions">
                      <button
                        type="button"
                        className={
                          node.value
                            ? "permission-state is-granted"
                            : "permission-state"
                        }
                        onClick={() => onSetValue(index, true)}
                      >
                        <Plus size={13} aria-hidden="true" /> Conceder
                      </button>
                      <button
                        type="button"
                        className={
                          !node.value
                            ? "permission-state is-denied"
                            : "permission-state"
                        }
                        onClick={() => onSetValue(index, false)}
                      >
                        <Minus size={13} aria-hidden="true" /> Denegar
                      </button>
                      <button
                        type="button"
                        className="remove-permission"
                        aria-label={`Eliminar ${node.key} de ${subjectLabel}`}
                        onClick={() => onRemove(index)}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                      {onPrepareTransfer && (
                        <button
                          type="button"
                          className="transfer-permission"
                          onClick={() => onPrepareTransfer(index)}
                        >
                          <CopyPlus size={13} aria-hidden="true" /> Copiar o
                          mover
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ))
        ) : (
          <p className="editor-empty">
            {nodes.some((n) => n.type === "permission")
              ? "Ningún permiso coincide con los filtros activos."
              : `${subjectLabel} no tiene permisos directos. Añade un nodo personalizado.`}
          </p>
        )}
      </section>
    </>
  );
}
