import type {
  ContentAnalyzer,
  ContentScrapingProvider,
  ScrapedContentItem,
  TranscriptionProvider,
} from '@dejatellevar/core';

/**
 * Adaptadores STUB de scraping/transcripción/clasificación de contenido (§12).
 *
 * Implementan los puertos con datos DETERMINISTAS (derivados de la URL), sin red.
 * Sirven para desarrollar y probar el flujo de punta a punta. Se sustituyen por
 * adaptadores reales (APIs de plataforma + transcripción por IA) sin tocar el
 * dominio: esa es la razón de que el core solo conozca los puertos.
 */

const BASE_TS = Date.parse('2026-07-01T12:00:00-05:00');

/** Hash determinista (FNV-1a) para generar cifras estables por URL. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const KINDS_BY_NETWORK: Record<string, string[]> = {
  tiktok: ['video', 'short'],
  youtube: ['video', 'short'],
  instagram: ['reel', 'image', 'carousel'],
  facebook: ['video', 'image'],
  x: ['text', 'video'],
  twitch: ['live', 'video'],
};

const TRANSCRIBABLE = new Set(['video', 'short', 'reel', 'live']);

const CAPTIONS = [
  'Hoy preparamos mamona llanera al mejor estilo del Meta 🔥 receta paso a paso',
  'Atardecer en el hato, el llano nunca deja de sorprender 🌅 turismo Villavicencio',
  'Aprende a bailar joropo con este tutorial de arpa y capacho 🎶',
  'Coleo en Acacías: así se vive el deporte llanero 🐎',
  'Tips para tu próximo viaje por los Llanos Orientales ✈️ destinos imperdibles',
  'Receta rápida de carne a la perra que te va a encantar 🍖',
];

export function makeStubContentScraper(): ContentScrapingProvider {
  return {
    async fetchProfile({ network, url }) {
      const seed = hash(`${network}:${url}`);
      const kinds = KINDS_BY_NETWORK[network] ?? ['video'];
      const followers = 5000 + (seed % 45000);
      const itemCount = 6 + (seed % 5); // 6–10 piezas

      const items: ScrapedContentItem[] = [];
      for (let i = 0; i < itemCount; i++) {
        const s = hash(`${url}:${i}`);
        const kind = kinds[i % kinds.length]!;
        const views = 800 + (s % 90000);
        const likes = Math.round(views * (0.04 + (s % 60) / 1000));
        const comments = Math.round(likes * 0.08);
        const shares = Math.round(likes * 0.05);
        const isVideo = TRANSCRIBABLE.has(kind);
        items.push({
          externalId: `${network}-${i}`,
          kind,
          url: `${url.replace(/\/$/, '')}/p/${i}`,
          title: isVideo ? `Publicación ${i + 1}` : null,
          views,
          likes,
          comments,
          shares,
          durationSeconds: isVideo ? 15 + (s % 90) : null,
          publishedAt: new Date(BASE_TS - i * 86_400_000),
          mediaUrl: isVideo ? `${url.replace(/\/$/, '')}/media/${i}.mp4` : null,
          caption: CAPTIONS[s % CAPTIONS.length]!,
        });
      }

      return {
        network,
        networkUserId: `${network}-${seed % 1_000_000}`,
        handle: null,
        followers,
        items,
      };
    },
  };
}

export function makeStubTranscriber(): TranscriptionProvider {
  const SCRIPTS = [
    'Bienvenidos mi gente, hoy les traigo una receta llanera con carne y mucho sabor del Meta.',
    'Estamos en el hato disfrutando del atardecer, el turismo en el llano es una maravilla.',
    'Les enseño a tocar joropo con el arpa, síganme para más música llanera.',
    'Así se vive el coleo en Villavicencio, puro deporte y tradición del llano.',
  ];
  return {
    async transcribe({ mediaUrl }) {
      const s = hash(mediaUrl);
      return {
        text: SCRIPTS[s % SCRIPTS.length]!,
        language: 'es',
        durationSeconds: 15 + (s % 90),
      };
    },
  };
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  gastronomia: ['mamona', 'carne', 'receta', 'asado', 'comida', 'sabor', 'perra'],
  turismo: ['llano', 'hato', 'atardecer', 'río', 'rio', 'finca', 'paisaje', 'viaje', 'destino'],
  musica: ['joropo', 'arpa', 'música', 'musica', 'canción', 'baile', 'capacho'],
  deporte: ['coleo', 'caballo', 'fútbol', 'futbol', 'deporte', 'tradición'],
  educacion: ['aprende', 'tutorial', 'tip', 'tips', 'consejo', 'enseño', 'paso a paso'],
};

const UNSAFE_WORDS = ['violencia', 'droga', 'apuesta', 'estafa'];

export function makeStubContentAnalyzer(): ContentAnalyzer {
  return {
    async analyze({ items, declaredCategories }) {
      const catScore = new Map<string, number>();
      const itemTopics: string[][] = [];
      let unsafe = false;

      for (const item of items) {
        const text = `${item.transcript ?? ''} ${item.caption ?? ''}`.toLowerCase();
        if (UNSAFE_WORDS.some((w) => text.includes(w))) unsafe = true;

        const topics = new Set<string>();
        for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
          const hits = words.filter((w) => text.includes(w)).length;
          if (hits > 0) {
            catScore.set(cat, (catScore.get(cat) ?? 0) + hits * Math.max(1, item.views));
            for (const w of words) if (text.includes(w)) topics.add(w);
          }
        }
        itemTopics.push([...topics].slice(0, 3));
      }

      const ranked = [...catScore.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
      // Combina lo declarado con lo detectado (detectado primero, sin duplicar).
      const suggestedCategories = [...new Set([...ranked, ...declaredCategories])].slice(0, 5);
      const topTopics = [...new Set(itemTopics.flat())].slice(0, 8);

      return {
        suggestedCategories,
        topTopics,
        audience: {
          primaryAgeRange: '25-34',
          topCities: ['Villavicencio', 'Acacías', 'Yopal'],
          languages: ['es'],
          interests: topTopics.slice(0, 5),
        },
        brandSafety: unsafe ? 'unsafe' : 'safe',
        itemTopics,
      };
    },
  };
}
