"use client";

import { NodeInspector } from "@/components/studio/node-inspector";
import { PermissionNodeEditor } from "@/components/studio/permission-node-editor";
import { PermissionTransferPanel } from "@/components/studio/permission-transfer-panel";
import type { PermissionTransferMode } from "@/lib/luckperms";
import type { LuckPermsBackup, PermissionEntry } from "@/lib/permissions";

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
  transferRequest: { nodeIndex: number; targetGroup: string | null } | null;
  onPrepareTransfer: (nodeIndex: number) => void;
  onStartDrag: (nodeIndex: number) => void;
  onEndDrag: () => void;
  onCloseTransfer: () => void;
  catalog?: Map<string, PermissionEntry>;
};

export function GroupPermissionEditor({
  backup,
  groupName,
  onAdd,
  onSetValue,
  onRemove,
  onTransfer,
  transferRequest,
  onPrepareTransfer,
  onStartDrag,
  onEndDrag,
  onCloseTransfer,
  catalog,
}: GroupPermissionEditorProps) {
  const group = backup && groupName ? backup.groups[groupName] : null;

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
            conservan al conceder o denegar un permiso existente. Arrastra el
            control de puntos hacia otro grupo o usa "Cambiar en otro grupo" con
            teclado.
          </p>
          <PermissionNodeEditor
            nodes={group.nodes}
            subjectLabel={`El grupo ${groupName}`}
            onAdd={onAdd}
            onSetValue={onSetValue}
            onRemove={onRemove}
            onPrepareTransfer={onPrepareTransfer}
            onStartDrag={onStartDrag}
            onEndDrag={onEndDrag}
            catalog={catalog}
          />
          <PermissionTransferPanel
            key={`${transferRequest?.nodeIndex ?? "none"}-${transferRequest?.targetGroup ?? "none"}`}
            backup={backup}
            sourceGroup={groupName}
            sourceNodeIndex={transferRequest?.nodeIndex ?? null}
            initialTargetGroup={transferRequest?.targetGroup ?? null}
            onClose={onCloseTransfer}
            onTransfer={(targetGroup, mode) => {
              if (transferRequest) {
                onTransfer(transferRequest.nodeIndex, targetGroup, mode);
              }
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
