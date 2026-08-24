import { assertDatabaseUrl, getBody, json, pool, timingSafeStringEqual, safeErrorResponse } from "./db.js";
import { checkPublicRateLimit } from "./rate-limit.js";

const MAX_FILE_SIZE = 3 * 1024 * 1024;
const MAX_FILES = 20;
const PATH_PATTERN = /^contratados\/[a-z0-9-]+\/[a-z0-9_.-]+$/i;
const ACCESS_PASSWORDS = {
  "Fredy Pneus": process.env.CONTRACTOR_ACCESS_PASSWORD_FREDY || "fredy5212",
  "Besten Pneus": process.env.CONTRACTOR_ACCESS_PASSWORD_BESTEN || "besten5212",
  "Achei Pneus": process.env.CONTRACTOR_ACCESS_PASSWORD_ACHEI || "Achei5212",
  "Trinca Mkt": process.env.CONTRACTOR_ACCESS_PASSWORD_TRINCA || "trinca5212",
};

function text(value) {
  return String(value || "").trim();
}

function safeFileName(name) {
  return text(name).toLowerCase().replace(/[^a-z0-9_.-]/g, "-").replace(/^-+|-+$/g, "") || "documento";
}

function isValidAccessPassword(empresa, accessPassword) {
  return Object.prototype.hasOwnProperty.call(ACCESS_PASSWORDS, empresa)
    && timingSafeStringEqual(ACCESS_PASSWORDS[empresa], accessPassword);
}

function isValidPayload(payload) {
  if (!Object.prototype.hasOwnProperty.call(ACCESS_PASSWORDS, payload.empresa)) return "Empresa invalida.";
  if (!isValidAccessPassword(payload.empresa, payload.accessPassword)) return "Senha de acesso invalida.";
  if (!/^documentos-(fredy|besten|achei|trinca)\.html$/.test(payload.origemHtml)) return "Origem invalida.";
  if (payload.nome.length < 3 || payload.nome.length > 160) return "Nome invalido.";
  if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(payload.cpf)) return "CPF invalido.";
  if (!/^\d{10,11}$/.test(payload.telefone.replace(/\D/g, ""))) return "Telefone invalido.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email) || payload.email.length > 160) return "E-mail invalido.";
  return null;
}

function normalizeDocuments(documentos) {
  const list = Array.isArray(documentos) ? documentos : [];
  return list
    .filter((item) => item && typeof item === "object" && PATH_PATTERN.test(text(item.path)))
    .map((item) => ({
      name: safeFileName(item.name),
      size: Number(item.size || 0),
      type: text(item.type) || "application/octet-stream",
      path: text(item.path),
    }));
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Metodo nao permitido." });
    assertDatabaseUrl();

    const allowed = await checkPublicRateLimit(req, "contractor_documents");
    if (!allowed) return json(res, 429, { error: "Muitos envios em pouco tempo. Tente novamente mais tarde." });

    const body = await getBody(req);

    if (body.verify === true) {
      const empresa = text(body.empresa);
      const accessPassword = text(body.accessPassword);
      if (!isValidAccessPassword(empresa, accessPassword)) return json(res, 400, { error: "Senha de acesso invalida." });
      return json(res, 200, { ok: true });
    }

    const payload = {
      empresa: text(body.empresa),
      origemHtml: text(body.origemHtml),
      accessPassword: text(body.accessPassword),
      nome: text(body.nome),
      telefone: text(body.telefone),
      cpf: text(body.cpf),
      email: text(body.email),
    };

    const validationError = isValidPayload(payload);
    if (validationError) return json(res, 400, { error: validationError });

    const documentos = normalizeDocuments(body.documentos);
    if (!documentos.length || documentos.length > MAX_FILES) return json(res, 400, { error: "Documentos invalidos." });
    if (documentos.some((file) => file.size <= 0 || file.size > MAX_FILE_SIZE)) {
      return json(res, 400, { error: "Cada documento deve ter entre 1 byte e 3 MB." });
    }

    const columns = new Map([
      ["empresa", payload.empresa],
      ["origem_html", payload.origemHtml],
      ["nome", payload.nome],
      ["telefone", payload.telefone],
      ["cpf", payload.cpf],
      ["email", payload.email],
      ["documentos", JSON.stringify(documentos)],
      ["created_by", "Publico"],
    ]);
    const optionalColumns = new Set(["origem_html", "email"]);

    let result = null;
    while (!result) {
      const names = [...columns.keys()];
      const placeholders = names.map((name, index) => (name === "documentos" ? `$${index + 1}::jsonb` : `$${index + 1}`));
      const sql = `insert into public."hub_documentos_contratados" (${names.map((name) => `"${name}"`).join(", ")})
         values (${placeholders.join(", ")}) returning *`;
      try {
        result = await pool.query(sql, [...columns.values()]);
      } catch (error) {
        const missing = [...optionalColumns].find((name) => error?.code === "42703" && String(error.message || "").includes(name));
        if (!missing) throw error;
        columns.delete(missing);
        optionalColumns.delete(missing);
      }
    }

    return json(res, 200, { data: result.rows[0] || null });
  } catch (error) {
    if (error?.code === "23505") {
      return json(res, 409, { error: "CPF ja possui envio de documentos registrado.", code: error.code });
    }
    return safeErrorResponse(res, error, "Nao foi possivel salvar documentos.");
  }
}
