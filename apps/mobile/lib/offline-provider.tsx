import { OfflineProvider, createApiClient, createQueryClient } from '@dejatellevar/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { onlineManager } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { type ReactNode, useState } from 'react';
import { getDevToken } from './dev-session';

/**
 * Proveedor de datos OFFLINE de la app móvil. Reusa la config compartida de
 * `@dejatellevar/client` y añade lo específico de React Native:
 *  - persistencia en AsyncStorage (lo visto se guarda en el dispositivo),
 *  - estado de red real vía NetInfo conectado a TanStack Query.
 */

// Conecta la conectividad del dispositivo con TanStack Query (una sola vez).
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(!!state.isConnected)),
);

const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  'https://dajate-llevar-app.vercel.app/api';

export function AppOfflineProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  const [api] = useState(() =>
    createApiClient({ baseUrl: API_URL, getAuthToken: () => getDevToken() }),
  );
  const [persister] = useState(() =>
    createAsyncStoragePersister({
      storage: AsyncStorage,
      key: 'dejatellevar-offline-cache',
    }),
  );

  return (
    <OfflineProvider queryClient={queryClient} persister={persister} api={api}>
      {children}
    </OfflineProvider>
  );
}
