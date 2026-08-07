/**
 * Opciones del perfil de creador. Describen QUÉ hace y A QUIÉN llega, para que
 * las empresas puedan encontrarlo y decidir a quién pautar o contratar (§12).
 * Son datos descriptivos de segmentación; las métricas duras (seguidores,
 * engagement, fidelidad) se calculan del análisis de contenido, no se declaran.
 */

export const CONTENT_CATEGORIES = [
  'Viajes',
  'Gastronomía',
  'Moda',
  'Belleza',
  'Fitness',
  'Tecnología',
  'Gaming',
  'Educación',
  'Humor',
  'Música',
  'Baile',
  'Arte',
  'Fotografía',
  'Mascotas',
  'Hogar',
  'Maternidad',
  'Finanzas personales',
  'Emprendimiento',
  'Vida saludable',
  'Naturaleza',
  'Cultura',
  'Deportes',
];

/** Arquetipo del creador: su rol y el valor que le da a una marca. */
export const CREATOR_TYPES = [
  { value: 'educador', label: 'Educador — enseña o hace tutoriales' },
  { value: 'entretenedor', label: 'Entretenedor — humor y contenido viral' },
  { value: 'resenador', label: 'Reseñador — reviews y recomendaciones' },
  { value: 'lifestyle', label: 'Lifestyle — día a día y vlogs' },
  { value: 'experto', label: 'Experto de nicho — autoridad en un tema' },
  { value: 'ugc', label: 'UGC — crea contenido para marcas' },
  { value: 'streamer', label: 'Streamer — transmisiones en vivo' },
];

/**
 * Estilos de contenido (cómo describe el creador lo que hace), detallado y
 * multi-selección. Cada uno trae sinónimos para búsqueda inteligente.
 */
export interface StyleOption {
  label: string;
  synonyms: string[];
}

export const CONTENT_STYLES: StyleOption[] = [
  {
    label: 'Tutoriales y how-to',
    synonyms: ['tutorial', 'como hacer', 'paso a paso', 'diy', 'aprender'],
  },
  {
    label: 'Reseñas y unboxing',
    synonyms: ['review', 'reseña', 'unboxing', 'opinión de producto'],
  },
  { label: 'Comedia y sketches', synonyms: ['humor', 'chistes', 'sketch', 'parodia', 'gracioso'] },
  { label: 'Vlogs / día a día', synonyms: ['vlog', 'rutina', 'mi día', 'lifestyle'] },
  { label: 'Retos y trends', synonyms: ['challenge', 'reto', 'trend', 'viral', 'tendencia'] },
  { label: 'Storytelling / relatos', synonyms: ['historia', 'relato', 'narración', 'anécdota'] },
  {
    label: 'Educativo / divulgación',
    synonyms: ['educación', 'enseñar', 'datos', 'divulgación', 'explicar'],
  },
  { label: 'Reacciones', synonyms: ['reaction', 'reacciono', 'react'] },
  { label: 'Entrevistas / podcast', synonyms: ['podcast', 'entrevista', 'charla', 'conversación'] },
  { label: 'Detrás de cámaras', synonyms: ['behind the scenes', 'bts', 'making of'] },
  {
    label: 'Recomendaciones / listas',
    synonyms: ['top', 'recomiendo', 'lista', 'favoritos', 'ranking'],
  },
  {
    label: 'Transformaciones / antes y después',
    synonyms: ['antes y después', 'makeover', 'glow up', 'transformación'],
  },
  { label: 'Recetas / cocina', synonyms: ['receta', 'cocina', 'comida', 'food', 'chef'] },
  {
    label: 'Rutinas (fitness, skincare…)',
    synonyms: ['rutina', 'fitness', 'skincare', 'ejercicio', 'gym'],
  },
  { label: 'Análisis y opinión', synonyms: ['análisis', 'opinión', 'crítica', 'debate'] },
  { label: 'En vivo / directos', synonyms: ['live', 'directo', 'stream', 'en vivo'] },
  {
    label: 'UGC para marcas',
    synonyms: ['ugc', 'contenido para marcas', 'publicidad', 'colaboración'],
  },
  { label: 'Fotografía / estética visual', synonyms: ['foto', 'fotografía', 'estética', 'visual'] },
  { label: 'Bailes / coreografías', synonyms: ['baile', 'dance', 'coreografía', 'tiktok dance'] },
  { label: 'Gaming / gameplay', synonyms: ['gaming', 'videojuegos', 'gameplay', 'juegos'] },
  { label: 'Viajes / turismo', synonyms: ['viajes', 'turismo', 'travel', 'destinos'] },
  {
    label: 'Motivación / desarrollo personal',
    synonyms: ['motivación', 'coaching', 'superación', 'mindset'],
  },
];

export const CONTENT_STYLE_LABELS = CONTENT_STYLES.map((s) => s.label);

/** Búsqueda inteligente por nombre o sinónimo; devuelve las etiquetas. */
export function searchContentStyles(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return CONTENT_STYLE_LABELS;
  return CONTENT_STYLES.filter(
    (s) => s.label.toLowerCase().includes(q) || s.synonyms.some((x) => x.toLowerCase().includes(q)),
  ).map((s) => s.label);
}

export const CONTENT_FORMATS = [
  'Reel / Short',
  'Video largo',
  'En vivo',
  'Historia',
  'Post / Carrusel',
  'Podcast',
  'UGC para marcas',
];

/** Rangos de edad de la audiencia (segmentación demográfica para las marcas). */
export const AGE_RANGES = ['13–17', '18–24', '25–34', '35–44', '45+'];

export const AUDIENCE_GENDERS = [
  { value: 'mostly_women', label: 'Mayoría mujeres' },
  { value: 'mostly_men', label: 'Mayoría hombres' },
  { value: 'balanced', label: 'Equilibrado' },
];

export const AUDIENCE_SCOPES = [
  { value: 'national', label: 'Nacional (todo el país)' },
  { value: 'regional', label: 'Regional' },
  { value: 'local', label: 'Local / una ciudad' },
];
