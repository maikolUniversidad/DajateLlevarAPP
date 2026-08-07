import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient con configuración OFFLINE-FIRST.
 *
 * - `networkMode: 'offlineFirst'`: las consultas se sirven de la caché aunque no
 *   haya red; las mutaciones se pausan sin conexión y se reanudan al volver.
 * - `gcTime` largo: los datos permanecen en memoria/caché para poder persistirlos
 *   y rehidratarlos al reabrir la app sin internet.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        networkMode: 'offlineFirst',
        gcTime: 1000 * 60 * 60 * 24 * 7, // 7 días en caché
        staleTime: 1000 * 60 * 5, // 5 min "fresco"
        retry: 2,
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
      },
      mutations: {
        networkMode: 'offlineFirst',
        retry: 3,
      },
    },
  });
}

/** Versión de la caché persistida. Súbela para invalidar cachés viejas al desplegar. */
export const PERSIST_BUSTER = 'v1';
export const PERSIST_KEY = 'dejatellevar-offline-cache';
export const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24 * 14; // 14 días
