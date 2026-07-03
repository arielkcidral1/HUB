export const config = { runtime: "edge" };

function envValue(name) {
  return globalThis.process?.env?.[name] || "";
}

const SUPABASE_URL = envValue("SUPABASE_URL") || "https://nblfwesptlpetbwfmdqf.supabase.co";
const SERVICE_ROLE_KEY = envValue("SUPABASE_SERVICE_ROLE_KEY") || envValue("SUPABASE_SERVICE_KEY");
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 20;
const ALLOWED_ORIGINS = new Set([
  "https://hub-opal-nine.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);
const ACCESS_PASSWORDS = {
  "Fredy Pneus": "fredy5212",
  "Besten Pneus": "besten5212",
  "Achei Pneus": "Achei5212",
  "Trinca Mkt": "trinca5212",
};

function corsHeaders(request) {
  const origin = request.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Vary": "Origin",
    ...(ALLOWED_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
  };
}

function json(request, status, body) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request) });
}

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

async function insertContractorDocument(row, includeSource = true) {
  const body = includeSource ? row : Object.fromEntries(Object.entries(row).filter(([key]) => key !== "origem_html"));
  const response = await fetch(`${SUPABASE_URL}/rest/v1/hub_documentos_contratados?select=*`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => null);
  return { response, result };
}

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, 405, { error: "Metodo nao permitido." });
  if (!SERVICE_ROLE_KEY) return json(request, 500, { error: "Funcao sem SUPABASE_SERVICE_ROLE_KEY configurada no Vercel." });

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

  const row = {
    empresa: payload.empresa,
    origem_html: payload.origemHtml,
    nome: payload.nome,
    telefone: payload.telefone,
    cpf: payload.cpf,
    documentos,
    created_by: "Publico",
  };

  let { response, result } = await insertContractorDocument(row, true);
  if (!response.ok && result?.code === "PGRST204" && /origem_html/i.test(result?.message || "")) {
    ({ response, result } = await insertContractorDocument(row, false));
  }

  if (!response.ok) {
    const message = result?.code === "23505"
      ? "CPF ja possui envio de documentos registrado."
      : result?.message || "Nao foi possivel salvar documentos.";
    return json(request, response.status, { error: message, code: result?.code });
  }
  return json(request, 200, { data: Array.isArray(result) ? result[0] : result });
}
