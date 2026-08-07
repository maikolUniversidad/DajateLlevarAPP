'use client';

import { AdminShell, ROLE_LABEL } from '@/components/AdminShell';
import { Badge } from '@dejatellevar/ui';
import Link from 'next/link';

/** Accesos del panel; se muestran solo los que el permiso habilita. */
const CARDS: { href: string; title: string; desc: string; need: string }[] = [
  {
    href: '/admin/auditoria',
    title: 'Auditoría',
    desc: 'Registro inmutable de todas las acciones que mutan datos en la plataforma.',
    need: 'audit:read',
  },
  {
    href: '/admin/eventos',
    title: 'Eventos de dominio',
    desc: 'Explorador de los eventos de negocio (reservas, pagos, roles...).',
    need: 'events:read',
  },
  {
    href: '/admin/equipo',
    title: 'Equipo y roles',
    desc: 'Asigna o revoca roles de plataforma al staff del backoffice.',
    need: 'roles:manage',
  },
];

export default function AdminHomePage() {
  return (
    <AdminShell>
      {(me) => {
        const cards = CARDS.filter((c) => me.permissions.includes(c.need));
        return (
          <div className="mx-auto max-w-4xl">
            <h1 className="font-display text-2xl text-text">Consola de administración</h1>
            <p className="mt-1 font-body text-text-muted">
              Tu rol es <strong className="text-text">{ROLE_LABEL[me.role]}</strong>. Ves y operas
              solo lo que tu rol permite.
            </p>

            <section className="mt-6">
              <h2 className="mb-2 font-display text-lg text-text">Tus permisos</h2>
              <div className="flex flex-wrap gap-1.5">
                {me.permissions.map((p) => (
                  <span
                    key={p}
                    className="rounded-sm bg-surface-raised px-2 py-0.5 font-mono text-xs text-text-muted"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </section>

            <section className="mt-8 grid gap-3 sm:grid-cols-2">
              {cards.length === 0 && (
                <p className="font-body text-sm text-text-muted">
                  Tu rol no tiene secciones operativas asignadas todavía.
                </p>
              )}
              {cards.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="rounded-md border border-border bg-surface p-4 transition-colors hover:bg-surface-raised"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base text-text">{c.title}</h3>
                    <Badge tone="neutral">{c.need}</Badge>
                  </div>
                  <p className="mt-1 font-body text-sm text-text-muted">{c.desc}</p>
                </Link>
              ))}
            </section>
          </div>
        );
      }}
    </AdminShell>
  );
}
