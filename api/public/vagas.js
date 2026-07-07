import { sql } from "../_lib/db.js";
import { json, corsHeaders } from "../_lib/cors.js";

export const config = { runtime: "edge" };

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "GET") return json(request, 405, { error: "Metodo nao permitido." });

  const rows = await sql`select * from hub_vagas where status = ${"Aberta"} order by created_at desc`;
  return json(request, 200, { data: rows });
}
