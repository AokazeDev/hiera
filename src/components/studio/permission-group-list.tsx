"use client";

import {
  ChevronRight,
  CopyPlus,
  GripVertical,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { PermissionContextEditor } from "@/components/studio/permission-context-editor";
import {
  type PermissionContext,
  type PermissionGroup,
  type PermissionGrouping,
  validatePermissionContextUpdate,
} from "@/lib/luckperms";
import type { LuckPermsNode } from "@/lib/permissions";

type DirectPermission = { node: LuckPermsNode; index: number };

type PermissionGroupListProps = {
  nodes: LuckPermsNode[];
  groups: PermissionGroup<DirectPermission>[];
  grouping: PermissionGrouping;
  subjectLabel: string;
  expandedGroups: Set<string>;
  onToggleGroup: (groupId: string) => void;
  onSetValue: (nodeIndex: number, value: boolean) => void;
  onSetContext: (nodeIndex: number, context: PermissionContext) => void;
  onRemove: (nodeIndex: number) => void;
  onPrepareTransfer?: (nodeIndex: number) => void;
  onStartDrag?: (nodeIndex: number) => void;
  onEndDrag?: () => void;
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

function permissionSummary(items: DirectPermission[]): string {
  const granted = items.filter(({ node }) => node.value).length;
  return `${granted} concedidos, ${items.length - granted} denegados`;
}

export function PermissionGroupList({
  nodes,
  groups,
  grouping,
  subjectLabel,
  expandedGroups,
  onToggleGroup,
  onSetValue,
  onSetContext,
  onRemove,
  onPrepareTransfer,
  onStartDrag,
  onEndDrag,
}: PermissionGroupListProps) {
  const [editingContextIndex, setEditingContextIndex] = useState<number | null>(
    null,
  );

  return (
    <section
      className="direct-permission-list"
      aria-labelledby="permission-map-title"
    >
      <header className="permission-list-heading">
        <div>
          <p id="permission-map-title">Mapa de permisos directos</p>
          <span>
            Grupo &gt; {grouping === "segment" ? "rama" : "plugin"} &gt; nodo
          </span>
        </div>
        <output>{groups.length} ramas</output>
      </header>
      <div className="permission-tree">
        {groups.map((group) => {
          const expanded = expandedGroups.has(group.id);
          const groupId = `permission-group-${encodeURIComponent(group.id)}`;

          return (
            <section className="permission-group" key={group.id}>
              <button
                type="button"
                className="permission-group-toggle"
                aria-controls={groupId}
                aria-expanded={expanded}
                onClick={() => onToggleGroup(group.id)}
              >
                <ChevronRight size={15} aria-hidden="true" />
                <span className="permission-group-branch" aria-hidden="true" />
                <code>
                  {grouping === "flat" ? "Todos los permisos" : group.label}
                </code>
                <small>{permissionSummary(group.items)}</small>
                <strong>{group.items.length}</strong>
              </button>
              {expanded && (
                <ul className="permission-group-nodes" id={groupId}>
                  {group.items.map(({ node, index }) => {
                    const context = contextLabel(node);
                    return (
                      <li key={`${index}-${node.key}`}>
                        <article className="direct-permission">
                          <div>
                            {onStartDrag && (
                              <span
                                className="permission-drag-handle"
                                draggable
                                aria-hidden="true"
                                onDragStart={(event) => {
                                  event.dataTransfer.effectAllowed = "copyMove";
                                  event.dataTransfer.setData(
                                    "text/plain",
                                    node.key,
                                  );
                                  onStartDrag(index);
                                }}
                                onDragEnd={onEndDrag}
                              >
                                <GripVertical size={14} aria-hidden="true" />
                              </span>
                            )}
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
                              className="transfer-permission"
                              onClick={() => setEditingContextIndex(index)}
                            >
                              Contexto
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
                                <CopyPlus size={13} aria-hidden="true" />{" "}
                                Cambiar en otro grupo
                              </button>
                            )}
                          </div>
                        </article>
                        {editingContextIndex === index && (
                          <PermissionContextEditor
                            context={node.context}
                            nodeKey={node.key}
                            validateContext={(context) =>
                              validatePermissionContextUpdate(
                                nodes,
                                index,
                                context,
                              )
                            }
                            onSave={(context) => onSetContext(index, context)}
                            onClose={() => setEditingContextIndex(null)}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
