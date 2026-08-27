import pg from "pg";

const { Pool } = pg;

function firstValidDatabaseUrl(...values) {
  return values.find((value) => /^postgres(ql)?:\/\//i.test(String(value || "").trim())) || "";
}

const DATABASE_URL = firstValidDatabaseUrl(
  process.env.AZURE_POSTGRES_URL,
  process.env.POSTGRES_URL,
  process.env.DATABASE_URL
);

function getPoolMax() {
  const value = Number(process.env.POSTGRES_POOL_MAX || 1);
  return Number.isInteger(value) && value > 0 ? value : 1;
}

export function assertDatabaseUrl() {
  if (!DATABASE_URL) {
    const error = new Error("DATABASE_URL nao configurada no ambiente do deploy.");
    error.statusCode = 500;
    throw error;
  }
}

export const pool = DATABASE_URL
  ? (globalThis.__hubPostgresPool ||= new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: getPoolMax(),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
      allowExitOnIdle: true,
    }))
  : null;

export const TABLES = new Set([
  "hub_advertencias_suspensoes",
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
  if (typeof res.status === "function") {
    res.status(status);
  } else {
    res.statusCode = status;
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store");
  res.end(JSON.stringify(body));
}

export function getBody(req) {
  if (Buffer.isBuffer(req.body)) {
    const raw = req.body.toString("utf8");
    if (!raw) return Promise.resolve({});
    try {
      return Promise.resolve(JSON.parse(raw));
    } catch {
      return Promise.reject(Object.assign(new Error("JSON invalido."), { statusCode: 400 }));
    }
  }
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
