import { put } from "@vercel/blob";
import { sql } from "../_lib/db.js";
import { sendJson, applyCorsHeadersNode } from "../_lib/cors.js";
import { requireUserNode } from "../_lib/jwt.js";

// @vercel/blob's server SDK (put/del) needs the Node.js runtime, not Edge,
// so this uses the classic (req, res) Vercel signature, not the Fetch API.

export const config = {
  api: { bodyParser: false },
};

function envValue(name) {
  return globalThis.process?.env?.[name] || "";
}

function getClientIdentifier(req) {
  return req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    `ua:${req.headers["user-agent"] || "unknown"}`;
}

async function checkRateLimit(req, formType, windowSeconds, max) {
  const ipHashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${envValue("RATE_LIMIT_SALT") || "hub"}:${getClientIdentifier(req)}`)
  );
  const ipHash = Array.from(new Uint8Array(ipHashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const requestId = crypto.randomUUID();
  const [{ hub_reserve_public_rate_limit: allowed }] = await sql`
    select app_private.hub_reserve_public_rate_limit(${formType}, ${ipHash}, ${windowSeconds}, ${max}, ${requestId}) as hub_reserve_public_rate_limit
  `;
  return allowed;
}

const CATEGORIES = {
  chat: { prefix: "chat/", maxSize: 10 * 1024 * 1024, requiresAuth: true },
  avatar: { prefix: "avatars/", maxSize: 10 * 1024 * 1024, requiresAuth: true },
  atestado: {
    prefix: "atestados/",
    maxSize: 10 * 1024 * 1024,
    requiresAuth: false,
    rateLimit: { formType: "blob_atestado", windowSeconds: 600, max: 5 },
  },
  curriculo: {
    prefix: "curriculos/",
    maxSize: 5 * 1024 * 1024,
    requiresAuth: false,
    allowedContentTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    rateLimit: { formType: "blob_curriculo", windowSeconds: 600, max: 5 },
  },
  contratado: {
    prefix: "contratados/",
    maxSize: 10 * 1024 * 1024,
    requiresAuth: false,
    rateLimit: { formType: "blob_contratado", windowSeconds: 600, max: 10 },
  },
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") { applyCorsHeadersNode(req, res); res.status(204).end(); return; }
  if (req.method !== "POST") return sendJson(req, res, 405, { error: "Metodo nao permitido." });

  const url = new URL(req.url, "http://localhost");
  const category = CATEGORIES[url.searchParams.get("category") || ""];
  if (!category) return sendJson(req, res, 400, { error: "Categoria de upload invalida." });

  const filename = url.searchParams.get("filename") || "arquivo";
  const contentType = req.headers["content-type"] || "application/octet-stream";

  if (category.allowedContentTypes && !category.allowedContentTypes.includes(contentType)) {
    return sendJson(req, res, 400, { error: "Tipo de arquivo nao permitido." });
  }

  if (category.requiresAuth) {
    const user = await requireUserNode(req, sql);
    if (!user) return sendJson(req, res, 401, { error: "Nao autenticado." });
  } else {
    const allowed = await checkRateLimit(
      req,
      category.rateLimit.formType,
      category.rateLimit.windowSeconds,
      category.rateLimit.max
    );
    if (!allowed) return sendJson(req, res, 429, { error: "Muitos envios. Tente novamente mais tarde." });
  }

  const buffer = await readRawBody(req);
  if (buffer.length <= 0) return sendJson(req, res, 400, { error: "Arquivo vazio." });
  if (buffer.length > category.maxSize) return sendJson(req, res, 400, { error: "Arquivo excede o tamanho maximo permitido." });

  const safeName = filename.replace(/[^a-z0-9_.-]/gi, "-");
  const pathname = `${category.prefix}${Date.now()}-${crypto.randomUUID()}-${safeName}`;

  try {
    const blob = await put(pathname, buffer, { access: "public", contentType, addRandomSuffix: true });
    sendJson(req, res, 200, { url: blob.url, pathname: blob.pathname });
  } catch (error) {
    sendJson(req, res, 400, { error: error.message || "Nao foi possivel enviar o arquivo." });
  }
}
