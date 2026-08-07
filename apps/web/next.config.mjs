import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Carga el .env de la RAÍZ del monorepo. Next solo lee variables desde apps/web,
 * pero las nuestras (DATABASE_URL, claves de Supabase) viven en la raíz. Sin esto
 * la API en proceso lanza "Falta DATABASE_URL" y responde 500. No sobrescribe lo
 * que ya venga del entorno: una variable pasada en línea siempre gana.
 */
const monorepoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
for (const file of ['.env.local', '.env']) {
  const path = join(monorepoRoot, file);
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Portabilidad desde el día uno (§19): salida autónoma, no atada a Vercel.
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: [
    '@dejatellevar/ui',
    '@dejatellevar/api',
    '@dejatellevar/core',
    '@dejatellevar/db',
    '@dejatellevar/contracts',
    '@dejatellevar/client',
  ],
  // postgres-js y drizzle corren solo en el servidor (Next 15: clave de nivel superior).
  serverExternalPackages: ['postgres', 'drizzle-orm'],
  webpack: (config) => {
    // Los paquetes del workspace usan imports ESM con extensión '.js' que apuntan
    // a archivos '.ts'. Webpack no resuelve eso por defecto: se lo enseñamos.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
    };
    return config;
  },
};

export default nextConfig;
