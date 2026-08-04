import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { assertDatabaseUrl, getBody, json, pool } from "./db.js";

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
         or regexp_replace(coalesce(cpf, ''), '\\D', '', 'g') = $2
         or lower(coalesce(nome, '')) = lower($3)
      limit 1`,
    [email, cpf, normalized]
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

function encodeCookiePayload(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeCookiePayload(value) {
  try {
    return JSON.parse(Buffer.from(String(value || ""), "base64url").toString("utf8"));
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
    return json(res, error.statusCode || 500, { error: error.message || "Erro de autenticacao." });
  }
}
