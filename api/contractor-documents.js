import { assertDatabaseUrl, getBody, json, pool } from "./db.js";

// Sem isso a Vercel aplica o limite padrao de 4.5mb por requisicao e rejeita
// o envio antes mesmo de chegar no handler, bem abaixo do que a pagina anuncia
// (ate 10mb por arquivo). 30mb casa com o teto que getBody ja aplica em db.js.
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email) || payload.email.length > 160) return "E-mail invalido.";
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
      email: text(body.email),
    };

    const validationError = isValidPayload(payload);
    if (validationError) return json(res, 400, { error: validationError });

    const documentos = normalizeDocuments(body.documentos);
    if (!documentos.length || documentos.length > MAX_FILES) return json(res, 400, { error: "Documentos invalidos." });
    if (documentos.some((file) => file.size <= 0 || file.size > MAX_FILE_SIZE)) {
      return json(res, 400, { error: "Cada documento deve ter entre 1 byte e 10 MB." });
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
    // Colunas opcionais (origem_html, email) podem faltar em bancos antigos;
    // nesse caso o Postgres devolve 42703 e a coluna citada e removida do insert.
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
    const message = error?.code === "23505"
      ? "CPF ja possui envio de documentos registrado."
      : error?.message || "Nao foi possivel salvar documentos.";
    return json(res, error?.statusCode || 500, { error: message, code: error?.code });
  }
}
