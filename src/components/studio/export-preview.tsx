"use client";

import { Download, FileDiff, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  type BackupEntityDiff,
  diffBackups,
  type NodeChange,
} from "@/lib/luckperms";
import type { LuckPermsBackup, LuckPermsNode } from "@/lib/permissions";

type ExportPreviewProps = {
  original: LuckPermsBackup;
  backup: LuckPermsBackup;
  onExport: () => void;
};

function describeNode(node: LuckPermsNode) {
  const context = Object.entries(node.context ?? {})
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(", ");
  return `${node.type}: ${node.key}${context ? ` (${context})` : ""}`;
}

function EntityChanges({
  entity,
  label,
}: {
  entity: BackupEntityDiff;
  label: string;
}) {
  const action =
    entity.kind === "added"
      ? "Creado"
      : entity.kind === "removed"
        ? "Eliminado"
        : "Modificado";
  return (
    <li className="export-diff-entity">
      <strong>
        {action} {label} <code>{entity.id}</code>
      </strong>
      {entity.fieldChanges.length > 0 && (
        <ul>
          {entity.fieldChanges.map((change) => (
            <li key={change.field}>Cambió {change.field}.</li>
          ))}
        </ul>
      )}
      {entity.nodeChanges.length > 0 && (
        <ul>
          {entity.nodeChanges.map((change: NodeChange, index) => (
            <li key={`${change.kind}-${describeNode(change.node)}-${index}`}>
              {change.kind === "added" ? "Añadido" : "Eliminado"}:{" "}
              <code>{describeNode(change.node)}</code>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function ExportPreview({
  original,
  backup,
  onExport,
}: ExportPreviewProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const diff = diffBackups(original, backup);

  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

  function closeDialog() {
    setOpen(false);
  }

  function exportBackup() {
    onExport();
    closeDialog();
  }

  return (
    <>
      <button
        type="button"
        className="text-button"
        onClick={() => setOpen(true)}
      >
        <Download size={15} aria-hidden="true" /> Exportar JSON
      </button>
      <dialog
        ref={dialog}
        className="group-dialog export-preview"
        onClose={closeDialog}
      >
        <div>
          <header>
            <div>
              <p className="eyebrow">RESUMEN DE EXPORTACIÓN</p>
              <h2>Revisar cambios locales</h2>
            </div>
            <button type="button" aria-label="Cerrar" onClick={closeDialog}>
              <X size={17} aria-hidden="true" />
            </button>
          </header>
          <p className="export-preview-intro">
            {diff.changeCount
              ? `${diff.changeCount} cambios respecto al backup importado. La descarga crea un archivo nuevo.`
              : "No hay cambios respecto al backup importado. La descarga crea un archivo nuevo."}
          </p>
          {diff.changeCount > 0 && (
            <div className="export-diff">
              <FileDiff size={17} aria-hidden="true" />
              <ul>
                {diff.groups.map((group) => (
                  <EntityChanges
                    key={`group-${group.id}`}
                    entity={group}
                    label="grupo"
                  />
                ))}
                {diff.users.map((user) => (
                  <EntityChanges
                    key={`user-${user.id}`}
                    entity={user}
                    label="usuario"
                  />
                ))}
                {diff.rootChanges.map((change) => (
                  <li key={change.field}>Cambió la sección {change.field}.</li>
                ))}
              </ul>
            </div>
          )}
          <footer>
            <button type="button" className="line-button" onClick={closeDialog}>
              Volver a editar
            </button>
            <button
              type="button"
              className="primary-action"
              onClick={exportBackup}
            >
              <Download size={15} aria-hidden="true" /> Descargar JSON
            </button>
          </footer>
        </div>
      </dialog>
    </>
  );
}
