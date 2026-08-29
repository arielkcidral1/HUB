import { assertDatabaseUrl, getBody, json, pool, safeErrorResponse } from "../db.js";
import { validateAuthSession } from "../auth.js";

function normalize(value) {
  return String(value || "").trim();
}

let presenceColumnsReady = false;
async function ensurePresenceColumns() {
  if (presenceColumnsReady) return;
  await pool.query(`
    alter table public.hub_users
      add column if not exists is_online boolean default false,
      add column if not exists last_seen timestamptz
  `);
  presenceColumnsReady = true;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Metodo nao permitido." });
    assertDatabaseUrl();
    const session = await validateAuthSession(req);
    if (!session?.user) return json(res, 401, { error: "Sessao encerrada por outro login." });
    await ensurePresenceColumns();

    const body = await getBody(req);
    const userId = normalize(session.user.id);
    const email = normalize(session.user.email).toLowerCase();
    const nome = normalize(session.user.user_metadata?.nome);
    const online = body.online !== false;

    if (!userId && !email && !nome) return json(res, 400, { error: "Usuario nao informado." });

    const filters = [];
    const values = [online];
    if (userId) {
      values.push(userId);
      filters.push(`id = $${values.length}`);
    }
    if (email) {
      values.push(email);
      filters.push(`lower(coalesce(email, '')) = $${values.length}`);
    }
    if (nome) {
      values.push(nome);
      filters.push(`lower(coalesce(nome, '')) = lower($${values.length})`);
    }

    const result = await pool.query(
      `update public.hub_users
          set is_online = $1,
              last_seen = now()
        where ${filters.join(" or ")}
        returning id, nome, email, is_online, last_seen`,
      values
    );

    return json(res, 200, { data: result.rows[0] || null });
  } catch (error) {
    return safeErrorResponse(res, error, "Erro ao atualizar presenca.");
  }
}
