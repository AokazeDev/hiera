"use client";

import { NodeInspector } from "@/components/studio/node-inspector";
import { PermissionNodeEditor } from "@/components/studio/permission-node-editor";
import type { LuckPermsBackup } from "@/lib/permissions";

type GroupPermissionEditorProps = {
  backup: LuckPermsBackup | null;
  groupName: string | null;
  onAdd: (key: string, value: boolean) => void;
  onSetValue: (nodeIndex: number, value: boolean) => void;
  onRemove: (nodeIndex: number) => void;
};

export function GroupPermissionEditor({
  backup,
  groupName,
  onAdd,
  onSetValue,
  onRemove,
}: GroupPermissionEditorProps) {
  const group = backup && groupName ? backup.groups[groupName] : null;

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
