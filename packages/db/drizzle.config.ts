import { defineConfig } from 'drizzle-kit';

/**
 * Config solo para `drizzle-kit studio`. El esquema autoritativo son las
 * migraciones SQL en ./migrations (no generamos DDL desde el schema TS).
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  dbCredentials: {
    url: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL ?? '',
  },
});
