"use client";

import { ExternalLink, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  type PermissionBatchDecision,
  previewPermissionBatch,
} from "@/lib/luckperms";
import type {
  LuckPermsBackup,
  PermissionAudience,
  PermissionCatalog,
} from "@/lib/permissions";

const audienceLabels: Record<PermissionAudience, string> = {
  admin: "Admin",
  player: "Usuario",
  group: "Grupo",
  sensitive: "Revisar",
};

const audienceFilters = [
  "all",
  "admin",
  "player",
  "group",
  "sensitive",
] as const;

type AudienceFilter = (typeof audienceFilters)[number];

type CatalogPanelProps = {
  backup: LuckPermsBackup | null;
  catalogs: PermissionCatalog[];
  selectedGroup: string | null;
  onApply: (
    nodes: string[],
    groupNames: string[],
    decision: PermissionBatchDecision,
  ) => void;
};

export function CatalogPanel({
  backup,
  catalogs,
  selectedGroup,
  onApply,
}: CatalogPanelProps) {
  const [selectedCatalog, setSelectedCatalog] =
    useState<PermissionCatalog | null>(null);
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState<AudienceFilter>("all");
  const [sortBy, setSortBy] = useState<"node" | "category">("node");
  const dialog = useRef<HTMLDialogElement>(null);
  const targetGroups = backup ? Object.keys(backup.groups) : [];
  const defaultTarget =
    selectedGroup && targetGroups.includes(selectedGroup)
      ? selectedGroup
      : (targetGroups[0] ?? "");
  const [batchTarget, setBatchTarget] = useState(defaultTarget);
  const [pendingApply, setPendingApply] = useState<string[] | null>(null);

  useEffect(() => setBatchTarget(defaultTarget), [defaultTarget]);
  useEffect(() => {
    if (selectedCatalog) dialog.current?.showModal();
  }, [selectedCatalog]);

  function close() {
    dialog.current?.close();
    setSelectedCatalog(null);
    setQuery("");
    setAudience("all");
  }

  function prepareApply(nodes: string[], target = batchTarget) {
    if (!target || nodes.length === 0) return;
    setBatchTarget(target);
    setPendingApply(nodes);
  }

  function confirmApply() {
    if (!pendingApply || !batchTarget) return;
    onApply(pendingApply, [batchTarget], "grant");
    setPendingApply(null);
  }

  const pendingPreview =
    backup && pendingApply && batchTarget
      ? previewPermissionBatch(backup, [batchTarget], pendingApply, "grant")
      : null;

  const permissions = selectedCatalog
    ? selectedCatalog.permissions
        .filter((permission) => {
          const matchesQuery = `${permission.node} ${permission.description}`
            .toLowerCase()
            .includes(query.toLowerCase());
          const matchesAudience =
            audience === "all" || permission.audience.includes(audience);
          return matchesQuery && matchesAudience;
        })
        .toSorted((left, right) =>
          sortBy === "category"
            ? left.category.localeCompare(right.category) ||
              left.node.localeCompare(right.node)
            : left.node.localeCompare(right.node),
        )
    : [];

  return (
    <section
      className="catalog-browser workspace"
      aria-labelledby="catalog-browser-title"
    >
      <header className="workspace-title">
        <div>
          <p className="eyebrow">CATÁLOGOS DE PLUGINS</p>
          <h1 id="catalog-browser-title">Fuentes de permisos verificadas.</h1>
          <p className="editor-intro">
            Un catálogo acelera la asignación de permisos documentados; no
            sustituye tu estructura ni crea una plantilla de servidor.
          </p>
        </div>
        <span className="editor-summary">
          {catalogs.length} publicado{catalogs.length === 1 ? "" : "s"}
        </span>
      </header>
      <div className="catalog-plugin-grid">
        {catalogs.map((catalog) => (
          <button
            key={catalog.slug}
            type="button"
            className="catalog-plugin-card"
            onClick={() => setSelectedCatalog(catalog)}
          >
            <span>PLUGIN / {catalog.slug}</span>
            <strong>{catalog.name}</strong>
            <small>
              {catalog.permissions.length} permisos · v{catalog.version}
            </small>
            <i>
              <span>FUENTE VERIFICADA</span> Abrir catálogo →
            </i>
          </button>
        ))}
      </div>
      <dialog
        ref={dialog}
        className="catalog-browser-dialog"
        aria-labelledby="catalog-dialog-title"
        onClose={close}
      >
        {selectedCatalog && (
          <article>
            <header>
              <div>
                <p className="eyebrow">CATÁLOGO / PLUGIN</p>
                <h2 id="catalog-dialog-title">{selectedCatalog.name}</h2>
              </div>
              <button
                type="button"
                aria-label="Cerrar catálogo"
                onClick={close}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <p className="catalog-browser-description">
              {selectedCatalog.description}
            </p>
            <dl className="catalog-browser-facts">
              <div>
                <dt>Versión</dt>
                <dd>{selectedCatalog.version}</dd>
              </div>
              <div>
                <dt>Actualizado</dt>
                <dd>{selectedCatalog.updatedAt}</dd>
              </div>
              <div>
                <dt>Permisos</dt>
                <dd>{selectedCatalog.permissions.length}</dd>
              </div>
            </dl>
            <div className="catalog-browser-links">
              <a
                href={selectedCatalog.website}
                target="_blank"
                rel="noreferrer"
              >
                Descargar plugin <ExternalLink size={13} aria-hidden="true" />
              </a>
              <a href={selectedCatalog.source} target="_blank" rel="noreferrer">
                Fuente documental <ExternalLink size={13} aria-hidden="true" />
              </a>
            </div>
            <div className="catalog-browser-controls">
              <label className="catalog-search-surface">
                <Search size={15} aria-hidden="true" />
                <span className="sr-only">Buscar permiso</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar permiso o descripción"
                />
              </label>
              <fieldset className="catalog-audience">
                <legend className="sr-only">Recomendación</legend>
                {audienceFilters.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={audience === value ? "is-active" : ""}
                    onClick={() => setAudience(value)}
                  >
                    {value === "all" ? "Todos" : audienceLabels[value]}
                  </button>
                ))}
              </fieldset>
              <label className="catalog-sort">
                <SlidersHorizontal size={14} aria-hidden="true" />
                <span className="sr-only">Ordenar permisos</span>
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as "node" | "category")
                  }
                >
                  <option value="node">Por nodo</option>
                  <option value="category">Por categoría</option>
                </select>
              </label>
            </div>
            <div className="catalog-batch-actions">
              <label>
                <span>Grupo de destino</span>
                <select
                  value={batchTarget}
                  onChange={(event) => setBatchTarget(event.target.value)}
                  disabled={!backup}
                >
                  {!backup && <option>Importa un backup</option>}
                  {targetGroups.map((groupName) => (
                    <option key={groupName} value={groupName}>
                      {groupName}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={!batchTarget}
                onClick={() =>
                  prepareApply(
                    selectedCatalog.permissions.map(
                      (permission) => permission.node,
                    ),
                  )
                }
              >
                Añadir todos
              </button>
              <button
                type="button"
                disabled={!batchTarget}
                onClick={() =>
                  prepareApply(
                    selectedCatalog.permissions
                      .filter((permission) =>
                        permission.recommendedFor?.includes("admin"),
                      )
                      .map((permission) => permission.node),
                  )
                }
              >
                Recomendados admin
              </button>
              <button
                type="button"
                disabled={!batchTarget}
                onClick={() =>
                  prepareApply(
                    selectedCatalog.permissions
                      .filter((permission) =>
                        permission.recommendedFor?.includes("player"),
                      )
                      .map((permission) => permission.node),
                  )
                }
              >
                Recomendados usuario
              </button>
            </div>
            {pendingApply && (
              <section className="catalog-apply-preview" aria-live="polite">
                <div>
                  <strong>Vista previa</strong>
                  <p>
                    {pendingPreview
                      ? `${pendingPreview.changeCount} cambios en ${batchTarget}. ${pendingPreview.targets[0]?.unchanged.length ?? 0} permisos ya estaban iguales.`
                      : "Importa un backup y selecciona un grupo para revisar los cambios."}
                  </p>
                </div>
                <button
                  type="button"
                  className="line-button"
                  onClick={() => setPendingApply(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="primary-action"
                  disabled={!pendingPreview || pendingPreview.changeCount === 0}
                  onClick={confirmApply}
                >
                  Confirmar concesión
                </button>
              </section>
            )}
            <p className="catalog-browser-count" aria-live="polite">
              {permissions.length} permisos visibles
              {audience !== "all" ? ` · ${audienceLabels[audience]}` : ""}.
            </p>
            <div className="catalog-permission-table">
              {permissions.map((permission) => (
                <article key={permission.node}>
                  <div>
                    <code>{permission.node}</code>
                    <p>{permission.description}</p>
                    <span>{permission.category}</span>
                  </div>
                  <div className="catalog-permission-tags">
                    {permission.audience.map((item) => (
                      <i key={item}>{audienceLabels[item]}</i>
                    ))}
                  </div>
                  <details className="catalog-permission-menu">
                    <summary
                      aria-label={`Añadir ${permission.node} a un grupo`}
                    >
                      <Plus size={15} aria-hidden="true" />
                    </summary>
                    <div>
                      {targetGroups.length ? (
                        targetGroups.map((groupName) => (
                          <button
                            key={groupName}
                            type="button"
                            onClick={() =>
                              prepareApply([permission.node], groupName)
                            }
                          >
                            Añadir a {groupName}
                          </button>
                        ))
                      ) : (
                        <p>Importa un backup para elegir un grupo.</p>
                      )}
                    </div>
                  </details>
                </article>
              ))}
            </div>
          </article>
        )}
      </dialog>
    </section>
  );
}
