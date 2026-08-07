/**
 * Etiquetas y escala de los ejes de reseña. La config por categoría
 * (category_review_axis) decide QUÉ ejes se muestran; este mapa resuelve el
 * rótulo y la escala de cada clave conocida al listar valores. Si aparece una
 * clave nueva ("y demás"), cae al propio key.
 */
export const AXIS_LABELS: Record<string, string> = {
  // Local
  expectation_vs_reality: 'Expectativa vs realidad',
  service_quality: 'Servicio',
  punctuality: 'Puntualidad',
  accessibility: 'Accesibilidad',
  value_for_money: 'Calidad-precio',
  cleanliness: 'Limpieza',
  instagrammability: 'Instagrameable',
  // Producto (plato/combo)
  flavor: 'Sabor',
  portion: 'Cantidad',
  product_value: 'Calidad-precio',
};

export function axisLabel(key: string): string {
  return AXIS_LABELS[key] ?? key;
}

/** El único eje en escala −3..3 es Expectativa vs Realidad; el resto 1..5. */
export function axisScale(key: string): '1_5' | 'neg3_3' {
  return key === 'expectation_vs_reality' ? 'neg3_3' : '1_5';
}

/** Bucket de estrellas (media 1..5) para la distribución de la ficha. */
export function ratingBucket(mean: number): 'excelente' | 'bueno' | 'promedio' | 'malo' {
  if (mean >= 4.5) return 'excelente';
  if (mean >= 3.5) return 'bueno';
  if (mean >= 2.5) return 'promedio';
  return 'malo';
}
