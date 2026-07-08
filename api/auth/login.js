import bcryptPkg from "bcryptjs";
const { compare: bcryptCompare } = bcryptPkg;
import { sql } from "../_lib/db.js";
import { sendJson, applyCorsHeadersNode } from "../_lib/cors.js";
import { normalizeCpf, isValidCpf, formatCpf } from "../_lib/cpf.js";
import { signAccessToken, randomOpaqueToken, hashToken, setAuthCookiesNode } from "../_lib/jwt.js";

// bcryptjs precisa do runtime Node.js (nao roda de forma confiavel no Edge),
// por isso este arquivo usa a assinatura classica (req, res) do Vercel em
// vez da Fetch API usada nas demais funcoes Edge.

function envValue(name) {
  return globalThis.process?.env?.[name] || "";
}

function getClientIdentifier(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const firstForwarded = forwardedFor ? String(forwardedFor).split(",")[0].trim() : "";
  return req.headers["cf-connecting-ip"] ||
    firstForwarded ||
    req.headers["x-real-ip"] ||
    `ua:${req.headers["user-agent"] || "unknown"}`;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") { applyCorsHeadersNode(req, res); res.status(204).end(); return; }
  if (req.method !== "POST") return sendJson(req, res, 405, { error: "Metodo nao permitido." });

  const body = req.body || {};
  const cpf = normalizeCpf(body.cpf);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if ((!isValidCpf(cpf) && !isEmail) || !password) return sendJson(req, res, 400, { error: "Credenciais invalidas." });

  const ipHashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${envValue("RATE_LIMIT_SALT") || "hub"}:${getClientIdentifier(req)}`)
  );
  const ipHash = Array.from(new Uint8Array(ipHashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const requestId = crypto.randomUUID();

  const [{ hub_reserve_public_rate_limit: allowed }] = await sql`
    select app_private.hub_reserve_public_rate_limit(${"login"}, ${ipHash}, ${600}, ${5}, ${requestId}) as hub_reserve_public_rate_limit
  `;
  if (!allowed) return sendJson(req, res, 429, { error: "Muitas tentativas. Tente novamente mais tarde." });

  let lookupEmail = email;
  if (!isEmail) {
    const formattedCpf = formatCpf(cpf);
    const rows = await sql`select email, cpf from hub_users where cpf = ${cpf} or cpf = ${formattedCpf} limit 1`;
    lookupEmail = rows[0]?.email || "";
  }
  if (!lookupEmail) return sendJson(req, res, 401, { error: "Credenciais invalidas." });

  const users = await sql`select id, nome, email, cpf, cargo, foto_perfil, password_hash from hub_users where lower(email) = lower(${lookupEmail}) limit 1`;
  const user = users[0];
  if (!user?.password_hash) return sendJson(req, res, 401, { error: "Credenciais invalidas." });

  const passwordOk = await bcryptCompare(password, user.password_hash);
  if (!passwordOk) return sendJson(req, res, 401, { error: "Credenciais invalidas." });

  const accessToken = await signAccessToken({ sub: user.id, email: user.email, cargo: user.cargo });
  const refreshToken = randomOpaqueToken();
  const refreshTokenHash = await hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await sql`insert into hub_sessions (user_id, refresh_token_hash, expires_at) values (${user.id}, ${refreshTokenHash}, ${expiresAt.toISOString()})`;

  setAuthCookiesNode(res, { accessToken, refreshToken });
  const { password_hash, ...profile } = user;
  sendJson(req, res, 200, { user: profile });
}
