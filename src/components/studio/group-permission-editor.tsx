"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { isValidPermissionKey } from "@/lib/luckperms";
import type { LuckPermsBackup, LuckPermsNode } from "@/lib/permissions";

type GroupPermissionEditorProps = {
  backup: LuckPermsBackup | null;
  groupName: string | null;
  onAdd: (key: string, value: boolean) => void;
  onSetValue: (nodeIndex: number, value: boolean) => void;
  onRemove: (nodeIndex: number) => void;
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

export function GroupPermissionEditor({
  backup,
  groupName,
  onAdd,
  onSetValue,
  onRemove,
}: GroupPermissionEditorProps) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState(true);
  const group = backup && groupName ? backup.groups[groupName] : null;
  const permissions = group
    ? group.nodes.flatMap((node, index) =>
        node.type === "permission" ? [{ node, index }] : [],
      )
    : [];
  const invalidKey = key.length > 0 && !isValidPermissionKey(key);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidPermissionKey(key)) return;
    onAdd(key, value);
    setKey("");
  }

  return (
    <section className="workspace" aria-labelledby="group-editor-title">
      {group && groupName ? (
        <>
          <div className="workspace-title">
            <div>
              <p className="eyebrow">EDITOR / GRUPO</p>
              <h2 id="group-editor-title">{groupName}</h2>
            </div>
            <p className="editor-summary">
              {permissions.length} permisos directos
            </p>
          </div>
          <p className="editor-intro">
            Los cambios solo afectan a este grupo. Los nodos con contexto se
            conservan al conceder o denegar un permiso existente.
          </p>
          <form className="permission-form" onSubmit={submit}>
            <label>
              <span>Permiso personalizado</span>
              <input
                aria-describedby={
                  invalidKey ? "permission-key-error" : undefined
                }
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
          <section
            className="direct-permission-list"
            aria-label="Permisos directos"
          >
            {permissions.length ? (
              permissions.map(({ node, index }) => {
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
                        aria-label={`Eliminar ${node.key}`}
                        onClick={() => onRemove(index)}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="editor-empty">
                Este grupo no tiene permisos directos. Añade uno personalizado o
                aplica una selección del catálogo.
              </p>
            )}
          </section>
        </>
      ) : (
        <div className="resolution-empty">
          <p>
            Importa un backup y selecciona un grupo para editar sus permisos
            directos.
          </p>
        </div>
      )}
    </section>
  );
}
