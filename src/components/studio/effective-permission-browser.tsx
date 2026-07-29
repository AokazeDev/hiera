"use client";

import { ChevronRight, GripVertical } from "lucide-react";
import { useState } from "react";
import { PermissionFilterBar } from "@/components/studio/permission-filter-bar";
import { PermissionGroupingControl } from "@/components/studio/permission-grouping-control";
import { PermissionSortingControl } from "@/components/studio/permission-sorting-control";
import { usePermissionGroupingFlip } from "@/components/studio/use-permission-grouping-flip";
import type { ResolvedPermission } from "@/lib/luckperms";
import {
  defaultPermissionFilter,
  filterResolvedPermissions,
  getEffectiveNodesForContext,
  getEffectiveUserNodesForContext,
  groupPermissions,
  type PermissionContext,
  type PermissionGrouping,
  type PermissionSort,
  sortPermissions,
} from "@/lib/luckperms";
import type { LuckPermsBackup, PermissionEntry } from "@/lib/permissions";

type EffectivePermissionBrowserProps = {
  backup: LuckPermsBackup | null;
  groupName: string | null;
  userId: string | null;
  activeContext: PermissionContext;
  catalog: Map<string, PermissionEntry>;
  onInspectPermissionOrigin: (permission: {
    key: string;
    origin: string;
    inherited: boolean;
  }) => void;
  onPreparePermissionTransfer: (sourceGroup: string, nodeIndex: number) => void;
  onStartPermissionDrag: (sourceGroup: string, nodeIndex: number) => void;
  onEndPermissionDrag: () => void;
};

function contextLabel(node: ResolvedPermission): string | null {
  if (!node.context || Object.keys(node.context).length === 0) return null;
  return Object.entries(node.context)
    .map(
      ([key, value]) =>
        `${key}=${Array.isArray(value) ? value.join(",") : value}`,
    )
    .join(" · ");
}

