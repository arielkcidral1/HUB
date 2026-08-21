// Conta quantos hub_users ainda usam hash legado (SHA-256/texto puro) em vez
// de bcrypt. Nao imprime nenhum hash ou senha, apenas totais.
// Uso: node scripts/check-password-hashes.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envText = fs.readFileSync(path.join(projectRoot, ".env"), "utf8");
const match = envText.match(/^DATABASE_URL=(.+)$/m);
if (!match) throw new Error("DATABASE_URL nao encontrada em .env");
const DATABASE_URL = match[1].trim();

const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

const result = await pool.query(`select password_hash from public.hub_users`);
let bcrypt = 0;
let sha256 = 0;
let plaintextOrOther = 0;
let empty = 0;

for (const row of result.rows) {
  const hash = String(row.password_hash || "").trim();
  if (!hash) { empty++; continue; }
  if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
    bcrypt++;
  } else if (/^[a-f0-9]{64}$/i.test(hash)) {
    sha256++;
  } else {
    plaintextOrOther++;
  }
}

console.log(JSON.stringify({
  total: result.rows.length,
  bcrypt,
  sha256_like: sha256,
  plaintext_or_other: plaintextOrOther,
  empty,
}, null, 2));

await pool.end();
