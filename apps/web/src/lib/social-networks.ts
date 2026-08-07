/**
 * Detección de red social a partir de una URL. Sirve para "comprobar" que un
 * enlace de creador pertenece de verdad a una red social conocida (comprobación
 * de dominio; la verificación de propiedad de la cuenta es un flujo posterior).
 * Las claves coinciden con el enum SocialNetwork de contracts.
 */
export type Network = 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'x' | 'twitch';

const DOMAINS: { network: Network; label: string; hosts: string[] }[] = [
  { network: 'tiktok', label: 'TikTok', hosts: ['tiktok.com'] },
  { network: 'instagram', label: 'Instagram', hosts: ['instagram.com'] },
  { network: 'youtube', label: 'YouTube', hosts: ['youtube.com', 'youtu.be'] },
  { network: 'facebook', label: 'Facebook', hosts: ['facebook.com', 'fb.com', 'fb.watch'] },
  { network: 'x', label: 'X (Twitter)', hosts: ['x.com', 'twitter.com'] },
  { network: 'twitch', label: 'Twitch', hosts: ['twitch.tv'] },
];

export const NETWORK_LABELS: Record<Network, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
  x: 'X (Twitter)',
  twitch: 'Twitch',
};

/** Redes seleccionables (para que el creador discrimine cuál es cada enlace). */
export const NETWORKS: { value: Network; label: string }[] = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'twitch', label: 'Twitch' },
];

/**
 * Devuelve la red social si la URL es válida y su dominio es conocido; null si
 * no es una URL válida o no pertenece a ninguna red social soportada.
 */
export function detectNetwork(rawUrl: string): Network | null {
  const value = rawUrl.trim();
  if (!value) return null;
  let host: string;
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    host = new URL(withProtocol).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
  for (const d of DOMAINS) {
    if (d.hosts.some((h) => host === h || host.endsWith(`.${h}`))) return d.network;
  }
  return null;
}
