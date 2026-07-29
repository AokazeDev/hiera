"use client";

import { useState } from "react";
import { PermissionFilterBar } from "@/components/studio/permission-filter-bar";
import { PermissionGroupList } from "@/components/studio/permission-group-list";
import { PermissionGroupingControl } from "@/components/studio/permission-grouping-control";
import { PermissionSortingControl } from "@/components/studio/permission-sorting-control";
import {
  defaultPermissionFilter,
  filterPermissionNodes,
  groupPermissions,
  isValidPermissionKey,
  type PermissionContext,
  type PermissionSort,
  sortPermissions,
} from "@/lib/luckperms";
import type { LuckPermsNode, PermissionEntry } from "@/lib/permissions";

type PermissionNodeEditorProps = {
  nodes: LuckPermsNode[];
  subjectLabel: string;
  onAdd: (key: string, value: boolean) => void;
  onSetValue: (nodeIndex: number, value: boolean) => void;
  onSetContext: (nodeIndex: number, context: PermissionContext) => void;
  onRemove: (nodeIndex: number) => void;
  onPrepareTransfer?: (nodeIndex: number) => void;
  onStartDrag?: (nodeIndex: number) => void;
  onEndDrag?: () => void;
  catalog?: Map<string, PermissionEntry>;
};

export function PermissionNodeEditor({
  nodes,
  subjectLabel,
  onAdd,
  onSetValue,
  onSetContext,
  onRemove,
  onPrepareTransfer,
  onStartDrag,
  onEndDrag,
  catalog,
}: PermissionNodeEditorProps) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState(true);
  const [filters, setFilters] = useState(defaultPermissionFilter);
  const [grouping, setGrouping] = useState<"flat" | "plugin" | "segment">(
    "plugin",
  );
  const [sort, setSort] = useState<PermissionSort>("name");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const permissions = sortPermissions(
    filterPermissionNodes(nodes, filters),
    sort,
    (permission) => permission.node,
    catalog,
  );
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

  function toggleGroup(groupId: string) {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
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
      <PermissionSortingControl value={sort} onChange={setSort} />
      {permissions.length ? (
        <PermissionGroupList
          nodes={nodes}
          groups={permissionGroups}
          grouping={grouping}
          subjectLabel={subjectLabel}
          expandedGroups={expandedGroups}
          onToggleGroup={toggleGroup}
          onSetValue={onSetValue}
          onSetContext={onSetContext}
          onRemove={onRemove}
          onPrepareTransfer={onPrepareTransfer}
          onStartDrag={onStartDrag}
          onEndDrag={onEndDrag}
        />
      ) : (
        <section
          className="direct-permission-list"
          aria-label="Permisos directos"
        >
          <p className="editor-empty">
            {nodes.some((n) => n.type === "permission")
              ? "Ningún permiso coincide con los filtros activos."
              : `${subjectLabel} no tiene permisos directos. Añade un nodo personalizado.`}
          </p>
        </section>
      )}
    </>
  );
}
