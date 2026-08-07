/**
 * Sistema de diseño móvil (§1) — HORIZONTE AL ATARDECER.
 * Espejo de packages/ui/tokens.css como constantes de RN (sin NativeWind:
 * las pantallas usan StyleSheet + estos tokens, patrón ya establecido).
 */

export const colors = {
  // Neutros fríos (tinte violeta)
  paja: '#F6F5FA',
  niebla: '#E8E6F0',
  carbon: '#191427',
  humo: '#625C74',
  borderStrong: '#CFCADD',

  // Marca
  noche: '#2E2A5E', // índigo profundo — superficies oscuras, cabeceras
  violeta: '#7C3AED', // acción primaria, enlaces, foco
  lila: '#A78BFA', // acento, destacados

  // Estados (funcionales: rojo↔verde, no marca)
  tinto: '#8C2F39',
  brote: '#3F8F5C',
  barro: '#B5651D',

  // Semánticos
  bg: '#F6F5FA',
  surface: '#FFFFFF',
  text: '#191427',
  textMuted: '#625C74',
  primary: '#7C3AED',
  primaryContrast: '#FFFFFF',
  white: '#FFFFFF',
} as const;

/** Degradados de marca para expo-linear-gradient (de arriba/izq. a abajo/der.). */
export const gradients = {
  splash: ['#5B3E9B', '#2A2550'] as [string, string], // portada del logo
  brand: ['#4C2A85', '#2E2A5E'] as [string, string], // cabeceras índigo
  brandVivid: ['#7C3AED', '#4C2A85'] as [string, string], // acento vivo
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Radios: botones y campos son tipo píldora, como en los mockups. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  banner: 40, // curva inferior de las cabeceras
  pill: 9999,
} as const;

export const typography = {
  display: 30, // títulos de pantalla
  h1: 26,
  h2: 20,
  body: 16,
  small: 14,
  tiny: 12,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;
