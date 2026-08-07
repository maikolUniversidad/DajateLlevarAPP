import type {
  AnalyzedContentItem,
  ConsentRecord,
  CreatorInsight,
  Me,
  MyCreator,
  RegisterCreator,
  Service,
  ServiceSearch,
} from '@dejatellevar/contracts';

export interface ApiClientOptions {
  /** Base de la API. Web: '/api' (mismo origen). Móvil: 'https://.../api'. */
  baseUrl: string;
  /** fetch inyectable (para pruebas o entornos sin fetch global). */
  fetchFn?: typeof fetch;
}

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

/**
 * Cliente de API tipado que web y móvil comparten. Habla siempre HTTP con la
 * misma API de Hono, de modo que la lógica de red no se duplica por plataforma.
 */
export function createApiClient(opts: ApiClientOptions) {
  const f = opts.fetchFn ?? fetch;
  const base = opts.baseUrl.replace(/\/$/, '');

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await f(`${base}${path}`, {
      credentials: 'include',
      headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
      ...init,
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
    // --- Creadores (§12): registro de enlaces + análisis de contenido ---------
    registerCreator(input: RegisterCreator): Promise<MyCreator> {
      return request<MyCreator>('/v1/creators', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    myCreator(): Promise<MyCreator> {
      return request<MyCreator>('/v1/creators/me');
    },
    analyzeMyContent(): Promise<CreatorInsight> {
      return request<CreatorInsight>('/v1/creators/me/analyze', { method: 'POST' });
    },
    myContent(): Promise<{ data: AnalyzedContentItem[] }> {
      return request<{ data: AnalyzedContentItem[] }>('/v1/creators/me/content');
    },
    logout() {
      return request<{ ok: boolean }>('/v1/auth/logout', { method: 'POST' });
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
