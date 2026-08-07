import type { Persister } from '@tanstack/query-persist-client-core';
import type { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { ApiClient } from './api-client.js';
import { PERSIST_BUSTER, PERSIST_MAX_AGE } from './query-client.js';

const ApiClientContext = createContext<ApiClient | null>(null);

export function useApi(): ApiClient {
  const client = useContext(ApiClientContext);
  if (!client) throw new Error('useApi debe usarse dentro de <OfflineProvider>');
  return client;
}

export interface OfflineProviderProps {
  queryClient: QueryClient;
  /** Persister de la plataforma: localStorage (web) o AsyncStorage (móvil). */
  persister: Persister;
  api: ApiClient;
  children: ReactNode;
}

/**
 * Envuelve la app con la caché persistida (offline) y el cliente de API.
 * Al rehidratar/reconectar, reintenta las mutaciones que quedaron en cola sin red.
 */
export function OfflineProvider({ queryClient, persister, api, children }: OfflineProviderProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, buster: PERSIST_BUSTER, maxAge: PERSIST_MAX_AGE }}
      onSuccess={() => {
        // La caché se rehidrató: reanuda las mutaciones encoladas offline.
        void queryClient.resumePausedMutations();
      }}
    >
      <ApiClientContext.Provider value={api}>{children}</ApiClientContext.Provider>
    </PersistQueryClientProvider>
  );
}
