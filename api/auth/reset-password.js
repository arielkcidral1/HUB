import bcryptPkg from "bcryptjs";
const { hash: bcryptHash } = bcryptPkg;
import { sql } from "../_lib/db.js";
import { sendJson, applyCorsHeadersNode } from "../_lib/cors.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") { applyCorsHeadersNode(req, res); res.status(204).end(); return; }
  if (req.method !== "POST") return sendJson(req, res, 405, { error: "Metodo nao permitido." });

  const body = req.body || {};
  const token = String(body.token || "");
  const newPassword = String(body.newPassword || "");
  if (!token || newPassword.length < 8) {
    return sendJson(req, res, 400, { error: "A nova senha precisa ter ao menos 8 caracteres." });
  }

  const rows = await sql`
    select id from hub_users
    where password_reset_token = ${token} and password_reset_expires_at > now()
    limit 1
  `;
  const user = rows[0];
  if (!user) return sendJson(req, res, 400, { error: "Link de redefinicao invalido ou expirado." });

  const passwordHash = await bcryptHash(newPassword, 12);
  await sql`
    update hub_users
    set password_hash = ${passwordHash}, password_reset_token = null, password_reset_expires_at = null
    where id = ${user.id}
  `;
  sendJson(req, res, 200, { ok: true });
}
