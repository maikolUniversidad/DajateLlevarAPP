import Link from 'next/link';

export const metadata = { title: 'Sin conexión — DéjateLlevar' };

/** Respaldo que sirve el service worker cuando no hay red ni caché de la ruta. */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12 text-center">
      <p className="font-mono text-sm uppercase tracking-widest text-primary">Sin conexión</p>
      <h1 className="mt-3 font-display text-2xl text-text">Estás sin internet</h1>
      <p className="mt-2 font-body text-text-muted">
        Puedes seguir viendo lo que ya habías abierto. Cuando vuelva la conexión, todo se sincroniza
        solo.
      </p>
      <Link
        href="/"
        className="mx-auto mt-6 inline-block rounded-md bg-primary px-5 py-3 font-body font-medium text-primary-contrast"
      >
        Reintentar
      </Link>
    </main>
  );
}
