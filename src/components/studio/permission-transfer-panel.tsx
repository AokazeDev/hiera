"use client";

import { ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import {
  type PermissionTransferMode,
  previewGroupPermissionTransfer,
  validateGroupPermissionTransfer,
} from "@/lib/luckperms";
import type { LuckPermsBackup } from "@/lib/permissions";

type PermissionTransferPanelProps = {
  backup: LuckPermsBackup;
  sourceGroup: string;
  sourceNodeIndex: number | null;
  initialTargetGroup: string | null;
  onTransfer: (targetGroup: string, mode: PermissionTransferMode) => void;
  onClose: () => void;
};

export function PermissionTransferPanel({
  backup,
  sourceGroup,
  sourceNodeIndex,
  initialTargetGroup,
  onTransfer,
  onClose,
}: PermissionTransferPanelProps) {
  const [targetGroup, setTargetGroup] = useState(initialTargetGroup ?? "");
  const [mode, setMode] = useState<PermissionTransferMode>("copy");
  const preview =
    sourceNodeIndex === null || !targetGroup
      ? null
      : previewGroupPermissionTransfer(
          backup,
          sourceGroup,
          sourceNodeIndex,
          targetGroup,
          mode,
        );
  const error =
    sourceNodeIndex === null || !targetGroup
      ? null
      : validateGroupPermissionTransfer(
          backup,
          sourceGroup,
          sourceNodeIndex,
          targetGroup,
        );

  if (sourceNodeIndex === null) return null;

  return (
    <section className="permission-transfer" aria-labelledby="transfer-title">
      <div className="permission-transfer-heading">
        <div>
          <p className="eyebrow">OPERACIÓN ENTRE GRUPOS</p>
          <h3 id="transfer-title">Copiar o mover permiso</h3>
        </div>
        <button type="button" className="text-button" onClick={onClose}>
          Cancelar
        </button>
      </div>
      <p className="editor-intro">
        El nodo conserva su valor, contexto y atributos al llegar al destino.
        También puedes arrastrarlo hacia un grupo del rail para preseleccionar
        el destino.
      </p>
      <div className="permission-transfer-controls">
        <label>
          <span>Grupo de destino</span>
          <select
            value={targetGroup}
            onChange={(event) => setTargetGroup(event.target.value)}
          >
            <option value="">Selecciona un grupo</option>
            {Object.keys(backup.groups).map((groupName) => (
              <option key={groupName} value={groupName}>
                {groupName}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Operación</legend>
          <label>
            <input
              type="radio"
              checked={mode === "copy"}
              onChange={() => setMode("copy")}
            />
            Copiar
          </label>
          <label>
            <input
              type="radio"
              checked={mode === "move"}
              onChange={() => setMode("move")}
            />
            Mover
          </label>
        </fieldset>
      </div>
      <p className="permission-transfer-preview" aria-live="polite">
        {preview ? (
          <>
            <ArrowRightLeft size={14} aria-hidden="true" />{" "}
            <code>{preview.node.key}</code>{" "}
            {preview.mode === "copy" ? "se copiará de" : "se moverá de"}{" "}
            <strong>{preview.sourceGroup}</strong> a{" "}
            <strong>{preview.targetGroup}</strong>.
          </>
        ) : error ? (
          error
        ) : (
          "Selecciona un grupo de destino para revisar el cambio."
        )}
      </p>
      <button
        type="button"
        className="primary-action"
        disabled={!preview}
        onClick={() => preview && onTransfer(preview.targetGroup, preview.mode)}
      >
        {mode === "copy" ? "Confirmar copia" : "Confirmar movimiento"}
      </button>
    </section>
  );
}
