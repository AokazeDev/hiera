"use client";

import { Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
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
  onApply: (nodes: string[], groupNames: string[]) => void;
};

export function CatalogPanel({
  backup,
  catalog,
  groupName,
  onApply,
}: CatalogPanelProps) {
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState<PermissionAudience | "all">("all");
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [targetGroups, setTargetGroups] = useState<Set<string>>(new Set());
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
    ? previewPermissionBatch(backup, [...targetGroups], [...selectedNodes])
    : null;
  function apply() {
    onApply([...selectedNodes], [...targetGroups]);
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
      {backup && (
        <fieldset className="batch-targets">
          <legend>Grupos de destino</legend>
          <p>Elige dónde se concederá esta selección.</p>
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
                  {target.additions.length > 0
                    ? `: conceder ${target.additions.join(", ")}.`
                    : ": sin permisos nuevos."}
                  {target.alreadyPresent.length > 0 &&
                    ` Ya contiene ${target.alreadyPresent.join(", ")}.`}
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      )}
      <div className="selection-dock">
        <span aria-live="polite">
          {preview
            ? `${selectedNodes.size} seleccionados, ${preview.additionCount} concesiones nuevas en ${preview.targets.length} grupos.`
            : `${selectedNodes.size} seleccionados. Importa un backup para elegir destinos.`}
        </span>
        <button
          type="button"
          className="primary-action"
          disabled={!preview || preview.additionCount === 0}
          onClick={apply}
        >
          Añadir concedidos <Sparkles size={15} />
        </button>
      </div>
    </section>
  );
}
