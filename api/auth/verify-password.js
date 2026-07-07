import bcryptPkg from "bcryptjs";
const { compare: bcryptCompare } = bcryptPkg;
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
  const password = String(body.password || "");
  if (!password) return sendJson(req, res, 400, { ok: false });

  const rows = await sql`select password_hash from hub_users where id = ${user.id}`;
  const passwordHash = rows[0]?.password_hash;
  const ok = passwordHash ? await bcryptCompare(password, passwordHash) : false;
  sendJson(req, res, 200, { ok });
}
