/**
 * Formaciones de partículas para la escena de la landing. Cada formación es un
 * Float32Array de posiciones (x,y,z por partícula) hacia el que las partículas
 * interpolan según el avance del scroll. El orden cuenta el negocio:
 *
 *   0 nube     → intro dispersa
 *   1 ruta     → descubrir servicios del Llano (una ruta que serpentea)
 *   2 medidor  → el Índice de Fidelidad (barra horizontal −3…+3)
 *   3 clústeres→ mercado de dos lados + creadores (3 núcleos conectados)
 *   4 remanso  → cierre / CTA (esfera suave)
 */

export const HUBS = [
  [-6.2, 0.6, 0], // empresas
  [0, -0.8, 1.4], // clientes
  [6.2, 0.6, -0.2], // creadores
] as const satisfies readonly (readonly [number, number, number])[];

/** Posición del hub para un índice 0..2 (definida, sin acceso por índice dinámico). */
export function hubPos(i: number): readonly [number, number, number] {
  return i <= 0 ? HUBS[0] : i === 1 ? HUBS[1] : HUBS[2];
}

export type Formations = {
  cloud: Float32Array;
  route: Float32Array;
  meter: Float32Array;
  clusters: Float32Array;
  calm: Float32Array;
  /** Índice de hub (0..2) asignado a cada partícula en la formación de clústeres. */
  hubOf: Uint8Array;
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** Punto aleatorio dentro de una esfera de radio r, centrada en c. */
function inSphere(c: readonly [number, number, number], r: number): [number, number, number] {
  let x: number;
  let y: number;
  let z: number;
  do {
    x = rand(-1, 1);
    y = rand(-1, 1);
    z = rand(-1, 1);
  } while (x * x + y * y + z * z > 1);
  return [c[0] + x * r, c[1] + y * r, c[2] + z * r];
}

export function buildFormations(count: number): Formations {
  const cloud = new Float32Array(count * 3);
  const route = new Float32Array(count * 3);
  const meter = new Float32Array(count * 3);
  const clusters = new Float32Array(count * 3);
  const calm = new Float32Array(count * 3);
  const hubOf = new Uint8Array(count);

  for (let i = 0; i < count; i++) {
    const o = i * 3;
    const u = i / (count - 1);

    // 0 — Nube dispersa, ligeramente aplanada (horizonte).
    {
      const [x, y, z] = inSphere([0, 0, 0], 7.2);
      cloud[o] = x;
      cloud[o + 1] = y * 0.7;
      cloud[o + 2] = z * 0.7;
    }

    // 1 — Ruta que serpentea a lo ancho, con nodos dispersos cada tanto.
    {
      const onNode = i % 23 === 0;
      const x = -8.5 + u * 17;
      const y = Math.sin(u * Math.PI * 3.2) * 2.1 + Math.sin(u * Math.PI * 11) * 0.25;
      const z = Math.cos(u * Math.PI * 2.1) * 1.6;
      if (onNode) {
        const [nx, ny, nz] = inSphere([x, y, z], 0.9);
        route[o] = nx;
        route[o + 1] = ny;
        route[o + 2] = nz;
      } else {
        route[o] = x + rand(-0.12, 0.12);
        route[o + 1] = y + rand(-0.12, 0.12);
        route[o + 2] = z + rand(-0.12, 0.12);
      }
    }

    // 2 — Medidor de fidelidad: barra horizontal fina −3…+3, con un marcador
    //     denso en el lado positivo (una calificación buena, +1.8 aprox.).
    {
      const marker = i % 9 === 0;
      if (marker) {
        meter[o] = 4.6 + rand(-0.12, 0.12); // columna del indicador
        meter[o + 1] = rand(-1.15, 1.15);
        meter[o + 2] = rand(-0.25, 0.25);
      } else {
        meter[o] = -7 + u * 14;
        meter[o + 1] = rand(-0.32, 0.32);
        meter[o + 2] = rand(-0.32, 0.32);
      }
    }

    // 3 — Tres clústeres (empresas, clientes, creadores).
    {
      const hub = i % 3;
      hubOf[i] = hub;
      const [x, y, z] = inSphere(hubPos(hub), 1.7);
      clusters[o] = x;
      clusters[o + 1] = y;
      clusters[o + 2] = z;
    }

    // 4 — Remanso: esfera suave y compacta para el cierre.
    {
      const [x, y, z] = inSphere([0, 0, 0], 3.2);
      calm[o] = x;
      calm[o + 1] = y;
      calm[o + 2] = z;
    }
  }

  return { cloud, route, meter, clusters, calm, hubOf };
}

/** Orden de las formaciones que recorre el scroll. */
export const FORMATION_ORDER: (keyof Omit<Formations, 'hubOf'>)[] = [
  'cloud',
  'route',
  'meter',
  'clusters',
  'calm',
];
