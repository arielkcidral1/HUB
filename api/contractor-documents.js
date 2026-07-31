import { assertDatabaseUrl, getBody, json, pool } from "./db.js";

export const config = { api: { bodyParser: { sizeLimit: "30mb" } } };

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

export default async function handler(request, response) {
  try {
    if (request.method !== "POST") return json(response, 405, { error: "Metodo nao permitido." });
    assertDatabaseUrl();

    const body = await getBody(request);
    const payload = {
      empresa: text(body.empresa),
      origemHtml: text(body.origemHtml),
      accessPassword: text(body.accessPassword),
      nome: text(body.nome),
      telefone: text(body.telefone),
      cpf: text(body.cpf),
    };

    const validationError = isValidPayload(payload);
    if (validationError) return json(response, 400, { error: validationError });

    const documentos = Array.isArray(body.documentos) ? body.documentos : [];
    if (!documentos.length || documentos.length > MAX_FILES) return json(response, 400, { error: "Documentos invalidos." });
    if (documentos.some((file) => Number(file.size || 0) <= 0 || Number(file.size || 0) > MAX_FILE_SIZE)) {
      return json(response, 400, { error: "Cada documento deve ter entre 1 byte e 10 MB." });
    }

    const normalizedDocuments = documentos.map((file) => ({
      name: safeFileName(file.name),
      size: Number(file.size || 0),
      type: text(file.type) || "application/octet-stream",
      dataUrl: text(file.dataUrl),
    }));

    const result = await pool.query(
      `insert into public.hub_documentos_contratados
        (empresa, origem_html, nome, telefone, cpf, documentos, created_by)
       values ($1, $2, $3, $4, $5, $6::jsonb, 'Publico')
       returning *`,
      [payload.empresa, payload.origemHtml, payload.nome, payload.telefone, payload.cpf, JSON.stringify(normalizedDocuments)]
    );

    return json(response, 200, { data: result.rows[0] });
  } catch (error) {
    const message = error.code === "23505"
      ? "CPF ja possui envio de documentos registrado."
      : error.message || "Nao foi possivel salvar documentos.";
    return json(response, error.statusCode || 500, { error: message, code: error.code });
  }
}
