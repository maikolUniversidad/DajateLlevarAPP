import type { DbClient } from '@dejatellevar/db';

/**
 * Contenedor de dependencias que la app de API recibe por inyección.
 * Así el paquete no crea conexiones ni conoce el entorno: quien la monta decide.
 */
export interface ApiDeps {
  db: DbClient;
}

/** Variables por request que fijan los middlewares. */
export interface ApiVariables {
  accountId: string | null;
  organizationId: string | null;
  requestId: string;
}

export type ApiEnv = {
  Variables: ApiVariables;
  Bindings: Record<string, never>;
};
