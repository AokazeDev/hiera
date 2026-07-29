import type { Metadata } from "next";
import Link from "next/link";
import {
  authMeReloaded,
  type PermissionAudience,
  type PermissionEntry,
} from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Catálogo de AuthMe Reloaded",
  description:
    "Acceso documental verificable a los permisos de AuthMe Reloaded para usarlos localmente en Hiera.",
  alternates: { canonical: "/catalogos/authme-reloaded" },
  openGraph: {
    url: "/catalogos/authme-reloaded",
    title: "Catálogo de AuthMe Reloaded | Hiera",
    description:
      "Acceso documental verificable a los permisos de AuthMe Reloaded para usarlos localmente en Hiera.",
    images: [
      {
        url: "/og-authme.png",
        width: 1200,
        height: 630,
        alt: "AuthMe Reloaded: catálogo de permisos en Hiera",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Catálogo de AuthMe Reloaded | Hiera",
    description:
      "Acceso documental verificable a los permisos de AuthMe Reloaded para usarlos localmente en Hiera.",
    images: [
      {
        url: "/og-authme.png",
        alt: "AuthMe Reloaded: catálogo de permisos en Hiera",
      },
    ],
  },
};

const audienceLabels: Record<PermissionAudience, string> = {
  admin: "administración",
  player: "jugador",
  group: "grupo",
  sensitive: "sensible",
};

const permissionsByCategory = authMeReloaded.permissions.reduce<
  Record<string, PermissionEntry[]>
>((groups, permission) => {
  const entries = groups[permission.category];
  if (entries) {
    entries.push(permission);
  } else {
    groups[permission.category] = [permission];
  }
  return groups;
}, {});

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
      <article className="document-content catalog-document">
        <p className="eyebrow">BIBLIOTECA / CATÁLOGO VERIFICABLE</p>
        <h1>{authMeReloaded.name}</h1>
        <p className="document-lede">{authMeReloaded.description}</p>
        <dl className="catalog-facts">
          <div className="catalog-fact">
            <dt>Versión documental</dt>
            <dd>{authMeReloaded.version}</dd>
          </div>
          <div className="catalog-fact">
            <dt>Actualizado</dt>
            <dd>{authMeReloaded.updatedAt}</dd>
          </div>
          <div className="catalog-fact">
            <dt>Permisos registrados</dt>
            <dd>{authMeReloaded.permissions.length}</dd>
          </div>
        </dl>
        <p>
          Esta referencia no sustituye la documentación del plugin. Comprueba la
          versión y cualquier fork antes de usar un nodo en un servidor.
        </p>
        <p>
          <a href={authMeReloaded.website}>Página oficial y descarga</a>
          {" · "}
          <a href={authMeReloaded.source}>Fuente documental exacta</a>
        </p>
        <section
          className="catalog-reference"
          aria-labelledby="catalog-reference-title"
        >
          <div className="catalog-reference-heading">
            <div>
              <p className="eyebrow">ÍNDICE DE NODOS</p>
              <h2 id="catalog-reference-title">Permisos documentados</h2>
            </div>
            <span>{authMeReloaded.permissions.length} nodos</span>
          </div>
          <div className="catalog-reference-groups">
            {Object.entries(permissionsByCategory).map(
              ([category, permissions]) => (
                <section
                  key={category}
                  aria-labelledby={`category-${category}`}
                >
                  <h3 id={`category-${category}`}>{category}</h3>
                  <ul>
                    {permissions.map((permission) => (
                      <li key={permission.node}>
                        <div>
                          <code>{permission.node}</code>
                          <p>{permission.description}</p>
                        </div>
                        <span>
                          {permission.audience
                            .map((audience) => audienceLabels[audience])
                            .join(" · ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ),
            )}
          </div>
        </section>
        <Link className="primary-action" href="/studio">
          Abrir el estudio local
        </Link>
      </article>
    </main>
  );
}
