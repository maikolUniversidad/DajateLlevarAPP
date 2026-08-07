'use client';

import { NETWORKS, NETWORK_LABELS, type Network, detectNetwork } from '@/lib/social-networks';

export interface SocialLinkRow {
  network: Network | '';
  url: string;
}

export function emptySocialLink(): SocialLinkRow {
  return { network: '', url: '' };
}

/**
 * Enlaces de redes sociales del creador. El creador ELIGE la red de cada enlace
 * (TikTok, Instagram, YouTube, Facebook, X, Twitch); además se comprueba el
 * dominio para avisar si no coincide o no es una red social. Mínimo uno válido.
 */
export function SocialLinksInput({
  value,
  onChange,
}: {
  value: SocialLinkRow[];
  onChange: (value: SocialLinkRow[]) => void;
}) {
  const rows = value.length ? value : [emptySocialLink()];

  function update(i: number, patch: Partial<SocialLinkRow>) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function add() {
    onChange([...rows, emptySocialLink()]);
  }
  function remove(i: number) {
    const next = rows.filter((_, idx) => idx !== i);
    onChange(next.length ? next : [emptySocialLink()]);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="font-body text-sm text-text-muted">
        Tus redes sociales{' '}
        <span className="text-text">(elige la red y pega el enlace, mínimo 1)</span>
      </span>
      {rows.map((row, i) => {
        const detected = detectNetwork(row.url);
        const notSocial = row.url.trim().length > 0 && !detected;
        const mismatch = detected && row.network && detected !== row.network;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: filas editables por índice
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <select
                aria-label="Red social"
                value={row.network}
                onChange={(e) => update(i, { network: e.target.value as Network | '' })}
                className="h-11 shrink-0 rounded-md border border-border-strong bg-surface px-2 font-body text-sm text-text"
              >
                <option value="">Red…</option>
                {NETWORKS.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
              <input
                value={row.url}
                onChange={(e) => {
                  const url = e.target.value;
                  // Autodetecta la red al pegar, si aún no eligió una.
                  const auto = !row.network ? detectNetwork(url) : null;
                  update(i, auto ? { url, network: auto } : { url });
                }}
                placeholder="https://www.tiktok.com/@tuusuario"
                inputMode="url"
                autoComplete="off"
                className={`h-11 w-full rounded-md border bg-surface px-3 font-body text-text ${
                  notSocial || mismatch ? 'border-tinto' : 'border-border-strong'
                }`}
              />
              {rows.length > 1 && (
                <button
                  type="button"
                  aria-label="Quitar enlace"
                  onClick={() => remove(i)}
                  className="shrink-0 rounded-md border border-border-strong px-3 py-2 font-body text-sm text-text-muted hover:text-text"
                >
                  ✕
                </button>
              )}
            </div>
            {detected && !mismatch && (
              <span className="font-body text-xs text-brote">
                ✓ Enlace de {NETWORK_LABELS[detected]}
              </span>
            )}
            {mismatch && detected && (
              <span className="font-body text-xs text-tinto">
                El enlace parece de {NETWORK_LABELS[detected]}, pero elegiste{' '}
                {NETWORK_LABELS[row.network as Network]}.
              </span>
            )}
            {notSocial && (
              <span className="font-body text-xs text-tinto">
                No parece un enlace de una red social válida (TikTok, Instagram, YouTube, Facebook,
                X o Twitch).
              </span>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={add}
        className="self-start font-body text-sm font-medium text-violeta hover:underline"
      >
        + Agregar otra red
      </button>
    </div>
  );
}
