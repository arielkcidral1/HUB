import bcrypt from "bcryptjs";
import { assertDatabaseUrl, getBody, json, pool } from "./db.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Metodo nao permitido." });
    assertDatabaseUrl();
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
    return json(res, error.statusCode || 500, { error: error.message || "Nao foi possivel deletar o malote." });
  }
}
