"use client";

import { GripVertical, Info, ShieldAlert, UserRound } from "lucide-react";
import { useState } from "react";
import { EditHistory } from "@/components/studio/edit-history";
import { GroupInheritanceEditor } from "@/components/studio/group-inheritance-editor";
import { PermissionFilterBar } from "@/components/studio/permission-filter-bar";
import { PermissionGroupingControl } from "@/components/studio/permission-grouping-control";
import { PermissionSortingControl } from "@/components/studio/permission-sorting-control";
import {
  type BackupHistory,
  defaultPermissionFilter,
  filterResolvedPermissions,
  getEffectiveNodes,
  getEffectiveUserNodes,
  groupPermissions,
  sortPermissions,
} from "@/lib/luckperms";
import type { LuckPermsBackup, PermissionEntry } from "@/lib/permissions";

type ResolutionPanelProps = {
  backup: LuckPermsBackup | null;
  groupName: string | null;
  userId: string | null;
  history: BackupHistory;
  onUndo: () => void;
  onRedo: () => void;
  onSelectGroup: (group: string) => void;
  onAddInheritance: (parentName: string) => void;
  onRemoveInheritance: (nodeIndex: number) => void;
  onPreparePermissionTransfer: (sourceGroup: string, nodeIndex: number) => void;
  onInspectPermissionOrigin: (permission: {
    key: string;
    origin: string;
    inherited: boolean;
  }) => void;
  onStartPermissionDrag: (sourceGroup: string, nodeIndex: number) => void;
  onEndPermissionDrag: () => void;
  catalog?: Map<string, PermissionEntry>;
};

export function ResolutionPanel({
  backup,
  groupName,
  userId,
  history,
  onUndo,
  onRedo,
  onSelectGroup,
  onAddInheritance,
  onRemoveInheritance,
  onPreparePermissionTransfer,
  onInspectPermissionOrigin,
  onStartPermissionDrag,
  onEndPermissionDrag,
  catalog,
}: ResolutionPanelProps) {
  const [filters, setFilters] = useState(defaultPermissionFilter);
  const [grouping, setGrouping] = useState<"flat" | "plugin" | "segment">(
    "flat",
  );
  const [sort, setSort] = useState<
    "name" | "status" | "category" | "origin" | "recommendation"
  >("name");
  const group = backup && groupName ? backup.groups[groupName] : null;
  const effective =
    backup && groupName ? getEffectiveNodes(backup, groupName) : [];
  const user = backup && userId ? backup.users?.[userId] : null;
  const userEffective =
    backup && userId ? getEffectiveUserNodes(backup, userId) : [];
  const selectedName = groupName ?? user?.username ?? userId;
  const selectedEffective = groupName ? effective : userEffective;
  const filteredEffective = sortPermissions(
    filterResolvedPermissions(selectedEffective, filters),
    sort,
    (permission) => permission,
    catalog,
  );
  const totalCount = selectedEffective.length;
  const filteredCount = filteredEffective.length;
  const permissionGroups = groupPermissions(
    filteredEffective,
    (permission) => permission.key,
    grouping,
  );

  function renderEffectiveList() {
    return (
      <div className="effective-list">
        {permissionGroups.map((group) => (
          <div className="permission-group" key={group.id}>
            {grouping !== "flat" && (
              <h3>
                <code>{group.label}</code>
                <span>{group.items.length}</span>
              </h3>
            )}
            {group.items.slice(0, 10).map((node) => (
              <div key={`${node.origin}-${node.originNodeIndex}-${node.key}`}>
                <span className={node.value ? "value-true" : "value-false"}>
                  {node.value ? "+" : "-"}
                </span>
                <code>{node.key}</code>
                <small>{node.inherited ? node.origin : "directo"}</small>
                {groupName && (
                  <>
                    <button
                      type="button"
                      className="effective-permission-origin"
                      onClick={() =>
                        onInspectPermissionOrigin({
                          key: node.key,
                          origin: node.origin,
                          inherited: node.inherited,
                        })
                      }
                    >
                      Ver origen
                    </button>
                    <span
                      className="permission-drag-handle"
                      draggable
                      aria-hidden="true"
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "copyMove";
                        event.dataTransfer.setData("text/plain", node.key);
                        onStartPermissionDrag(
                          node.origin,
                          node.originNodeIndex,
                        );
                      }}
                      onDragEnd={onEndPermissionDrag}
                    >
                      <GripVertical size={14} aria-hidden="true" />
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
            ))}
            {group.items.length > 10 && <p>+ {group.items.length - 10} más</p>}
          </div>
        ))}
        {filteredEffective.length === 0 && totalCount > 0 && (
          <p>Ningún permiso coincide con los filtros activos.</p>
        )}
      </div>
    );
  }

  return (
    <aside className="resolution-panel">
      <div className="rail-heading">
        <span>RESOLUCIÓN</span>
      </div>
      {backup && group && groupName ? (
        <>
          <div className="selected-group">
            <span className="group-mark" />
            {groupName}
          </div>
          <GroupInheritanceEditor
            backup={backup}
            groupName={groupName}
            onAdd={onAddInheritance}
            onRemove={onRemoveInheritance}
            onSelectGroup={onSelectGroup}
          />
          <PermissionFilterBar
            nodes={selectedEffective}
            filters={filters}
            onChange={setFilters}
            showOrigin
          />
          <PermissionGroupingControl value={grouping} onChange={setGrouping} />
          <PermissionSortingControl
            value={sort}
            onChange={setSort}
            showOrigin
          />
          <div className="effective-count">
            <strong>{filteredCount}</strong>
            <span>
              {totalCount === filteredCount
                ? "permisos efectivos"
                : `de ${totalCount} permisos efectivos`}
            </span>
          </div>
          {renderEffectiveList()}
        </>
      ) : backup && user && userId ? (
        <>
          <div className="selected-group">
            <UserRound size={16} aria-hidden="true" />
            {selectedName}
          </div>
          <PermissionFilterBar
            nodes={selectedEffective}
            filters={filters}
            onChange={setFilters}
            showOrigin
          />
          <PermissionGroupingControl value={grouping} onChange={setGrouping} />
          <PermissionSortingControl
            value={sort}
            onChange={setSort}
            showOrigin
          />
          <div className="effective-count">
            <strong>{filteredCount}</strong>
            <span>
              {totalCount === filteredCount
                ? "permisos efectivos"
                : `de ${totalCount} permisos efectivos`}
            </span>
          </div>
          {renderEffectiveList()}
        </>
      ) : (
        <div className="resolution-empty">
          <Info size={21} />
          <p>
            La resolución mostrará el origen de cada permiso cuando importes un
            backup.
          </p>
        </div>
      )}
      {backup && (
        <EditHistory history={history} onUndo={onUndo} onRedo={onRedo} />
      )}
      <div className="safety-note">
        <ShieldAlert size={15} />
        <p>
          Los comodines y bypasses requieren una revisión manual antes de
          aplicarlos a producción.
        </p>
      </div>
    </aside>
  );
}
