import { assertDatabaseUrl, json, safeErrorResponse } from "../db.js";
import { validateAuthSession } from "../auth.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Metodo nao permitido." });
    assertDatabaseUrl();
    const session = await validateAuthSession(req);
    if (!session?.user) return json(res, 401, { error: "Sessao encerrada por outro login." });
    return json(res, 200, { ok: true });
  } catch (error) {
    return safeErrorResponse(res, error, "Erro ao validar sessao.");
  }
}
