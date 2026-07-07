import { sql } from "../_lib/db.js";
import { json, corsHeaders } from "../_lib/cors.js";
import { getRefreshCookie, hashToken, setAuthCookies } from "../_lib/jwt.js";

export const config = { runtime: "edge" };

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, 405, { error: "Metodo nao permitido." });

  const refreshToken = getRefreshCookie(request);
  if (refreshToken) {
    const refreshTokenHash = await hashToken(refreshToken);
    await sql`update hub_sessions set revoked_at = now() where refresh_token_hash = ${refreshTokenHash} and revoked_at is null`;
  }

  const headers = new Headers(corsHeaders(request));
  headers.set("Content-Type", "application/json");
  setAuthCookies(headers, { accessToken: null, refreshToken: null });
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
