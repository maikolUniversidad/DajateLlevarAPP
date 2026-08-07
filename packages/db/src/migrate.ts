import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

/**
 * Migrador SQL-first: aplica los archivos de ./migrations en orden alfabético
 * dentro de una tabla de control `schema_migrations`. Portable: no depende de
 * drizzle-kit ni de Supabase, solo de un Postgres estándar.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

async function main() {
  const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Falta DATABASE_URL (o DATABASE_URL_DIRECT) para migrar.');
  }

  const sql = postgres(url, { max: 1 });

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name        text PRIMARY KEY,
        applied_at  timestamptz NOT NULL DEFAULT now()
      )
    `;

    const applied = new Set(
      (await sql<{ name: string }[]>`SELECT name FROM schema_migrations`).map((r) => r.name),
    );

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.warn('No hay migraciones en', MIGRATIONS_DIR);
    }

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`· ${file} (ya aplicada)`);
        continue;
      }
      const contents = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
      process.stdout.write(`→ aplicando ${file} ... `);
      await sql.begin(async (tx) => {
        await tx.unsafe(contents);
        await tx`INSERT INTO schema_migrations (name) VALUES (${file})`;
      });
      console.log('ok');
    }

    console.log('\nMigraciones al día.');
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error('\nError en la migración:', e);
  process.exit(1);
});
