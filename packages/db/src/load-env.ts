import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Carga las variables de la raíz del monorepo (.env.local y luego .env) para los
 * scripts de línea de comandos (migrate, seed). No sobrescribe lo que ya venga
 * en el entorno: una variable pasada en línea siempre gana.
 *
 * Importa este módulo lo PRIMERO en cualquier script de BD.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

for (const file of ['.env.local', '.env']) {
  const path = join(root, file);
  if (!existsSync(path)) continue;
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
