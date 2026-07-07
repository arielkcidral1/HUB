import bcryptPkg from "bcryptjs";
const { compare: bcryptCompare, hash: bcryptHash } = bcryptPkg;
import { sql } from "../_lib/db.js";
import { json, corsHeaders } from "../_lib/cors.js";
import { requireUser } from "../_lib/jwt.js";

// bcryptjs precisa do runtime Node.js (nao roda de forma confiavel no Edge).

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, 405, { error: "Metodo nao permitido." });

  const user = await requireUser(request, sql);
  if (!user) return json(request, 401, { error: "Nao autenticado." });

  let body;
  try { body = await request.json(); } catch { return json(request, 400, { error: "Requisicao invalida." }); }
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");
  if (!currentPassword || newPassword.length < 8) {
    return json(request, 400, { error: "A nova senha precisa ter ao menos 8 caracteres." });
  }

  const rows = await sql`select password_hash from hub_users where id = ${user.id}`;
  const passwordHash = rows[0]?.password_hash;
  const currentOk = passwordHash ? await bcryptCompare(currentPassword, passwordHash) : false;
  if (!currentOk) return json(request, 401, { error: "Senha atual incorreta." });

  const newHash = await bcryptHash(newPassword, 12);
  await sql`update hub_users set password_hash = ${newHash} where id = ${user.id}`;
  return json(request, 200, { ok: true });
}
