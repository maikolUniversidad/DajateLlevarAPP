# Offline y persistencia en la app móvil

La lógica offline es **compartida** con la web: vive en `packages/client`
(`@dejatellevar/client`). La app móvil solo aporta el **persister de AsyncStorage**
y conecta el estado de red (NetInfo) con TanStack Query. Así, lo ya visto se muestra
sin internet y las acciones hechas offline se reintentan al reconectar.

## 1. Instalar dependencias (una vez)

```bash
pnpm --filter @dejatellevar/mobile add \
  @dejatellevar/client \
  @tanstack/react-query@5.62.16 \
  @tanstack/react-query-persist-client@5.62.16 \
  @tanstack/query-async-storage-persister@5.62.16 \
  @react-native-async-storage/async-storage \
  @react-native-community/netinfo
```

## 2. Crear el proveedor offline

`lib/offline-provider.tsx`:

```tsx
import { createApiClient, createQueryClient, OfflineProvider } from '@dejatellevar/client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { onlineManager } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import { useState, type ReactNode } from 'react';

// Conecta el estado de red del dispositivo con TanStack Query.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(!!state.isConnected)),
);

const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string) ?? 'https://dajate-llevar-app.vercel.app/api';

export function AppOfflineProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  const [api] = useState(() => createApiClient({ baseUrl: API_URL }));
  const [persister] = useState(() =>
    createAsyncStoragePersister({ storage: AsyncStorage, key: 'dejatellevar-offline-cache' }),
  );
  return (
    <OfflineProvider queryClient={queryClient} persister={persister} api={api}>
      {children}
    </OfflineProvider>
  );
}
```

## 3. Envolver la app

En `app/_layout.tsx`, envuelve el `<Stack>` con `<AppOfflineProvider>`:

```tsx
import { AppOfflineProvider } from '../lib/offline-provider';
// ...
return (
  <AppOfflineProvider>
    <Stack screenOptions={{ headerShown: false }}>{/* ... */}</Stack>
  </AppOfflineProvider>
);
```

## 4. Consumir datos con caché offline

En cualquier pantalla, usa los hooks compartidos (mismos que la web):

```tsx
import { useServices } from '@dejatellevar/client';

const { data, isLoading } = useServices({ sort: 'fidelity' });
// data.data → servicios; se rehidratan de AsyncStorage sin conexión.
```

## Qué queda cubierto

- **Lecturas offline:** la última respuesta de cada consulta se guarda en AsyncStorage
  y se muestra al reabrir la app sin internet (`networkMode: 'offlineFirst'`).
- **Escrituras offline:** las mutaciones se **pausan** sin red y se **reintentan solas**
  al reconectar (`resumePausedMutations`).
- **Un solo origen de verdad:** la config vive en `packages/client`; web y móvil la comparten.
