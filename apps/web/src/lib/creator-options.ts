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
