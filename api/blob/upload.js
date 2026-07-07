import { put } from "@vercel/blob";
import { sql } from "../_lib/db.js";
import { json, corsHeaders } from "../_lib/cors.js";
import { requireUser } from "../_lib/jwt.js";

// @vercel/blob's server SDK (put/del) needs the Node.js runtime, not Edge.

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

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, 405, { error: "Metodo nao permitido." });

  const url = new URL(request.url);
  const category = CATEGORIES[url.searchParams.get("category") || ""];
  if (!category) return json(request, 400, { error: "Categoria de upload invalida." });

  const filename = url.searchParams.get("filename") || "arquivo";
  const contentType = request.headers.get("content-type") || "application/octet-stream";

  if (category.allowedContentTypes && !category.allowedContentTypes.includes(contentType)) {
    return json(request, 400, { error: "Tipo de arquivo nao permitido." });
  }

  if (category.requiresAuth) {
    const user = await requireUser(request, sql);
    if (!user) return json(request, 401, { error: "Nao autenticado." });
  } else {
    const allowed = await checkRateLimit(
      request,
      category.rateLimit.formType,
      category.rateLimit.windowSeconds,
      category.rateLimit.max
    );
    if (!allowed) return json(request, 429, { error: "Muitos envios. Tente novamente mais tarde." });
  }

  const buffer = await request.arrayBuffer();
  if (buffer.byteLength <= 0) return json(request, 400, { error: "Arquivo vazio." });
  if (buffer.byteLength > category.maxSize) return json(request, 400, { error: "Arquivo excede o tamanho maximo permitido." });

  const safeName = filename.replace(/[^a-z0-9_.-]/gi, "-");
  const pathname = `${category.prefix}${Date.now()}-${crypto.randomUUID()}-${safeName}`;

  try {
    const blob = await put(pathname, buffer, { access: "public", contentType, addRandomSuffix: true });
    return json(request, 200, { url: blob.url, pathname: blob.pathname });
  } catch (error) {
    return json(request, 400, { error: error.message || "Nao foi possivel enviar o arquivo." });
  }
}
