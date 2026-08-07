import Link from 'next/link';

/**
 * Barra superior del home: marca + acceso a identidad (entrar / crear cuenta).
 * Fondo índigo translúcido para leerse tanto sobre el héroe oscuro como sobre
 * las secciones claras de abajo.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#221d47]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-paja">
          Déjate<span className="text-lila">Llevar</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/entrar"
            className="rounded-full px-4 py-2 font-body text-sm font-medium text-paja transition-colors hover:bg-white/10"
          >
            Entrar
          </Link>
          <Link
            href="/registro"
            className="rounded-full bg-violeta px-4 py-2 font-body text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Crear cuenta
          </Link>
        </nav>
      </div>
    </header>
  );
}
