'use client';

import { OfflineProvider, createApiClient, createQueryClient } from '@dejatellevar/client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { ReactNode } from 'react';
import { useState } from 'react';

/**
 * Proveedor de datos offline-first de la web. Persiste la caché de TanStack Query
 * en localStorage, así lo ya visto se muestra sin conexión al recargar.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  const [api] = useState(() => createApiClient({ baseUrl: '/api' }));
  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      key: 'dejatellevar-offline-cache',
    }),
  );

  return (
    <OfflineProvider queryClient={queryClient} persister={persister} api={api}>
      {children}
    </OfflineProvider>
  );
}
