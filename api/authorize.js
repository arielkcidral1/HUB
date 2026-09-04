function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function stripAccents(value) {
  return normalize(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function matchesName(session, ...targets) {
  const user = session?.user || {};
  const candidates = [
    user.email,
    user.email ? String(user.email).split("@")[0] : "",
    user.user_metadata?.nome,
    user.user_metadata?.name,
  ];
  const normalizedTargets = targets.map(stripAccents);
  return candidates.some((candidate) => {
    const normalized = stripAccents(candidate);
    return normalized && normalizedTargets.some((target) => normalized === target || normalized.startsWith(target));
  });
}

function getCargo(session) {
  return normalize(session?.user?.app_metadata?.cargo || session?.user?.user_metadata?.cargo || "");
}

function isManager(session) {
  return getCargo(session) === "gerente";
}

function isReceptionist(session) {
  return getCargo(session) === "recepcionista";
}

function isRh(session) {
  return getCargo(session) === "rh";
}

function hasFredericoLevelAccess(session) {
  return matchesName(session, "frederico")
    || matchesName(session, "jucimara")
    || matchesName(session, "alex", "alexsandro")
    || matchesName(session, "alcione", "jose alcione")
    || matchesName(session, "andre barbosa");
}

function isAriel(session) {
  return matchesName(session, "ariel");
}

function isVanessa(session) {
  return matchesName(session, "vanessa");
}

const BASE_RESTRICTED_TABLES = new Set(["hub_chat_messages", "hub_quadros", "hub_eventos", "hub_users", "hub_read_receipts"]);
const MANAGER_TABLES = new Set([...BASE_RESTRICTED_TABLES, "hub_documentos"]);
const RECEPTIONIST_TABLES = BASE_RESTRICTED_TABLES;

const FREDERICO_ONLY_TABLES = new Set(["hub_denuncias", "hub_feedbacks"]);
const VANESSA_ONLY_TABLES = new Set(["hub_feedbacks"]);
const ARIEL_ONLY_TABLES = new Set(["hub_clima_pesquisas"]);

export function getReadableTables(session) {
  if (isManager(session)) return MANAGER_TABLES;
  if (isReceptionist(session)) return RECEPTIONIST_TABLES;
  if (hasFredericoLevelAccess(session) || isAriel(session)) return null;
  if (isVanessa(session)) return { exclude: VANESSA_ONLY_TABLES };
  return { exclude: FREDERICO_ONLY_TABLES };
}

export function canReadTable(session, table) {
  if (ARIEL_ONLY_TABLES.has(table)) return isAriel(session);
  const readable = getReadableTables(session);
  if (readable === null) return true;
  if (readable instanceof Set) return readable.has(table);
  return !readable.exclude.has(table);
}

export function authorizeUsersWrite(session, { method, filters, columns }) {
  if (isRh(session)) return true;
  if (method === "POST") return false;

  const idFilters = (Array.isArray(filters) ? filters : []).filter((filter) => filter?.column === "id" && filter?.op === "eq");
  const isSelfOnly = idFilters.length === 1 && (Array.isArray(filters) ? filters : []).length === 1
    && String(idFilters[0].value) === String(session?.user?.id || "");
  if (!isSelfOnly) return false;
  if (method === "DELETE") return false;

  const SAFE_SELF_COLUMNS = new Set(["nome", "foto_perfil", "configuracoes"]);
  return (columns || []).every((column) => SAFE_SELF_COLUMNS.has(column));
}

export function authorizeWrite(session, table, context) {
  if (table === "hub_users") return authorizeUsersWrite(session, context);
  return canReadTable(session, table);
}

export function getForcedRowFilter(session, table) {
  if (table === "hub_documentos" && isManager(session)) {
    const nome = String(session?.user?.user_metadata?.nome || "").trim();
    return { column: "created_by", op: "eq", value: nome || " sem-nome " };
  }
  return null;
}
