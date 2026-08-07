import type { AuthProvider } from '@dejatellevar/core';
import type { DbClient } from '@dejatellevar/db';

/**
 * Contenedor de dependencias que la app de API recibe por inyección.
 * Así el paquete no crea conexiones ni conoce el entorno: quien la monta decide.
 */
export interface ApiDeps {
  db: DbClient;
  auth: AuthProvider;
}

/** Variables por request que fijan los middlewares. */
export interface ApiVariables {
  /** account.id local (no el id del proveedor de auth). */
  accountId: string | null;
  organizationId: string | null;
  requestId: string;
}

export type ApiEnv = {
  Variables: ApiVariables;
  Bindings: Record<string, never>;
};
