import crypto from "node:crypto";
import { pool, SESSION_SECRET } from "./db.js";

let tableReady = false;

async function ensureRateLimitTable() {
  if (tableReady) return;
  await pool.query(`
    create table if not exists public.hub_rate_limits (
      id bigserial primary key,
      scope text not null,
      client_key text not null,
      created_at timestamptz not null default now()
    )
  `);
  await pool.query(`create index if not exists hub_rate_limits_scope_key_idx on public.hub_rate_limits (scope, client_key, created_at)`);
  tableReady = true;
}

// Usa o ULTIMO IP da cadeia x-forwarded-for, nao o primeiro: e o valor que a
// borda da Vercel acrescenta por ultimo, entao e o mais dificil de forjar -
// um cliente pode mandar qualquer coisa nesse header, mas nao controla o
// que a Vercel anexa no final.
function getClientIp(req) {
  const chain = String(req.headers["x-forwarded-for"] || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (chain.length) return chain[chain.length - 1];
  return req.socket?.remoteAddress || "unknown";
}

// A chave nunca guarda o IP em texto puro no banco, so um hash dele.
function hashClientKey(scope, identifier) {
  return crypto.createHash("sha256").update(`${SESSION_SECRET}:${scope}:${identifier}`).digest("hex");
}

const LIMITS = {
  hub_denuncias: { max: 5, windowMinutes: 10 },
  hub_feedbacks: { max: 5, windowMinutes: 10 },
  hub_chamados: { max: 5, windowMinutes: 10 },
  hub_candidaturas: { max: 10, windowMinutes: 10 },
  hub_atestados: { max: 5, windowMinutes: 10 },
  contractor_documents: { max: 3, windowMinutes: 10 },
  file_upload: { max: 15, windowMinutes: 10 },
  login_attempt: { max: 8, windowMinutes: 10 },
  action_password_attempt: { max: 10, windowMinutes: 10 },
};

// Evita hub_rate_limits crescer pra sempre: chance pequena por chamada de
// apagar registros com mais de 1 dia, em vez de rodar isso toda hora.
async function maybeCleanup() {
  if (Math.random() > 0.02) return;
  try {
    await pool.query(`delete from public.hub_rate_limits where created_at < now() - interval '1 day'`);
  } catch (_) {
    // limpeza e best-effort; uma falha aqui nao pode derrubar o rate limit em si.
  }
}

// Devolve true se o pedido pode seguir. Ja registra a tentativa no banco
// quando permite, para a proxima chamada contar corretamente.
// extraKeyPart combina com o IP (nao substitui) - usado no login para nao
// travar o escritorio inteiro se uma pessoa errar a propria senha varias vezes.
export async function checkPublicRateLimit(req, scope, extraKeyPart) {
  const rule = LIMITS[scope];
  if (!rule) return true;

  await ensureRateLimitTable();
  const ip = getClientIp(req);
  const identifier = extraKeyPart ? `${ip}:${extraKeyPart}` : ip;
  const clientKey = hashClientKey(scope, identifier);

  const { rows } = await pool.query(
    `select count(*)::int as count
       from public.hub_rate_limits
      where scope = $1 and client_key = $2 and created_at > now() - ($3 || ' minutes')::interval`,
    [scope, clientKey, String(rule.windowMinutes)]
  );
  if (rows[0].count >= rule.max) return false;

  await pool.query(`insert into public.hub_rate_limits (scope, client_key) values ($1, $2)`, [scope, clientKey]);
  maybeCleanup();
  return true;
}
