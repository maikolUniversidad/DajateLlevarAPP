import type {
  CreateProductReview,
  CreateVenueReview,
  ServiceSearch,
} from '@dejatellevar/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './provider.js';

/** Claves de caché estables (sirven para invalidar y persistir). */
export const queryKeys = {
  services: (params: Partial<ServiceSearch>) => ['services', params] as const,
  service: (id: string) => ['service', id] as const,
  serviceDetail: (id: string) => ['service-detail', id] as const,
  serviceReviews: (id: string) => ['service-reviews', id] as const,
  productReviews: (id: string) => ['product-reviews', id] as const,
  categories: () => ['categories'] as const,
  me: () => ['me'] as const,
  consents: () => ['consents'] as const,
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

/** Ficha enriquecida de un servicio/local (facts, ejes, productos). */
export function useServiceDetail(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.serviceDetail(id),
    queryFn: () => api.getServiceDetail(id),
    enabled: !!id,
  });
}

/** Opiniones del local. */
export function useServiceReviews(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.serviceReviews(id),
    queryFn: () => api.listServiceReviews(id),
    enabled: !!id,
  });
}

/** Opiniones de un producto (plato). */
export function useProductReviews(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.productReviews(id),
    queryFn: () => api.listProductReviews(id),
    enabled: !!id,
  });
}

/** Publicar reseña de un plato; refresca sus opiniones y la ficha. */
export function useCreateProductReview(serviceId: string, productId: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProductReview) => api.createProductReview(productId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.productReviews(productId) });
      qc.invalidateQueries({ queryKey: queryKeys.serviceDetail(serviceId) });
    },
  });
}

/** Publicar reseña del local; refresca opiniones y la ficha. */
export function useCreateVenueReview(serviceId: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateVenueReview) => api.createVenueReview(serviceId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.serviceReviews(serviceId) });
      qc.invalidateQueries({ queryKey: queryKeys.serviceDetail(serviceId) });
    },
  });
}

/** Catálogo de actividades. Se rehidrata offline; cambia poco, cachea largo. */
export function useCategories() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: () => api.listCategories(),
    staleTime: 1000 * 60 * 60, // 1 h: la taxonomía cambia poco
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
