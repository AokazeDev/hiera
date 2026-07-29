import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="site-footer">
      <Link className="wordmark" href="/">
        HIERA<span>.</span>
      </Link>
      <p>Editor local para decisiones de LuckPerms.</p>
      <nav aria-label="Enlaces del pie">
        <Link href="/guia/permisos">Guía</Link>
        <Link href="/catalogos">Catálogos</Link>
        <Link href="/studio">Abrir estudio ↗</Link>
      </nav>
    </footer>
  );
}
