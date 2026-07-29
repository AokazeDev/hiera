import {
  ArrowUpRight,
  Braces,
  FileJson,
  Network,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { LandingMotion } from "@/components/landing-motion";
import { PublicFooter } from "@/components/public-footer";

const steps = [
  ["01", "Exporta", "/lp export hiera-backup.json"],
  ["02", "Abre", "Carga esa copia en el estudio local."],
  ["03", "Revisa", "Comprueba herencias, contexto y procedencia."],
  ["04", "Importa", "/lp import hiera-backup.json --replace"],
];

const questions = [
  [
    "¿El backup sale de mi navegador?",
    "No. Hiera interpreta el JSON dentro de tu navegador y solo descarga un archivo nuevo cuando tú lo confirmas.",
  ],
  [
    "¿Puede aplicar cambios directamente al servidor?",
    "No. El estudio prepara un backup JSON compatible para que revises e importes explícitamente con LuckPerms.",
  ],
  [
    "¿Los catálogos sustituyen la documentación del plugin?",
    "No. Son referencias con versión, fuente y fecha de consulta. Confirma siempre la versión y cualquier fork de tu servidor.",
  ],
  [
    "¿Qué ocurre con permisos sensibles o comodines?",
    "Hiera los conserva como nodos del backup y señala que requieren revisión manual antes de llevarlos a producción.",
  ],
] as const;

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Hiera",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    url: "https://hiera.symera.cloud/",
    description:
      "Editor gratuito, local y sin cuenta para inspeccionar backups JSON de LuckPerms.",
    isAccessibleForFree: true,
    featureList: [
      "Procesamiento local en el navegador",
      "Sin cuenta",
      "Exportación JSON compatible con LuckPerms",
    ],
  };

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
      <LandingMotion>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <nav className="site-nav" aria-label="Navegacion principal">
          <Link className="wordmark" href="/">
            HIERA<span>.</span>
          </Link>
          <div className="nav-links">
            <a href="#demostracion">Demostración</a>
            <a href="#principios">Principios</a>
            <Link href="/guia/permisos">Guía</Link>
            <Link href="/catalogos" transitionTypes={["hiera-forward"]}>
              Catálogos
            </Link>
          </div>
          <Link
            className="nav-action"
            href="/studio"
            transitionTypes={["hiera-forward"]}
          >
            Abrir estudio local <ArrowUpRight size={15} />
          </Link>
        </nav>

        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">EDITOR LOCAL DE BACKUPS DE LUCKPERMS</p>
            <h1>
              Lee tus permisos <em>en local.</em>
            </h1>
            <p className="hero-lede">
              Hiera es gratis, funciona en tu navegador y no pide cuenta. Abre
              una copia de LuckPerms para revisar permisos, usuarios, contextos
              y herencias sin subir el archivo.
            </p>
            <ul className="hero-facts" aria-label="Condiciones de uso de Hiera">
              <li>
                <strong>Gratis</strong>
                <span>sin plan ni prueba</span>
              </li>
              <li>
                <strong>Local</strong>
                <span>el backup queda en el navegador</span>
              </li>
              <li>
                <strong>Sin cuenta</strong>
                <span>abre el archivo y empieza</span>
              </li>
            </ul>
            <div className="hero-actions">
              <Link
                className="primary-action"
                href="/studio"
                transitionTypes={["hiera-forward"]}
              >
                Abrir el estudio <ArrowUpRight size={17} />
              </Link>
              <a className="quiet-action" href="#demostracion">
                Ver el flujo local
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

        <section
          className="product-sequence"
          id="demostracion"
          aria-labelledby="sequence-title"
          data-reveal-section
        >
          <div className="sequence-intro">
            <p className="eyebrow">DEMOSTRACIÓN EN EL NAVEGADOR</p>
            <h2 id="sequence-title">
              Importa una copia, mueve una decisión y exporta el resultado.
            </h2>
            <p>
              Esta secuencia representa el flujo del estudio. El archivo se
              procesa localmente; la salida es un JSON nuevo que eliges
              descargar.
            </p>
          </div>
          <figure className="sequence-media">
            <video
              className="sequence-video"
              controls
              aria-describedby="sequence-video-description"
              poster="/hiera-local-workflow-poster.svg"
              preload="metadata"
            >
              <source src="/hiera-local-workflow.webm" type="video/webm" />
              <track
                kind="captions"
                src="/hiera-local-workflow.es.vtt"
                srcLang="es"
                label="Español"
                default
              />
              Tu navegador no puede reproducir esta demostración de video.
            </video>
            <div className="sequence-video-fallback">
              <Image
                src="/hiera-local-workflow-poster.svg"
                alt="Vista previa del paso de exportacion local: un backup JSON validado queda listo para descargar."
                width={1200}
                height={675}
                unoptimized
              />
              <p>La animación se ha sustituido por una vista fija.</p>
            </div>
            <figcaption id="sequence-video-description">
              Video de seis segundos: importa un backup JSON, revisa el permiso
              <code>essentials.fly</code> entre grupos y exporta un archivo
              validado. No se reproduce automáticamente.
            </figcaption>
          </figure>
        </section>

        <section className="manifesto" id="principios" data-reveal-section>
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
              <h2>Catálogos trazables</h2>
              <p>
                Los catálogos declaran plugin, versión, origen y fecha de
                actualización.
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

        <section className="workflow" id="flujo" data-reveal-section>
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

        <section
          className="permission-primer"
          aria-labelledby="permission-primer-title"
          data-reveal-section
        >
          <div>
            <p className="eyebrow">LECTURA DEL BACKUP</p>
            <h2 id="permission-primer-title">
              Directo, heredado, contextual: no son la misma cosa.
            </h2>
          </div>
          <div className="primer-rules">
            <article>
              <span className="primer-index">01</span>
              <h3>Directo</h3>
              <p>
                Un nodo definido en el grupo o usuario que estás inspeccionando.
                Hiera lo conserva separado de lo que llega desde otros grupos.
              </p>
            </article>
            <article>
              <span className="primer-index">02</span>
              <h3>Herencia</h3>
              <p>
                Un grupo puede recibir nodos de sus padres. La resolución indica
                el origen para que una regla no parezca local cuando no lo es.
              </p>
            </article>
            <article>
              <span className="primer-index">03</span>
              <h3>Contexto y precedencia</h3>
              <p>
                Un nodo contextual solo aplica cuando sus pares activos
                coinciden. Entre coincidencias, Hiera prioriza el nodo directo y
                después el contexto más específico.
              </p>
            </article>
          </div>
          <Link className="quiet-action" href="/guia/permisos">
            Leer la guía de resolución
          </Link>
        </section>

        <section className="landing-faq" aria-labelledby="faq-title">
          <div className="landing-faq-intro">
            <h2 id="faq-title">Respuestas antes de tocar producción.</h2>
            <p>Lo local y explícito también debe ser fácil de comprobar.</p>
          </div>
          <div className="landing-faq-list">
            {questions.map(([question, answer], index) => (
              <details key={question} open={index === 0}>
                <summary>
                  {question}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="closing" data-reveal-section>
          <p className="eyebrow">FUENTES Y ARCHIVOS, SIN CAJAS NEGRAS</p>
          <h2>
            El estudio acepta tu backup. Los catálogos solo aportan referencia.
          </h2>
          <p>
            Los permisos personalizados, las herencias y los contextos no
            dependen de un catálogo. Cuando existe una fuente, puedes comprobar
            su versión y procedencia antes de usarla.
          </p>
          <Link
            className="primary-action"
            href="/catalogos"
            transitionTypes={["hiera-forward"]}
          >
            Ver índice de catálogos <ArrowUpRight size={17} />
          </Link>
        </section>
        <PublicFooter />
      </LandingMotion>
    </ViewTransition>
  );
}
