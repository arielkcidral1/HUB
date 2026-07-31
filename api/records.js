import { assertTable, getBody, json, pool, quoteIdent } from "./db.js";

const OPERATORS = {
  eq: "=",
  ilike: "ilike",
};

function normalizeColumns(select) {
  if (!select || select === "*") return "*";
  return String(select)
    .split(",")
    .map((column) => quoteIdent(column.trim()))
    .join(", ");
}

function buildWhere(filters = []) {
  const clauses = [];
  const values = [];

  for (const filter of filters) {
    if (filter?.op === "or" && Array.isArray(filter.conditions)) {
      const orClauses = [];
      for (const condition of filter.conditions) {
        const column = String(condition.column || "").trim();
        const op = String(condition.op || "eq").trim();
        if (!column || !OPERATORS[op]) continue;
        values.push(op === "ilike" ? `%${condition.value}%` : condition.value);
        orClauses.push(`${quoteIdent(column)} ${OPERATORS[op]} $${values.length}`);
      }
      if (orClauses.length) clauses.push(`(${orClauses.join(" or ")})`);
      continue;
    }

    const column = String(filter.column || "").trim();
    const op = String(filter.op || "eq").trim();
    if (!column) continue;

    if (op === "in") {
      const list = Array.isArray(filter.value) ? filter.value : [];
      if (!list.length) continue;
      const placeholders = list.map((value) => {
        values.push(value);
        return `$${values.length}`;
      });
      clauses.push(`${quoteIdent(column)} in (${placeholders.join(", ")})`);
      continue;
    }

    if (!OPERATORS[op]) continue;
    values.push(op === "ilike" ? `%${filter.value}%` : filter.value);
    clauses.push(`${quoteIdent(column)} ${OPERATORS[op]} $${values.length}`);
  }

  return {
    sql: clauses.length ? ` where ${clauses.join(" and ")}` : "",
    values,
  };
}

function buildOrder(order = []) {
  if (!Array.isArray(order) || !order.length) return "";
  const parts = order
    .filter((item) => item?.column)
    .map((item) => `${quoteIdent(item.column)} ${item.ascending === false ? "desc" : "asc"}`);
  return parts.length ? ` order by ${parts.join(", ")}` : "";
}

function buildLimit(limit) {
  const value = Number(limit);
  return Number.isInteger(value) && value > 0 ? ` limit ${value}` : "";
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const table = url.searchParams.get("table") || "";
    assertTable(table);

    if (req.method === "GET") {
      const filters = JSON.parse(url.searchParams.get("filters") || "[]");
      const order = JSON.parse(url.searchParams.get("order") || "[]");
      const select = normalizeColumns(url.searchParams.get("select") || "*");
      const where = buildWhere(filters);
      const sql = `select ${select} from public.${quoteIdent(table)}${where.sql}${buildOrder(order)}${buildLimit(url.searchParams.get("limit"))}`;
      const result = await pool.query(sql, where.values);
      return json(res, 200, { data: result.rows });
    }

    const body = await getBody(req);

    if (req.method === "POST") {
      const rows = Array.isArray(body.rows) ? body.rows : [body.row || body];
      const inserted = [];
      for (const row of rows) {
        const entries = Object.entries(row || {}).filter(([, value]) => value !== undefined);
        const columns = entries.map(([key]) => quoteIdent(key));
        const values = entries.map(([, value]) => value);
        const placeholders = values.map((_, index) => `$${index + 1}`);
        const sql = `insert into public.${quoteIdent(table)} (${columns.join(", ")}) values (${placeholders.join(", ")}) returning *`;
        const result = await pool.query(sql, values);
        inserted.push(result.rows[0]);
      }
      return json(res, 200, { data: inserted });
    }

    if (req.method === "PATCH") {
      const filters = Array.isArray(body.filters) ? body.filters : [];
      const row = body.row || {};
      const entries = Object.entries(row).filter(([, value]) => value !== undefined);
      const values = entries.map(([, value]) => value);
      const sets = entries.map(([key], index) => `${quoteIdent(key)} = $${index + 1}`);
      const where = buildWhere(filters);
      const shiftedWhereSql = where.sql.replace(/\$(\d+)/g, (_, number) => `$${Number(number) + values.length}`);
      const sql = `update public.${quoteIdent(table)} set ${sets.join(", ")}${shiftedWhereSql} returning *`;
      const result = await pool.query(sql, values.concat(where.values));
      return json(res, 200, { data: result.rows });
    }

    if (req.method === "DELETE") {
      const filters = Array.isArray(body.filters) ? body.filters : [];
      const where = buildWhere(filters);
      const sql = `delete from public.${quoteIdent(table)}${where.sql} returning *`;
      const result = await pool.query(sql, where.values);
      return json(res, 200, { data: result.rows });
    }

    return json(res, 405, { error: "Metodo nao permitido." });
  } catch (error) {
    return json(res, error.statusCode || 500, { error: error.message || "Erro no banco de dados." });
  }
}
