"use client";

import { useState } from "react";
import { NodeInspector } from "@/components/studio/node-inspector";
import { PermissionNodeEditor } from "@/components/studio/permission-node-editor";
import { PermissionTransferPanel } from "@/components/studio/permission-transfer-panel";
import type { PermissionTransferMode } from "@/lib/luckperms";
import type { LuckPermsBackup } from "@/lib/permissions";

type GroupPermissionEditorProps = {
  backup: LuckPermsBackup | null;
  groupName: string | null;
  onAdd: (key: string, value: boolean) => void;
  onSetValue: (nodeIndex: number, value: boolean) => void;
  onRemove: (nodeIndex: number) => void;
  onTransfer: (
    nodeIndex: number,
    targetGroup: string,
    mode: PermissionTransferMode,
  ) => void;
};

export function GroupPermissionEditor({
  backup,
  groupName,
  onAdd,
  onSetValue,
  onRemove,
  onTransfer,
}: GroupPermissionEditorProps) {
  const group = backup && groupName ? backup.groups[groupName] : null;
  const [transferNodeIndex, setTransferNodeIndex] = useState<number | null>(
    null,
  );

  return (
    <section className="workspace" aria-labelledby="group-editor-title">
      {backup && group && groupName ? (
        <>
          <div className="workspace-title">
            <div>
              <p className="eyebrow">EDITOR / GRUPO</p>
              <h2 id="group-editor-title">{groupName}</h2>
            </div>
            <p className="editor-summary">
              {group.nodes.filter((node) => node.type === "permission").length}{" "}
              permisos directos
            </p>
          </div>
          <p className="editor-intro">
            Los cambios solo afectan a este grupo. Los nodos con contexto se
            conservan al conceder o denegar un permiso existente.
          </p>
          <PermissionNodeEditor
            nodes={group.nodes}
            subjectLabel={`El grupo ${groupName}`}
            onAdd={onAdd}
            onSetValue={onSetValue}
            onRemove={onRemove}
            onPrepareTransfer={setTransferNodeIndex}
          />
          <PermissionTransferPanel
            backup={backup}
            sourceGroup={groupName}
            sourceNodeIndex={transferNodeIndex}
            onClose={() => setTransferNodeIndex(null)}
            onTransfer={(targetGroup, mode) => {
              if (transferNodeIndex !== null) {
                onTransfer(transferNodeIndex, targetGroup, mode);
              }
              setTransferNodeIndex(null);
            }}
          />
          <NodeInspector
            nodes={group.nodes}
            subjectLabel={`el grupo ${groupName}`}
          />
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
