import Link from 'next/link';
import type { ReactNode } from 'react';

export const inputClass =
  'h-11 w-full rounded-md border border-border-strong bg-surface px-3 font-body text-text';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: el control se asocia por anidación (llega como children).
    <label className="flex flex-col gap-1">
      <span className="font-body text-sm text-text-muted">{label}</span>
      {children}
    </label>
  );
}

/** Marco común de las pantallas de autenticación y cuenta. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 font-display text-xl text-text">
        DéjateLlevar
      </Link>
      <h1 className="font-display text-2xl text-text">{title}</h1>
      {subtitle ? (
        <p className="mt-1 mb-6 font-body text-text-muted">{subtitle}</p>
      ) : (
        <div className="mb-6" />
      )}
      {children}
    </main>
  );
}
