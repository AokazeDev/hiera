import type { Metadata } from "next";
import Link from "next/link";
import { authMeReloaded } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Catálogo de AuthMe Reloaded",
  description:
    "Acceso documental verificable a los permisos de AuthMe Reloaded para usarlos localmente en Hiera.",
  alternates: { canonical: "/catalogos/authme-reloaded" },
  openGraph: {
    url: "/catalogos/authme-reloaded",
    images: [
      {
        url: "/authme-reloaded-og.png",
        width: 1200,
        height: 640,
        alt: "Catálogo de permisos de AuthMe Reloaded en Hiera",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/authme-reloaded-og.png"],
  },
};

export default function AuthMeCatalogPage() {
  return (
    <main className="document-page">
      <nav className="site-nav" aria-label="Navegación principal">
        <Link className="wordmark" href="/">
          HIERA<span>.</span>
        </Link>
        <Link className="nav-action" href="/studio">
          Abrir estudio
        </Link>
      </nav>
      <article className="document-content">
        <p className="eyebrow">CATÁLOGO VERIFICABLE</p>
        <h1>{authMeReloaded.name}</h1>
        <p className="document-lede">{authMeReloaded.description}</p>
        <dl className="catalog-facts">
          <div>
            <dt>Versión documental</dt>
            <dd>{authMeReloaded.version}</dd>
          </div>
          <div>
            <dt>Actualizado</dt>
            <dd>{authMeReloaded.updatedAt}</dd>
          </div>
          <div>
            <dt>Permisos registrados</dt>
            <dd>{authMeReloaded.permissions.length}</dd>
          </div>
        </dl>
        <p>
          Este acceso directo no sustituye la documentación del plugin.
          Comprueba la versión y cualquier fork antes de aplicarlo a un
          servidor.
        </p>
        <p>
          <a href={authMeReloaded.website}>Página oficial y descarga</a>
          {" · "}
          <a href={authMeReloaded.source}>Fuente documental exacta</a>
        </p>
        <Link className="primary-action" href="/studio">
          Usar el catálogo en el estudio
        </Link>
      </article>
    </main>
  );
}
