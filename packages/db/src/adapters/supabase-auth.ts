import type { AuthProvider } from '@dejatellevar/core';

/**
 * SupabaseAuthProvider — adaptador del puerto AuthProvider.
 *
 * ES EL ÚNICO ARCHIVO que conoce Supabase Auth. Habla con GoTrue por REST (sin
 * SDK) para no acoplar el proyecto a la librería del proveedor: cambiar de auth
 * es reescribir solo este archivo.
 */
export interface SupabaseAuthConfig {
  url: string; // https://TU-PROYECTO.supabase.co
  anonKey: string;
}

export function createSupabaseAuthProvider(config: SupabaseAuthConfig): AuthProvider {
  const base = `${config.url.replace(/\/$/, '')}/auth/v1`;
  const headers = {
    apikey: config.anonKey,
    'Content-Type': 'application/json',
  };

  return {
    async verifyToken(token: string) {
      const res = await fetch(`${base}/user`, {
        headers: { ...headers, Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const user = (await res.json()) as { id?: string };
      return user.id ? { externalUserId: user.id } : null;
    },

    async createUser({ email, password, fullName }) {
      const res = await fetch(`${base}/signup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password, data: { full_name: fullName } }),
      });
      if (!res.ok) throw new Error(`Supabase signup falló: ${res.status}`);
      const user = (await res.json()) as { id?: string; user?: { id: string } };
      const externalUserId = user.id ?? user.user?.id;
      if (!externalUserId) throw new Error('Supabase signup no devolvió id');
      return { externalUserId };
    },

    async signIn({ email, password }) {
      const res = await fetch(`${base}/token?grant_type=password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { access_token?: string };
      return data.access_token ? { token: data.access_token } : null;
    },
  };
}
