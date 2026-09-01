import { assertDatabaseUrl, assertTable, getBody, json, pool, quoteIdent, PUBLIC_READ_TABLES, PUBLIC_INSERT_TABLES, stripSensitiveColumns, safeErrorResponse } from "./db.js";
import { validateAuthSession } from "./auth.js";
import { checkPublicRateLimit } from "./rate-limit.js";
import { canReadTable, authorizeWrite, getForcedRowFilter } from "./authorize.js";

const OPERATORS = {
  eq: "=",
  ilike: "ilike",
};

const JSON_COLUMNS = new Map([
  ["hub_clima_pesquisas", new Set(["respostas"])],
  ["hub_documentos_contratados", new Set(["documentos"])],
  ["hub_documentos", new Set(["dados"])],
  ["hub_malotes", new Set(["colaboradores"])],
  ["hub_quadros", new Set(["listas"])],
  ["hub_users", new Set(["configuracoes"])],
]);

function isJsonColumn(table, column) {
  return JSON_COLUMNS.get(table)?.has(column);
}

function normalizeDbValue(table, column, value) {
  if (!isJsonColumn(table, column) || value == null || typeof value === "string") return value;
  return JSON.stringify(value);
}

function placeholderFor(table, column, index) {
  return isJsonColumn(table, column) ? `$${index}::jsonb` : `$${index}`;
}

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

function unauthorized(res) {
  return json(res, 401, { error: "Sessao invalida ou expirada." });
}

function forbidden(res) {
  return json(res, 403, { error: "Sem permissao para esta operacao." });
}

export default async function handler(req, res) {
  try {
    assertDatabaseUrl();
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const table = url.searchParams.get("table") || "";
    assertTable(table);

    const session = await validateAuthSession(req);
    const isAuthenticated = Boolean(session?.user?.id);

    if (req.method === "GET") {
      if (!isAuthenticated && !PUBLIC_READ_TABLES.has(table)) return unauthorized(res);
      if (isAuthenticated && !canReadTable(session, table)) return forbidden(res);
      if (!isAuthenticated) {
        const allowedRead = await checkPublicRateLimit(req, "public_read");
        if (!allowedRead) return json(res, 429, { error: "Muitas solicitacoes. Tente novamente mais tarde." });
      }

      const filters = JSON.parse(url.searchParams.get("filters") || "[]");
      const order = JSON.parse(url.searchParams.get("order") || "[]");
      const select = normalizeColumns(url.searchParams.get("select") || "*");
      const forcedFilter = isAuthenticated ? getForcedRowFilter(session, table) : null;
      const effectiveFilters = [
        ...filters,
        ...(!isAuthenticated && table === "hub_vagas" ? [{ column: "status", op: "eq", value: "Aberta" }] : []),
        ...(forcedFilter ? [forcedFilter] : []),
      ];
      const where = buildWhere(effectiveFilters);
      const sql = `select ${select} from public.${quoteIdent(table)}${where.sql}${buildOrder(order)}${buildLimit(url.searchParams.get("limit"))}`;
      const result = await pool.query(sql, where.values);
      const cacheControl = !isAuthenticated ? "public, max-age=30, s-maxage=120, stale-while-revalidate=300" : "private, no-store";
      return json(res, 200, { data: stripSensitiveColumns(table, result.rows) }, cacheControl);
    }

    const body = await getBody(req);

    if (req.method === "POST") {
      let rows = Array.isArray(body.rows) ? body.rows : [body.row || body];
      if (!isAuthenticated) {
        const sanitize = PUBLIC_INSERT_TABLES.get(table);
        if (!sanitize) return unauthorized(res);
        const allowed = await checkPublicRateLimit(req, table);
        if (!allowed) return json(res, 429, { error: "Muitos envios em pouco tempo. Tente novamente mais tarde." });
        rows = rows.map(sanitize);
      } else {
        const columns = [...new Set(rows.flatMap((row) => Object.keys(row || {})))];
        if (!authorizeWrite(session, table, { method: "POST", filters: [], columns })) return forbidden(res);
        const forcedFilter = getForcedRowFilter(session, table);
        if (forcedFilter) rows = rows.map((row) => ({ ...row, [forcedFilter.column]: forcedFilter.value }));
      }
      const ignoreConflict = url.searchParams.get("on_conflict") === "ignore";
      const conflictClause = ignoreConflict ? " on conflict do nothing" : "";
      const inserted = [];
      try {
        for (const row of rows) {
          const entries = Object.entries(row || {}).filter(([, value]) => value !== undefined);
          const columns = entries.map(([key]) => quoteIdent(key));
          const values = entries.map(([key, value]) => normalizeDbValue(table, key, value));
          const placeholders = entries.map(([key], index) => placeholderFor(table, key, index + 1));
          const sql = `insert into public.${quoteIdent(table)} (${columns.join(", ")}) values (${placeholders.join(", ")})${conflictClause} returning *`;
          const result = await pool.query(sql, values);
          if (result.rows[0]) inserted.push(result.rows[0]);
        }
      } catch (error) {
        if (error?.code === "23505") {
          return json(res, 409, { error: "Ja existe um registro com esses dados.", code: error.code });
        }
        throw error;
      }
      return json(res, 200, { data: stripSensitiveColumns(table, inserted) });
    }

    if (!isAuthenticated) return unauthorized(res);

    if (req.method === "PATCH") {
      const filters = Array.isArray(body.filters) ? body.filters : [];
      const row = body.row || {};
      const entries = Object.entries(row).filter(([, value]) => value !== undefined);
      if (!authorizeWrite(session, table, { method: "PATCH", filters, columns: entries.map(([key]) => key) })) return forbidden(res);
      const forcedFilter = getForcedRowFilter(session, table);
      const effectiveFilters = forcedFilter ? [...filters, forcedFilter] : filters;
      const values = entries.map(([key, value]) => normalizeDbValue(table, key, value));
      const sets = entries.map(([key], index) => `${quoteIdent(key)} = ${placeholderFor(table, key, index + 1)}`);
      const where = buildWhere(effectiveFilters);
      const shiftedWhereSql = where.sql.replace(/\$(\d+)/g, (_, number) => `$${Number(number) + values.length}`);
      const sql = `update public.${quoteIdent(table)} set ${sets.join(", ")}${shiftedWhereSql} returning *`;
      const result = await pool.query(sql, values.concat(where.values));
      return json(res, 200, { data: stripSensitiveColumns(table, result.rows) });
    }

    if (req.method === "DELETE") {
      const filters = Array.isArray(body.filters) ? body.filters : [];
      if (!authorizeWrite(session, table, { method: "DELETE", filters, columns: [] })) return forbidden(res);
      const forcedFilter = getForcedRowFilter(session, table);
      const effectiveFilters = forcedFilter ? [...filters, forcedFilter] : filters;
      const where = buildWhere(effectiveFilters);
      const sql = `delete from public.${quoteIdent(table)}${where.sql} returning *`;
      const result = await pool.query(sql, where.values);
      return json(res, 200, { data: result.rows });
    }

    return json(res, 405, { error: "Metodo nao permitido." });
  } catch (error) {
    return safeErrorResponse(res, error, "Erro no banco de dados.");
  }
}
