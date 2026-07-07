import { del } from "@vercel/blob";
import { sql } from "../_lib/db.js";
import { json, corsHeaders } from "../_lib/cors.js";
import { requireUser } from "../_lib/jwt.js";
import { isRh } from "../_lib/authz.js";

// @vercel/blob's server SDK (put/del) needs the Node.js runtime, not Edge.

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, 405, { error: "Metodo nao permitido." });

  const user = await requireUser(request, sql);
  if (!user || !isRh(user)) return json(request, 403, { error: "Sem permissao." });

  let body;
  try { body = await request.json(); } catch { return json(request, 400, { error: "Requisicao invalida." }); }
  const url = String(body.url || "");
  if (!url) return json(request, 400, { error: "Informe a url do arquivo." });

  try {
    await del(url);
    return json(request, 200, { ok: true });
  } catch (error) {
    return json(request, 400, { error: error.message || "Nao foi possivel remover o arquivo." });
  }
}
