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
  return {
    id: row.id,
    email: row.email || "",
    user_metadata: { nome: row.nome || "", cargo: row.cargo || "" },
    app_metadata: { cargo: row.cargo || "" },
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Metodo nao permitido." });
    assertDatabaseUrl();
    const body = await getBody(req);
    const action = body.action || "login";

    if (action === "logout") return json(res, 200, { ok: true });
    if (action === "session") return json(res, 200, { session: null });

    const user = await findUser(body.identifier || body.email || body.cpf || body.nome);
    if (!user || !isPasswordValid(body.password || body.senha, user.password_hash)) {
      return json(res, 401, { error: "Credenciais invalidas." });
    }

    return json(res, 200, {
      user: publicUser(user),
      session: {
        user: publicUser(user),
        access_token: crypto.randomUUID(),
        refresh_token: crypto.randomUUID(),
      },
    });
  } catch (error) {
    return json(res, 500, { error: error.message || "Erro de autenticacao." });
  }
}
