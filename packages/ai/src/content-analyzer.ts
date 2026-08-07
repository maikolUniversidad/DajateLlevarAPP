import type { ContentAnalyzer } from '@dejatellevar/core';
import { z } from 'zod';
import { type CreateLLMProviderOptions, createLLMProvider } from './index.js';

/**
 * ContentAnalyzer REAL sobre el LLM (DeepSeek/OpenAI). Clasifica el contenido del
 * creador —categoría, temas, audiencia, seguridad de marca— a partir de las
 * transcripciones y captions. Es el punto donde la IA "se conecta" al flujo de
 * análisis de creadores (§12). El scraping y la transcripción son puertos aparte.
 */

// Taxonomía oficial (slugs) para que el modelo sugiera categorías válidas.
const CATEGORY_SLUGS = [
  'gastronomia',
  'aventura-naturaleza',
  'bienestar',
  'belleza',
  'deporte-fitness',
  'cultura-entretenimiento',
  'turismo-llanero',
  'formacion',
  'servicios-profesionales',
  'eventos',
  'hogar-mascotas',
  'transporte-traslados',
] as const;

const analysisSchema = z.object({
  suggestedCategories: z.array(z.string()).max(6).default([]),
  topTopics: z.array(z.string()).max(12).default([]),
  audience: z
    .object({
      primaryAgeRange: z.string().nullable().default(null),
      topCities: z.array(z.string()).default([]),
      languages: z.array(z.string()).default([]),
      interests: z.array(z.string()).default([]),
    })
    .default({ primaryAgeRange: null, topCities: [], languages: [], interests: [] }),
  brandSafety: z.enum(['safe', 'review', 'unsafe']).default('review'),
  itemTopics: z.array(z.array(z.string())).default([]),
});

export function createContentAnalyzer(options: CreateLLMProviderOptions = {}): ContentAnalyzer {
  const llm = createLLMProvider(options);

  return {
    async analyze({ items, declaredCategories }) {
      // Compacta cada ítem para el prompt (recorta transcripciones largas).
      const compact = items.map((it, i) => ({
        i,
        network: it.network,
        kind: it.kind,
        views: it.views,
        caption: it.caption?.slice(0, 300) ?? null,
        transcript: it.transcript?.slice(0, 1200) ?? null,
      }));

      const prompt = [
        'Analiza el contenido de un creador de contenido colombiano para clasificarlo.',
        `Categorías válidas (usa SOLO estos slugs en suggestedCategories): ${CATEGORY_SLUGS.join(', ')}.`,
        `Categorías que el creador declaró (referencia, no obligan): ${declaredCategories.join(', ') || '(ninguna)'}.`,
        '',
        'Piezas de contenido (JSON):',
        JSON.stringify(compact),
        '',
        'Devuelve un objeto JSON con EXACTAMENTE esta forma:',
        '{',
        '  "suggestedCategories": string[] (slugs de la lista, máx 6, ordenados por relevancia),',
        '  "topTopics": string[] (temas transversales en español, máx 12),',
        '  "audience": { "primaryAgeRange": string|null (p.ej. "18-24"), "topCities": string[], "languages": string[], "interests": string[] },',
        '  "brandSafety": "safe" | "review" | "unsafe",',
        `  "itemTopics": string[][] (EXACTAMENTE ${items.length} arreglos, uno por pieza en el mismo orden, 1-4 temas cada uno)`,
        '}',
        'No inventes ciudades ni datos si no hay evidencia; usa listas vacías o null.',
      ].join('\n');

      const { value } = await llm.generate({
        useCase: 'creator_content_analysis',
        prompt,
        schema: analysisSchema,
      });

      // Alinea itemTopics al número de piezas (rellena/recorta por robustez).
      const itemTopics = items.map((_, i) => value.itemTopics[i] ?? []);
      // Filtra categorías sugeridas a slugs válidos.
      const validSet = new Set<string>(CATEGORY_SLUGS);
      const suggestedCategories = value.suggestedCategories.filter((s) => validSet.has(s));

      return {
        suggestedCategories,
        topTopics: value.topTopics,
        audience: value.audience,
        brandSafety: value.brandSafety,
        itemTopics,
      };
    },
  };
}