export function EffectivePermissionBrowser({
  backup,
  groupName,
  userId,
  activeContext,
  catalog,
  onInspectPermissionOrigin,
  onPreparePermissionTransfer,
  onStartPermissionDrag,
  onEndPermissionDrag,
}: EffectivePermissionBrowserProps) {
  const [filters, setFilters] = useState(defaultPermissionFilter);
  const [grouping, setGrouping] = useState<PermissionGrouping>("plugin");
  const [sort, setSort] = useState<PermissionSort>("name");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const { root: groupingRoot, prepareGroupingTransition } =
    usePermissionGroupingFlip();
  const user = backup && userId ? backup.users?.[userId] : null;
  const subject = groupName ?? user?.username ?? userId;
  const effective =
    backup && groupName
      ? getEffectiveNodesForContext(backup, groupName, activeContext)
      : backup && userId
        ? getEffectiveUserNodesForContext(backup, userId, activeContext)
        : [];
  const permissions = sortPermissions(
    filterResolvedPermissions(effective, filters, catalog),
    sort,
    (permission) => permission,
    catalog,
  );
  const groups = groupPermissions(
    permissions,
    (permission) => permission.key,
    grouping,
  );

  function toggleGroup(groupId: string) {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  function changeGrouping(nextGrouping: PermissionGrouping) {
    if (nextGrouping === grouping) return;
    prepareGroupingTransition();
    setExpandedGroups((current) => {
      const expandedPermissions = new Set(
        groups
          .filter((group) => current.has(group.id))
          .flatMap((group) =>
            group.items.map(
              (permission) =>
                `${permission.origin}-${permission.originNodeIndex}-${permission.key}`,
            ),
          ),
      );
      return new Set(
        groupPermissions(
          permissions,
          (permission) => permission.key,
          nextGrouping,
        )
          .filter((group) =>
            group.items.some((permission) =>
              expandedPermissions.has(
                `${permission.origin}-${permission.originNodeIndex}-${permission.key}`,
              ),
            ),
          )
          .map((group) => group.id),
      );
    });
    setGrouping(nextGrouping);
  }

  return (
    <section
      className="workspace effective-permission-browser"
      aria-labelledby="effective-permissions-title"
    >
      {backup && subject ? (
        <div ref={groupingRoot}>
          <div className="workspace-title">
            <div>
              <p className="eyebrow">
                RESOLUCIÓN / {groupName ? "GRUPO" : "USUARIO"}
              </p>
              <h2 id="effective-permissions-title">{subject}</h2>
            </div>
            <p className="editor-summary">
              {permissions.length} de {effective.length} permisos efectivos
            </p>
          </div>
          <p className="editor-intro">
            Esta vista concentra los filtros del resultado efectivo. El rail
            mantiene solo el contexto, la muestra y el historial de cambios.
          </p>
          <PermissionFilterBar
            nodes={effective}
            filters={filters}
            onChange={setFilters}
            showOrigin
          />
          <div className="effective-permission-controls">
            <PermissionGroupingControl
              value={grouping}
              onChange={changeGrouping}
            />
            <PermissionSortingControl
              value={sort}
              onChange={setSort}
              showOrigin
            />
          </div>
          {groups.length ? (
            <div className="effective-permission-tree">
              {groups.map((group) => {
                const expanded = expandedGroups.has(group.id);
                const groupId = `effective-permission-group-${encodeURIComponent(group.id)}`;
                return (
                  <section
                    className="permission-group"
                    data-permission-flip-item
                    data-flip-id={`effective-permission-group-${group.id}`}
                    key={group.id}
                  >
                    <button
                      type="button"
                      className="permission-group-toggle"
                      aria-controls={groupId}
                      aria-expanded={expanded}
                      onClick={() => toggleGroup(group.id)}
                    >
                      <ChevronRight size={15} aria-hidden="true" />
                      <span
                        className="permission-group-branch"
                        aria-hidden="true"
                      />
                      <code>
                        {grouping === "flat"
                          ? "Todos los permisos"
                          : group.label}
                      </code>
                      <small>{group.items.length} resultados</small>
                      <strong>{group.items.length}</strong>
                    </button>
                    {expanded && (
                      <ul className="effective-permission-nodes" id={groupId}>
                        {group.items.map((node) => {
                          const context = contextLabel(node);
                          return (
                            <li
                              data-permission-flip-item
                              data-flip-id={`effective-permission-${node.origin}-${node.originNodeIndex}-${node.key}`}
                              key={`${node.origin}-${node.originNodeIndex}-${node.key}`}
                            >
                              <span
                                className={
                                  node.value ? "value-true" : "value-false"
                                }
                              >
                                {node.value ? "+" : "-"}
                              </span>
                              <div>
                                <code>{node.key}</code>
                                <small>
                                  {node.inherited
                                    ? `Heredado de ${node.origin}`
                                    : "Directo"}
                                </small>
                                {context && <small>Contexto: {context}</small>}
                                {node.contextConflict && (
                                  <small className="context-conflict">
                                    Conflicto contextual
                                  </small>
                                )}
                              </div>
                              <div className="effective-permission-actions">
                                <button
                                  type="button"
                                  className="effective-permission-origin"
                                  onClick={() =>
                                    onInspectPermissionOrigin(node)
                                  }
                                >
                                  Abrir ruta
                                </button>
                                {groupName && (
                                  <>
                                    <span
                                      className="permission-drag-handle"
                                      draggable
                                      aria-hidden="true"
                                      onDragStart={(event) => {
                                        event.dataTransfer.effectAllowed =
                                          "copyMove";
                                        event.dataTransfer.setData(
                                          "text/plain",
                                          node.key,
                                        );
                                        onStartPermissionDrag(
                                          node.origin,
                                          node.originNodeIndex,
                                        );
                                      }}
                                      onDragEnd={onEndPermissionDrag}
                                    >
                                      <GripVertical
                                        size={14}
                                        aria-hidden="true"
                                      />
                                    </span>
                                    <button
                                      type="button"
                                      className="effective-permission-transfer"
                                      onClick={() =>
                                        onPreparePermissionTransfer(
                                          node.origin,
                                          node.originNodeIndex,
                                        )
                                      }
                                    >
                                      Cambiar
                                    </button>
                                  </>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            <p className="editor-empty">
              Ningún permiso efectivo coincide con los filtros activos.
            </p>
          )}
        </div>
      ) : (
        <div className="resolution-empty">
          <p>
            Importa un backup y selecciona un grupo o usuario para resolver sus
            permisos.
          </p>
        </div>
      )}
    </section>
  );
}
