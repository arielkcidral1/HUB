import pg from "pg";

const DATABASE_URL =
  process.env.AZURE_POSTGRES_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Defina DATABASE_URL (ou AZURE_POSTGRES_URL / POSTGRES_URL) no ambiente para rodar este script.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

try {
  const dbSize = await pool.query(
    "select pg_size_pretty(pg_database_size(current_database())) as size, pg_database_size(current_database()) as bytes"
  );
  console.log(`Tamanho total do banco "${(await pool.query("select current_database()")).rows[0].current_database}": ${dbSize.rows[0].size}`);

  const tables = await pool.query(`
    select relname as tabela,
           pg_size_pretty(pg_total_relation_size(relid)) as tamanho,
           pg_total_relation_size(relid) as bytes
    from pg_catalog.pg_statio_user_tables
    order by bytes desc
    limit 20
  `);

  console.log("\nMaiores tabelas:");
  for (const row of tables.rows) {
    console.log(`  ${row.tabela.padEnd(35)} ${row.tamanho}`);
  }
} finally {
  await pool.end();
}
