import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { assertDatabaseUrl, getBody, json, pool, SESSION_SECRET, safeErrorResponse } from "./db.js";
import { checkPublicRateLimit } from "./rate-limit.js";

function normalize(value) {
  return String(value || "").trim();
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

async function findUser(identifier) {
  const normalized = normalize(identifier);
  const cpf = onlyDigits(normalized);
  const email = normalized.toLowerCase();
  const result = await pool.query(
    `select id, nome, email, cpf, cargo, foto_perfil, password_hash, created_at
       from public.hub_users
      where lower(coalesce(email, '')) = lower($1)
         or (regexp_replace(coalesce(cpf, ''), '\\D', '', 'g') <> '' and regexp_replace(coalesce(cpf, ''), '\\D', '', 'g') = $2)
      limit 1`,
    [email, cpf]
  );
  return result.rows[0] || null;
}

function isPasswordValid(password, hash) {
  const value = normalize(password);
  const stored = normalize(hash);
  if (!value || !stored) return false;
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
    return bcrypt.compareSync(value, stored);
  }
  if (stored === value) return true;
  const sha256 = crypto.createHash("sha256").update(value).digest("hex");
  return stored === sha256;
}

function publicUser(row) {
  const databaseName = normalize(row.nome);
  const genericName = ["usuario", "voce", "persisted-user"].includes(databaseName.toLowerCase());
  const displayName = databaseName && !genericName
    ? databaseName
    : normalize(row.email).split("@")[0] || "Usuario";
  return {
    id: row.id,
    email: row.email || "",
    user_metadata: { nome: displayName, cargo: row.cargo || "" },
    app_metadata: { cargo: row.cargo || "" },
  };
}

// O cookie carrega o payload em base64 + uma assinatura HMAC, para que um
// cliente nao possa forjar sessao (ex: id/cargo/session_version de outro
// usuario) sem conhecer o SESSION_SECRET do servidor.
function signPayload(payloadB64) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(payloadB64).digest("base64url");
}

function encodeCookiePayload(value) {
  const payloadB64 = Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
  return `${payloadB64}.${signPayload(payloadB64)}`;
}

function decodeCookiePayload(value) {
  if (!SESSION_SECRET) return null;
  const raw = String(value || "");
  const separatorIndex = raw.lastIndexOf(".");
  if (separatorIndex < 1) return null;
  const payloadB64 = raw.slice(0, separatorIndex);
  const signature = raw.slice(separatorIndex + 1);
  const expectedSignature = signPayload(payloadB64);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function getCookie(req, name) {
  const cookies = String(req.headers.cookie || "").split(";");
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

async function ensureSessionVersionColumn() {
  await pool.query(`
    alter table public.hub_users
      add column if not exists session_version bigint not null default 0
  `);
}

export async function validateAuthSession(req) {
  const session = decodeCookiePayload(getCookie(req, "hub_auth_session"));
  const userId = session?.user?.id;
  if (!userId || session.session_version == null) return null;

  await ensureSessionVersionColumn();
  const result = await pool.query(
    `select session_version from public.hub_users where id = $1 limit 1`,
    [userId]
  );
  const currentVersion = result.rows[0]?.session_version;
  return currentVersion != null && String(currentVersion) === String(session.session_version)
    ? session
    : null;
}

function setAuthCookie(res, session) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `hub_auth_session=${encodeCookiePayload(session)}; Path=/; Max-Age=2592000; SameSite=Lax; HttpOnly${secure}`);
}

function clearAuthCookie(res) {
  res.setHeader("Set-Cookie", "hub_auth_session=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly");
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Metodo nao permitido." });
    assertDatabaseUrl();
    const body = await getBody(req);
    const action = body.action || "login";
    await ensureSessionVersionColumn();

    if (action === "logout") {
      clearAuthCookie(res);
      return json(res, 200, { ok: true });
    }
    if (action === "session") {
      const session = await validateAuthSession(req);
      return json(res, 200, { session: session?.user ? session : null });
    }

    // Combina IP + identificador tentado: limita forca bruta contra uma
    // conta especifica sem travar o escritorio inteiro (mesmo IP) so porque
    // uma pessoa errou a propria senha varias vezes.
    const attemptedIdentifier = normalize(body.identifier || body.email || body.cpf || body.nome).toLowerCase();
    const allowedAttempt = await checkPublicRateLimit(req, "login_attempt", attemptedIdentifier);
    if (!allowedAttempt) return json(res, 429, { error: "Muitas tentativas de login. Aguarde alguns minutos." });

    const user = await findUser(body.identifier || body.email || body.cpf || body.nome);
    if (!user || !isPasswordValid(body.password || body.senha, user.password_hash)) {
      return json(res, 401, { error: "Credenciais invalidas." });
    }

    const versionedUser = (await pool.query(
      `update public.hub_users
          set session_version = coalesce(session_version, 0) + 1
        where id = $1
      returning id, nome, email, cpf, cargo, foto_perfil, created_at, session_version`,
      [user.id]
    )).rows[0] || user;
    const session = {
      user: publicUser(versionedUser),
      session_version: String(versionedUser.session_version || 0),
      access_token: crypto.randomUUID(),
      refresh_token: crypto.randomUUID(),
    };
    setAuthCookie(res, session);

    return json(res, 200, {
      user: publicUser(user),
      session,
    });
  } catch (error) {
    return safeErrorResponse(res, error, "Erro de autenticacao.");
  }
}
