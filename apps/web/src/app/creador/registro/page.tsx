'use client';

import { AuthShell, Field, inputClass } from '@/components/AuthShell';
import { ApiRequestError, useApi } from '@dejatellevar/client';
import type { SocialNetwork } from '@dejatellevar/contracts';
import { Button } from '@dejatellevar/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const NETWORKS: { value: SocialNetwork; label: string }[] = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'x', label: 'X' },
  { value: 'twitch', label: 'Twitch' },
];

function splitList(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

interface LinkRow {
  network: SocialNetwork;
  url: string;
}

export default function RegistroCreadorPage() {
  const api = useApi();
  const router = useRouter();
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [categoriesText, setCategoriesText] = useState('');
  const [citiesText, setCitiesText] = useState('');
  const [links, setLinks] = useState<LinkRow[]>([{ network: 'tiktok', url: '' }]);
  const [acceptAi, setAcceptAi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validLinks = links.filter((l) => l.url.trim());
  const canSubmit = handle.trim().length >= 3 && acceptAi && validLinks.length > 0;

  function setLink(i: number, patch: Partial<LinkRow>) {
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLink() {
    setLinks((prev) => [...prev, { network: 'instagram', url: '' }]);
  }
  function removeLink(i: number) {
    setLinks((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.registerCreator({
        handle: handle.trim(),
        bio: bio.trim() || undefined,
        categories: splitList(categoriesText),
        cities: splitList(citiesText),
        social_links: validLinks.map((l) => ({ network: l.network, url: l.url.trim() })),
        accept_ai_processing: true,
      });
      router.push('/creador/panel');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Error de red. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Conviértete en creador"
      subtitle="Conecta tus redes y analizamos tu contenido para mostrar tu categoría y audiencia reales."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Tu @ de creador">
          <input
            required
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className={inputClass}
            placeholder="juanita.llano"
            autoComplete="off"
          />
        </Field>
        <Field label="Bio (opcional)">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={`${inputClass} h-20 py-2`}
            maxLength={500}
          />
        </Field>
        <Field label="Categorías (separadas por coma)">
          <input
            value={categoriesText}
            onChange={(e) => setCategoriesText(e.target.value)}
            className={inputClass}
            placeholder="gastronomía, turismo"
          />
        </Field>
        <Field label="Ciudades (separadas por coma)">
          <input
            value={citiesText}
            onChange={(e) => setCitiesText(e.target.value)}
            className={inputClass}
            placeholder="Villavicencio, Acacías"
          />
        </Field>

        <div className="flex flex-col gap-3">
          <span className="font-body text-sm text-text-muted">Enlaces de tus redes</span>
          {links.map((link, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: filas efímeras sin id estable.
            <div key={i} className="flex gap-2">
              <select
                value={link.network}
                onChange={(e) => setLink(i, { network: e.target.value as SocialNetwork })}
                className={`${inputClass} w-32 shrink-0`}
              >
                {NETWORKS.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
              <input
                value={link.url}
                onChange={(e) => setLink(i, { url: e.target.value })}
                className={inputClass}
                placeholder="https://tiktok.com/@tu.usuario"
                inputMode="url"
              />
              {links.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLink(i)}
                  className="shrink-0 px-2 font-body text-sm text-text-muted hover:text-tinto"
                  aria-label="Quitar enlace"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addLink}
            disabled={links.length >= 6}
            className="self-start font-body text-sm text-primary hover:underline disabled:opacity-50"
          >
            + Agregar otra red
          </button>
        </div>

        <label className="flex items-start gap-2 font-body text-sm text-text">
          <input
            type="checkbox"
            checked={acceptAi}
            onChange={(e) => setAcceptAi(e.target.checked)}
            className="mt-1"
          />
          <span>
            Autorizo el{' '}
            <Link href="/legal/ai_processing" className="text-primary hover:underline">
              análisis con IA de mi contenido
            </Link>{' '}
            (transcripción y clasificación) para calcular mi categoría y audiencia (Ley 1581 de
            2012).
          </span>
        </label>

        {error && (
          <p className="rounded-md border border-tinto/30 bg-tinto/10 p-3 font-body text-sm text-tinto">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading || !canSubmit} className="w-full">
          {loading ? 'Creando perfil...' : 'Crear perfil de creador'}
        </Button>
      </form>

      <p className="mt-6 text-center font-body text-sm text-text-muted">
        ¿Ya eres creador?{' '}
        <Link href="/creador/panel" className="text-primary hover:underline">
          Ir a mi panel
        </Link>
      </p>
    </AuthShell>
  );
}
