// Espelha no servidor o mesmo escopo de abas que script.js aplica na
// interface (getAllowedViewsForCurrentUser). Sem isso, qualquer conta
// autenticada - mesmo Gerente ou Recepcionista - conseguia ler/escrever
// qualquer tabela so chamando /api/records direto, ignorando o que a UI
// esconde dela.

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

// Frederico, Jucimara, Alex e Jose Alcione - mesmo criterio de
// hasFredericoLevelAccess() em script.js.
function hasFredericoLevelAccess(session) {
  return matchesName(session, "frederico")
    || matchesName(session, "jucimara")
    || matchesName(session, "alex", "alexsandro")
    || matchesName(session, "alcione", "jose alcione");
}

function isAriel(session) {
  return matchesName(session, "ariel");
}

// Tabelas que Gerente/Recepcionista continuam usando (chat, quadros,
// calendario, conta); Gerente tambem enxerga Documentos de Uso Geral.
const BASE_RESTRICTED_TABLES = new Set(["hub_chat_messages", "hub_quadros", "hub_eventos", "hub_users", "hub_read_receipts"]);
const MANAGER_TABLES = new Set([...BASE_RESTRICTED_TABLES, "hub_documentos"]);
const RECEPTIONIST_TABLES = BASE_RESTRICTED_TABLES;

// Denuncias e Feedbacks (Fale com a diretoria) ficam restritos mesmo para
// quem tem acesso amplo, igual a interface (so Frederico/Ariel/nivel Frederico).
const FREDERICO_ONLY_TABLES = new Set(["hub_denuncias", "hub_feedbacks"]);

export function getReadableTables(session) {
  if (isManager(session)) return MANAGER_TABLES;
  if (isReceptionist(session)) return RECEPTIONIST_TABLES;
  if (hasFredericoLevelAccess(session) || isAriel(session)) return null; // null = todas as tabelas da allowlist
  return { exclude: FREDERICO_ONLY_TABLES };
}

export function canReadTable(session, table) {
  const readable = getReadableTables(session);
  if (readable === null) return true;
  if (readable instanceof Set) return readable.has(table);
  return !readable.exclude.has(table);
}

// hub_users e o unico caso onde a escrita precisa de uma regra propria: sem
// isso, qualquer conta consegue trocar o proprio cargo (ou o de outra
// pessoa) direto pela API.
export function authorizeUsersWrite(session, { method, filters, columns }) {
  if (isRh(session)) return true;
  if (method === "POST") return false; // criar usuario e so RH

  const idFilters = (Array.isArray(filters) ? filters : []).filter((filter) => filter?.column === "id" && filter?.op === "eq");
  const isSelfOnly = idFilters.length === 1 && (Array.isArray(filters) ? filters : []).length === 1
    && String(idFilters[0].value) === String(session?.user?.id || "");
  if (!isSelfOnly) return false;
  if (method === "DELETE") return false; // ninguem apaga a propria conta por aqui

  const SAFE_SELF_COLUMNS = new Set(["nome", "foto_perfil", "configuracoes"]);
  return (columns || []).every((column) => SAFE_SELF_COLUMNS.has(column));
}

export function authorizeWrite(session, table, context) {
  if (table === "hub_users") return authorizeUsersWrite(session, context);
  return canReadTable(session, table);
}

// Gerente so enxerga na UI os documentos que ele mesmo gerou
// (canCurrentUserAccessDocumentRecord em script.js); sem forcar isso tambem
// aqui, dava pra ler/editar/apagar o documento de outro gerente so chamando
// a API direto com outro id.
export function getForcedRowFilter(session, table) {
  if (table === "hub_documentos" && isManager(session)) {
    const nome = String(session?.user?.user_metadata?.nome || "").trim();
    // Sem nome no perfil, nao da pra provar propriedade de nada - nao filtra por engano pra tudo.
    return { column: "created_by", op: "eq", value: nome || " sem-nome " };
  }
  return null;
}
