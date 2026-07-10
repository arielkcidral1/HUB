// Porta para JS da autorizacao que antes vivia em RLS (sql/01_schema_rls.sql).
// Cada tabela hub_* so e' acessivel atraves da API, entao esta e' agora a
// unica linha de defesa (nao ha mais Postgres RLS por baixo).

export function normalizeName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function isRh(user) {
  return String(user?.cargo || "").toLowerCase() === "rh";
}

export function isManager(user) {
  return ["gerente", "manager"].includes(String(user?.cargo || "").toLowerCase());
}

export function isCashier(user) {
  return ["caixa", "crediarista"].includes(String(user?.cargo || "").toLowerCase());
}

export function canAccessChatChannel(user, channelId) {
  const channel = String(channelId || "");
  if (isRh(user)) return true;
  const name = normalizeName(user?.nome);
  if (isManager(user)) {
    if (channel === "geral-gerentes") return true;
    if (channel.startsWith("dm:") && channel.includes(name)) return true;
  }
  if (isCashier(user)) {
    if (channel === "geral-caixa") return true;
    if (channel.startsWith("dm:") && channel.includes(name)) return true;
  }
  return false;
}

const rhOnly = { read: (user) => isRh(user), write: (user) => isRh(user) };

// Mapa collection (chave usada pelo frontend) -> { table, read, write, ... }.
// read/write recebem (user) e devem retornar boolean; para "comunicados" o
// acesso depende tambem da linha (canal), tratado a parte no handler.
export const RECORD_RULES = {
  denuncias: { table: "hub_denuncias", ...rhOnly },
  comunicados: {
    table: "hub_chat_messages",
    read: (user) => Boolean(user), // filtragem por canal e' feita linha a linha
    write: (user, row) => canAccessChatChannel(user, row?.canal),
    canReadRow: (user, row) => canAccessChatChannel(user, row?.canal),
    updateDelete: (user) => isRh(user),
  },
  malotes: { table: "hub_malotes", ...rhOnly },
  chamados: { table: "hub_chamados", ...rhOnly },
  vagas: { table: "hub_vagas", ...rhOnly },
  eventos: { table: "hub_eventos", ...rhOnly },
  vtRegistros: { table: "hub_vt_registros", ...rhOnly },
  documentosContratados: { table: "hub_documentos_contratados", ...rhOnly },
  documentos: {
    table: "hub_documentos",
    read: (user) => isRh(user) || isManager(user),
    write: (user) => isRh(user) || isManager(user),
  },
  candidaturas: { table: "hub_candidaturas", ...rhOnly },
  atestados: { table: "hub_atestados", ...rhOnly },
  usuarios: {
    table: "hub_users",
    read: (user) => Boolean(user),
    write: (user) => isRh(user),
  },
};

export function isArielUser(user) {
  return normalizeName(user?.nome) === "ariel";
}
