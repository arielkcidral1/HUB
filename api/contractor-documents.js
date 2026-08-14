import { assertDatabaseUrl, getBody, json, pool } from "./db.js";

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

function normalizeDocuments(documentos) {
  const list = Array.isArray(documentos) ? documentos : [];
  return list
    .filter((item) => item && typeof item === "object" && text(item.dataUrl).startsWith("data:"))
    .map((item) => {
      const dataUrl = text(item.dataUrl);
      const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
      const size = Number(item.size || 0) || Buffer.from(base64, "base64").length;
      return {
        name: safeFileName(item.name),
        size,
        type: text(item.type) || "application/octet-stream",
        dataUrl,
      };
    });
}

// O formulario publico envia JSON com os arquivos ja embutidos em dataUrl;
// a rota antiga esperava multipart e quebrava com "Unrecognized content-type header".
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Metodo nao permitido." });
    assertDatabaseUrl();

    const body = await getBody(req);
    const payload = {
      empresa: text(body.empresa),
      origemHtml: text(body.origemHtml),
      accessPassword: text(body.accessPassword),
      nome: text(body.nome),
      telefone: text(body.telefone),
      cpf: text(body.cpf),
    };

    const validationError = isValidPayload(payload);
    if (validationError) return json(res, 400, { error: validationError });

    const documentos = normalizeDocuments(body.documentos);
    if (!documentos.length || documentos.length > MAX_FILES) return json(res, 400, { error: "Documentos invalidos." });
    if (documentos.some((file) => file.size <= 0 || file.size > MAX_FILE_SIZE)) {
      return json(res, 400, { error: "Cada documento deve ter entre 1 byte e 10 MB." });
    }

    const values = [
      payload.empresa,
      payload.origemHtml,
      payload.nome,
      payload.telefone,
      payload.cpf,
      JSON.stringify(documentos),
      "Publico",
    ];

    let result;
    try {
      result = await pool.query(
        `insert into public."hub_documentos_contratados"
           ("empresa", "origem_html", "nome", "telefone", "cpf", "documentos", "created_by")
         values ($1, $2, $3, $4, $5, $6::jsonb, $7) returning *`,
        values,
      );
    } catch (error) {
      // Bancos antigos ainda nao possuem a coluna origem_html.
      if (error?.code !== "42703") throw error;
      result = await pool.query(
        `insert into public."hub_documentos_contratados"
           ("empresa", "nome", "telefone", "cpf", "documentos", "created_by")
         values ($1, $2, $3, $4, $5::jsonb, $6) returning *`,
        [payload.empresa, payload.nome, payload.telefone, payload.cpf, JSON.stringify(documentos), "Publico"],
      );
    }

    return json(res, 200, { data: result.rows[0] || null });
  } catch (error) {
    const message = error?.code === "23505"
      ? "CPF ja possui envio de documentos registrado."
      : error?.message || "Nao foi possivel salvar documentos.";
    return json(res, error?.statusCode || 500, { error: message, code: error?.code });
  }
}
