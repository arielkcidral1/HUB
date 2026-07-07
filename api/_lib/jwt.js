import { SignJWT, jwtVerify } from "jose";

function envValue(name) {
  return globalThis.process?.env?.[name] || "";
}

function secretKey() {
  const secret = envValue("JWT_SECRET");
  if (!secret) throw new Error("JWT_SECRET nao configurada.");
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secretKey());
}

export async function verifyAccessToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload;
  } catch {
    return null;
  }
}

export function randomOpaqueToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashToken(token) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const ACCESS_COOKIE = "hub_access";
const REFRESH_COOKIE = "hub_refresh";

export function parseCookies(request) {
  const header = request.headers.get("cookie") || "";
  const out = {};
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    out[trimmed.slice(0, idx)] = decodeURIComponent(trimmed.slice(idx + 1));
  }
  return out;
}

export function setAuthCookies(headers, { accessToken, refreshToken, accessMaxAge = 3600, refreshMaxAge = 60 * 60 * 24 * 30 }) {
  const common = "HttpOnly; Secure; SameSite=Lax; Path=/";
  if (accessToken !== undefined) {
    headers.append(
      "Set-Cookie",
      accessToken
        ? `${ACCESS_COOKIE}=${accessToken}; ${common}; Max-Age=${accessMaxAge}`
        : `${ACCESS_COOKIE}=; ${common}; Max-Age=0`
    );
  }
  if (refreshToken !== undefined) {
    headers.append(
      "Set-Cookie",
      refreshToken
        ? `${REFRESH_COOKIE}=${refreshToken}; ${common}; Max-Age=${refreshMaxAge}`
        : `${REFRESH_COOKIE}=; ${common}; Max-Age=0`
    );
  }
}

export function getAccessCookie(request) {
  return parseCookies(request)[ACCESS_COOKIE] || "";
}

export function getRefreshCookie(request) {
  return parseCookies(request)[REFRESH_COOKIE] || "";
}

export async function requireUser(request, sql) {
  const token = getAccessCookie(request);
  const payload = await verifyAccessToken(token);
  if (!payload?.sub) return null;
  const rows = await sql`select id, nome, email, cpf, cargo, foto_perfil from hub_users where id = ${payload.sub}`;
  return rows[0] || null;
}

// Variantes para funcoes no runtime Node.js (req/res classicos do Vercel,
// nao a Fetch API usada nas funcoes Edge acima).

export function parseCookiesNode(req) {
  const header = req.headers?.cookie || "";
  const out = {};
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    out[trimmed.slice(0, idx)] = decodeURIComponent(trimmed.slice(idx + 1));
  }
  return out;
}

export function getAccessCookieNode(req) {
  return parseCookiesNode(req)[ACCESS_COOKIE] || "";
}

export function getRefreshCookieNode(req) {
  return parseCookiesNode(req)[REFRESH_COOKIE] || "";
}

export function setAuthCookiesNode(res, { accessToken, refreshToken, accessMaxAge = 3600, refreshMaxAge = 60 * 60 * 24 * 30 }) {
  const common = "HttpOnly; Secure; SameSite=Lax; Path=/";
  const cookies = [];
  if (accessToken !== undefined) {
    cookies.push(
      accessToken
        ? `${ACCESS_COOKIE}=${accessToken}; ${common}; Max-Age=${accessMaxAge}`
        : `${ACCESS_COOKIE}=; ${common}; Max-Age=0`
    );
  }
  if (refreshToken !== undefined) {
    cookies.push(
      refreshToken
        ? `${REFRESH_COOKIE}=${refreshToken}; ${common}; Max-Age=${refreshMaxAge}`
        : `${REFRESH_COOKIE}=; ${common}; Max-Age=0`
    );
  }
  if (cookies.length) res.setHeader("Set-Cookie", cookies);
}

export async function requireUserNode(req, sql) {
  const token = getAccessCookieNode(req);
  const payload = await verifyAccessToken(token);
  if (!payload?.sub) return null;
  const rows = await sql`select id, nome, email, cpf, cargo, foto_perfil from hub_users where id = ${payload.sub}`;
  return rows[0] || null;
}
