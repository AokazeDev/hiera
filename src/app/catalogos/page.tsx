import type { Metadata } from "next";
import Link from "next/link";
import { CatalogDirectory } from "@/components/catalog-directory";
import { catalogs } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Catálogos de permisos",
  description:
    "Fuentes documentales verificables para acelerar el trabajo en Hiera, sin sustituir el editor general.",
  alternates: { canonical: "/catalogos" },
};

export default function CatalogsPage() {
  return (
    <main className="catalog-directory-page">
      <nav className="site-nav" aria-label="Navegación principal">
        <Link className="wordmark" href="/">
          HIERA<span>.</span>
        </Link>
        <Link className="nav-action" href="/studio">
          Abrir estudio
        </Link>
      </nav>
      <section className="catalog-directory-intro" data-reveal-section>
        <p className="eyebrow">ÍNDICE DE FUENTES</p>
        <h1>Atajos documentales, no cajas negras.</h1>
        <p>
          Cada catálogo tiene versión, fecha, fuente y alcance explícitos. El
          editor de permisos personalizados sigue siendo el centro de Hiera.
        </p>
      </section>
      <section
        className="catalog-directory-body"
        data-reveal-section
        aria-labelledby="catalog-directory-title"
      >
        <div className="catalog-directory-heading">
          <h2 id="catalog-directory-title">Catálogos disponibles</h2>
          <span>
            {catalogs.length} fuente{catalogs.length === 1 ? "" : "s"} publicada
            {catalogs.length === 1 ? "" : "s"}
          </span>
        </div>
        <CatalogDirectory catalogs={catalogs} />
      </section>
    </main>
  );
}
