export const ALLOWED_ORIGINS = new Set([
  "https://hub-opal-nine.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

export function corsHeaders(request) {
  const origin = request.headers.get("origin") || "";
  const headers = {
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
  if (ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

export function json(request, status, body, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json", ...(extraHeaders || {}) },
  });
}

export function applyCorsHeadersNode(req, res) {
  const origin = req.headers?.origin || "";
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Vary", "Origin");
  if (ALLOWED_ORIGINS.has(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
}

export function sendJson(req, res, status, body) {
  applyCorsHeadersNode(req, res);
  res.status(status).json(body);
}
