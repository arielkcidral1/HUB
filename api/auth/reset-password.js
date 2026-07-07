import { hash as bcryptHash } from "bcryptjs";
import { sql } from "../_lib/db.js";
import { json, corsHeaders } from "../_lib/cors.js";

// bcryptjs precisa do runtime Node.js (nao roda de forma confiavel no Edge).

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, 405, { error: "Metodo nao permitido." });

  let body;
  try { body = await request.json(); } catch { return json(request, 400, { error: "Requisicao invalida." }); }
  const token = String(body.token || "");
  const newPassword = String(body.newPassword || "");
  if (!token || newPassword.length < 8) {
    return json(request, 400, { error: "A nova senha precisa ter ao menos 8 caracteres." });
  }

  const rows = await sql`
    select id from hub_users
    where password_reset_token = ${token} and password_reset_expires_at > now()
    limit 1
  `;
  const user = rows[0];
  if (!user) return json(request, 400, { error: "Link de redefinicao invalido ou expirado." });

  const passwordHash = await bcryptHash(newPassword, 12);
  await sql`
    update hub_users
    set password_hash = ${passwordHash}, password_reset_token = null, password_reset_expires_at = null
    where id = ${user.id}
  `;
  return json(request, 200, { ok: true });
}
