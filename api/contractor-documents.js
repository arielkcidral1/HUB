import { sql } from "./_lib/db.js";
import { json, corsHeaders } from "./_lib/cors.js";

export const config = { runtime: "edge" };

function envValue(name) {
  return globalThis.process?.env?.[name] || "";
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 20;
const ACCESS_PASSWORDS = {
  "Fredy Pneus": "fredy5212",
  "Besten Pneus": "besten5212",
  "Achei Pneus": "Achei5212",
  "Trinca Mkt": "trinca5212",
};

function text(value) {
  return String(value || "").trim();
}

function safeFileName(name) {
  return text(name).toLowerCase().replace(/[^a-z0-9_.-]/g, "-").replace(/^-+|-+$/g, "") || "documento";
}

function isValidPayload(payload) {
  if (!Object.prototype.hasOwnProperty.call(ACCESS_PASSWORDS, payload.empresa)) return "Empresa invalida.";
  if (ACCESS_PASSWORDS[payload.empresa] !== payload.accessPassword) return "Senha de acesso invalida.";
  if (!/^documentos-(fredy|besten|achei|trinca)\.html$/.test(payload.origemHtml)) return "Origem invalida.";
  if (payload.nome.length < 3 || payload.nome.length > 160) return "Nome invalido.";
  if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(payload.cpf)) return "CPF invalido.";
  if (!/^\d{10,11}$/.test(payload.telefone.replace(/\D/g, ""))) return "Telefone invalido.";
  return null;
}

async function fileToDataUrl(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  const mimeType = text(file.type) || "application/octet-stream";
  return `data:${mimeType};base64,${btoa(binary)}`;
}

function getClientIdentifier(req) {
  return req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    `ua:${req.headers.get("user-agent") || "unknown"}`;
}

async function checkRateLimit(request) {
  const ipHashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${envValue("RATE_LIMIT_SALT") || "hub"}:${getClientIdentifier(request)}`)
  );
  const ipHash = Array.from(new Uint8Array(ipHashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const requestId = crypto.randomUUID();
  const [{ hub_reserve_public_rate_limit: allowed }] = await sql`
    select app_private.hub_reserve_public_rate_limit(${"documentos_contratados"}, ${ipHash}, ${600}, ${10}, ${requestId}) as hub_reserve_public_rate_limit
  `;
  return allowed;
}

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, 405, { error: "Metodo nao permitido." });

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return json(request, 400, { error: "Formulario invalido." });
  }

  const payload = {
    empresa: text(formData.get("empresa")),
    origemHtml: text(formData.get("origemHtml")),
    accessPassword: text(formData.get("accessPassword")),
    nome: text(formData.get("nome")),
    telefone: text(formData.get("telefone")),
    cpf: text(formData.get("cpf")),
  };
  const validationError = isValidPayload(payload);
  if (validationError) return json(request, 400, { error: validationError });

  const allowed = await checkRateLimit(request);
  if (!allowed) return json(request, 429, { error: "Muitos envios. Tente novamente mais tarde." });

  const files = formData.getAll("documentos").filter((file) => file instanceof File && file.name);
  if (!files.length || files.length > MAX_FILES) return json(request, 400, { error: "Documentos invalidos." });
  if (files.some((file) => file.size <= 0 || file.size > MAX_FILE_SIZE)) {
    return json(request, 400, { error: "Cada documento deve ter entre 1 byte e 10 MB." });
  }

  const documentos = [];
  for (const file of files) {
    documentos.push({
      name: safeFileName(file.name),
      size: file.size,
      type: text(file.type) || "application/octet-stream",
      dataUrl: await fileToDataUrl(file),
    });
  }

  try {
    const rows = await sql`
      insert into hub_documentos_contratados (empresa, origem_html, nome, telefone, cpf, documentos, created_by)
      values (${payload.empresa}, ${payload.origemHtml}, ${payload.nome}, ${payload.telefone}, ${payload.cpf}, ${JSON.stringify(documentos)}, ${"Publico"})
      returning *
    `;
    return json(request, 200, { data: rows[0] });
  } catch (error) {
    const message = /unique|duplicate/i.test(error.message || "")
      ? "CPF ja possui envio de documentos registrado."
      : error.message || "Nao foi possivel salvar documentos.";
    return json(request, 400, { error: message });
  }
}
