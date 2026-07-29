
export function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
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
const rhOrManager = { read: (user) => isRh(user) || isManager(user), write: (user) => isRh(user) || isManager(user) };

function isOwnedBoard(user, row) {
  const createdBy = normalizeName(row?.created_by);
  const ownerName = row?.owner_name || (!["auto-sync", "sistema", "system"].includes(createdBy) ? row?.created_by : "") || row?.nome;
  return normalizeName(ownerName) === normalizeName(user?.nome);
}

export const RECORD_RULES = {
  denuncias: { table: "hub_denuncias", ...rhOnly },
  comunicados: {
    table: "hub_chat_messages",
    read: (user) => Boolean(user),
    write: (user, row) => canAccessChatChannel(user, row?.canal),
    canReadRow: (user, row) => canAccessChatChannel(user, row?.canal),
    updateDelete: (user) => isRh(user),
  },
  malotes: { table: "hub_malotes", jsonbColumns: ["colaboradores"], ...rhOnly },
  chamados: { table: "hub_chamados", ...rhOnly },
  quadros: { table: "hub_quadros", jsonbColumns: ["listas"], ...rhOrManager, canReadRow: isOwnedBoard },
  vagas: { table: "hub_vagas", ...rhOnly },
  eventos: { table: "hub_eventos", ...rhOnly },
  vtRegistros: { table: "hub_vt_registros", ...rhOnly },
  documentosContratados: { table: "hub_documentos_contratados", jsonbColumns: ["documentos"], ...rhOnly },
  documentos: {
    table: "hub_documentos",
    jsonbColumns: ["dados"],
    ...rhOrManager,
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
