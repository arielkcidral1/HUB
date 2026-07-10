import { sql } from "../../_lib/db.js";
import { json, corsHeaders } from "../../_lib/cors.js";
import { requireUser } from "../../_lib/jwt.js";
import { RECORD_RULES } from "../../_lib/authz.js";

export const config = { runtime: "edge" };

const IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

function safeColumns(row) {
  return Object.keys(row).filter((key) => IDENTIFIER.test(key) && key !== "id");
}

function toSqlParam(value) {
  if (value !== null && typeof value === "object") return JSON.stringify(value);
  return value;
}

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });

  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const id = parts.pop();
  const collection = parts.pop();
  const rule = RECORD_RULES[collection];
  if (!rule || !id) return json(request, 404, { error: "Colecao ou id desconhecido." });

  const user = await requireUser(request, sql);
  if (!user) return json(request, 401, { error: "Nao autenticado." });

  const canWrite = rule.updateDelete ? rule.updateDelete(user) : rule.write(user);
  if (!canWrite) return json(request, 403, { error: "Sem permissao para alterar este registro." });

  if (request.method === "PATCH") {
    let body;
    try { body = await request.json(); } catch { return json(request, 400, { error: "Requisicao invalida." }); }
    const columns = safeColumns(body);
    if (!columns.length) return json(request, 400, { error: "Nenhum campo para atualizar." });
    const assignments = columns.map((column, index) => `${column} = $${index + 1}`).join(", ");
    const values = columns.map((column) => toSqlParam(body[column]));
    values.push(id);
    const text = `update ${rule.table} set ${assignments} where id = $${values.length} returning *`;
    const rows = await sql(text, values);
    if (!rows.length) return json(request, 404, { error: "Registro nao encontrado." });
    return json(request, 200, { data: rows[0] });
  }

  if (request.method === "DELETE") {
    if (collection === "vagas") {
      await sql(`delete from hub_candidaturas where vaga_id = $1`, [id]);
    }
    const rows = await sql(`delete from ${rule.table} where id = $1 returning id`, [id]);
    if (!rows.length) return json(request, 404, { error: "Registro nao encontrado." });
    return json(request, 200, { data: rows[0] });
  }

  return json(request, 405, { error: "Metodo nao permitido." });
}
