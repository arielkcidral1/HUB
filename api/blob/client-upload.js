import { handleUpload } from "@vercel/blob/client";
import { sql } from "../_lib/db.js";
import { sendJson, applyCorsHeadersNode } from "../_lib/cors.js";

const MAX_CONTRATADO_FILE_SIZE = 10 * 1024 * 1024;
const ACCESS_PASSWORDS = {
  "Fredy Pneus": "fredy5212",
  "Besten Pneus": "besten5212",
  "Achei Pneus": "Achei5212",
  "Trinca Mkt": "trinca5212",
};

function envValue(name) {
  return globalThis.process?.env?.[name] || "";
}

function text(value) {
  return String(value || "").trim();
}

function getHeader(req, name) {
  return req.headers?.[name.toLowerCase()] || req.headers?.[name] || "";
}

function getClientIdentifier(req) {
  const forwardedFor = getHeader(req, "x-forwarded-for");
  const firstForwarded = forwardedFor ? String(forwardedFor).split(",")[0].trim() : "";
  return getHeader(req, "cf-connecting-ip") ||
    firstForwarded ||
    getHeader(req, "x-real-ip") ||
    `ua:${getHeader(req, "user-agent") || "unknown"}`;
}

async function checkRateLimit(req) {
  const ipHashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${envValue("RATE_LIMIT_SALT") || "hub"}:${getClientIdentifier(req)}`)
  );
  const ipHash = Array.from(new Uint8Array(ipHashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const requestId = crypto.randomUUID();
  const [{ hub_reserve_public_rate_limit: allowed }] = await sql`
    select app_private.hub_reserve_public_rate_limit(${"blob_contratado"}, ${ipHash}, ${600}, ${30}, ${requestId}) as hub_reserve_public_rate_limit
  `;
  return allowed;
}

function parseClientPayload(clientPayload) {
  try {
    return JSON.parse(clientPayload || "{}");
  } catch {
    return {};
  }
}

function validateContractorPayload(payload) {
  const empresa = text(payload.empresa);
  const origemHtml = text(payload.origemHtml);
  const accessPassword = text(payload.accessPassword);
  if (!Object.prototype.hasOwnProperty.call(ACCESS_PASSWORDS, empresa)) return "Empresa invalida.";
  if (ACCESS_PASSWORDS[empresa] !== accessPassword) return "Senha de acesso invalida.";
  if (!/^documentos-(fredy|besten|achei|trinca)\.html$/.test(origemHtml)) return "Origem invalida.";
  return null;
}

function validatePathname(pathname) {
  const value = text(pathname);
  if (!/^contratados\/[a-z0-9_.-]+$/i.test(value)) return false;
  if (value.includes("..") || value.includes("//")) return false;
  return true;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") { applyCorsHeadersNode(req, res); res.status(204).end(); return; }
  if (req.method !== "POST") return sendJson(req, res, 405, { error: "Metodo nao permitido." });

  const body = req.body || {};

  try {
    const response = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!validatePathname(pathname)) throw new Error("Caminho de upload invalido.");

        const payload = parseClientPayload(clientPayload);
        const validationError = validateContractorPayload(payload);
        if (validationError) throw new Error(validationError);

        let allowed;
        try {
          allowed = await checkRateLimit(req);
        } catch (error) {
          console.error("client upload rate limit failed", error);
          throw new Error("Nao foi possivel liberar o envio publico agora. Tente novamente em instantes.");
        }
        if (!allowed) throw new Error("Muitos envios. Tente novamente mais tarde.");

        return {
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_CONTRATADO_FILE_SIZE,
          tokenPayload: JSON.stringify({
            empresa: text(payload.empresa),
            origemHtml: text(payload.origemHtml),
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("contractor document upload completed", { pathname: blob.pathname, tokenPayload });
      },
    });

    return sendJson(req, res, 200, response);
  } catch (error) {
    console.error("client blob upload failed", error);
    return sendJson(req, res, 400, { error: error.message || "Nao foi possivel enviar o arquivo." });
  }
}
