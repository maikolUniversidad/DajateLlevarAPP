import type {
  ContentScrapingProvider,
  ScrapedContentItem,
  ScrapedProfile,
} from '@dejatellevar/core';

/**
 * Scraper de contenido social. Implementa el puerto `ContentScrapingProvider`.
 *
 * REALIDAD del scraping (importante): cada red exige un mecanismo distinto.
 *  - **YouTube**: se resuelve de VERDAD con el feed RSS público del canal
 *    (`/feeds/videos.xml`), sin clave ni violar términos: da videos recientes con
 *    título, vistas, likes y fecha.
 *  - **TikTok / Instagram / X / Facebook / Twitch**: NO hay forma pública y estable
 *    sin API oficial (con aprobación) o un servicio de scraping de pago
 *    (Apify, RapidAPI…). Para esas redes se delega en el `fallback` (p. ej. el stub)
 *    hasta conectar un proveedor con credenciales.
 */

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36';

const FETCH_TIMEOUT_MS = 20_000;

async function httpGet(url: string, accept: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': USER_AGENT, accept, 'accept-language': 'es,en;q=0.8' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(Number.parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number.parseInt(d, 10)));
}

/** Resuelve el channelId (UC…) de una URL de YouTube (canal, @handle, /c/, /user/). */
async function resolveYouTubeChannelId(url: string): Promise<string | null> {
  const direct = url.match(/youtube\.com\/channel\/(UC[0-9A-Za-z_-]{20,})/);
  if (direct) return direct[1]!;
  // Para @handle, /c/Nombre o /user/Nombre hay que leer la página y extraerlo.
  try {
    const html = await httpGet(url, 'text/html');
    const m =
      html.match(/"channelId":"(UC[0-9A-Za-z_-]{20,})"/) ??
      html.match(/"externalId":"(UC[0-9A-Za-z_-]{20,})"/) ??
      html.match(/channel\/(UC[0-9A-Za-z_-]{20,})/);
    return m ? m[1]! : null;
  } catch {
    return null;
  }
}

function parseYouTubeFeed(xml: string, handle: string | null, channelId: string): ScrapedProfile {
  const channelName = xml.match(/<author>[\s\S]*?<name>([^<]+)<\/name>/)?.[1] ?? null;
  const items: ScrapedContentItem[] = [];

  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let match: RegExpExecArray | null = entryRe.exec(xml);
  while (match !== null) {
    const e = match[1]!;
    const videoId = e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? null;
    const title = e.match(/<title>([^<]*)<\/title>/)?.[1] ?? null;
    const published = e.match(/<published>([^<]+)<\/published>/)?.[1] ?? null;
    const views = Number(e.match(/<media:statistics\s+views="(\d+)"/)?.[1] ?? 0);
    const likes = Number(e.match(/<media:starRating[^>]*\bcount="(\d+)"/)?.[1] ?? 0);
    items.push({
      externalId: videoId,
      kind: 'video',
      url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : '',
      title: title ? decodeEntities(title) : null,
      views,
      likes,
      comments: 0, // no está en el feed RSS
      shares: 0,
      durationSeconds: null,
      publishedAt: published ? new Date(published) : null,
      // El RSS no expone la URL del medio; la transcripción de YouTube requiere
      // extracción aparte. Se deja null: el análisis clasifica por título.
      mediaUrl: null,
      caption: title ? decodeEntities(title) : null,
    });
    match = entryRe.exec(xml);
  }

  return {
    network: 'youtube',
    networkUserId: channelId,
    handle: handle ?? channelName,
    followers: 0, // el feed RSS no incluye suscriptores
    items,
  };
}

async function fetchYouTube(url: string): Promise<ScrapedProfile> {
  const channelId = await resolveYouTubeChannelId(url);
  if (!channelId) {
    throw new Error(`No se pudo resolver el canal de YouTube desde ${url}`);
  }
  const handle = url.match(/youtube\.com\/(@[\w.-]+)/)?.[1] ?? null;
  const xml = await httpGet(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
    'application/atom+xml',
  );
  return parseYouTubeFeed(xml, handle, channelId);
}

export interface CreateContentScraperOptions {
  /** Proveedor para las redes aún no soportadas de forma nativa (p. ej. el stub). */
  fallback?: ContentScrapingProvider;
}

export function createContentScraper(
  options: CreateContentScraperOptions = {},
): ContentScrapingProvider {
  return {
    async fetchProfile(input) {
      if (input.network === 'youtube') {
        return fetchYouTube(input.url);
      }
      if (options.fallback) {
        return options.fallback.fetchProfile(input);
      }
      throw new Error(
        `El scraping de "${input.network}" requiere API oficial o un servicio con credenciales.`,
      );
    },
  };
}
