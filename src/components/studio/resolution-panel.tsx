"use client";

import { Info, ShieldAlert, UserRound } from "lucide-react";
import { useState } from "react";
import { EditHistory } from "@/components/studio/edit-history";
import { GroupInheritanceEditor } from "@/components/studio/group-inheritance-editor";
import { PermissionFilterBar } from "@/components/studio/permission-filter-bar";
import {
  type BackupHistory,
  defaultPermissionFilter,
  filterResolvedPermissions,
  getEffectiveNodes,
  getEffectiveUserNodes,
} from "@/lib/luckperms";
import type { LuckPermsBackup } from "@/lib/permissions";

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
}: ResolutionPanelProps) {
  const [filters, setFilters] = useState(defaultPermissionFilter);
  const group = backup && groupName ? backup.groups[groupName] : null;
  const effective =
    backup && groupName ? getEffectiveNodes(backup, groupName) : [];
  const user = backup && userId ? backup.users?.[userId] : null;
  const userEffective =
    backup && userId ? getEffectiveUserNodes(backup, userId) : [];
  const selectedName = groupName ?? user?.username ?? userId;
  const selectedEffective = groupName ? effective : userEffective;
  const filteredEffective = filterResolvedPermissions(
    selectedEffective,
    filters,
  );
  const totalCount = selectedEffective.length;
  const filteredCount = filteredEffective.length;

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
          <div className="effective-count">
            <strong>{filteredCount}</strong>
            <span>
              {totalCount === filteredCount
                ? "permisos efectivos"
                : `de ${totalCount} permisos efectivos`}
            </span>
          </div>
          <div className="effective-list">
            {filteredEffective.slice(0, 10).map((node) => (
              <div key={`${node.origin}-${node.key}`}>
                <span className={node.value ? "value-true" : "value-false"}>
                  {node.value ? "+" : "-"}
                </span>
                <code>{node.key}</code>
                <small>{node.inherited ? node.origin : "directo"}</small>
              </div>
            ))}
            {filteredEffective.length > 10 && (
              <p>+ {filteredEffective.length - 10} más</p>
            )}
            {filteredEffective.length === 0 && totalCount > 0 && (
              <p>Ningún permiso coincide con los filtros activos.</p>
            )}
          </div>
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
          <div className="effective-count">
            <strong>{filteredCount}</strong>
            <span>
              {totalCount === filteredCount
                ? "permisos efectivos"
                : `de ${totalCount} permisos efectivos`}
            </span>
          </div>
          <div className="effective-list">
            {filteredEffective.slice(0, 10).map((node) => (
              <div key={`${node.origin}-${node.key}`}>
                <span className={node.value ? "value-true" : "value-false"}>
                  {node.value ? "+" : "-"}
                </span>
                <code>{node.key}</code>
                <small>{node.inherited ? node.origin : "directo"}</small>
              </div>
            ))}
            {filteredEffective.length > 10 && (
              <p>+ {filteredEffective.length - 10} más</p>
            )}
            {filteredEffective.length === 0 && totalCount > 0 && (
              <p>Ningún permiso coincide con los filtros activos.</p>
            )}
          </div>
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
