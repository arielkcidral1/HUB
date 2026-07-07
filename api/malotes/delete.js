import { compare as bcryptCompare } from "bcryptjs";
import { sql } from "../_lib/db.js";
import { json, corsHeaders } from "../_lib/cors.js";
import { requireUser } from "../_lib/jwt.js";
import { isRh } from "../_lib/authz.js";

// bcryptjs precisa do runtime Node.js (nao roda de forma confiavel no Edge).

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, 405, { error: "Metodo nao permitido." });

  const user = await requireUser(request, sql);
  if (!user) return json(request, 401, { error: "Nao autenticado." });
  if (!isRh(user)) return json(request, 403, { error: "Apenas RH pode excluir malotes." });

  let body;
  try { body = await request.json(); } catch { return json(request, 400, { error: "Requisicao invalida." }); }
  const password = String(body.password || body.actionPassword || "");
  if (!password) return json(request, 400, { error: "Informe a senha de acao." });

  const rows = await sql`select password_hash from hub_action_passwords where action = ${"delete_malote"}`;
  const passwordHash = rows[0]?.password_hash;
  const passwordOk = passwordHash ? await bcryptCompare(password, passwordHash) : false;
  if (!passwordOk) return json(request, 403, { error: "Senha de autorizacao invalida." });

  if (body.validateOnly) return json(request, 200, { valid: true });

  const id = String(body.id || "");
  if (!id) return json(request, 400, { error: "Informe o id do malote." });
  const deleted = await sql`delete from hub_malotes where id = ${id} returning id`;
  if (!deleted.length) return json(request, 404, { error: "Malote nao encontrado." });
  return json(request, 200, { data: deleted[0] });
}
