import fs from "node:fs";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Uso: node postgres/run-migration.js <caminho-do-arquivo.sql>");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL || process.env.AZURE_POSTGRES_URL || process.env.POSTGRES_URL;
if (!databaseUrl) {
  console.error("Defina DATABASE_URL antes de rodar (ex: $env:DATABASE_URL = \"postgresql://...\").");
  process.exit(1);
}

const sql = fs.readFileSync(file, "utf8");
const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log(`Migration aplicada com sucesso: ${file}`);
} catch (error) {
  console.error("Erro ao aplicar migration:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
