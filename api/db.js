import pg from "pg";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

if (!DATABASE_URL) {
  console.warn("DATABASE_URL nao configurada para o PostgreSQL da Microsoft.");
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

export const TABLES = new Set([
  "hub_atestados",
  "hub_candidaturas",
  "hub_chamados",
  "hub_chat_messages",
  "hub_denuncias",
  "hub_documentos",
  "hub_documentos_contratados",
  "hub_eventos",
  "hub_feedbacks",
  "hub_malotes",
  "hub_quadros",
  "hub_read_receipts",
  "hub_sessions",
  "hub_unit_test_runs",
  "hub_users",
  "hub_vagas",
  "hub_vt_registros",
]);

export function assertTable(table) {
  if (!TABLES.has(table)) {
    const error = new Error("Tabela nao permitida.");
    error.statusCode = 400;
    throw error;
  }
}

export function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export function getBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  if (typeof req.body === "string") {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch {
      return Promise.reject(Object.assign(new Error("JSON invalido."), { statusCode: 400 }));
    }
  }

  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 30 * 1024 * 1024) {
        reject(Object.assign(new Error("Payload muito grande."), { statusCode: 413 }));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(Object.assign(new Error("JSON invalido."), { statusCode: 400 }));
      }
    });
    req.on("error", reject);
  });
}

export function quoteIdent(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}
