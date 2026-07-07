import { compare as bcryptCompare } from "bcryptjs";
import { sql } from "../_lib/db.js";
import { json, corsHeaders } from "../_lib/cors.js";
import { requireUser } from "../_lib/jwt.js";

export const config = { runtime: "edge" };

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, 405, { error: "Metodo nao permitido." });

  const user = await requireUser(request, sql);
  if (!user) return json(request, 401, { error: "Nao autenticado." });

  let body;
  try { body = await request.json(); } catch { return json(request, 400, { error: "Requisicao invalida." }); }
  const password = String(body.password || "");
  if (!password) return json(request, 400, { ok: false });

  const rows = await sql`select password_hash from hub_users where id = ${user.id}`;
  const passwordHash = rows[0]?.password_hash;
  const ok = passwordHash ? await bcryptCompare(password, passwordHash) : false;
  return json(request, 200, { ok });
}
