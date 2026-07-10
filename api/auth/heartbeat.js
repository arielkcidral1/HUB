import { sql } from "../_lib/db.js";
import { json, corsHeaders } from "../_lib/cors.js";
import { requireUser } from "../_lib/jwt.js";

export const config = { runtime: "edge" };

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, 405, { error: "Metodo nao permitido." });

  const user = await requireUser(request, sql);
  if (!user) return json(request, 401, { error: "Nao autenticado." });

  // navigator.sendBeacon (usado ao fechar a aba) manda o corpo como texto/blob,
  // por isso o parse tolera tanto JSON quanto corpo vazio (heartbeat normal).
  let online = true;
  try {
    const body = await request.json();
    if (body && typeof body.online === "boolean") online = body.online;
  } catch {
    // corpo vazio = heartbeat normal (fica online)
  }

  await sql`update hub_users set last_seen = now(), is_online = ${online} where id = ${user.id}`;
  return json(request, 200, { ok: true });
}
