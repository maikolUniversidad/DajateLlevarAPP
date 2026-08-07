/**
 * Sesión de desarrollo en memoria. El login llama al shim de la API
 * (GET /v1/dev/session), guarda el token aquí, y el cliente lo envía como
 * `Authorization: Bearer` en cada request. No se persiste: se reestablece al
 * iniciar sesión. Cuando exista auth real (Supabase), esto se reemplaza.
 */
let token: string | null = null;
let accountName: string | null = null;

export function setDevSession(t: string | null, name: string | null): void {
  token = t;
  accountName = name;
}

export function getDevToken(): string | null {
  return token;
}

export function getDevAccountName(): string | null {
  return accountName;
}
