import type {
  Category,
  ConsentRecord,
  CreateProductReview,
  CreateVenueReview,
  Me,
  ProductReview,
  ProductReviewList,
  Review,
  ReviewList,
  Service,
  ServiceDetail,
  ServiceSearch,
} from '@dejatellevar/contracts';

export interface ApiClientOptions {
  /** Base de la API. Web: '/api' (mismo origen). Móvil: 'https://.../api'. */
  baseUrl: string;
  /** fetch inyectable (para pruebas o entornos sin fetch global). */
  fetchFn?: typeof fetch;
  /**
   * Token de sesión a enviar como `Authorization: Bearer`. Se resuelve por
   * request (para que móvil lo lea tras iniciar sesión). Web usa la cookie
   * httpOnly, así que normalmente no lo necesita.
   */
  getAuthToken?: () => string | null | undefined;
}

/** Sesión de desarrollo que entrega el shim (solo dev). */
export type DevSession = { account: { id: string; full_name: string }; token: string };

export interface ApiError {
  code: string;
  message: string;
}

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(status: number, error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.code = error.code;
    this.status = status;
  }
}

export type ServiceList = { data: Service[]; next_cursor: string | null };
export type CategoryList = { data: Category[] };

export type PageParams = { cursor?: string; limit?: number };

function pageQuery(params: PageParams): string {
  const qs = new URLSearchParams();
  if (params.cursor) qs.set('cursor', params.cursor);
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  const s = qs.toString();
  return s ? `?${s}` : '';
}

/**
 * Cliente de API tipado que web y móvil comparten. Habla siempre HTTP con la
 * misma API de Hono, de modo que la lógica de red no se duplica por plataforma.
 */
export function createApiClient(opts: ApiClientOptions) {
  const f = opts.fetchFn ?? fetch;
  const base = opts.baseUrl.replace(/\/$/, '');

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = opts.getAuthToken?.();
    const res = await f(`${base}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const err = (body?.error as ApiError) ?? { code: 'UNKNOWN', message: 'Error desconocido' };
      throw new ApiRequestError(res.status, err);
    }
    return body as T;
  }

  return {
    request,
    listServices(params: Partial<ServiceSearch> = {}): Promise<ServiceList> {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
      }
      return request<ServiceList>(`/v1/services?${qs.toString()}`);
    },
    getService(id: string): Promise<Service> {
      return request<Service>(`/v1/services/${id}`);
    },
    getServiceDetail(id: string): Promise<ServiceDetail> {
      return request<ServiceDetail>(`/v1/services/${id}`);
    },
    listServiceReviews(id: string, params: PageParams = {}): Promise<ReviewList> {
      return request<ReviewList>(`/v1/services/${id}/reviews${pageQuery(params)}`);
    },
    listProductReviews(id: string, params: PageParams = {}): Promise<ProductReviewList> {
      return request<ProductReviewList>(`/v1/products/${id}/reviews${pageQuery(params)}`);
    },
    createVenueReview(id: string, body: CreateVenueReview): Promise<Review> {
      return request<Review>(`/v1/services/${id}/reviews`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    createProductReview(id: string, body: CreateProductReview): Promise<ProductReview> {
      return request<ProductReview>(`/v1/products/${id}/reviews`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    devSession(): Promise<DevSession> {
      return request<DevSession>('/v1/dev/session');
    },
    listCategories(): Promise<CategoryList> {
      return request<CategoryList>('/v1/categories');
    },
    me(): Promise<Me> {
      return request<Me>('/v1/me');
    },
    consents(): Promise<{ data: ConsentRecord[] }> {
      return request<{ data: ConsentRecord[] }>('/v1/me/consents');
    },
    login(input: { email: string; password: string }) {
      return request<{ ok: boolean }>('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    logout() {
      return request<{ ok: boolean }>('/v1/auth/logout', { method: 'POST' });
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
