'use client';

import { Badge, Button } from '@dejatellevar/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useCallback, useEffect, useState } from 'react';

/** Rol y permisos del staff autenticado (GET /v1/admin/me). */
export type PlatformMe = {
  account_id: string;
  role: 'super_admin' | 'moderator' | 'finance' | 'support' | 'analyst';
  permissions: string[];
};

export const ROLE_LABEL: Record<PlatformMe['role'], string> = {
  super_admin: 'Super administrador',
  moderator: 'Moderación',
  finance: 'Finanzas',
  support: 'Soporte',
  analyst: 'Analista',
};

/** Navegación del backoffice; cada entrada declara el permiso que la habilita. */
const NAV: { href: string; label: string; need?: string }[] = [
  { href: '/admin', label: 'Panel' },
  { href: '/admin/auditoria', label: 'Auditoría', need: 'audit:read' },
  { href: '/admin/eventos', label: 'Eventos de dominio', need: 'events:read' },
  { href: '/admin/equipo', label: 'Equipo y roles', need: 'roles:manage' },
];

function Centered({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 font-display text-xl text-text">
        DéjateLlevar
      </Link>
      {children}
    </main>
  );
}

/**
 * Marco de la consola de administración (§7.6). Carga el rol del staff, filtra la
 * navegación por permisos y bloquea el contenido si falta el permiso requerido.
 * Los hijos reciben el `me` ya cargado para no volver a pedirlo.
 */
export function AdminShell({
  need,
  children,
}: {
  /** Permiso requerido para ver el contenido de esta página. */
  need?: string;
  children: (me: PlatformMe) => ReactNode;
}) {
  const pathname = usePathname();
  const [state, setState] = useState<'loading' | 'unauth' | 'forbidden' | 'ready'>('loading');
  const [me, setMe] = useState<PlatformMe | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/v1/admin/me');
    if (res.status === 401) return setState('unauth');
    if (res.status === 403) return setState('forbidden');
    if (!res.ok) return setState('forbidden');
    setMe((await res.json()) as PlatformMe);
    setState('ready');
  }, []);

  useEffect(() => {
    load().catch(() => setState('unauth'));
  }, [load]);

  if (state === 'loading') {
    return (
      <Centered>
        <p className="font-body text-text-muted">Cargando la consola...</p>
      </Centered>
    );
  }

  if (state === 'unauth') {
    return (
      <Centered>
        <h1 className="font-display text-2xl text-text">Consola de administración</h1>
        <p className="mt-1 mb-6 font-body text-text-muted">Inicia sesión para continuar.</p>
        <Link href="/entrar">
          <Button className="w-full">Iniciar sesión</Button>
        </Link>
      </Centered>
    );
  }

  if (state === 'forbidden' || !me) {
    return (
      <Centered>
        <h1 className="font-display text-2xl text-text">Sin acceso</h1>
        <p className="mt-1 font-body text-text-muted">
          Tu cuenta no forma parte del staff de plataforma. Si crees que es un error, contacta a un
          super administrador.
        </p>
        <Link href="/" className="mt-6 font-body text-sm text-primary hover:underline">
          Volver al inicio
        </Link>
      </Centered>
    );
  }

  const visibleNav = NAV.filter((n) => !n.need || me.permissions.includes(n.need));
  const allowed = !need || me.permissions.includes(need);

  return (
    <div className="min-h-screen bg-bg md:flex">
      <aside className="border-border border-b bg-surface p-4 md:w-64 md:border-r md:border-b-0">
        <Link href="/" className="font-display text-lg text-text">
          DéjateLlevar
        </Link>
        <p className="mt-1 mb-4 font-mono text-xs text-text-muted">Backoffice</p>
        <div className="mb-4">
          <Badge tone="info">{ROLE_LABEL[me.role]}</Badge>
        </div>
        <nav className="flex flex-wrap gap-1 md:flex-col">
          {visibleNav.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-md px-3 py-2 font-body text-sm ${
                  active ? 'bg-primary text-primary-contrast' : 'text-text hover:bg-surface-raised'
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 px-5 py-8 md:px-8">
        {allowed ? (
          children(me)
        ) : (
          <div className="rounded-md border border-border bg-surface p-6">
            <h1 className="font-display text-xl text-text">Sin permiso</h1>
            <p className="mt-1 font-body text-text-muted">
              Tu rol ({ROLE_LABEL[me.role]}) no incluye el permiso necesario para esta sección.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
