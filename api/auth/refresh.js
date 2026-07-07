import { sql } from "../_lib/db.js";
import { json, corsHeaders } from "../_lib/cors.js";
import { getRefreshCookie, hashToken, randomOpaqueToken, signAccessToken, setAuthCookies } from "../_lib/jwt.js";

export const config = { runtime: "edge" };

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, 405, { error: "Metodo nao permitido." });

  const refreshToken = getRefreshCookie(request);
  if (!refreshToken) return json(request, 401, { error: "Sessao expirada." });

  const refreshTokenHash = await hashToken(refreshToken);
  const sessions = await sql`
    select s.id, s.user_id, s.expires_at, s.revoked_at, u.email, u.cargo
    from hub_sessions s
    join hub_users u on u.id = s.user_id
    where s.refresh_token_hash = ${refreshTokenHash}
    limit 1
  `;
  const session = sessions[0];
  if (!session || session.revoked_at || new Date(session.expires_at) < new Date()) {
    return json(request, 401, { error: "Sessao expirada." });
  }

  const newRefreshToken = randomOpaqueToken();
  const newRefreshTokenHash = await hashToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await sql`update hub_sessions set revoked_at = now() where id = ${session.id}`;
  await sql`insert into hub_sessions (user_id, refresh_token_hash, expires_at) values (${session.user_id}, ${newRefreshTokenHash}, ${expiresAt.toISOString()})`;

  const accessToken = await signAccessToken({ sub: session.user_id, email: session.email, cargo: session.cargo });
  const headers = new Headers(corsHeaders(request));
  headers.set("Content-Type", "application/json");
  setAuthCookies(headers, { accessToken, refreshToken: newRefreshToken });
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
