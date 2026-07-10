import { sql } from "../_lib/db.js";
import { json, corsHeaders } from "../_lib/cors.js";
import { randomOpaqueToken } from "../_lib/jwt.js";

export const config = { runtime: "edge" };

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, 405, { error: "Metodo nao permitido." });

  let body;
  try { body = await request.json(); } catch { return json(request, 400, { error: "Requisicao invalida." }); }
  const email = String(body.email || "").trim().toLowerCase();
  if (!email) return json(request, 400, { error: "Informe o e-mail." });

  const token = randomOpaqueToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
  await sql`
    update hub_users
    set password_reset_token = ${token}, password_reset_expires_at = ${expiresAt.toISOString()}
    where lower(email) = ${email}
  `;

  return json(request, 200, { ok: true });
}
