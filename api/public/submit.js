import { sql } from "../_lib/db.js";
import { json, corsHeaders } from "../_lib/cors.js";

export const config = { runtime: "edge" };

function envValue(name) {
  return globalThis.process?.env?.[name] || "";
}

function getClientIdentifier(req) {
  return req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    `ua:${req.headers.get("user-agent") || "unknown"}`;
}

async function checkRateLimit(request, formType, windowSeconds, max) {
  const ipHashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${envValue("RATE_LIMIT_SALT") || "hub"}:${getClientIdentifier(request)}`)
  );
  const ipHash = Array.from(new Uint8Array(ipHashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const requestId = crypto.randomUUID();
  const [{ hub_reserve_public_rate_limit: allowed }] = await sql`
    select app_private.hub_reserve_public_rate_limit(${formType}, ${ipHash}, ${windowSeconds}, ${max}, ${requestId}) as hub_reserve_public_rate_limit
  `;
  return allowed;
}

function trimmed(value) {
  return String(value || "").trim();
}

async function handleDenuncia(body) {
  const descricao = trimmed(body.descricao);
  if (descricao.length < 1 || descricao.length > 4000) {
    return { error: "Descricao invalida (1 a 4000 caracteres)." };
  }
  const rows = await sql`
    insert into hub_denuncias (identificacao, categoria, descricao, status, created_by)
    values (${"Anonimo"}, ${"Denuncia anonima"}, ${descricao}, ${"Aberta"}, ${"Publico"})
    returning *
  `;
  return { data: rows[0] };
}

async function handleChamado(body) {
  const solicitante = trimmed(body.solicitante);
  const unidade = trimmed(body.unidade);
  const epis = trimmed(body.epis);
  const observacoes = trimmed(body.observacoes);
  if (solicitante.length < 3 || solicitante.length > 120) return { error: "Nome do solicitante invalido." };
  if (unidade.length < 2 || unidade.length > 120) return { error: "Unidade invalida." };
  if (epis.length < 3 || epis.length > 1500) return { error: "Descricao de EPIs invalida." };
  if (observacoes.length > 1000) return { error: "Observacoes muito longas." };

  const rows = await sql`
    insert into hub_chamados (solicitante, unidade, setor, epis, observacoes, status, created_by)
    values (${solicitante}, ${unidade}, ${trimmed(body.setor)}, ${epis}, ${observacoes}, ${"Aberto"}, ${"Publico"})
    returning *
  `;
  return { data: rows[0] };
}

const HANDLERS = {
  denuncias: { fn: handleDenuncia, windowSeconds: 600, max: 5 },
  chamados: { fn: handleChamado, windowSeconds: 600, max: 10 },
};

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, 405, { error: "Metodo nao permitido." });

  let body;
  try { body = await request.json(); } catch { return json(request, 400, { error: "Requisicao invalida." }); }
  const type = String(body.type || "");
  const entry = HANDLERS[type];
  if (!entry) return json(request, 400, { error: "Tipo de envio nao suportado neste endpoint." });

  const allowed = await checkRateLimit(request, type, entry.windowSeconds, entry.max);
  if (!allowed) return json(request, 429, { error: "Muitos envios. Tente novamente mais tarde." });

  const result = await entry.fn(body.payload || {});
  if (result.error) return json(request, 400, { error: result.error });
  return json(request, 200, { data: result.data });
}
