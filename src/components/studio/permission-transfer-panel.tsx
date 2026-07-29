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
          mode,
        );

  if (sourceNodeIndex === null) return null;

  return (
    <section className="permission-transfer" aria-labelledby="transfer-title">
      <div className="permission-transfer-heading">
        <div>
          <p className="eyebrow">OPERACIÓN ENTRE GRUPOS</p>
          <h3 id="transfer-title">Decidir cambio de permiso</h3>
        </div>
        <button type="button" className="text-button" onClick={onClose}>
          Cancelar
        </button>
      </div>
      <p className="editor-intro">
        Copiar y mover conservan valor, contexto y atributos. Conceder, denegar
        y eliminar solo afectan el mismo permiso y contexto en el destino; nunca
        cambian el origen.
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
          <label>
            <input
              type="radio"
              checked={mode === "grant"}
              onChange={() => setMode("grant")}
            />
            Conceder
          </label>
          <label>
            <input
              type="radio"
              checked={mode === "deny"}
              onChange={() => setMode("deny")}
            />
            Denegar
          </label>
          <label>
            <input
              type="radio"
              checked={mode === "remove"}
              onChange={() => setMode("remove")}
            />
            Eliminar del destino
          </label>
        </fieldset>
      </div>
      <p className="permission-transfer-preview" aria-live="polite">
        {preview ? (
          <>
            <ArrowRightLeft size={14} aria-hidden="true" />{" "}
            <code>{preview.node.key}</code>{" "}
            {preview.mode === "copy" && "se copiará de"}
            {preview.mode === "move" && "se moverá de"}
            {preview.mode === "grant" && "se concederá en"}
            {preview.mode === "deny" && "se denegará en"}
            {preview.mode === "remove" && "se eliminará de"}{" "}
            {(preview.mode === "copy" || preview.mode === "move") && (
              <>
                <strong>{preview.sourceGroup}</strong> a{" "}
              </>
            )}
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
        {mode === "copy"
          ? "Confirmar copia"
          : mode === "move"
            ? "Confirmar movimiento"
            : mode === "grant"
              ? "Confirmar concesión"
              : mode === "deny"
                ? "Confirmar denegación"
                : "Confirmar eliminación"}
      </button>
    </section>
  );
}
