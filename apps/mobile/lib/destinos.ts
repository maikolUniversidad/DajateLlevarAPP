/**
 * Destinos del Meta para la entrada del descubrimiento. Estático por ahora:
 * el filtro se manda como `city` (texto) a GET /v1/services. Cuando exista un
 * catálogo de destinos en la API (con geocerca), se reemplaza por un fetch sin
 * tocar las pantallas que consumen esta lista.
 */
export interface Destino {
  slug: string;
  label: string;
  /** Valor enviado como filtro `city` a la API. */
  city: string;
}

export const DESTINOS: Destino[] = [
  { slug: 'villavicencio', label: 'Villavicencio', city: 'Villavicencio' },
  { slug: 'restrepo', label: 'Restrepo', city: 'Restrepo' },
  { slug: 'acacias', label: 'Acacías', city: 'Acacías' },
  { slug: 'cumaral', label: 'Cumaral', city: 'Cumaral' },
  { slug: 'puerto-lopez', label: 'Puerto López', city: 'Puerto López' },
  { slug: 'granada', label: 'Granada', city: 'Granada' },
];
