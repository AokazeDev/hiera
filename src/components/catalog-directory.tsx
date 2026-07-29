"use client";

import { ArrowUpRight, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PermissionCatalog } from "@/lib/permissions";

type CatalogDirectoryProps = { catalogs: PermissionCatalog[] };

export function CatalogDirectory({ catalogs }: CatalogDirectoryProps) {
  const [selected, setSelected] = useState<PermissionCatalog | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (selected) dialog.current?.showModal();
  }, [selected]);

  function close() {
    dialog.current?.close();
    setSelected(null);
  }

  return (
    <>
      <div className="catalog-directory-grid">
        {catalogs.map((catalog) => (
          <article className="catalog-directory-card" key={catalog.slug}>
            <div className="catalog-card-index">
              CAT / 0{catalogs.indexOf(catalog) + 1}
            </div>
            <div className="catalog-card-glyph" aria-hidden="true">
              <span className="catalog-glyph-bar" />
              <span className="catalog-glyph-bar" />
              <span className="catalog-glyph-bar" />
            </div>
            <h2>{catalog.name}</h2>
            <p>{catalog.description}</p>
            <div className="catalog-card-meta">
              <span>{catalog.permissions.length} permisos</span>
              <span>{catalog.version}</span>
            </div>
            <button
              type="button"
              className="catalog-card-action"
              onClick={() => setSelected(catalog)}
            >
              Ver ficha <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          </article>
        ))}
        <article
          className="catalog-directory-empty"
          aria-label="Próximos catálogos"
        >
          <span className="catalog-card-index">CAT / 02—</span>
          <h2>El siguiente catálogo lo decides tú.</h2>
          <p>
            Hiera solo incorpora fuentes verificables. El editor funciona igual
            aunque tu plugin todavía no tenga catálogo.
          </p>
          <a
            href="https://github.com/Aokaze/hiera/issues"
            target="_blank"
            rel="noreferrer"
          >
            Proponer una fuente <ExternalLink size={14} aria-hidden="true" />
          </a>
        </article>
      </div>
      <dialog ref={dialog} className="catalog-detail-dialog" onClose={close}>
        {selected && (
          <article>
            <header>
              <div>
                <p className="eyebrow">FICHA DOCUMENTAL</p>
                <h2>{selected.name}</h2>
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
