import { assertDatabaseUrl, json, pool, quoteIdent } from "./db.js";

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
  documentosContratados: "hub_documentos_contratados",
  candidaturas: "hub_candidaturas",
  atestados: "hub_atestados",
};

async function selectRows(client, table) {
  const quotedTable = quoteIdent(table);
  try {
    const result = await client.query(`select * from public.${quotedTable} order by "created_at" desc`);
    return result.rows;
  } catch (error) {
    if (error?.code !== "42703") throw error;
    const result = await client.query(`select * from public.${quotedTable}`);
    return result.rows;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Metodo nao permitido." });

  let client;
  try {
    assertDatabaseUrl();
    client = await pool.connect();
    const data = {};

    for (const [collection, table] of Object.entries(BOOTSTRAP_TABLES)) {
      data[collection] = await selectRows(client, table);
    }

    return json(res, 200, { data });
  } catch (error) {
    return json(res, error.statusCode || 500, { error: error.message || "Erro ao carregar dados iniciais." });
  } finally {
    client?.release();
  }
}
