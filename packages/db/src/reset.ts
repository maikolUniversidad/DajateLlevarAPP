import postgres from 'postgres';

/** Borra el esquema público y lo recrea vacío. Solo para desarrollo. */
async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('reset está deshabilitado en producción.');
  }
  const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (!url) throw new Error('Falta DATABASE_URL.');

  const sql = postgres(url, { max: 1 });
  try {
    await sql.unsafe('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    console.log('Esquema public reiniciado. Corre db:migrate y db:seed.');
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
