/**
 * Gremios / sectores de negocio para el selector con búsqueda inteligente del
 * registro de empresa. Cada entrada trae sinónimos para que la búsqueda
 * "entienda" el gremio aunque el usuario escriba distinto.
 */
export interface Sector {
  value: string;
  label: string;
  synonyms: string[];
}

export const SECTORS: Sector[] = [
  {
    value: 'turismo',
    label: 'Turismo y viajes',
    synonyms: ['agencia', 'tours', 'excursiones', 'viajes'],
  },
  {
    value: 'gastronomia',
    label: 'Gastronomía y restaurantes',
    synonyms: ['comida', 'restaurante', 'bar', 'café', 'cocina'],
  },
  {
    value: 'hoteleria',
    label: 'Hotelería y alojamiento',
    synonyms: ['hotel', 'hostal', 'glamping', 'finca', 'hospedaje'],
  },
  {
    value: 'belleza',
    label: 'Belleza y estética',
    synonyms: ['peluquería', 'spa', 'uñas', 'barbería', 'maquillaje'],
  },
  {
    value: 'salud',
    label: 'Salud y bienestar',
    synonyms: ['médico', 'clínica', 'terapia', 'psicología', 'odontología'],
  },
  {
    value: 'deporte',
    label: 'Deporte y fitness',
    synonyms: ['gimnasio', 'gym', 'entrenador', 'yoga', 'crossfit'],
  },
  {
    value: 'educacion',
    label: 'Educación y formación',
    synonyms: ['academia', 'curso', 'clases', 'colegio', 'instituto'],
  },
  {
    value: 'eventos',
    label: 'Entretenimiento y eventos',
    synonyms: ['fiesta', 'evento', 'dj', 'boda', 'producción'],
  },
  {
    value: 'arte',
    label: 'Arte y cultura',
    synonyms: ['galería', 'museo', 'teatro', 'música', 'danza'],
  },
  {
    value: 'moda',
    label: 'Moda y textil',
    synonyms: ['ropa', 'diseño', 'confección', 'boutique', 'calzado'],
  },
  {
    value: 'tecnologia',
    label: 'Tecnología y software',
    synonyms: ['app', 'desarrollo', 'ti', 'startup', 'sistemas'],
  },
  {
    value: 'comercio',
    label: 'Comercio y retail',
    synonyms: ['tienda', 'almacén', 'venta', 'minorista', 'supermercado'],
  },
  {
    value: 'transporte',
    label: 'Transporte y logística',
    synonyms: ['carga', 'domicilios', 'mensajería', 'flota', 'envíos'],
  },
  {
    value: 'construccion',
    label: 'Construcción',
    synonyms: ['obra', 'remodelación', 'arquitectura', 'ingeniería'],
  },
  {
    value: 'inmobiliario',
    label: 'Inmobiliario',
    synonyms: ['arriendo', 'venta de inmuebles', 'propiedad raíz', 'finca raíz'],
  },
  {
    value: 'agro',
    label: 'Agroindustria',
    synonyms: ['agricultura', 'ganadería', 'café', 'cultivo', 'campo'],
  },
  { value: 'manufactura', label: 'Manufactura', synonyms: ['fábrica', 'producción', 'industria'] },
  {
    value: 'finanzas',
    label: 'Finanzas y seguros',
    synonyms: ['banco', 'crédito', 'seguro', 'inversión'],
  },
  {
    value: 'marketing',
    label: 'Marketing y publicidad',
    synonyms: ['agencia', 'publicidad', 'redes', 'branding', 'diseño'],
  },
  {
    value: 'audiovisual',
    label: 'Fotografía y audiovisual',
    synonyms: ['foto', 'video', 'producción', 'estudio'],
  },
  {
    value: 'automotriz',
    label: 'Automotriz',
    synonyms: ['taller', 'carros', 'motos', 'mecánica', 'lavado'],
  },
  {
    value: 'mascotas',
    label: 'Mascotas y veterinaria',
    synonyms: ['veterinaria', 'perros', 'gatos', 'peluquería canina'],
  },
  {
    value: 'hogar',
    label: 'Hogar y decoración',
    synonyms: ['muebles', 'decoración', 'aseo', 'jardinería'],
  },
  {
    value: 'servicios',
    label: 'Servicios profesionales',
    synonyms: ['abogado', 'contador', 'consultoría', 'asesoría'],
  },
  { value: 'otro', label: 'Otro', synonyms: [] },
];

/** Busca sectores por nombre o sinónimo (búsqueda "inteligente" simple). */
export function searchSectors(query: string): Sector[] {
  const q = query.trim().toLowerCase();
  if (!q) return SECTORS;
  return SECTORS.filter(
    (s) =>
      s.label.toLowerCase().includes(q) ||
      s.value.includes(q) ||
      s.synonyms.some((syn) => syn.toLowerCase().includes(q)),
  );
}
