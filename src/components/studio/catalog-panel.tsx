"use client";

import { GripVertical, Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { CatalogPermissionDropPanel } from "@/components/studio/catalog-permission-drop-panel";
import type {
  CatalogPermissionDecision,
  PermissionBatchDecision,
} from "@/lib/luckperms";
import { previewPermissionBatch } from "@/lib/luckperms";
import type {
  LuckPermsBackup,
  PermissionAudience,
  PermissionCatalog,
} from "@/lib/permissions";

const audiences: Array<[PermissionAudience, string]> = [
  ["admin", "Administración"],
  ["player", "Jugador"],
  ["group", "Por grupo"],
  ["sensitive", "Sensible"],
];
const labels: Record<PermissionAudience, string> = {
  admin: "Admin",
  player: "Jugador",
  group: "Grupo",
  sensitive: "Revisar",
};

type CatalogPanelProps = {
  backup: LuckPermsBackup | null;
  catalog: PermissionCatalog;
  groupName: string | null;
  onApply: (
    nodes: string[],
    groupNames: string[],
    decision: PermissionBatchDecision,
  ) => void;
  dragRequest: { permissionKey: string; targetGroup: string } | null;
  onStartPermissionDrag: (permissionKey: string) => void;
  onEndPermissionDrag: () => void;
  onApplyDroppedPermission: (
    permissionKey: string,
    groupName: string,
    decision: CatalogPermissionDecision,
  ) => void;
  onCloseDragRequest: () => void;
};

export function CatalogPanel({
  backup,
  catalog,
  groupName,
  onApply,
  dragRequest,
  onStartPermissionDrag,
  onEndPermissionDrag,
  onApplyDroppedPermission,
  onCloseDragRequest,
}: CatalogPanelProps) {
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState<PermissionAudience | "all">("all");
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [targetGroups, setTargetGroups] = useState<Set<string>>(new Set());
  const [batchDecision, setBatchDecision] =
    useState<PermissionBatchDecision>("grant");
  useEffect(() => {
    setTargetGroups(groupName ? new Set([groupName]) : new Set());
  }, [groupName]);
  const permissions = catalog.permissions.filter(
    (permission) =>
      `${permission.node} ${permission.description}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (audience === "all" || permission.audience.includes(audience)),
  );
  function toggle(node: string) {
    setSelectedNodes((current) => {
      const next = new Set(current);
      if (next.has(node)) next.delete(node);
      else next.add(node);
      return next;
    });
  }
  function toggleTarget(group: string) {
    setTargetGroups((current) => {
      const next = new Set(current);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }
  const preview = backup
    ? previewPermissionBatch(
        backup,
        [...targetGroups],
        [...selectedNodes],
        batchDecision,
      )
    : null;
  function apply() {
    onApply([...selectedNodes], [...targetGroups], batchDecision);
    setSelectedNodes(new Set());
  }
  return (
    <section className="workspace">
      <div className="workspace-title">
        <div>
          <p className="eyebrow">CATALOGO / {catalog.name.toUpperCase()}</p>
          <h2>Construye una plantilla con criterio</h2>
        </div>
        <a href={catalog.website} target="_blank" rel="noreferrer">
          Plugin y descargas
        </a>
      </div>
      <div className="catalog-meta">
        <span>{catalog.version}</span>
        <span>Actualizado {catalog.updatedAt}</span>
        <a href={catalog.source} target="_blank" rel="noreferrer">
          Fuente: {catalog.sourceLabel}
        </a>
      </div>
      <div className="catalog-controls">
        <label>
          <Search size={15} />
          <span className="sr-only">Buscar permiso</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar nodo o descripción"
          />
        </label>
        <div className="filter-row">
          {[["all", "Todos"], ...audiences].map(([key, label]) => (
            <button
              type="button"
              key={key}
              className={audience === key ? "filter-active" : ""}
              onClick={() => setAudience(key as PermissionAudience | "all")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="permission-table">
        {permissions.map((permission) => (
          <label className="permission-row" key={permission.node}>
            <input
              type="checkbox"
              checked={selectedNodes.has(permission.node)}
              onChange={() => toggle(permission.node)}
            />
            <span
              className="catalog-drag-handle"
              draggable
              aria-hidden="true"
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "copy";
                event.dataTransfer.setData("text/plain", permission.node);
                onStartPermissionDrag(permission.node);
              }}
              onDragEnd={onEndPermissionDrag}
            >
              <GripVertical size={14} aria-hidden="true" />
            </span>
            <span className="permission-node">{permission.node}</span>
            <span className="permission-description">
              {permission.description}
            </span>
            <span className="permission-audiences">
              {permission.audience.map((item) => (
                <i key={item} className={`audience-${item}`}>
                  {labels[item]}
                </i>
              ))}
            </span>
          </label>
        ))}
      </div>
      {backup && dragRequest && (
        <CatalogPermissionDropPanel
          key={`${dragRequest.permissionKey}-${dragRequest.targetGroup}`}
          backup={backup}
          permissionKey={dragRequest.permissionKey}
          initialTargetGroup={dragRequest.targetGroup}
          onApply={onApplyDroppedPermission}
          onClose={onCloseDragRequest}
        />
      )}
      {backup && (
        <fieldset className="batch-targets">
          <legend>Grupos de destino</legend>
          <p>Elige el cambio y los grupos de destino.</p>
          <div className="batch-decisions">
            {(
              [
                ["grant", "Conceder"],
                ["deny", "Denegar"],
                ["remove", "Eliminar globales"],
              ] as Array<[PermissionBatchDecision, string]>
            ).map(([decision, label]) => (
              <label key={decision}>
                <input
                  type="radio"
                  name="batch-decision"
                  checked={batchDecision === decision}
                  onChange={() => setBatchDecision(decision)}
                />
                {label}
              </label>
            ))}
          </div>
          <div>
            {Object.keys(backup.groups).map((group) => (
              <label key={group}>
                <input
                  type="checkbox"
                  checked={targetGroups.has(group)}
                  onChange={() => toggleTarget(group)}
                />
                {group}
              </label>
            ))}
          </div>
          {preview && selectedNodes.size > 0 && (
            <ul className="batch-preview" aria-live="polite">
              {preview.targets.map((target) => (
                <li key={target.groupName}>
                  <strong>{target.groupName}</strong>
                  {target.additions.length > 0 &&
                    `: añadir ${target.additions.join(", ")}.`}
                  {target.updates.length > 0 &&
                    ` Actualizar ${target.updates.join(", ")}.`}
                  {target.removals.length > 0 &&
                    ` Eliminar ${target.removals.join(", ")}.`}
                  {target.unchanged.length > 0 &&
                    ` Sin cambios: ${target.unchanged.join(", ")}.`}
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      )}
      <div className="selection-dock">
        <span aria-live="polite">
          {preview
            ? `${selectedNodes.size} seleccionados, ${preview.changeCount} cambios en ${preview.targets.length} grupos.`
            : `${selectedNodes.size} seleccionados. Importa un backup para elegir destinos.`}
        </span>
        <button
          type="button"
          className="primary-action"
          disabled={!preview || preview.changeCount === 0}
          onClick={apply}
        >
          {batchDecision === "grant"
            ? "Aplicar concesiones"
            : batchDecision === "deny"
              ? "Aplicar denegaciones"
              : "Eliminar permisos globales"}{" "}
          <Sparkles size={15} />
        </button>
      </div>
    </section>
  );
}
