import { assertDatabaseUrl, getBody, json, pool } from "./db.js";

export const config = { api: { bodyParser: { sizeLimit: "15mb" } } };

function safeName(name) {
  return String(name || "arquivo").replace(/[^a-z0-9_.-]/gi, "-");
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
    const path = String(body.path || body.dataUrl || "");
    const dataUrl = String(body.dataUrl || "");

    if (!path || !dataUrl) return json(res, 400, { error: "Arquivo invalido." });

    await pool.query(
      `insert into public.hub_files (path, name, size, type, data_url)
       values ($1, $2, $3, $4, $5)
       on conflict (path) do update set
         name = excluded.name,
         size = excluded.size,
         type = excluded.type,
         data_url = excluded.data_url`,
      [path, name, body.size || 0, body.type || "application/octet-stream", dataUrl]
    );

    return json(res, 200, {
      path,
      name,
      size: body.size || 0,
      type: body.type || "application/octet-stream",
    });
  } catch (error) {
    return json(res, error.statusCode || 500, { error: error.message || "Erro ao processar arquivo." });
  }
}
