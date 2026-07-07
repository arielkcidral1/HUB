import { sql } from "../_lib/db.js";
import { json, corsHeaders } from "../_lib/cors.js";
import { requireUser } from "../_lib/jwt.js";

export const config = { runtime: "edge" };

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "PATCH") return json(request, 405, { error: "Metodo nao permitido." });

  const user = await requireUser(request, sql);
  if (!user) return json(request, 401, { error: "Nao autenticado." });

  let body;
  try { body = await request.json(); } catch { return json(request, 400, { error: "Requisicao invalida." }); }
  const nome = body.nome !== undefined ? String(body.nome || "").trim() : undefined;
  const fotoPerfil = body.foto_perfil !== undefined ? String(body.foto_perfil || "") : undefined;
  if (nome === undefined && fotoPerfil === undefined) return json(request, 400, { error: "Nenhum campo para atualizar." });

  const rows = await sql`
    update hub_users
    set nome = coalesce(${nome ?? null}, nome), foto_perfil = coalesce(${fotoPerfil ?? null}, foto_perfil)
    where id = ${user.id}
    returning id, nome, email, cpf, cargo, foto_perfil
  `;
  return json(request, 200, { data: rows[0] });
}
