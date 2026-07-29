import type { Metadata } from "next";
import Link from "next/link";
import { CatalogDirectory } from "@/components/catalog-directory";
import { catalogs } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Catálogos de permisos",
  description:
    "Biblioteca de fuentes documentales para permisos de plugins: versión, fecha, origen y nodos consultables.",
  alternates: { canonical: "/catalogos" },
  openGraph: {
    url: "/catalogos",
    title: "Catálogos de permisos | Hiera",
    description:
      "Biblioteca de fuentes documentales para permisos de plugins: versión, fecha, origen y nodos consultables.",
    images: [
      {
        url: "/og-catalogos.png",
        width: 1200,
        height: 630,
        alt: "Catálogos de permisos con fuentes verificables para plugins",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Catálogos de permisos | Hiera",
    description:
      "Biblioteca de fuentes documentales para permisos de plugins: versión, fecha, origen y nodos consultables.",
    images: [
      {
        url: "/og-catalogos.png",
        alt: "Catálogos de permisos con fuentes verificables para plugins",
      },
    ],
  },
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
        <p className="eyebrow">BIBLIOTECA DOCUMENTAL / REGISTRO PÚBLICO</p>
        <h1>Catálogos de permisos con versión y procedencia.</h1>
        <p>
          Cada registro cita una fuente documental y fija cuándo se consultó.
          Los nodos se muestran como referencia: confirma la versión de tu
          plugin antes de aplicarlos.
        </p>
      </section>
      <section
        className="catalog-directory-body"
        data-reveal-section
        aria-labelledby="catalog-directory-title"
      >
        <div className="catalog-directory-heading">
          <h2 id="catalog-directory-title">Catálogos disponibles</h2>
          <span>{catalogs.length} registro publicado</span>
        </div>
        <CatalogDirectory catalogs={catalogs} />
      </section>
    </main>
  );
}
