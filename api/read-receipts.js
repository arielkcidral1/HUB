import { sql } from "./_lib/db.js";
import { json, corsHeaders } from "./_lib/cors.js";
import { requireUser } from "./_lib/jwt.js";

export const config = { runtime: "edge" };

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });

  const user = await requireUser(request, sql);
  if (!user) return json(request, 401, { error: "Nao autenticado." });

  if (request.method === "GET") {
    const rows = await sql`select item_type, item_id from hub_read_receipts where user_id = ${user.id}`;
    return json(request, 200, { data: rows });
  }

  if (request.method === "POST") {
    let body;
    try { body = await request.json(); } catch { return json(request, 400, { error: "Requisicao invalida." }); }
    const rows = Array.isArray(body.rows) ? body.rows : [];
    for (const row of rows) {
      const itemType = String(row.item_type || "");
      const itemId = String(row.item_id || "");
      if (!["message", "notification"].includes(itemType) || !itemId) continue;
      await sql`
        insert into hub_read_receipts (user_id, item_type, item_id)
        values (${user.id}, ${itemType}, ${itemId})
        on conflict (user_id, item_type, item_id) do update set read_at = now()
      `;
    }
    return json(request, 200, { ok: true });
  }

  return json(request, 405, { error: "Metodo nao permitido." });
}
