"use client";

import { useState } from "react";
import {
  type CatalogPermissionDecision,
  previewCatalogPermissionDecision,
} from "@/lib/luckperms";
import type { LuckPermsBackup } from "@/lib/permissions";

type CatalogPermissionDropPanelProps = {
  backup: LuckPermsBackup;
  permissionKey: string;
  initialTargetGroup: string;
  onApply: (
    permissionKey: string,
    targetGroup: string,
    decision: CatalogPermissionDecision,
  ) => void;
  onClose: () => void;
};

export function CatalogPermissionDropPanel({
  backup,
  permissionKey,
  initialTargetGroup,
  onApply,
  onClose,
}: CatalogPermissionDropPanelProps) {
  const [targetGroup, setTargetGroup] = useState(initialTargetGroup);
  const [decision, setDecision] = useState<CatalogPermissionDecision>("grant");
  const preview = previewCatalogPermissionDecision(
    backup,
    permissionKey,
    targetGroup,
    decision,
  );

  return (
    <section
      className="permission-transfer"
      aria-labelledby="catalog-drop-title"
    >
      <div className="permission-transfer-heading">
        <div>
          <p className="eyebrow">CATALOGO / OPERACION LOCAL</p>
          <h3 id="catalog-drop-title">Decidir permiso documentado</h3>
        </div>
        <button type="button" className="text-button" onClick={onClose}>
          Cancelar
        </button>
      </div>
      <p className="editor-intro">
        El catálogo solo aporta la clave documentada. Este cambio crea o
        actualiza el permiso global del backup y no modifica nodos con contexto.
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
              checked={decision === "grant"}
              onChange={() => setDecision("grant")}
            />
            Conceder
          </label>
          <label>
            <input
              type="radio"
              checked={decision === "deny"}
              onChange={() => setDecision("deny")}
            />
            Denegar
          </label>
        </fieldset>
      </div>
      <p className="permission-transfer-preview" aria-live="polite">
        {preview ? (
          <>
            <code>{preview.key}</code> se{" "}
            {preview.value ? "concederá" : "denegará"} en{" "}
            <strong>{preview.groupName}</strong>
            {preview.existingGlobalValue === null
              ? ". Se creará un permiso global."
              : ". Se actualizará el permiso global existente."}
          </>
        ) : (
          "Selecciona un grupo de destino para revisar el cambio."
        )}
      </p>
      <button
        type="button"
        className="primary-action"
        disabled={!preview}
        onClick={() =>
          preview && onApply(preview.key, preview.groupName, decision)
        }
      >
        Confirmar {decision === "grant" ? "concesión" : "denegación"}
      </button>
    </section>
  );
}
