"use client";

import { Search, Sparkles } from "lucide-react";
import { useState } from "react";
import type { PermissionAudience, PermissionCatalog } from "@/lib/permissions";

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
  catalog: PermissionCatalog;
  groupName: string | null;
  canApply: boolean;
  onApply: (nodes: string[]) => void;
};

export function CatalogPanel({
  catalog,
  groupName,
  canApply,
  onApply,
}: CatalogPanelProps) {
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState<PermissionAudience | "all">("all");
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
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
  function apply() {
    onApply([...selectedNodes]);
    setSelectedNodes(new Set());
  }
  return (
    <section className="workspace">
      <div className="workspace-title">
        <div>
          <p className="eyebrow">CATALOGO / {catalog.name.toUpperCase()}</p>
          <h2>
            {groupName
              ? `Aplicar a ${groupName}`
              : "Construye una plantilla con criterio"}
          </h2>
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
      <div className="selection-dock">
        <span>{selectedNodes.size} seleccionados</span>
        <button
          type="button"
          className="primary-action"
          disabled={!canApply || selectedNodes.size === 0}
          onClick={apply}
        >
          Añadir concedidos <Sparkles size={15} />
        </button>
      </div>
    </section>
  );
}
