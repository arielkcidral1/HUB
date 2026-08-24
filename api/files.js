import { assertDatabaseUrl, getBody, json, pool, safeErrorResponse } from "./db.js";
import { validateAuthSession } from "./auth.js";
import { checkPublicRateLimit } from "./rate-limit.js";

export const config = { api: { bodyParser: { sizeLimit: "15mb" } } };

const PUBLIC_UPLOAD_PREFIXES = ["candidaturas/", "atestados/", "contratados/"];

function safeName(name) {
  return String(name || "arquivo").replace(/[^a-z0-9_.-]/gi, "-");
}

function isValidStoragePath(path) {
  const value = String(path || "");
  if (!value || value.length > 512) return false;
  if (/^(data:|https?:)/i.test(value)) return false;
  return /^[a-z0-9][a-z0-9_.\/-]*$/i.test(value);
}

function isPublicUploadPath(path) {
  return PUBLIC_UPLOAD_PREFIXES.some((prefix) => path.startsWith(prefix));
}

async function ensureFilesTable() {
  await pool.query(`
    create table if not exists public.hub_files (
      path text primary key,
      name text,
      size bigint default 0,
      type text default 'application/octet-stream',
      data_url text not null,
      created_at timestamptz default now()
    )
  `);
}

function dataUrlToBuffer(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;,]+)?(;base64)?,(.*)$/);
  if (!match) return Buffer.from(String(dataUrl || ""), "utf8");
  const payload = match[3] || "";
  return match[2] ? Buffer.from(payload, "base64") : Buffer.from(decodeURIComponent(payload), "utf8");
}

export default async function handler(req, res) {
  try {
    assertDatabaseUrl();
    await ensureFilesTable();

    if (req.method === "GET") {
      const session = await validateAuthSession(req);
      if (!session?.user?.id) return json(res, 401, { error: "Sessao invalida ou expirada." });

      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const path = url.searchParams.get("path") || "";
      if (!path) return json(res, 400, { error: "Arquivo nao informado." });

      const result = await pool.query(
        "select name, type, data_url from public.hub_files where path = $1 limit 1",
        [path]
      );
      const file = result.rows[0];
      if (!file) return json(res, 404, { error: "Arquivo nao encontrado." });

      const buffer = dataUrlToBuffer(file.data_url);
      res.setHeader("Content-Type", file.type || "application/octet-stream");
      res.setHeader("Cache-Control", "private, max-age=300");
      if (file.name) res.setHeader("Content-Disposition", `inline; filename="${safeName(file.name)}"`);
      res.end(buffer);
      return;
    }

    if (req.method !== "POST") return json(res, 405, { error: "Metodo nao permitido." });
    const body = await getBody(req);
    const name = safeName(body.name);
    const path = String(body.path || "");
    const dataUrl = String(body.dataUrl || "");

    if (!path || !dataUrl) return json(res, 400, { error: "Arquivo invalido." });
    if (!isValidStoragePath(path)) return json(res, 400, { error: "Caminho do arquivo invalido." });

    const session = await validateAuthSession(req);
    const isAuthenticated = Boolean(session?.user?.id);

    if (!isAuthenticated) {
      if (!isPublicUploadPath(path)) return json(res, 401, { error: "Sessao invalida ou expirada." });
      const allowed = await checkPublicRateLimit(req, "file_upload");
      if (!allowed) return json(res, 429, { error: "Muitos envios em pouco tempo. Tente novamente mais tarde." });
    }

    const conflictClause = isAuthenticated
      ? `on conflict (path) do update set
         name = excluded.name,
         size = excluded.size,
         type = excluded.type,
         data_url = excluded.data_url`
      : "on conflict (path) do nothing";

    const result = await pool.query(
      `insert into public.hub_files (path, name, size, type, data_url)
       values ($1, $2, $3, $4, $5)
       ${conflictClause}
       returning path`,
      [path, name, body.size || 0, body.type || "application/octet-stream", dataUrl]
    );

    if (!isAuthenticated && !result.rows.length) {
      return json(res, 409, { error: "Ja existe um arquivo nesse caminho." });
    }

    return json(res, 200, {
      path,
      name,
      size: body.size || 0,
      type: body.type || "application/octet-stream",
    });
  } catch (error) {
    return safeErrorResponse(res, error, "Erro ao processar arquivo.");
  }
}
