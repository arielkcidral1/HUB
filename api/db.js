import crypto from "node:crypto";
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

// Preferir SESSION_SECRET quando configurado. Sem ele, deriva uma chave
// estavel a partir da DATABASE_URL (ja secreta e unica por ambiente) para o
// cookie de sessao continuar assinado mesmo sem uma variavel nova no deploy.
export const SESSION_SECRET = process.env.SESSION_SECRET
  || (DATABASE_URL ? crypto.createHash("sha256").update(`hub-session:${DATABASE_URL}`).digest("hex") : "");

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

// Tabelas que um visitante sem sessao pode LER via /api/records (GET).
// So a vaga em si; curriculos, denuncias etc. nunca ficam legiveis sem login.
export const PUBLIC_READ_TABLES = new Set(["hub_vagas"]);

function text(value) {
  return String(value ?? "").trim();
}

// Caminho de arquivo ja enviado antes para /api/files (ex: candidaturas/<uuid>/nome.pdf).
function isSafeFilePath(value) {
  const path = text(value);
  return Boolean(path) && path.length <= 512 && /^[a-z0-9][a-z0-9_./-]*$/i.test(path) && !path.includes("..");
}

// Tabelas que um visitante sem sessao pode INSERIR via /api/records (POST).
// Cada funcao recebe a linha crua enviada pelo cliente e devolve so os
// campos permitidos, com valores sensiveis (status, created_by) fixados no
// servidor - o cliente nunca decide isso sozinho.
export const PUBLIC_INSERT_TABLES = new Map([
  ["hub_denuncias", (row) => ({
    identificacao: "Anonimo",
    categoria: "Denuncia anonima",
    descricao: text(row.descricao).slice(0, 4000),
    status: "Aberta",
  })],
  ["hub_feedbacks", (row) => ({
    tipo: text(row.tipo) || "Sugestao",
    mensagem: text(row.mensagem).slice(0, 4000),
    autor_nome: text(row.autor_nome).slice(0, 160) || null,
    autor_email: text(row.autor_email).slice(0, 160) || null,
    status: "Novo",
    created_by: text(row.autor_nome).slice(0, 160) || "Formulario publico",
  })],
  ["hub_chamados", (row) => ({
    solicitante: text(row.solicitante).slice(0, 160),
    unidade: text(row.unidade).slice(0, 120),
    setor: text(row.setor).slice(0, 120),
    epis: text(row.epis).slice(0, 4000),
    observacoes: text(row.observacoes).slice(0, 4000),
    status: "Aberto",
    created_by: "Publico",
  })],
  ["hub_candidaturas", (row) => {
    if (!isSafeFilePath(row.curriculo_url)) {
      const error = new Error("Curriculo invalido.");
      error.statusCode = 400;
      throw error;
    }
    return {
      vaga_id: text(row.vaga_id),
      nome: text(row.nome).slice(0, 160),
      telefone: text(row.telefone).slice(0, 30),
      cpf: text(row.cpf).slice(0, 20),
      curriculo_url: text(row.curriculo_url),
      created_by: "Publico",
    };
  }],
  ["hub_atestados", (row) => {
    if (!isSafeFilePath(row.arquivo_url)) {
      const error = new Error("Arquivo invalido.");
      error.statusCode = 400;
      throw error;
    }
    return {
      nome: text(row.nome).slice(0, 160),
      cpf: text(row.cpf).slice(0, 20),
      telefone: text(row.telefone).slice(0, 30),
      unidade: text(row.unidade).slice(0, 120),
      arquivo_nome: text(row.arquivo_nome).slice(0, 200) || "Atestado",
      arquivo_tamanho: Number(row.arquivo_tamanho) || 0,
      arquivo_tipo: text(row.arquivo_tipo).slice(0, 120) || "application/octet-stream",
      arquivo_url: text(row.arquivo_url),
      status: "Recebido",
      created_by: "Publico",
    };
  }],
]);

// Colunas que nunca devem sair de /api/records, autenticado ou nao.
export const SENSITIVE_COLUMNS = new Map([
  ["hub_users", new Set(["password_hash"])],
]);

export function stripSensitiveColumns(table, rows) {
  const hidden = SENSITIVE_COLUMNS.get(table);
  if (!hidden || !hidden.size) return rows;
  return rows.map((row) => {
    const clean = { ...row };
    hidden.forEach((column) => delete clean[column]);
    return clean;
  });
}

export function json(res, status, body) {
  if (typeof res.status === "function") {
    res.status(status);
  } else {
    res.statusCode = status;
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
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

// So devolve error.message pro cliente quando fomos NOS que jogamos o erro
// de proposito (com statusCode, ex: "Curriculo invalido."). Um erro sem
// statusCode veio direto do pg ou de uma excecao inesperada - devolver a
// mensagem crua podia vazar nome de coluna/tabela/constraint do banco.
export function safeErrorResponse(res, error, fallbackMessage = "Erro no servidor.") {
  if (error?.statusCode) {
    return json(res, error.statusCode, { error: error.message || fallbackMessage, code: error.code });
  }
  console.error(fallbackMessage, error);
  return json(res, 500, { error: fallbackMessage });
}

// Comparacao de string em tempo constante, para senhas/segredos curtos onde
// um "!==" direto poderia (em teoria) vazar informacao pelo tempo de resposta.
export function timingSafeStringEqual(a, b) {
  const bufferA = Buffer.from(String(a ?? ""));
  const bufferB = Buffer.from(String(b ?? ""));
  if (bufferA.length !== bufferB.length) {
    // Ainda compara contra algo do mesmo tamanho, pra nao vazar o tamanho certo por atalho.
    crypto.timingSafeEqual(bufferA, bufferA);
    return false;
  }
  return crypto.timingSafeEqual(bufferA, bufferB);
}
