import { sql } from "../_lib/db.js";
import { json, corsHeaders } from "../_lib/cors.js";
import { requireUser } from "../_lib/jwt.js";
import { RECORD_RULES } from "../_lib/authz.js";

export const config = { runtime: "edge" };

const IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

function safeColumns(row) {
  return Object.keys(row).filter((key) => IDENTIFIER.test(key));
}

function toSqlParam(value) {
  if (value !== null && typeof value === "object") return JSON.stringify(value);
  return value;
}

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });

  const url = new URL(request.url);
  const collection = url.pathname.split("/").filter(Boolean).pop();
  const rule = RECORD_RULES[collection];
  if (!rule) return json(request, 404, { error: "Colecao desconhecida." });

  const user = await requireUser(request, sql);
  if (!user) return json(request, 401, { error: "Nao autenticado." });

  if (request.method === "GET") {
    if (!rule.read(user)) return json(request, 403, { error: "Sem permissao para ler estes dados." });
    const rows = await sql(`select * from ${rule.table} order by created_at desc`, []);
    const visible = rule.canReadRow ? rows.filter((row) => rule.canReadRow(user, row)) : rows;
    return json(request, 200, { data: visible });
  }

  if (request.method === "POST") {
    let body;
    try { body = await request.json(); } catch { return json(request, 400, { error: "Requisicao invalida." }); }
    if (!rule.write(user, body)) return json(request, 403, { error: "Sem permissao para criar este registro." });

    const columns = safeColumns(body);
    if (!columns.length) return json(request, 400, { error: "Nenhum campo para inserir." });
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
    const values = columns.map((column) => toSqlParam(body[column]));
    const text = `insert into ${rule.table} (${columns.join(", ")}) values (${placeholders}) returning *`;
    const rows = await sql(text, values);
    return json(request, 200, { data: rows[0] });
  }

  return json(request, 405, { error: "Metodo nao permitido." });
}
