"use client";

import { GripVertical, Info, ShieldAlert, UserRound } from "lucide-react";
import { useState } from "react";
import { EditHistory } from "@/components/studio/edit-history";
import { GroupInheritanceEditor } from "@/components/studio/group-inheritance-editor";
import { PermissionContextEditor } from "@/components/studio/permission-context-editor";
import {
  type BackupHistory,
  getEffectiveNodesForContext,
  getEffectiveUserNodesForContext,
  type PermissionContext,
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
  onPreparePermissionTransfer: (sourceGroup: string, nodeIndex: number) => void;
  activeContext: PermissionContext;
  onActiveContextChange: (context: PermissionContext) => void;
  onInspectPermissionOrigin: (permission: {
    key: string;
    origin: string;
    inherited: boolean;
  }) => void;
  onStartPermissionDrag: (sourceGroup: string, nodeIndex: number) => void;
  onEndPermissionDrag: () => void;
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
  activeContext,
  onActiveContextChange,
  onInspectPermissionOrigin,
  onStartPermissionDrag,
  onEndPermissionDrag,
}: ResolutionPanelProps) {
  const [isEditingActiveContext, setIsEditingActiveContext] = useState(false);
  const group = backup && groupName ? backup.groups[groupName] : null;
  const effective =
    backup && groupName
      ? getEffectiveNodesForContext(backup, groupName, activeContext)
      : [];
  const user = backup && userId ? backup.users?.[userId] : null;
  const userEffective =
    backup && userId
      ? getEffectiveUserNodesForContext(backup, userId, activeContext)
      : [];
  const selectedName = groupName ?? user?.username ?? userId;
  const selectedEffective = groupName ? effective : userEffective;
  const totalCount = selectedEffective.length;

  function renderEffectiveList() {
    return (
      <div className="effective-list">
        {selectedEffective.slice(0, 10).map((node) => (
          <div key={`${node.origin}-${node.originNodeIndex}-${node.key}`}>
            <span className={node.value ? "value-true" : "value-false"}>
              {node.value ? "+" : "-"}
            </span>
            <code>{node.key}</code>
            <small>{node.inherited ? node.origin : "directo"}</small>
            {node.contextConflict && (
              <small className="context-conflict">conflicto contextual</small>
            )}
            {(groupName || userId) && (
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
                  Abrir ruta
                </button>
                {groupName && (
                  <>
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
              </>
            )}
          </div>
        ))}
        {totalCount > 10 && <p>+ {totalCount - 10} más</p>}
      </div>
    );
  }

  return (
    <aside className="resolution-panel">
      <div className="rail-heading">
        <span>RESOLUCIÓN</span>
      </div>
      {backup && (groupName || userId) && (
        <section className="active-context" aria-label="Contexto activo">
          <div>
            <strong>Contexto activo</strong>
            <p>
              {Object.keys(activeContext).length === 0
                ? "Global: solo aplican nodos sin contexto."
                : `${Object.keys(activeContext).length} condiciones activas.`}
            </p>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() => setIsEditingActiveContext(true)}
          >
            Cambiar
          </button>
          {isEditingActiveContext && (
            <PermissionContextEditor
              context={activeContext}
              nodeKey="la resolución"
              validateContext={() => null}
              onSave={onActiveContextChange}
              onClose={() => setIsEditingActiveContext(false)}
            />
          )}
        </section>
      )}
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
          <div className="effective-count">
            <strong>{totalCount}</strong>
            <span>permisos efectivos</span>
          </div>
          {renderEffectiveList()}
        </>
      ) : backup && user && userId ? (
        <>
          <div className="selected-group">
            <UserRound size={16} aria-hidden="true" />
            {selectedName}
          </div>
          <div className="effective-count">
            <strong>{totalCount}</strong>
            <span>permisos efectivos</span>
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
