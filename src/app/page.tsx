import {
  ArrowUpRight,
  Braces,
  FileJson,
  Network,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { ViewTransition } from "react";

const steps = [
  ["01", "Exporta", "/lp export hiera-backup.json"],
  ["02", "Inspecciona", "Carga el archivo en el estudio local."],
  ["03", "Decide", "Comprueba herencias y aplica permisos con contexto."],
  ["04", "Importa", "/lp import hiera-backup.json --replace"],
];

export default function Home() {
  return (
    <ViewTransition
      enter={{
        "hiera-forward": "hiera-forward",
        "hiera-back": "hiera-back",
        default: "none",
      }}
      exit={{
        "hiera-forward": "hiera-forward",
        "hiera-back": "hiera-back",
        default: "none",
      }}
      default="none"
    >
      <main>
        <nav className="site-nav" aria-label="Navegacion principal">
          <Link className="wordmark" href="/">
            HIERA<span>.</span>
          </Link>
          <div className="nav-links">
            <a href="#flujo">Flujo</a>
            <a href="#principios">Principios</a>
            <Link href="/studio" transitionTypes={["hiera-forward"]}>
              Catalogo
            </Link>
          </div>
          <Link
            className="nav-action"
            href="/studio"
            transitionTypes={["hiera-forward"]}
          >
            Abrir estudio <ArrowUpRight size={15} />
          </Link>
        </nav>

        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">LUCKPERMS, SIN ADIVINAR</p>
            <h1>
              La jerarquia de tu servidor, <em>por fin</em> legible.
            </h1>
            <p className="hero-lede">
              Hiera convierte un respaldo de LuckPerms en un mapa operativo:
              permisos directos, excepciones, usuarios y herencias en una misma
              superficie de trabajo.
            </p>
            <div className="hero-actions">
              <Link
                className="primary-action"
                href="/studio"
                transitionTypes={["hiera-forward"]}
              >
                Abrir el estudio <ArrowUpRight size={17} />
              </Link>
              <a className="quiet-action" href="#flujo">
                Como exportar un backup
              </a>
            </div>
          </div>
          <div className="permission-atlas">
            <div className="atlas-topline">
              <span>MAPA DE HERENCIA</span>
              <span>RESUELTO</span>
            </div>
            <svg
              viewBox="0 0 640 390"
              role="img"
              aria-label="Grupo default heredado por builder y moderator; admin hereda de moderator"
            >
              <path
                className="graph-line"
                d="M155 125 C155 182 155 182 155 242"
              />
              <path
                className="graph-line"
                d="M155 125 C310 182 455 182 455 242"
              />
              <path
                className="graph-line"
                d="M455 125 C455 182 455 182 455 242"
              />
              <g className="graph-token graph-default">
                <rect x="90" y="65" width="130" height="60" rx="8" />
                <text x="155" y="101">
                  default
                </text>
              </g>
              <g className="graph-token graph-admin">
                <rect x="390" y="65" width="130" height="60" rx="8" />
                <text x="455" y="101">
                  admin
                </text>
              </g>
              <g className="graph-token graph-builder">
                <rect x="90" y="242" width="130" height="60" rx="8" />
                <text x="155" y="278">
                  builder
                </text>
              </g>
              <g className="graph-token graph-moderator">
                <rect x="390" y="242" width="130" height="60" rx="8" />
                <text x="455" y="278">
                  moderator
                </text>
              </g>
            </svg>
            <div className="atlas-footer">
              <span>
                <i className="signal direct" /> Directo
              </span>
              <span>
                <i className="signal inherited" /> Heredado
              </span>
              <strong>48 resueltos</strong>
            </div>
          </div>
        </section>

        <section className="manifesto" id="principios">
          <p className="eyebrow">UN ARCHIVO NO DEBERIA SER UNA CAJA NEGRA</p>
          <p className="manifesto-copy">
            Los permisos son infraestructura. Hiera los trata como tal: con
            procedencia, contexto, decisiones explícitas y una salida que sigue
            siendo compatible con LuckPerms.
          </p>
          <div className="principle-rail">
            <article>
              <FileJson size={19} />
              <h2>Local primero</h2>
              <p>
                El backup se interpreta en tu navegador. No se suben UUIDs ni
                configuraciones de tu comunidad.
              </p>
            </article>
            <article>
              <Network size={19} />
              <h2>Herencia visible</h2>
              <p>
                Cada nodo efectivo conserva el grupo que lo concedió o denegó.
              </p>
            </article>
            <article>
              <Braces size={19} />
              <h2>Catalogos trazables</h2>
              <p>
                Las plantillas declaran plugin, versión, origen, fecha y nivel
                de recomendación.
              </p>
            </article>
            <article>
              <ShieldCheck size={19} />
              <h2>Exportacion consciente</h2>
              <p>
                Revisa el resultado y descarga un JSON antes de tocar
                producción.
              </p>
            </article>
          </div>
        </section>

        <section className="workflow" id="flujo">
          <div className="workflow-intro">
            <p className="eyebrow">DEL SERVIDOR AL MAPA</p>
            <h2>Un flujo seguro de cuatro movimientos.</h2>
            <p>
              Hiera trabaja con el formato de exportación de LuckPerms. Haz una
              copia antes de importar cambios en un servidor activo.
            </p>
          </div>
          <ol className="steps">
            {steps.map(([number, title, body]) => (
              <li key={number}>
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <code>{body}</code>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="closing">
          <p className="eyebrow">PRIMER CATALOGO DISPONIBLE</p>
          <h2>AuthMe Reloaded, documentado permiso a permiso.</h2>
          <p>
            Filtra permisos de administración, jugadores y privilegios que
            conviene reservar para un grupo específico.
          </p>
          <Link
            className="primary-action"
            href="/studio?catalog=authme-reloaded"
            transitionTypes={["hiera-forward"]}
          >
            Explorar AuthMe Reloaded <ArrowUpRight size={17} />
          </Link>
        </section>
      </main>
    </ViewTransition>
  );
}
