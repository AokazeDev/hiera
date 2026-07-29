import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Guía de permisos de LuckPerms",
  description:
    "Cómo interpreta Hiera los permisos directos, la herencia, los contextos y la precedencia de LuckPerms.",
  alternates: { canonical: "/guia/permisos" },
};

export default function PermissionGuidePage() {
  return (
    <main className="document-page public-shell">
      <nav className="site-nav" aria-label="Navegación principal">
        <Link className="wordmark" href="/">
          HIERA<span>.</span>
        </Link>
        <Link className="nav-action" href="/studio">
          Abrir estudio
        </Link>
      </nav>
      <article className="document-content">
        <p className="eyebrow">GUÍA DE RESOLUCIÓN</p>
        <h1>Leer una decisión de permisos sin adivinar.</h1>
        <p className="document-lede">
          Hiera resuelve el backup únicamente en el navegador. Su resultado
          explica de dónde viene cada permiso, pero no sustituye la
          configuración de calculadores o extensiones externas de LuckPerms.
        </p>

        <section aria-labelledby="direct-title">
          <h2 id="direct-title">Permisos directos</h2>
          <p>
            Un permiso directo es un nodo de tipo <code>permission</code> en el
            grupo o usuario seleccionado. Concederlo, denegarlo o eliminarlo
            afecta solo a ese sujeto y a ese contexto exacto. Hiera nunca
            modifica el backup importado: cualquier salida es un JSON nuevo
            descargado de forma explícita.
          </p>
        </section>

        <section aria-labelledby="inheritance-title">
          <h2 id="inheritance-title">Herencia y procedencia</h2>
          <p>
            Los nodos de herencia enlazan un grupo o usuario con un grupo padre.
            Hiera recorre esa cadena sin repetir ciclos y conserva el grupo de
            origen de cada permiso efectivo. Un nodo directo del sujeto
            prevalece sobre un nodo heredado con la misma clave aplicable.
          </p>
        </section>

        <section aria-labelledby="context-title">
          <h2 id="context-title">Contextos</h2>
          <p>
            Un contexto es un conjunto de pares clave-valor, por ejemplo
            <code>server=survival</code> o <code>world=spawn</code>. Un nodo es
            aplicable si cada clave que exige está activa. Cuando un valor del
            nodo es una lista, basta con que coincida uno de sus valores
            activos; las comparaciones no distinguen mayúsculas.
          </p>
        </section>

        <section aria-labelledby="precedence-title">
          <h2 id="precedence-title">Precedencia que aplica Hiera</h2>
          <ol>
            <li>
              Descarta nodos cuyo contexto no coincide con el contexto activo.
            </li>
            <li>Prefiere el nodo directo sobre un nodo heredado aplicable.</li>
            <li>
              Dentro de una misma fuente, prefiere el contexto con más pares
              coincidentes.
            </li>
            <li>
              Si dos nodos igual de específicos tienen valores opuestos, muestra
              el conflicto y conserva el primero del backup como resultado
              determinista.
            </li>
          </ol>
          <p>
            Esta regla no intenta reproducir calculadores, extensiones ni reglas
            externas que puedan alterar la resolución de tu instalación.
          </p>
        </section>

        <section aria-labelledby="safe-flow-title">
          <h2 id="safe-flow-title">Flujo seguro</h2>
          <ol>
            <li>
              Exporta: <code>/lp export hiera-backup.json</code>.
            </li>
            <li>Revisa y edita el archivo en el estudio local.</li>
            <li>Confirma el diff y descarga el JSON nuevo.</li>
            <li>
              Pruébalo antes de usar{" "}
              <code>/lp import hiera-luckperms-backup.json --replace</code>.
            </li>
          </ol>
        </section>
      </article>
      <PublicFooter />
    </main>
  );
}
