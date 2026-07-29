"use client";

import { ArrowUpRight, ExternalLink, FileJson, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import type { PermissionCatalog } from "@/lib/permissions";

type CatalogDirectoryProps = { catalogs: PermissionCatalog[] };

export function CatalogDirectory({ catalogs }: CatalogDirectoryProps) {
  const [selected, setSelected] = useState<PermissionCatalog | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (selected && !dialog.current?.open) dialog.current?.showModal();
  }, [selected]);

  function close() {
    dialog.current?.close();
    setSelected(null);
  }

  return (
    <>
      <div className="catalog-directory-grid">
        {catalogs.map((catalog, index) => (
          <article className="catalog-directory-card" key={catalog.slug}>
            <div className="catalog-card-topline">
              <span className="catalog-card-logo" aria-hidden="true">
                <FileJson size={16} />
              </span>
              <div className="catalog-card-identity">
                <span className="catalog-card-index">
                  REG / {String(index + 1).padStart(2, "0")}
                </span>
                <h2>{catalog.name}</h2>
              </div>
              <span className="catalog-card-status">Fuente verificada</span>
            </div>
            <div className="catalog-card-body">
              <p>{catalog.description}</p>
            </div>
            <div className="catalog-card-footer">
              <dl className="catalog-card-meta">
                <div>
                  <dt>Nodos</dt>
                  <dd>{catalog.permissions.length}</dd>
                </div>
                <div>
                  <dt>Versión</dt>
                  <dd>{catalog.version}</dd>
                </div>
                <div>
                  <dt>Actualizado</dt>
                  <dd>{catalog.updatedAt}</dd>
                </div>
              </dl>
            </div>
            <ActionButton
              variant="quiet"
              className="catalog-card-action"
              onClick={() => setSelected(catalog)}
              aria-haspopup="dialog"
            >
              Consultar ficha <ArrowUpRight size={15} aria-hidden="true" />
            </ActionButton>
          </article>
        ))}
        <article
          className="catalog-directory-empty"
          aria-label="Próximos catálogos"
        >
          <span className="catalog-card-index">REG / PRÓXIMAMENTE</span>
          <h2>Registro abierto a fuentes verificables.</h2>
          <p>
            Un catálogo necesita una fuente estable, versión identificable y
            fecha de consulta. El estudio funciona aunque tu plugin no figure
            aquí.
          </p>
          <a
            href="https://github.com/Aokaze/hiera/issues"
            target="_blank"
            rel="noreferrer"
          >
            Proponer una fuente documental{" "}
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </article>
      </div>
      <dialog
        ref={dialog}
        className="catalog-detail-dialog"
        aria-labelledby="catalog-detail-title"
        onClose={close}
      >
        {selected && (
          <article>
            <header>
              <div>
                <p className="eyebrow">FICHA DOCUMENTAL</p>
                <h2 id="catalog-detail-title">{selected.name}</h2>
              </div>
              <button
                type="button"
                aria-label="Cerrar ficha del catálogo"
                onClick={close}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <p>{selected.description}</p>
            <dl>
              <div>
                <dt>Versión</dt>
                <dd>{selected.version}</dd>
              </div>
              <div>
                <dt>Actualización</dt>
                <dd>{selected.updatedAt}</dd>
              </div>
              <div>
                <dt>Permisos</dt>
                <dd>{selected.permissions.length}</dd>
              </div>
            </dl>
            <section
              className="catalog-detail-preview"
              aria-labelledby="catalog-preview-title"
            >
              <h3 id="catalog-preview-title">Muestra de nodos</h3>
              <ul>
                {selected.permissions.slice(0, 4).map((permission) => (
                  <li key={permission.node}>
                    <code>{permission.node}</code>
                    <span>{permission.category}</span>
                  </li>
                ))}
              </ul>
            </section>
            <div className="catalog-detail-links">
              <a href={selected.website} target="_blank" rel="noreferrer">
                Plugin y descarga <ExternalLink size={14} aria-hidden="true" />
              </a>
              <a href={selected.source} target="_blank" rel="noreferrer">
                Fuente documental <ExternalLink size={14} aria-hidden="true" />
              </a>
              <Link href={`/catalogos/${selected.slug}`}>
                Abrir página completa{" "}
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </article>
        )}
      </dialog>
    </>
  );
}
