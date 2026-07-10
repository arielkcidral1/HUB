import { sql } from "../_lib/db.js";
import { json, corsHeaders } from "../_lib/cors.js";
import { requireUser } from "../_lib/jwt.js";

export const config = { runtime: "edge" };

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "PUT") return json(request, 405, { error: "Metodo nao permitido." });

  const user = await requireUser(request, sql);
  if (!user) return json(request, 401, { error: "Nao autenticado." });

  let body;
  try { body = await request.json(); } catch { return json(request, 400, { error: "Requisicao invalida." }); }
  const settings = body?.settings;
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return json(request, 400, { error: "Configuracoes invalidas." });
  }

  const rows = await sql`update hub_users set configuracoes = ${JSON.stringify(settings)} where id = ${user.id} returning configuracoes`;
  return json(request, 200, { configuracoes: rows[0]?.configuracoes || {} });
}
