import { sql } from "./_lib/db.js";
import { json, corsHeaders } from "./_lib/cors.js";
import { requireUser } from "./_lib/jwt.js";
import { isArielUser } from "./_lib/authz.js";

export const config = { runtime: "edge" };

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });

  const user = await requireUser(request, sql);
  if (!user) return json(request, 401, { error: "Nao autenticado." });

  if (request.method === "GET") {
    const rows = isArielUser(user)
      ? await sql`select * from hub_feedbacks order by created_at desc`
      : await sql`select * from hub_feedbacks where autor_email = ${user.email} order by created_at desc`;
    return json(request, 200, { data: rows });
  }

  if (request.method === "POST") {
    let body;
    try { body = await request.json(); } catch { return json(request, 400, { error: "Requisicao invalida." }); }
    const mensagem = String(body.mensagem || "").trim();
    if (!mensagem) return json(request, 400, { error: "Mensagem obrigatoria." });
    const rows = await sql`
      insert into hub_feedbacks (tipo, mensagem, autor_nome, autor_email, status, created_by)
      values (${body.tipo || null}, ${mensagem}, ${user.nome}, ${user.email}, ${"Novo"}, ${user.nome})
      returning *
    `;
    return json(request, 200, { data: rows[0] });
  }

  if (request.method === "DELETE") {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return json(request, 400, { error: "Informe o id." });
    const rows = isArielUser(user)
      ? await sql`delete from hub_feedbacks where id = ${id} returning id`
      : await sql`delete from hub_feedbacks where id = ${id} and autor_email = ${user.email} returning id`;
    if (!rows.length) return json(request, 404, { error: "Feedback nao encontrado." });
    return json(request, 200, { data: rows[0] });
  }

  return json(request, 405, { error: "Metodo nao permitido." });
}
