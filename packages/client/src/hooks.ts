import type { ServiceSearch } from '@dejatellevar/contracts';
import { useQuery } from '@tanstack/react-query';
import { useApi } from './provider.js';

/** Claves de caché estables (sirven para invalidar y persistir). */
export const queryKeys = {
  services: (params: Partial<ServiceSearch>) => ['services', params] as const,
  service: (id: string) => ['service', id] as const,
  me: () => ['me'] as const,
  consents: () => ['consents'] as const,
  myCreator: () => ['my-creator'] as const,
};

/** Lista de servicios con caché offline. Muestra lo último visto sin conexión. */
export function useServices(params: Partial<ServiceSearch> = {}) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.services(params),
    queryFn: () => api.listServices(params),
  });
}

export function useService(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.service(id),
    queryFn: () => api.getService(id),
    enabled: !!id,
  });
}

/** Perfil de la cuenta. Se rehidrata offline si ya se cargó antes. */
export function useMe() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => api.me(),
    retry: false,
  });
}

/** Perfil de creador del titular (enlaces + insight). */
export function useMyCreator() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.myCreator(),
    queryFn: () => api.myCreator(),
    retry: false,
  });
}
