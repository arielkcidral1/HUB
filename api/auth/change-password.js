import bcryptPkg from "bcryptjs";
const { compare: bcryptCompare, hash: bcryptHash } = bcryptPkg;
import { sql } from "../_lib/db.js";
import { sendJson, applyCorsHeadersNode } from "../_lib/cors.js";
import { requireUserNode } from "../_lib/jwt.js";

// bcryptjs precisa do runtime Node.js (nao roda de forma confiavel no Edge).

export default async function handler(req, res) {
  if (req.method === "OPTIONS") { applyCorsHeadersNode(req, res); res.status(204).end(); return; }
  if (req.method !== "POST") return sendJson(req, res, 405, { error: "Metodo nao permitido." });

  const user = await requireUserNode(req, sql);
  if (!user) return sendJson(req, res, 401, { error: "Nao autenticado." });

  const body = req.body || {};
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");
  if (!currentPassword || newPassword.length < 8) {
    return sendJson(req, res, 400, { error: "A nova senha precisa ter ao menos 8 caracteres." });
  }

  const rows = await sql`select password_hash from hub_users where id = ${user.id}`;
  const passwordHash = rows[0]?.password_hash;
  const currentOk = passwordHash ? await bcryptCompare(currentPassword, passwordHash) : false;
  if (!currentOk) return sendJson(req, res, 401, { error: "Senha atual incorreta." });

  const newHash = await bcryptHash(newPassword, 12);
  await sql`update hub_users set password_hash = ${newHash} where id = ${user.id}`;
  sendJson(req, res, 200, { ok: true });
}
