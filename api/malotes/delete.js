import bcryptPkg from "bcryptjs";
const { compare: bcryptCompare } = bcryptPkg;
import { sql } from "../_lib/db.js";
import { sendJson, applyCorsHeadersNode } from "../_lib/cors.js";
import { requireUserNode } from "../_lib/jwt.js";
import { isRh } from "../_lib/authz.js";

// bcryptjs precisa do runtime Node.js (nao roda de forma confiavel no Edge).

export default async function handler(req, res) {
  if (req.method === "OPTIONS") { applyCorsHeadersNode(req, res); res.status(204).end(); return; }
  if (req.method !== "POST") return sendJson(req, res, 405, { error: "Metodo nao permitido." });

  const user = await requireUserNode(req, sql);
  if (!user) return sendJson(req, res, 401, { error: "Nao autenticado." });
  if (!isRh(user)) return sendJson(req, res, 403, { error: "Apenas RH pode excluir malotes." });

  const body = req.body || {};
  const password = String(body.password || body.actionPassword || "");
  if (!password) return sendJson(req, res, 400, { error: "Informe a senha de acao." });

  const rows = await sql`select password_hash from hub_action_passwords where action = ${"delete_malote"}`;
  const passwordHash = rows[0]?.password_hash;
  const passwordOk = passwordHash ? await bcryptCompare(password, passwordHash) : false;
  if (!passwordOk) return sendJson(req, res, 403, { error: "Senha de autorizacao invalida." });

  if (body.validateOnly) return sendJson(req, res, 200, { valid: true });

  const id = String(body.id || "");
  if (!id) return sendJson(req, res, 400, { error: "Informe o id do malote." });
  const deleted = await sql`delete from hub_malotes where id = ${id} returning id`;
  if (!deleted.length) return sendJson(req, res, 404, { error: "Malote nao encontrado." });
  sendJson(req, res, 200, { data: deleted[0] });
}
