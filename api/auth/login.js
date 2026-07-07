import { compare as bcryptCompare } from "bcryptjs";
import { sql } from "../_lib/db.js";
import { json, corsHeaders } from "../_lib/cors.js";
import { normalizeCpf, isValidCpf, formatCpf } from "../_lib/cpf.js";
import { signAccessToken, randomOpaqueToken, hashToken, setAuthCookies } from "../_lib/jwt.js";

// bcryptjs precisa do runtime Node.js (nao roda de forma confiavel no Edge).

function envValue(name) {
  return globalThis.process?.env?.[name] || "";
}

function getClientIdentifier(req) {
  return req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    `ua:${req.headers.get("user-agent") || "unknown"}`;
}

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, 405, { error: "Metodo nao permitido." });

  let body;
  try { body = await request.json(); } catch { return json(request, 400, { error: "Credenciais invalidas." }); }

  const cpf = normalizeCpf(body.cpf);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if ((!isValidCpf(cpf) && !isEmail) || !password) return json(request, 400, { error: "Credenciais invalidas." });

  const ipHashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${envValue("RATE_LIMIT_SALT") || "hub"}:${getClientIdentifier(request)}`)
  );
  const ipHash = Array.from(new Uint8Array(ipHashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const requestId = crypto.randomUUID();

  const [{ hub_reserve_public_rate_limit: allowed }] = await sql`
    select app_private.hub_reserve_public_rate_limit(${"login"}, ${ipHash}, ${600}, ${5}, ${requestId}) as hub_reserve_public_rate_limit
  `;
  if (!allowed) return json(request, 429, { error: "Muitas tentativas. Tente novamente mais tarde." });

  let lookupEmail = email;
  if (!isEmail) {
    const formattedCpf = formatCpf(cpf);
    const rows = await sql`select email, cpf from hub_users where cpf = ${cpf} or cpf = ${formattedCpf} limit 1`;
    lookupEmail = rows[0]?.email || "";
  }
  if (!lookupEmail) return json(request, 401, { error: "Credenciais invalidas." });

  const users = await sql`select id, nome, email, cpf, cargo, foto_perfil, password_hash from hub_users where lower(email) = lower(${lookupEmail}) limit 1`;
  const user = users[0];
  if (!user?.password_hash) return json(request, 401, { error: "Credenciais invalidas." });

  const passwordOk = await bcryptCompare(password, user.password_hash);
  if (!passwordOk) return json(request, 401, { error: "Credenciais invalidas." });

  const accessToken = await signAccessToken({ sub: user.id, email: user.email, cargo: user.cargo });
  const refreshToken = randomOpaqueToken();
  const refreshTokenHash = await hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await sql`insert into hub_sessions (user_id, refresh_token_hash, expires_at) values (${user.id}, ${refreshTokenHash}, ${expiresAt.toISOString()})`;

  const headers = new Headers(corsHeaders(request));
  headers.set("Content-Type", "application/json");
  setAuthCookies(headers, { accessToken, refreshToken });

  const { password_hash, ...profile } = user;
  return new Response(JSON.stringify({ user: profile }), { status: 200, headers });
}
