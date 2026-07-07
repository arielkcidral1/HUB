import { del } from "@vercel/blob";
import { sql } from "../_lib/db.js";
import { sendJson, applyCorsHeadersNode } from "../_lib/cors.js";
import { requireUserNode } from "../_lib/jwt.js";
import { isRh } from "../_lib/authz.js";

// @vercel/blob's server SDK (put/del) needs the Node.js runtime, not Edge.

export default async function handler(req, res) {
  if (req.method === "OPTIONS") { applyCorsHeadersNode(req, res); res.status(204).end(); return; }
  if (req.method !== "POST") return sendJson(req, res, 405, { error: "Metodo nao permitido." });

  const user = await requireUserNode(req, sql);
  if (!user || !isRh(user)) return sendJson(req, res, 403, { error: "Sem permissao." });

  const body = req.body || {};
  const url = String(body.url || "");
  if (!url) return sendJson(req, res, 400, { error: "Informe a url do arquivo." });

  try {
    await del(url);
    sendJson(req, res, 200, { ok: true });
  } catch (error) {
    sendJson(req, res, 400, { error: error.message || "Nao foi possivel remover o arquivo." });
  }
}
