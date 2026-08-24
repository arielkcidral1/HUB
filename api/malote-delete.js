import bcrypt from "bcryptjs";
import { assertDatabaseUrl, getBody, json, pool, safeErrorResponse } from "./db.js";
import { validateAuthSession } from "./auth.js";
import { checkPublicRateLimit } from "./rate-limit.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Metodo nao permitido." });
    assertDatabaseUrl();

    // A senha de acao sozinha nao bastava: sem exigir sessao, qualquer
    // pessoa na internet podia tentar adivinhar essa senha, sem nem estar
    // logada no HUB.
    const session = await validateAuthSession(req);
    if (!session?.user?.id) return json(res, 401, { error: "Sessao invalida ou expirada." });

    const allowed = await checkPublicRateLimit(req, "action_password_attempt", `malote:${session.user.id}`);
    if (!allowed) return json(res, 429, { error: "Muitas tentativas. Aguarde alguns minutos." });

    const body = await getBody(req);
    const password = String(body.password || "").trim();
    const result = await pool.query(
      "select password_hash from app_private.hub_action_passwords where action = 'delete_malote' limit 1"
    );
    const hash = result.rows[0]?.password_hash || "";
    if (!hash || !bcrypt.compareSync(password, hash)) {
      return json(res, 401, { error: "Senha de autorizacao invalida." });
    }

    if (body.validateOnly) return json(res, 200, { ok: true });

    const deleted = await pool.query("delete from public.hub_malotes where id = $1 returning *", [body.id]);
    if (!deleted.rows.length) return json(res, 404, { error: "Malote nao encontrado." });
    return json(res, 200, { data: deleted.rows[0] });
  } catch (error) {
    return safeErrorResponse(res, error, "Nao foi possivel deletar o malote.");
  }
}
