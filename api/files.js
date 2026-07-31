import { getBody, json } from "./db.js";

export const config = { api: { bodyParser: { sizeLimit: "15mb" } } };

function safeName(name) {
  return String(name || "arquivo").replace(/[^a-z0-9_.-]/gi, "-");
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Metodo nao permitido." });
    const body = await getBody(req);
    const name = safeName(body.name);
    return json(res, 200, {
      path: body.dataUrl || "",
      name,
      size: body.size || 0,
      type: body.type || "application/octet-stream",
    });
  } catch (error) {
    return json(res, error.statusCode || 500, { error: error.message || "Erro ao processar arquivo." });
  }
}
