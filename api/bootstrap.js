import { assertDatabaseUrl, json, pool, quoteIdent, stripSensitiveColumns, safeErrorResponse } from "./db.js";
import { validateAuthSession } from "./auth.js";
import { canReadTable, getForcedRowFilter } from "./authorize.js";

const BOOTSTRAP_TABLES = {
  usuarios: "hub_users",
  denuncias: "hub_denuncias",
  comunicados: "hub_chat_messages",
  malotes: "hub_malotes",
  chamados: "hub_chamados",
  quadros: "hub_quadros",
  vagas: "hub_vagas",
  eventos: "hub_eventos",
  vtRegistros: "hub_vt_registros",
  disciplinaryRecords: "hub_advertencias_suspensoes",
  documentos: "hub_documentos",
  documentosContratados: "hub_documentos_contratados",
  candidaturas: "hub_candidaturas",
  atestados: "hub_atestados",
  feedbacks: "hub_feedbacks",
  climaPesquisas: "hub_clima_pesquisas",
  climaConfig: "hub_clima_config",
};

const BOOTSTRAP_ROW_LIMITS = {
  hub_chat_messages: 1500,
};

async function selectRows(client, table, forcedFilter) {
  const quotedTable = quoteIdent(table);
  const where = forcedFilter ? ` where ${quoteIdent(forcedFilter.column)} = $1` : "";
  const params = forcedFilter ? [forcedFilter.value] : [];
  const limit = BOOTSTRAP_ROW_LIMITS[table];
  const limitSql = limit ? ` limit ${Number(limit)}` : "";
  try {
    const result = await client.query(`select * from public.${quotedTable}${where} order by "created_at" desc${limitSql}`, params);
    return result.rows;
  } catch (error) {
    if (error?.code !== "42703") throw error;
    const result = await client.query(`select * from public.${quotedTable}${where}${limitSql}`, params);
    return result.rows;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Metodo nao permitido." });

  let client;
  try {
    assertDatabaseUrl();
    const session = await validateAuthSession(req);
    if (!session?.user?.id) return json(res, 401, { error: "Sessao invalida ou expirada." });

    client = await pool.connect();
    const data = {};
    const errors = {};

    await Promise.all(Object.entries(BOOTSTRAP_TABLES).map(async ([collection, table]) => {
      if (!canReadTable(session, table)) {
        data[collection] = [];
        return;
      }
      try {
        data[collection] = stripSensitiveColumns(table, await selectRows(client, table, getForcedRowFilter(session, table)));
      } catch (error) {
        data[collection] = [];
        console.error(`Erro ao carregar ${table} no bootstrap:`, error);
        errors[collection] = "Erro ao carregar tabela.";
      }
    }));

    return json(res, 200, { data, errors });
  } catch (error) {
    return safeErrorResponse(res, error, "Erro ao carregar dados iniciais.");
  } finally {
    client?.release();
  }
}
