export const config = { runtime: "edge" };

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 20;
const ACCESS_PASSWORDS = {
  "Fredy Pneus": "fredy5212",
  "Besten Pneus": "besten5212",
  "Achei Pneus": "Achei5212",
  "Trinca Mkt": "trinca5212",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function text(value) {
  return String(value || "").trim();
}

function safeFileName(name) {
  return text(name).toLowerCase().replace(/[^a-z0-9_.-]/g, "-").replace(/^-+|-+$/g, "") || "documento";
}

async function fileToDataUrl(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return `data:${file.type || "application/octet-stream"};base64,${btoa(binary)}`;
}

function getPostgrestUrl() {
  const directUrl = text(process.env.POSTGRES_REST_URL || process.env.SUPABASE_URL);
  if (directUrl) return directUrl.replace(/\/$/, "");

  const databaseUrl = text(process.env.POSTGRES_URL || process.env.DATABASE_URL);
  const host = databaseUrl.match(/@([^/:?]+)(?::\d+)?(?:\/|\?|$)/)?.[1];
  if (host) return `https://${host.replace(/^db\./, "")}`;
  throw Object.assign(new Error("PostgREST nao configurado."), { statusCode: 500 });
}

function getServiceRoleKey() {
  const key = text(process.env.POSTGRES_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!key) throw Object.assign(new Error("POSTGRES_SERVICE_ROLE_KEY nao configurada."), { statusCode: 500 });
  // fileToDataUrl e usado para embutir os anexos quando o envio chega pelo Vercel.
  return key;
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

async function insertContractorDocuments(row) {
  const baseUrl = getPostgrestUrl();
  const serviceRoleKey = getServiceRoleKey();
  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
    prefer: "return=representation",
  };

  let result = await fetch(`${baseUrl}/rest/v1/hub_documentos_contratados`, {
    method: "POST",
    headers,
    body: JSON.stringify(row),
  });

  if (result.status === 201 || result.status === 200) {
    const data = await result.json().catch(() => []);
    return Array.isArray(data) ? data[0] : data;
  }

  const error = await result.json().catch(() => ({}));
  if (error?.code !== "PGRST204") throw error;

  const legacyRow = { ...row };
  delete legacyRow.origem_html;
  result = await fetch(`${baseUrl}/rest/v1/hub_documentos_contratados`, {
    method: "POST",
    headers,
    body: JSON.stringify(legacyRow),
  });

  if (result.status === 201 || result.status === 200) {
    const data = await result.json().catch(() => []);
    return Array.isArray(data) ? data[0] : data;
  }

  throw await result.json().catch(() => ({}));
}

export default async function handler(request) {
  try {
    if (request.method !== "POST") return json({ error: "Metodo nao permitido." }, 405);

    const formData = await request.formData();
    // PGRST204 tambem e tratado em insertContractorDocuments para tolerar schema antigo.
    const payload = {
      empresa: text(formData.get("empresa")),
      origemHtml: text(formData.get("origemHtml")),
      accessPassword: text(formData.get("accessPassword")),
      nome: text(formData.get("nome")),
      telefone: text(formData.get("telefone")),
      cpf: text(formData.get("cpf")),
    };

    const validationError = isValidPayload(payload);
    if (validationError) return json({ error: validationError }, 400);

    const files = formData.getAll("documentos").filter((file) => file && typeof file === "object" && "arrayBuffer" in file);
    if (!files.length || files.length > MAX_FILES) return json({ error: "Documentos invalidos." }, 400);
    if (files.some((file) => Number(file.size || 0) <= 0 || Number(file.size || 0) > MAX_FILE_SIZE)) {
      return json({ error: "Cada documento deve ter entre 1 byte e 10 MB." }, 400);
    }

    const documentos = await Promise.all(files.map(async (file) => ({
      name: safeFileName(file.name),
      size: Number(file.size || 0),
      type: text(file.type) || "application/octet-stream",
      dataUrl: await fileToDataUrl(file),
    })));

    const data = await insertContractorDocuments({
      empresa: payload.empresa,
      origem_html: payload.origemHtml,
      nome: payload.nome,
      telefone: payload.telefone,
      cpf: payload.cpf,
      documentos,
      created_by: "Publico",
    });

    return json({ data });
  } catch (error) {
    const result = error || {};
    const message = result?.code === "23505"
      ? "CPF ja possui envio de documentos registrado."
      : result.message || "Nao foi possivel salvar documentos.";
    return json({ error: message, code: result.code }, result.statusCode || 500);
  }
}
