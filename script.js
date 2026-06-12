const STORAGE_KEY = "hub-rh-data";
const DOCUMENT_RECORDS_KEY = "hub-document-records";
const SESSION_KEY = "hub-rh-session";
const TEAM_USERS_KEY = "hub-team-users";
const TEAM_CREDENTIALS_KEY = "hub-team-credentials";
const READ_RH_MESSAGES_KEY = "hub-rh-read-message-ids";
const RH_CHANNEL = "rh";
const TEAM_DELETE_PASSWORD = "160712";
const LOGIN_USERS = {
  ariel: { nome: "Ariel", senha: "arielc" },
  andrei: { nome: "Andrei", senha: "1208" },
  patricia: { nome: "Patricia", senha: "1102" },
  dani: { nome: "Dani", senha: "926710" },
  vanessa: { nome: "Vanessa", senha: "521216" },
};
const LOGIN_DISPLAY_NAMES = {
  ariel: "Ariel",
  andrei: "Andrei",
  patricia: "Patricia",
  dani: "Dani",
  vanessa: "Vanessa",
};
const USERS_TABLE = "hub_users";
const GENERAL_CHANNEL = "geral";
const TABLES = {
  denuncias: "hub_denuncias",
  comunicados: "hub_chat_messages",
  malotes: "hub_malotes",
  chamados: "hub_chamados",
  vagas: "hub_vagas",
  candidaturas: "hub_candidaturas",
  usuarios: USERS_TABLE,
};

function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

const defaultData = {
  denuncias: [
    {
      id: generateUUID(),
      identificacao: "Anonimo",
      categoria: "Denuncia anonima",
      descricao: "Relato anonimo recebido para avaliacao inicial do RH.",
      status: "Aberta",
      createdAt: "Hoje",
    },
  ],
  comunicados: [
    {
      id: generateUUID(),
      autor: "Marina Souza",
      mensagem: "Revisar pendencias de benefícios, vagas e entregas de EPI.",
      canal: GENERAL_CHANNEL,
      arquivo: null,
      createdAt: "Hoje",
    },
  ],
  malotes: [
    {
      id: generateUUID(),
      destino: "Unidade Norte",
      origem: "Almoxarifado Central",
      epis: "Luvas nitrilicas (10), oculos de protecao (5), protetor auricular (20)",
      status: "Entrega",
      createdAt: "Hoje",
    },
  ],
  chamados: [],
  vagas: [
    {
      id: generateUUID(),
      cargo: "Auxiliar Administrativo",
      projeto: "",
      descricao: "Apoio as rotinas administrativas, organizacao de documentos e atendimento interno.",
      requisitos: "Ensino medio completo, organizacao e conhecimento basico em pacote Office.",
      status: "Aberta",
      createdAt: "Hoje",
    },
  ],
  candidaturas: [],
  usuarios: Object.values(LOGIN_USERS).map((user) => ({
    id: generateUUID(),
    nome: user.nome,
    senha: user.senha,
    cargo: "RH",
    createdAt: "Hoje",
  })),
};

let data = loadLocalData();
let supabaseClient = null;
let realtimeChannel = null;
let activeChatChannel = GENERAL_CHANNEL;
let refreshTimer = null;
let refreshInProgress = false;
let documentRecords = loadDocumentRecords();
let readRhMessageIds = loadReadRhMessageIds();
let chamadosSelectionMode = false;
let showArchivedChamados = false;
let denunciasSelectionMode = false;
let showArchivedDenuncias = false;
window.editingDocId = null;

const documentLabels = {
  admissao: "Checklist de Admissao",
  ausencia: "Entrevista ausencia",
  desligamento: "Entrevista de Desligamento",
  beneficios: "Adesao plano saude e odonto",
  "feedback-operacional": "Feedback operacional",
  "feedback-fredy": "Feedback Fredy Pneus",
  ferias: "Solicitacao de Ferias",
  "movimentacao-pessoal": "MP - Movimentacao Pessoal",
  "requisicao-pessoal": "RP - Requisicao Pessoal",
  "solicitacao-desligamento": "SD - Solicitacao de Desligamento",
};

const UNIT_OPTIONS = [
  "1- MTZ",
  "2- SBS",
  "3- TJA 1",
  "4- PLÇ",
  "5- GUA",
  "7- DPA JC",
  "9- DPA IRI",
  "10- JPL",
  "11- BC",
  "12- GCS GPO",
  "12- GCS JLLE",
  "13- JRG 1",
  "14- BRQ",
  "15- FLN",
  "17- FAC",
  "19- RNG 1",
  "20- BNU 1",
  "21- JRG 2",
  "22- TRINCA",
  "23- ITJ 2",
  "26- BNU 2",
  "28- ARA",
];

const EPI_OPTIONS = [
  "Luva PU",
  "Luva Pigmentada",
  "Luva de Raspa",
  "Luva nitrilica",
  "Oculos Transparente",
  "Oculos Verde",
  "Mascara com Filtro",
  "Respirador PFF2",
  "Protetor Auricular",
  "Protetor Auricular tipo concha",
  "Avental de Raspa",
  "Sapatão",
  "Luva de Vaqueta",
  "Creme de Proteção",
];

function isLoginMatch(value, expected) {
  return String(value || "").trim() === String(expected || "").trim();
}

function normalizeLoginName(value) {
  return String(value || "").trim().toLowerCase();
}

function getLoginDisplayName(value) {
  const normalized = normalizeLoginName(value);
  return LOGIN_DISPLAY_NAMES[normalized] || findLocalTeamUser(value)?.nome || String(value || "").trim();
}

function loadTeamUsersStore() {
  try {
    return JSON.parse(localStorage.getItem(TEAM_USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTeamUsersStore(users) {
  localStorage.setItem(TEAM_USERS_KEY, JSON.stringify(users || []));
}

function loadTeamCredentialsStore() {
  try {
    return JSON.parse(localStorage.getItem(TEAM_CREDENTIALS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTeamCredentialsStore(users) {
  localStorage.setItem(TEAM_CREDENTIALS_KEY, JSON.stringify(users || []));
}

function syncTeamCredentials(users) {
  const credentials = mergeUsersByName(loadTeamCredentialsStore(), users || [])
    .filter((user) => user?.nome && user?.senha)
    .map((user) => ({ nome: user.nome, senha: user.senha }));
  saveTeamCredentialsStore(credentials);
}

function readStoredUsersFromHubData() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return parsed.usuarios || [];
  } catch {
    return [];
  }
}

function getStoredLoginUsers() {
  return mergeUsersByName(
    loadTeamCredentialsStore(),
    mergeUsersByName(loadTeamUsersStore(), readStoredUsersFromHubData())
  );
}

function persistTeamCredential(nome, senha) {
  if (!String(nome || "").trim() || !String(senha || "").trim()) return;
  const credentials = mergeUsersByName(loadTeamCredentialsStore(), [{ nome: String(nome).trim(), senha: String(senha).trim() }]);
  saveTeamCredentialsStore(credentials);
}

function getAllLocalUsers() {
  return mergeUsersByName(
    Object.values(LOGIN_USERS).map((user) => ({
      nome: user.nome,
      senha: user.senha,
      syncStatus: "online",
    })),
    mergeUsersByName(getStoredLoginUsers(), data?.usuarios || [])
  );
}

function findLocalTeamUser(value) {
  const normalized = normalizeLoginName(value);
  return getAllLocalUsers().find((user) => normalizeLoginName(user.nome) === normalized);
}

function getCurrentUserRecord() {
  return findLocalTeamUser(getCurrentUserName());
}

function getUserRoleLabel(value) {
  const normalized = normalizeLoginName(value);
  const role = (data.usuarios || []).find((user) => normalizeLoginName(user.nome) === normalized)?.cargo || findLocalTeamUser(value)?.cargo || "";
  return role ? ` (${role})` : "";
}

function repairTeamCredentialsStore() {
  syncTeamCredentials(mergeUsersByName(loadTeamUsersStore(), data?.usuarios || []));
}

function getDirectChannel(userA, userB) {
  const users = [normalizeLoginName(userA), normalizeLoginName(userB)].sort();
  return `dm:${users[0]}:${users[1]}`;
}

function isDirectChannel(channelId) {
  return String(channelId || "").startsWith("dm:");
}

function getDirectChannelUsers(channelId) {
  if (!isDirectChannel(channelId)) return [];
  return String(channelId).slice(3).split(":").filter(Boolean);
}

function isValidDirectChannel(channelId) {
  const users = getDirectChannelUsers(channelId);
  return users.length === 2 && users[0] !== users[1];
}

function isCurrentUserInChannel(channelId) {
  if (channelId === GENERAL_CHANNEL) return !isManagerUser();
  return isValidDirectChannel(channelId) && getDirectChannelUsers(channelId).includes(normalizeLoginName(getCurrentUserName()));
}

function getTeamUsers() {
  return (data.usuarios || [])
    .slice()
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"));
}

function getChatChannels() {
  const currentUser = getCurrentUserName();
  const directChannels = getTeamUsers().filter((user) => normalizeLoginName(user.nome) !== normalizeLoginName(currentUser)).map((user) => ({
      id: getDirectChannel(currentUser, user.nome),
      label: `${user.nome}${getUserRoleLabel(user.nome)}`,
      subtitle: `Conversa individual com ${user.nome}`,
    }));

  return isManagerUser()
    ? directChannels
    : [
        { id: GENERAL_CHANNEL, label: "Chat geral", subtitle: "Mensagens e arquivos compartilhados pela equipe" },
        ...directChannels,
      ];
}

function getActiveChatChannel() {
  const channels = getChatChannels();
  return channels.find((channel) => channel.id === activeChatChannel) || channels[0];
}

function getAllowedChatChannelIds() {
  return getChatChannels().map((channel) => channel.id);
}

function normalizeChatChannel(canal) {
  if (!canal || canal === GENERAL_CHANNEL) return GENERAL_CHANNEL;
  if (isDirectChannel(canal)) return canal;
  if (canal === RH_CHANNEL) return getDirectChannel(getCurrentUserName(), "Ariel");
  if (String(canal).startsWith("usuario:")) {
    return getDirectChannel(getCurrentUserName(), String(canal).slice("usuario:".length));
  }
  return canal;
}

function canAccessChatChannel(canal) {
  const channel = normalizeChatChannel(canal);
  return (channel === GENERAL_CHANNEL && !isManagerUser()) || (isValidDirectChannel(channel) && isCurrentUserInChannel(channel));
}

function isAllowedLoginName(value) {
  return Boolean(findLocalTeamUser(value));
}

function validateLocalLogin(name, password) {
  const user = findLocalTeamUser(name);
  return Boolean(user && isLoginMatch(password, user.senha));
}

function debugLocalLoginNames() {
  return getAllLocalUsers().map((user) => normalizeLoginName(user.nome)).join(", ");
}

function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === "active";
}

function getCurrentUserName() {
  if (!isAuthenticated() && isPublicPage()) return "Publico";
  return sessionStorage.getItem(`${SESSION_KEY}-user`) || "Voce";
}

function getCurrentUserRole() {
  return sessionStorage.getItem(`${SESSION_KEY}-role`) || "";
}

function isManagerUser() {
  return normalizeLoginName(getCurrentUserRole()) === "gerente";
}

function refreshCurrentUserRoleFromData() {
  if (!isAuthenticated()) return;
  const user = findLocalTeamUser(getCurrentUserName());
  if (user?.cargo) sessionStorage.setItem(`${SESSION_KEY}-role`, user.cargo);
}

function setAuthenticatedUser(name) {
  const user = window.pendingLoginUser || findLocalTeamUser(name);
  sessionStorage.setItem(SESSION_KEY, "active");
  sessionStorage.setItem(`${SESSION_KEY}-user`, getLoginDisplayName(user?.nome || name));
  sessionStorage.setItem(`${SESSION_KEY}-role`, user?.cargo || "");
  window.pendingLoginUser = null;
}

function clearAuthenticatedUser() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(`${SESSION_KEY}-user`);
  sessionStorage.removeItem(`${SESSION_KEY}-role`);
}

async function validateLogin(name, password) {
  const normalizedName = normalizeLoginName(name);
  const normalizedPassword = String(password || "").trim();

  const client = supabaseClient || getSupabaseClient();

  if (client) {
    try {
      let { data: users, error } = await client
        .from(USERS_TABLE)
        .select("nome, senha, cargo");

      if (error && isMissingColumn(error, "cargo")) {
        const fallback = await client
          .from(USERS_TABLE)
          .select("nome, senha");
        users = fallback.data;
        error = fallback.error;
      }

      if (error) throw error;

      const dbUser = (users || []).find(
        (u) => normalizeLoginName(u.nome) === normalizedName
      );

      if (dbUser) {
        // Se o usuário existe no banco, validar estritamente pela senha do banco
        const isMatch = String(dbUser.senha).trim() === normalizedPassword;
        if (isMatch) {
          window.pendingLoginUser = dbUser;
        }
        return isMatch;
      }
    } catch (error) {
      console.error("Erro ao validar usuario no Supabase (tentando offline):", error);
    }
  }

  // Fallback para login local se o banco não responder ou se o usuário só existir localmente
  const localMatch = validateLocalLogin(normalizedName, normalizedPassword);
  if (localMatch) {
    window.pendingLoginUser = findLocalTeamUser(normalizedName);
    return true;
  }

  const errorMsg = document.getElementById("login-error");
  if (errorMsg && !client) {
    console.warn("Não foi possível conectar ao banco. Verifique se o login.html possui os scripts do Supabase.");
    errorMsg.textContent = "Erro de conexão. Verifique os scripts do banco.";
  }
  return false;
}

function isPublicPage() {
  return Boolean(document.querySelector("[data-public-denuncia]") || document.querySelector("[data-public-vagas]") || document.querySelector("[data-public-chamados]"));
}

function isLoginPage() {
  return window.location.pathname.endsWith('login.html');
}

function setupLogin() {
  const loginForm = document.getElementById("login-form");
  const logoutButton = document.getElementById("logout-button");
  repairTeamCredentialsStore();

  // Redirecionamentos Inteligentes
  if (isAuthenticated()) {
    if (isLoginPage()) {
      window.location.href = "index.html";
      return false;
    }
  } else {
    if (!isLoginPage() && !isPublicPage()) {
      window.location.href = "login.html";
      return false;
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const name = form.get("nome");
      const loginOk = await validateLogin(name, form.get("senha"));
  
      if (!loginOk) {
        console.warn("Login local disponivel para:", debugLocalLoginNames());
        const errorEl = document.getElementById("login-error");
        if (errorEl && !errorEl.textContent.includes("banco") && !errorEl.textContent.includes("conexão")) {
          errorEl.textContent = "Nome ou senha incorretos.";
        }
        return;
      }
  
      setAuthenticatedUser(name);
      window.location.href = "index.html";
    });
  }

  logoutButton?.addEventListener("click", () => {
    clearAuthenticatedUser();
    window.location.href = "login.html";
  });

  return isAuthenticated() || isPublicPage();
}

function getSupabaseClient() {
  const config = window.HUB_SUPABASE;
  const hasConfig =
    config &&
    config.url &&
    config.anonKey &&
    !config.url.includes("COLE_AQUI") &&
    !config.anonKey.includes("COLE_AQUI") &&
    window.supabase;

  if (!hasConfig) return null;
  return window.supabase.createClient(config.url, config.anonKey);
}

function setSyncStatus(text, isOnline = false) {
  const target = document.getElementById("sync-status");
  if (!target) return;
  target.textContent = text;
  document.querySelector(".status-dot")?.classList.toggle("offline", !isOnline);
}

function loadLocalData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultData;

  try {
    const parsed = JSON.parse(saved);
    parsed.comunicados = (parsed.comunicados || []).map((item) => ({
      id: item.id || generateUUID(),
      autor: item.autor || "Equipe RH",
      mensagem: item.mensagem || item.titulo || "",
      canal: normalizeChatChannel(item.canal),
      arquivo: item.arquivo || null,
      createdAt: item.createdAt || "Hoje",
    }));
    return {
      denuncias: parsed.denuncias || [],
      comunicados: parsed.comunicados || [],
      malotes: parsed.malotes || [],
      chamados: parsed.chamados || [],
      vagas: parsed.vagas || [],
      candidaturas: parsed.candidaturas || [],
      usuarios: mergeUsersByName(parsed.usuarios || defaultData.usuarios, loadTeamUsersStore()),
    };
  } catch {
    return defaultData;
  }
}

function loadDocumentRecords() {
  try {
    return JSON.parse(localStorage.getItem(DOCUMENT_RECORDS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveDocumentRecords() {
  localStorage.setItem(DOCUMENT_RECORDS_KEY, JSON.stringify(documentRecords));
}

function saveLocalData() {
  if (data?.usuarios) {
    saveTeamUsersStore(data.usuarios);
    syncTeamCredentials(data.usuarios);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function ensureRequiredTeamUsers() {
  if (!data.usuarios) data.usuarios = [];

  Object.values(LOGIN_USERS).forEach((requiredUser) => {
    const existingIndex = data.usuarios.findIndex((user) => normalizeLoginName(user.nome) === normalizeLoginName(requiredUser.nome));

    if (existingIndex >= 0) {
      if (!data.usuarios[existingIndex].cargo) {
        data.usuarios[existingIndex].cargo = "RH";
      }
    } else {
      data.usuarios.push({
        id: generateUUID(),
        nome: requiredUser.nome,
        senha: requiredUser.senha,
        cargo: "RH",
        syncStatus: "local",
        createdAt: todayLabel(),
      });
    }
  });
}

function mergeUsersByName(currentUsers = [], incomingUsers = []) {
  const merged = new Map();

  [...currentUsers, ...incomingUsers].forEach((user) => {
    if (!user?.nome) return;
    const key = normalizeLoginName(user.nome);
    const existing = merged.get(key);
    merged.set(key, {
      ...(existing || {}),
      ...user,
      id: user.id || existing?.id || generateUUID(),
      createdAt: user.createdAt || existing?.createdAt || todayLabel(),
    });
  });

  return [...merged.values()];
}

function loadReadRhMessageIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(READ_RH_MESSAGES_KEY) || "[]");
    return new Set(saved.map(String));
  } catch {
    return new Set();
  }
}

function saveReadRhMessageIds() {
  localStorage.setItem(READ_RH_MESSAGES_KEY, JSON.stringify([...readRhMessageIds]));
}

function getUnreadRhMessages() {
  const currentUser = getCurrentUserName();
  return data.comunicados.filter(
    (item) => isDirectChannel(normalizeChatChannel(item.canal)) && isCurrentUserInChannel(normalizeChatChannel(item.canal)) && item.autor !== currentUser && !readRhMessageIds.has(String(item.id))
  );
}

function markRhMessagesRead() {
  const currentChannel = activeChatChannel;
  const unread = getUnreadRhMessages().filter((item) => normalizeChatChannel(item.canal) === currentChannel);
  if (!unread.length) return;
  unread.forEach((item) => readRhMessageIds.add(String(item.id)));
  saveReadRhMessageIds();
}

function checkAndMarkChatAsRead() {
  const communicationView = document.getElementById("comunicacao");
  if (!communicationView?.classList.contains("active") || !isDirectChannel(activeChatChannel) || !isCurrentUserInChannel(activeChatChannel)) return;
  markRhMessagesRead();
  renderDashboard();
}

function renderCurrentUser() {
  const target = document.getElementById("current-user");
  const avatar = document.getElementById("current-user-avatar");
  if (!target && !avatar) return;

  const user = getCurrentUserRecord();
  if (target) target.textContent = getCurrentUserName();
  if (avatar) {
    if (user?.foto_perfil) {
      avatar.src = user.foto_perfil;
      avatar.style.display = "block";
    } else {
      avatar.src = "";
      avatar.style.display = "none";
    }
  }
}

function populateUnitSelects() {
  document.querySelectorAll("[data-unit-select]").forEach((select) => {
    const currentValue = select.value;
    const placeholder = select.dataset.unitPlaceholder || "Selecione uma unidade";
    select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>` + UNIT_OPTIONS
      .map((unit) => `<option value="${escapeHtml(unit)}">${escapeHtml(unit)}</option>`)
      .join("");

    if (currentValue) {
      const hasCurrent = [...select.options].some((option) => option.value === currentValue);
      if (!hasCurrent) {
        select.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(currentValue)}">${escapeHtml(currentValue)}</option>`);
      }
      select.value = currentValue;
    }
  });
}

function setFieldValue(field, value) {
  if (!field) return;
  if (field.tagName === "SELECT" && value && ![...field.options].some((option) => option.value === value)) {
    field.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`);
  }
  field.value = value || "";
}

function getSelectedMaloteDestino() {
  return document.getElementById("malote-destino-filter")?.value || "";
}

function getFilteredMalotes() {
  const selectedDestino = getSelectedMaloteDestino();
  if (!selectedDestino) return data.malotes;
  return data.malotes.filter((item) => item.destino === selectedDestino);
}

function renderMaloteReport() {
  const target = document.getElementById("malote-report");
  if (!target) return;

  const selectedDestino = getSelectedMaloteDestino();
  const source = getFilteredMalotes();
  const byDestino = data.malotes.reduce((acc, item) => {
    const key = item.destino || "Sem destino";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topDestino = Object.entries(byDestino).sort((a, b) => b[1] - a[1])[0];
  const separacao = source.filter((item) => item.status === "Separação").length;
  const entrega = source.filter((item) => item.status === "Entrega").length;

  target.innerHTML = `
    <article class="report-chip">
      <span>${selectedDestino ? "Destino filtrado" : "Total geral"}</span>
      <strong>${source.length}</strong>
      <small>${escapeHtml(selectedDestino || "Todos os destinos")}</small>
    </article>
    <article class="report-chip">
      <span>Em separacao</span>
      <strong>${separacao}</strong>
      <small>Malotes pendentes</small>
    </article>
    <article class="report-chip">
      <span>Em entrega</span>
      <strong>${entrega}</strong>
      <small>Malotes em entrega</small>
    </article>
    <article class="report-chip">
      <span>Destino com mais malotes</span>
      <strong>${topDestino ? topDestino[1] : 0}</strong>
      <small>${escapeHtml(topDestino ? topDestino[0] : "Sem dados")}</small>
    </article>
  `;
}

function formatDate(value) {
  if (!value) return "Hoje";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "Hoje";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCpf(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatRg(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}-${digits.slice(8)}`;
}

function isTodayLabel(value) {
  return value === todayLabel() || value === "Hoje";
}

function formatEpiItems(items) {
  return items
    .filter((item) => item.nome && item.quantidade)
    .map((item) => `${item.nome} (${item.quantidade}${item.tamanho ? `, ${item.tamanho}` : ""})`)
    .join(", ");
}

function readEpiItems(formElement) {
  return [...formElement.querySelectorAll(".epi-row")]
    .map((row) => ({
      nome: row.querySelector('[name="epi_nome[]"]')?.value.trim() || "",
      quantidade: row.querySelector('[name="epi_quantidade[]"]')?.value.trim() || "",
      tamanho: row.querySelector('[name="epi_tamanho[]"]')?.value.trim() || "",
    }))
    .filter((item) => item.nome && item.quantidade);
}

function createEpiRow(nome = "", quantidade = "") {
  return `
    <div class="epi-row">
      <label>Nome
        <input name="epi_nome[]" placeholder="Capacete, luvas, oculos..." value="${escapeHtml(nome)}" required />
      </label>
      <label>Quantidade
        <input name="epi_quantidade[]" type="number" min="1" step="1" placeholder="1" value="${escapeHtml(quantidade)}" required />
      </label>
      <button class="danger-button remove-epi" type="button" aria-label="Remover EPI">Remover</button>
    </div>
  `;
}

function createChamadoEpiRow(nome = "", quantidade = "", tamanho = "Nao se aplica") {
  const optionValues = nome && !EPI_OPTIONS.includes(nome) ? [nome, ...EPI_OPTIONS] : EPI_OPTIONS;
  const options = '<option value="">Selecione</option>' + optionValues
    .map((item) => `<option value="${escapeHtml(item)}" ${item === nome ? "selected" : ""}>${escapeHtml(item)}</option>`)
    .join("");
  const sizeOptions = ["Nao se aplica", "PP", "P", "M", "G", "GG", "EG"]
    .map((item) => `<option value="${escapeHtml(item)}" ${item === tamanho ? "selected" : ""}>${escapeHtml(item)}</option>`)
    .join("");

  return `
    <div class="epi-row">
      <label>Nome
        <select name="epi_nome[]" data-epi-select required>${options}</select>
      </label>
      <label>Quantidade
        <input name="epi_quantidade[]" type="number" min="1" step="1" placeholder="1" value="${escapeHtml(quantidade)}" required />
      </label>
      <label>Tamanho
        <select name="epi_tamanho[]" required>${sizeOptions}</select>
      </label>
      <button class="danger-button remove-epi" type="button" aria-label="Remover EPI">Remover</button>
    </div>
  `;
}

function populateEpiSelects() {
  document.querySelectorAll("[data-epi-select]").forEach((select) => {
    const currentValue = select.value;
    select.innerHTML = '<option value="">Selecione</option>' + EPI_OPTIONS
      .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
      .join("");
    if (currentValue) select.value = currentValue;
  });
}

function resetEpiRows(items = [{ nome: "", quantidade: "", tamanho: "Nao se aplica" }]) {
  const list = document.getElementById("epi-list");
  if (!list) return;
  list.innerHTML = items.length
    ? items.map((item) => createChamadoEpiRow(item.nome, item.quantidade, item.tamanho || "Nao se aplica")).join("")
    : createChamadoEpiRow();
}

function parseEpiItems(value) {
  const text = String(value || "").trim();
  if (!text) return [];

  const items = [];
  const pattern = /([^,(]+?)\s*\(([^)]*)\)\s*,?/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const details = String(match[2] || "").split(",").map((item) => item.trim());
    items.push({
      nome: String(match[1] || "").trim(),
      quantidade: details[0] || "1",
      tamanho: details[1] || "Nao se aplica",
    });
  }

  if (items.length) return items.filter((item) => item.nome);

  return text
    .split(/\n|;/)
    .map((part) => ({
      nome: part.trim(),
      quantidade: "1",
      tamanho: "Nao se aplica",
    }))
    .filter((item) => item.nome);
}

function renderMaloteEpisDetails(epis) {
  const items = parseEpiItems(epis);
  if (!items.length) return `<p><strong>EPI:</strong> ${escapeHtml(epis || "Nao informado")}</p>`;

  return items
    .map((item) => `
      <div class="malote-epi-detail">
        <p><strong>EPI:</strong> ${escapeHtml(item.nome || "Nao informado")}</p>
        <p><strong>Tamanho do EPI:</strong> ${escapeHtml(item.tamanho || "Nao se aplica")}</p>
        <p><strong>Quantidade:</strong> ${escapeHtml(item.quantidade || "1")}</p>
      </div>
    `)
    .join("");
}

function todayLabel() {
  return formatDate(new Date().toISOString());
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function badgeClass(value) {
  return ["Urgente", "Alta", "Aberta"].includes(value) ? "tag alert" : "tag";
}

function showModal(title, text, type = "info") {
  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header ${type}">
        ${escapeHtml(title)}
      </div>
      <div class="modal-body">${escapeHtml(text)}</div>
      <div class="modal-footer">
        <button class="primary-button" onclick="document.getElementById('custom-modal').remove()">Entendi</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function showPasswordActionModal({ title, text, confirmText = "Confirmar", danger = false, onConfirm }) {
  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header ${danger ? "error" : "info"}">${escapeHtml(title)}</div>
      <div class="modal-body">
        <p>${escapeHtml(text)}</p>
        <label class="modal-password-label">Senha de autorizacao
          <input id="modal-action-password" type="password" autocomplete="current-password" placeholder="Digite a senha" />
        </label>
        <p class="form-feedback error" id="modal-action-error" hidden>Senha incorreta.</p>
      </div>
      <div class="modal-footer modal-footer-split">
        <button class="secondary-link" type="button" data-modal-cancel>Cancelar</button>
        <button class="${danger ? "danger-button" : "primary-button"}" type="button" data-modal-confirm>${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  overlay.querySelector("[data-modal-cancel]").addEventListener("click", close);
  overlay.querySelector("[data-modal-confirm]").addEventListener("click", async () => {
    const password = overlay.querySelector("#modal-action-password").value;
    const error = overlay.querySelector("#modal-action-error");
    if (String(password).trim() !== TEAM_DELETE_PASSWORD) {
      error.hidden = false;
      return;
    }

    await onConfirm();
    close();
  });

  overlay.querySelector("#modal-action-password").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      overlay.querySelector("[data-modal-confirm]").click();
    }
  });

  document.body.appendChild(overlay);
  overlay.querySelector("#modal-action-password").focus();
}

function showConfirmActionModal({ title, text, confirmText = "Confirmar", danger = false, onConfirm }) {
  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header ${danger ? "error" : "info"}">${escapeHtml(title)}</div>
      <div class="modal-body"><p>${escapeHtml(text)}</p></div>
      <div class="modal-footer modal-footer-split">
        <button class="secondary-link" type="button" data-modal-cancel>Cancelar</button>
        <button class="${danger ? "danger-button" : "primary-button"}" type="button" data-modal-confirm>${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  overlay.querySelector("[data-modal-cancel]").addEventListener("click", close);
  overlay.querySelector("[data-modal-confirm]").addEventListener("click", async () => {
    await onConfirm();
    close();
  });

  document.body.appendChild(overlay);
  overlay.querySelector("[data-modal-confirm]").focus();
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function parseChatMessage(row) {
  const text = row.mensagem || "";
  const match = text.match(/^\[hub-channel:([^\]]+)\]\s*/);
  return {
      canal: normalizeChatChannel(match ? match[1] : row.canal),
    mensagem: match ? text.slice(match[0].length) : text,
  };
}

function mapRows(collection, rows) {
  if (collection === "denuncias") {
    return rows.map((row) => ({
      id: row.id,
      identificacao: row.identificacao,
      categoria: row.categoria,
      descricao: row.descricao,
      status: row.status || "Aberta", // Garante o mapeamento do status
      createdBy: row.created_by || "Sistema",
      createdAt: formatDateTime(row.created_at),
    }));
  }

  if (collection === "comunicados") {
    return rows.map((row) => {
      const parsed = parseChatMessage(row);
      return {
        id: row.id,
        autor: row.autor,
        mensagem: parsed.mensagem,
        canal: parsed.canal,
        createdBy: row.created_by || row.autor,
        arquivo: row.arquivo_nome
          ? {
              name: row.arquivo_nome,
              size: row.arquivo_tamanho,
              type: row.arquivo_tipo,
              url: row.arquivo_url,
            }
          : null,
        createdAt: formatDateTime(row.created_at),
      };
    });
  }

  if (collection === "malotes") {
    return rows.map((row) => ({
      id: row.id,
      destino: row.destino,
      origem: row.origem || "",
      epis: row.epis,
      status: row.status,
      createdBy: row.created_by || "Sistema",
      updatedBy: row.updated_by || "",
      createdAt: formatDate(row.created_at),
    }));
  }

  if (collection === "chamados") {
    return rows.map((row) => ({
      id: row.id,
      solicitante: row.solicitante,
      unidade: row.unidade,
      setor: row.setor || "",
      epis: row.epis,
      observacoes: row.observacoes || "",
      status: row.status || "Aberto",
      createdAt: formatDateTime(row.created_at),
    }));
  }

  if (collection === "candidaturas") {
    return rows.map((row) => ({
      id: row.id,
      vaga_id: row.vaga_id,
      nome: row.nome,
      telefone: row.telefone || "",
      cpf: row.cpf,
      curriculo_url: row.curriculo_url,
      createdBy: row.created_by || row.nome,
      createdAt: formatDate(row.created_at),
    }));
  }

  if (collection === "usuarios") {
    return rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      senha: row.senha,
      cargo: row.cargo || "",
      foto_perfil: row.foto_perfil || "",
      createdBy: row.created_by || "Sistema",
      createdAt: formatDate(row.created_at),
    }));
  }

  return rows.map((row) => {
    const legacyDetails = parseLegacyJobDetails(row.projeto);
    return {
      id: row.id,
      cargo: row.cargo,
      projeto: "",
      descricao: row.descricao || legacyDetails.descricao,
      requisitos: row.requisitos || legacyDetails.requisitos,
      status: row.status,
      createdBy: row.created_by || "Sistema",
      createdAt: formatDate(row.created_at),
    };
  });
}

function mergeRealtimeRow(collection, row, action = "INSERT") {
  if (action === "DELETE") {
    if (collection === "usuarios") {
      removeLocalUser(row.id);
      return;
    }
    const current = data[collection] || [];
    data[collection] = current.filter((item) => String(item.id) !== String(row.id));
    return;
  }

  const mapped = mapRows(collection, [row])[0];
  const current = data[collection] || [];

  const index = current.findIndex((item) => String(item.id) === String(mapped.id) || (collection === "usuarios" && normalizeLoginName(item.nome) === normalizeLoginName(mapped.nome)));
  if (index >= 0) {
    data[collection] = current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...mapped } : item));
  } else {
    data[collection] = [mapped, ...current];
  }
}

function renderRealtimeUpdate(collection) {
  saveLocalData();

  if (collection === "comunicados") {
    renderDashboard();
    renderChatChannels();
    renderChat();
    return;
  }

  if (collection === "usuarios") {
    ensureRequiredTeamUsers();
    renderDashboard();
    renderTeamUsers();
    renderChatChannels();
    renderChat();
    return;
  }

  renderAll();
}

function toDbPayload(collection, values) {
  if (collection === "comunicados") {
    return {
      autor: values.autor,
      canal: normalizeChatChannel(values.canal),
      mensagem: values.mensagem || "",
      created_by: values.createdBy || values.autor || getCurrentUserName(),
      arquivo_nome: values.arquivo?.name || null,
      arquivo_tamanho: values.arquivo?.size || null,
      arquivo_tipo: values.arquivo?.type || null,
      arquivo_url: values.arquivo?.url || null,
    };
  }

  if (collection === "usuarios") {
    return {
      nome: values.nome,
      senha: values.senha,
      cargo: values.cargo || "",
      created_by: values.createdBy || getCurrentUserName(),
    };
  }

  if (collection === "vagas") {
    return {
      cargo: values.cargo,
      projeto: JSON.stringify({
        descricao: values.descricao || "",
        requisitos: values.requisitos || "",
      }),
      descricao: values.descricao || "",
      requisitos: values.requisitos || "",
      status: values.status || "Aberta",
      created_by: values.createdBy || getCurrentUserName(),
    };
  }

  if (collection === "malotes") {
    return {
      destino: values.destino,
      origem: values.origem || "",
      epis: values.epis,
      status: values.status || "Separação",
      created_by: values.createdBy || getCurrentUserName(),
      updated_by: values.updatedBy || null,
    };
  }

  if (collection === "chamados") {
    const payload = {};
    if ("solicitante" in values) payload.solicitante = values.solicitante;
    if ("unidade" in values) payload.unidade = values.unidade;
    if ("setor" in values) payload.setor = values.setor || "";
    if ("epis" in values) payload.epis = values.epis;
    if ("observacoes" in values) payload.observacoes = values.observacoes || "";
    payload.status = values.status || "Aberto";
    payload.created_by = values.createdBy || getCurrentUserName();
    return payload;
  }

  const { createdBy, ...payload } = values;
  return {
    ...payload,
    created_by: createdBy || getCurrentUserName(),
  };
}

function withoutCreatedBy(payload) {
  const { created_by, ...rest } = payload;
  return rest;
}

function withoutUpdatedBy(payload) {
  const { updated_by, ...rest } = payload;
  return rest;
}

function isMissingCreatedByColumn(error) {
  const message = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`;
  return message.includes("created_by");
}

function isMissingColumn(error, columnName) {
  const message = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`;
  return message.includes(columnName);
}

function parseLegacyJobDetails(projeto) {
  try {
    const parsed = JSON.parse(projeto || "{}");
    return {
      descricao: parsed.descricao || "",
      requisitos: parsed.requisitos || "",
    };
  } catch {
    return {
      descricao: "",
      requisitos: "",
    };
  }
}

function withoutOptionalJobColumns(payload) {
  const { descricao, requisitos, created_by, ...rest } = payload;
  return rest;
}

function withoutOptionalApplicationColumns(payload) {
  const { telefone, created_by, ...rest } = payload;
  return rest;
}

async function loadFromSupabase(options = {}) {
  const { setupLive = true } = options;

  if (!supabaseClient) {
    setSyncStatus("Modo local", false);
    renderAll();
    return;
  }

  try {
    const requests = await Promise.allSettled(
      Object.entries(TABLES).map(async ([collection, table]) => {
        let query = supabaseClient.from(table).select("*").order("created_at", { ascending: false });
        if (collection === "comunicados") {
          query = query.in("canal", getAllowedChatChannelIds());
        }

        const { data: rows, error } = await query;
        if (error) throw error;
        return [collection, mapRows(collection, rows || [])];
      })
    );

    requests.forEach((result) => {
      if (result.status === "fulfilled") {
        const [collection, rows] = result.value;

        if (collection === "usuarios" && supabaseClient) {
          const dbNames = (rows || []).map((u) => normalizeLoginName(u.nome));
          
          data.usuarios = (data.usuarios || []).filter((localUser) => {
            const norm = normalizeLoginName(localUser.nome);
            if (dbNames.includes(norm) || Object.keys(LOGIN_USERS).includes(norm)) {
              return true;
            }
            if (localUser.syncStatus === "local") {
              supabaseClient.from(USERS_TABLE).insert({
                nome: localUser.nome,
                senha: localUser.senha,
                created_by: "Auto-Sync"
              }).then();
              return true;
            }
            return false; // Usuário foi deletado da nuvem, remove do cache local!
          });
        }

        data[collection] = collection === "usuarios" ? mergeUsersByName(data.usuarios, rows) : rows;
      } else {
        console.error("Erro ao carregar colecao do Supabase:", result.reason);
      }
    });
    ensureRequiredTeamUsers();
    saveLocalData();
    if (setupLive) {
      setupRealtime();
      setupAutoRefresh();
    }
    const hasFailures = requests.some((result) => result.status === "rejected");
    setSyncStatus(hasFailures ? "Supabase parcial" : "Supabase EIXO online", !hasFailures);
    renderAll();
  } catch (error) {
    console.error("Erro ao carregar Supabase:", error);
    setSyncStatus("Supabase pendente", false);
    renderAll();
  }
}

async function refreshFromSupabase() {
  if (!supabaseClient || refreshInProgress) return;

  refreshInProgress = true;
  try {
    await loadFromSupabase({ setupLive: false });
  } finally {
    refreshInProgress = false;
  }
}

function setupAutoRefresh() {
  if (refreshTimer) return;

  refreshTimer = window.setInterval(() => {
    if (document.visibilityState === "visible") {
      refreshFromSupabase();
    }
  }, 15000);
}

function setupRealtime() {
  if (!supabaseClient || realtimeChannel) return;

  realtimeChannel = supabaseClient.channel("hub-realtime-updates");

  Object.entries(TABLES).forEach(([collection, table]) => {
    realtimeChannel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload) => {
        const row = payload.eventType === "DELETE" ? payload.old : payload.new;
        if (!row) return;
        if (collection === "comunicados" && !canAccessChatChannel(row.canal)) return;

        mergeRealtimeRow(collection, row, payload.eventType);
        renderRealtimeUpdate(collection);
      }
    );
  });

  realtimeChannel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      console.info("HUB realtime conectado");
      setSyncStatus("Tempo real online", true);
    }
  });
}

async function uploadChatFile(file) {
  if (!supabaseClient || !file || !file.name) return null;

  const bucket = window.HUB_SUPABASE.chatFilesBucket || "hub-chat-files";
  const safeName = file.name.replace(/[^a-z0-9_.-]/gi, "-");
  const path = `${Date.now()}-${generateUUID()}-${safeName}`;
  const { error } = await supabaseClient.storage.from(bucket).upload(path, file);
  if (error) throw error;

  const { data: publicUrl } = supabaseClient.storage.from(bucket).getPublicUrl(path);
  return publicUrl.publicUrl;
}

async function addItem(collection, values) {
  if (!supabaseClient) {
    data[collection].unshift({
      id: generateUUID(),
      createdAt: todayLabel(),
      createdBy: values.createdBy || getCurrentUserName(),
      ...values,
    });
    saveLocalData();
    renderAll();
    return true;
  }

  try {
    const payload = toDbPayload(collection, values);
    const { data: inserted, error } = await supabaseClient
      .from(TABLES[collection])
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      if (isMissingCreatedByColumn(error)) {
        const { data: insertedWithoutAuthor, error: retryError } = await supabaseClient
          .from(TABLES[collection])
          .insert(withoutCreatedBy(payload))
          .select("*")
          .single();

        if (retryError) throw retryError;

        data[collection].unshift({
          ...mapRows(collection, [insertedWithoutAuthor])[0],
          createdBy: values.createdBy || getCurrentUserName(),
        });
        saveLocalData();
        setSyncStatus("Supabase sem autoria", false);
        renderAll();
        return true;
      }

      if (collection === "malotes" && isMissingColumn(error, "updated_by")) {
        const { data: insertedWithoutEditor, error: retryError } = await supabaseClient
          .from(TABLES[collection])
          .insert(withoutUpdatedBy(payload))
          .select("*")
          .single();

        if (retryError) throw retryError;

        data[collection].unshift(mapRows(collection, [insertedWithoutEditor])[0]);
        saveLocalData();
        setSyncStatus("Supabase precisa migracao", false);
        renderAll();
        return true;
      }

      if (collection === "vagas" && (isMissingColumn(error, "descricao") || isMissingColumn(error, "requisitos"))) {
        const { data: insertedLegacy, error: retryError } = await supabaseClient
          .from(TABLES[collection])
          .insert(withoutOptionalJobColumns(payload))
          .select("*")
          .single();

        if (retryError) throw retryError;

        data[collection].unshift({
          ...mapRows(collection, [insertedLegacy])[0],
          descricao: values.descricao || "",
          requisitos: values.requisitos || "",
          createdBy: values.createdBy || getCurrentUserName(),
        });
        saveLocalData();
        setSyncStatus("Supabase precisa migracao", false);
        renderAll();
        showModal("Banco precisa atualizar", "A vaga foi salva em modo compatibilidade. Rode o supabase-schema.sql atualizado para gravar descricao e requisitos em colunas proprias.", "info");
        return true;
      }

      if (collection === "candidaturas" && isMissingColumn(error, "telefone")) {
        const { data: insertedLegacy, error: retryError } = await supabaseClient
          .from(TABLES[collection])
          .insert(withoutOptionalApplicationColumns(payload))
          .select("*")
          .single();

        if (retryError) throw retryError;

        data[collection].unshift({
          ...mapRows(collection, [insertedLegacy])[0],
          telefone: values.telefone || "",
          createdBy: values.createdBy || getCurrentUserName(),
        });
        saveLocalData();
        setSyncStatus("Supabase precisa migracao", false);
        renderAll();
        showModal("Banco precisa atualizar", "A candidatura foi salva, mas rode o supabase-schema.sql atualizado para gravar telefone no banco.", "info");
        return true;
      }

      throw error;
    }

    data[collection].unshift(mapRows(collection, [inserted])[0]);
    saveLocalData();
    setSyncStatus("Supabase EIXO online", true);
    renderAll();
    return true;
  } catch (error) {
    console.error("Erro ao salvar no Supabase:", error);
    setSyncStatus("Erro no Supabase", false);
    const message =
      collection === "chamados"
        ? "Nao foi possivel abrir o chamado. Rode o arquivo fix-chamados-supabase.sql no Supabase para criar a tabela hub_chamados."
        : "Nao foi possivel salvar no Supabase. Confira se as tabelas hub_* existem no projeto EIXO.";
    showModal("Erro ao Salvar", message, "error");
    return false;
  }
}

async function updateItem(collection, id, values) {
  if (!id) return false;

  if (!supabaseClient) {
    data[collection] = (data[collection] || []).map((item) =>
      String(item.id) === String(id) ? { ...item, ...values } : item
    );
    saveLocalData();
    renderAll();
    return true;
  }

  try {
    const payload = toDbPayload(collection, values);
    if (collection === "malotes") {
      delete payload.created_by;
      payload.updated_by = values.updatedBy || getCurrentUserName();
    }
    if (collection === "chamados") {
      delete payload.created_by;
    }
    const { data: updated, error } = await supabaseClient
      .from(TABLES[collection])
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (isMissingCreatedByColumn(error)) {
        const { data: updatedWithoutAuthor, error: retryError } = await supabaseClient
          .from(TABLES[collection])
          .update(withoutCreatedBy(payload))
          .eq("id", id)
          .select("*")
          .single();

        if (retryError) throw retryError;
        mergeRealtimeRow(collection, updatedWithoutAuthor, "UPDATE");
        renderRealtimeUpdate(collection);
        setSyncStatus("Supabase sem autoria", false);
        return true;
      }

      if (collection === "malotes" && isMissingColumn(error, "updated_by")) {
        const { data: updatedWithoutEditor, error: retryError } = await supabaseClient
          .from(TABLES[collection])
          .update(withoutUpdatedBy(payload))
          .eq("id", id)
          .select("*")
          .single();

        if (retryError) throw retryError;
        mergeRealtimeRow(collection, {
          ...updatedWithoutEditor,
          updated_by: values.updatedBy || getCurrentUserName(),
        }, "UPDATE");
        renderRealtimeUpdate(collection);
        setSyncStatus("Supabase precisa migracao", false);
        return true;
      }

      if (collection === "vagas" && (isMissingColumn(error, "descricao") || isMissingColumn(error, "requisitos"))) {
        const { data: updatedLegacy, error: retryError } = await supabaseClient
          .from(TABLES[collection])
          .update(withoutOptionalJobColumns(payload))
          .eq("id", id)
          .select("*")
          .single();

        if (retryError) throw retryError;
        mergeRealtimeRow(collection, {
          ...updatedLegacy,
          descricao: values.descricao || "",
          requisitos: values.requisitos || "",
        }, "UPDATE");
        renderRealtimeUpdate(collection);
        setSyncStatus("Supabase precisa migracao", false);
        showModal("Banco precisa atualizar", "A vaga foi atualizada em modo compatibilidade. Rode o supabase-schema.sql atualizado para gravar descricao e requisitos em colunas proprias.", "info");
        return true;
      }

      throw error;
    }

    mergeRealtimeRow(collection, updated, "UPDATE");
    renderRealtimeUpdate(collection);
    setSyncStatus("Supabase EIXO online", true);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar no Supabase:", error);
    setSyncStatus("Erro no Supabase", false);
    const message =
      collection === "chamados"
        ? "O Supabase bloqueou o arquivamento do chamado. Rode o arquivo fix-arquivar-chamados-supabase.sql no Supabase para liberar UPDATE em hub_chamados."
        : "Nao foi possivel atualizar o registro no Supabase.";
    showModal("Erro ao Atualizar", message, "error");
    return false;
  }
}

async function deleteItem(collection, id) {
  if (!id) return false;

  if (!supabaseClient) {
    data[collection] = (data[collection] || []).filter((item) => String(item.id) !== String(id));
    if (collection === "vagas") {
      data.candidaturas = (data.candidaturas || []).filter((item) => String(item.vaga_id) !== String(id));
    }
    saveLocalData();
    renderAll();
    return true;
  }

  try {
    if (collection === "vagas") {
      const { error: candidaturaError } = await supabaseClient.from(TABLES.candidaturas).delete().eq("vaga_id", id);
      if (candidaturaError) throw candidaturaError;
    }

    const { data: deletedRows, error } = await supabaseClient.from(TABLES[collection]).delete().eq("id", id).select("id");
    if (error) throw error;

    if (!deletedRows?.length) {
      setSyncStatus("Delete pendente no Supabase", false);
      showModal("Permissao de Delete", "O Supabase nao confirmou a exclusao da vaga. Rode o supabase-schema.sql atualizado para liberar DELETE em hub_vagas.", "error");
      await refreshFromSupabase();
      return false;
    }

    data[collection] = (data[collection] || []).filter((item) => String(item.id) !== String(id));
    if (collection === "vagas") {
      data.candidaturas = (data.candidaturas || []).filter((item) => String(item.vaga_id) !== String(id));
    }
    saveLocalData();
    renderAll();
    setSyncStatus("Supabase EIXO online", true);
    return true;
  } catch (error) {
    console.error("Erro ao deletar no Supabase:", error);
    setSyncStatus("Erro no Supabase", false);
    showModal("Erro ao Deletar", "Nao foi possivel deletar a vaga no Supabase.", "error");
    return false;
  }
}

function upsertLocalUser(values) {
  const normalizedName = normalizeLoginName(values.nome);
  const existingIndex = values.id ? data.usuarios.findIndex((user) => String(user.id) === String(values.id)) : data.usuarios.findIndex((user) => normalizeLoginName(user.nome) === normalizedName);
  const user = {
    id: values.id || (existingIndex >= 0 ? data.usuarios[existingIndex].id : generateUUID()),
    nome: getLoginDisplayName(values.nome) || values.nome,
    senha: values.senha,
    cargo: values.cargo || data.usuarios[existingIndex]?.cargo || "",
    foto_perfil: values.foto_perfil || data.usuarios[existingIndex]?.foto_perfil || "",
    createdBy: values.createdBy || getCurrentUserName(),
    syncStatus: values.syncStatus || data.usuarios[existingIndex]?.syncStatus || "active",
    createdAt: existingIndex >= 0 ? data.usuarios[existingIndex].createdAt : todayLabel(),
  };

  if (existingIndex >= 0) {
    data.usuarios[existingIndex] = user;
  } else {
    data.usuarios.unshift(user);
  }

  const users = mergeUsersByName(loadTeamUsersStore(), data.usuarios);
  saveTeamUsersStore(users);
  syncTeamCredentials(users);
  saveLocalData();
  renderAll();
}

async function saveTeamUser(values) {
  const nome = String(values.nome || "").trim();
  const senha = String(values.senha || "").trim();
  const cargo = String(values.cargo || "").trim();
  if (!nome || !senha) return false;
  persistTeamCredential(nome, senha);

  if (!supabaseClient) {
    upsertLocalUser({ nome, senha, cargo, syncStatus: "active" });
    return true;
  }

  try {
    const { data: existingRows, error: findError } = await supabaseClient
      .from(USERS_TABLE)
      .select("id, nome")
      .ilike("nome", nome)
      .limit(1);

    if (findError) throw findError;

    const existing = existingRows?.[0];
    let query = existing
      ? supabaseClient.from(USERS_TABLE).update({ nome, senha, cargo, created_by: getCurrentUserName() }).eq("id", existing.id)
      : supabaseClient.from(USERS_TABLE).insert({ nome, senha, cargo, created_by: getCurrentUserName() });

    let result = await query.select("*");

    if (result.error && isMissingCreatedByColumn(result.error)) {
      query = existing
        ? supabaseClient.from(USERS_TABLE).update({ nome, senha, cargo }).eq("id", existing.id)
        : supabaseClient.from(USERS_TABLE).insert({ nome, senha, cargo });
      result = await query.select("*");
    }

    if (result.error && isMissingColumn(result.error, "cargo")) {
      query = existing
        ? supabaseClient.from(USERS_TABLE).update({ nome, senha, created_by: getCurrentUserName() }).eq("id", existing.id)
        : supabaseClient.from(USERS_TABLE).insert({ nome, senha, created_by: getCurrentUserName() });
      result = await query.select("*");
    }

    if (result.error) throw result.error;
    const savedRows = result.data;

    const saved = mapRows("usuarios", savedRows || [])[0] || { nome, senha, cargo, createdAt: todayLabel() };
    upsertLocalUser({ ...saved, cargo: saved.cargo || cargo, syncStatus: "active" });
    setSyncStatus("Supabase EIXO online", true);
    return true;
  } catch (error) {
    console.error("Erro ao salvar usuario no Supabase:", error);
    upsertLocalUser({ nome, senha, cargo, syncStatus: "local" });
    setSyncStatus("Usuario salvo local", false);
    showModal("Aviso de Banco de Dados", "O usuário foi salvo apenas localmente. Para que o login funcione em outros computadores, execute o código SQL de criação da tabela 'hub_users' no painel do Supabase.", "error");
    return true;
  }
}

async function updateCurrentAccount(currentPassword, newName, newPassword, newFotoUrl) {
  const user = getCurrentUserRecord();
  if (!user) {
    showModal("Conta nao encontrada", "Nao foi possivel localizar sua conta nesta sessao.", "error");
    return false;
  }

  if (currentPassword && !isLoginMatch(currentPassword, user.senha)) {
    showModal("Senha incorreta", "A senha atual informada nao confere.", "error");
    return false;
  }

  const updatedUser = {
    ...user,
    nome: newName || user.nome,
    senha: newPassword || user.senha,
    foto_perfil: newFotoUrl || user.foto_perfil,
    cargo: user.cargo || getCurrentUserRole(),
    syncStatus: user.syncStatus || "active",
  };

  if (!supabaseClient) {
    upsertLocalUser(updatedUser);
    persistTeamCredential(updatedUser.nome, updatedUser.senha);
    if (newName) sessionStorage.setItem(`${SESSION_KEY}-user`, getLoginDisplayName(updatedUser.nome));
    return true;
  }

  try {
    let payload = {
      nome: updatedUser.nome,
      senha: updatedUser.senha,
      cargo: updatedUser.cargo || "",
      foto_perfil: updatedUser.foto_perfil || null,
      created_by: getCurrentUserName(),
    };
    let query = supabaseClient.from(USERS_TABLE).update(payload);

    if (updatedUser.id && !String(updatedUser.id).startsWith("local-")) {
      query = query.eq("id", updatedUser.id);
    } else {
      query = query.ilike("nome", updatedUser.nome);
    }

    let result = await query.select("*");

    if (result.error && (isMissingColumn(result.error, "cargo") || isMissingColumn(result.error, "foto_perfil"))) {
      const { cargo, foto_perfil, ...legacyPayload } = payload;
      query = supabaseClient.from(USERS_TABLE).update(legacyPayload);
      query = updatedUser.id && !String(updatedUser.id).startsWith("local-")
        ? query.eq("id", updatedUser.id)
        : query.ilike("nome", updatedUser.nome);
      result = await query.select("*");
      showModal("Atualização parcial", "A senha e o nome foram alterados. Atualize o banco de dados para salvar cargo e foto de perfil.", "info");
    } else if (result.error) {
      throw result.error;
    }

    const saved = mapRows("usuarios", result.data || [])[0] || updatedUser;
    upsertLocalUser({ ...updatedUser, ...saved, senha: updatedUser.senha });
    persistTeamCredential(updatedUser.nome, updatedUser.senha);
    if (newName) sessionStorage.setItem(`${SESSION_KEY}-user`, getLoginDisplayName(updatedUser.nome));
    setSyncStatus("Supabase EIXO online", true);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar conta:", error);
    upsertLocalUser({ ...updatedUser, syncStatus: "local" });
    persistTeamCredential(updatedUser.nome, updatedUser.senha);
    if (newName) sessionStorage.setItem(`${SESSION_KEY}-user`, getLoginDisplayName(updatedUser.nome));
    setSyncStatus("Conta atualizada local", false);
    showModal("Atualizacao local", "Os dados foram alterados localmente. Rode os SQLs atualizados no Supabase se o banco bloquear as colunas.", "info");
    return true;
  }
}

function removeLocalUser(id) {
  const removedUser = data.usuarios.find((user) => String(user.id) === String(id));
  const keepUser = (user) => String(user.id) !== String(id) && normalizeLoginName(user.nome) !== normalizeLoginName(removedUser?.nome);
  data.usuarios = data.usuarios.filter(keepUser);
  const users = loadTeamUsersStore().filter(keepUser);
  const credentials = loadTeamCredentialsStore().filter(keepUser);
  saveTeamUsersStore(users);
  saveTeamCredentialsStore(credentials);

  if (removedUser && normalizeLoginName(removedUser.nome) === normalizeLoginName(getCurrentUserName())) {
    clearAuthenticatedUser();
    window.location.href = "login.html";
    return;
  }

  saveLocalData();
  renderAll();
}

async function deleteTeamUser(id) {
  if (!id) return false;

  const localUser = data.usuarios.find((u) => String(u.id) === String(id));

  if (!supabaseClient || !localUser) {
    removeLocalUser(id);
    return true;
  }

  try {
    const { error } = await supabaseClient
      .from(USERS_TABLE)
      .delete()
      .ilike("nome", localUser.nome);

    if (error) throw error;

    removeLocalUser(id);
    setSyncStatus("Supabase EIXO online", true);
    return true;
  } catch (error) {
    console.error("Erro ao excluir usuario no Supabase:", error);
    removeLocalUser(id);
    setSyncStatus("Usuario removido local", false);
    return true;
  }
}

function renderCards(targetId, items, template) {
  const target = document.getElementById(targetId);
  if (!target) return;

  if (!items.length) {
    target.innerHTML = '<p class="empty-state">Nenhum registro cadastrado ainda.</p>';
    return;
  }

  target.innerHTML = items.map(template).join("");
}

function activateView(viewId) {
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
  document.querySelectorAll(".user-chip").forEach((chip) => chip.classList.toggle("active", viewId === "conta"));
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
}

function applyRoleAccess() {
  if (!isAuthenticated() || isPublicPage() || !document.querySelector(".nav-list")) return;
  refreshCurrentUserRoleFromData();

  const allowedViews = isManagerUser()
    ? new Set(["comunicacao", "documentos", "conta"])
    : new Set(["dashboard", "denuncias", "comunicacao", "malotes", "chamados", "vagas", "documentos", "equipe", "conta"]);
  const allowedExternalUrls = isManagerUser()
    ? new Set(["https://hub-opal-nine.vercel.app/chamados.html", "https://hub-opal-nine.vercel.app/denuncia.html"])
    : new Set();

  document.querySelectorAll(".nav-item").forEach((button) => {
    const allowed = button.dataset.externalUrl
      ? allowedExternalUrls.has(button.dataset.externalUrl)
      : allowedViews.has(button.dataset.view);
    button.hidden = !allowed;
    button.disabled = !allowed;
  });

  document.querySelectorAll(".view").forEach((view) => {
    if (!allowedViews.has(view.id)) view.classList.remove("active");
  });

  const activeView = document.querySelector(".view.active");
  if (!activeView || !allowedViews.has(activeView.id)) {
    activateView(isManagerUser() ? "documentos" : "dashboard");
  }
}

function renderDashboard() {
  if (!document.getElementById("metric-denuncias")) return;

  document.getElementById("metric-denuncias").textContent = data.denuncias.filter((item) => item.status === "Aberta" || item.status === "Urgente").length;
  const unreadRhMessages = getUnreadRhMessages();
  if (document.getElementById("metric-comunicados")) {
    document.getElementById("metric-comunicados").textContent = unreadRhMessages.length;
  }
  if (document.getElementById("metric-malotes")) {
    document.getElementById("metric-malotes").textContent = data.malotes.filter((item) => isTodayLabel(item.createdAt)).length;
  }
  if (document.getElementById("metric-vagas")) {
    document.getElementById("metric-vagas").textContent = data.vagas.filter((item) => item.status !== "Fechada").length;
  }
  if (document.getElementById("metric-documentos")) {
    document.getElementById("metric-documentos").textContent = documentRecords.length;
  }

  const dashboardItems = [
    ...data.denuncias
      .filter(item => item.status === "Aberta" || item.status === "Urgente")
      .map((item) => ({
        title: `Denúncia: ${item.categoria}`,
        text: item.descricao,
        tag: item.status,
        date: item.createdAt,
      })),
    ...data.chamados
      .filter((item) => item.status === "Aberto")
      .map((item) => ({
        title: `Chamado: ${item.unidade}`,
        text: item.epis,
        tag: item.status,
        date: item.createdAt,
      })),
    ...data.malotes.map((item) => ({ title: `Malote: ${item.destino}`, text: `Origem: ${item.origem || "Nao informada"} | ${item.epis}`, tag: item.status, date: item.createdAt })),
    ...data.vagas.map((item) => ({ title: `Vaga: ${item.cargo}`, text: item.descricao, tag: item.status, date: item.createdAt })),
    ...documentRecords.map((item) => ({ title: `Doc: ${documentLabels[item.type] || item.type}`, text: item.summary, tag: "Registro", date: item.createdAt }))
  ].slice(0, 8);

  const dashboardTarget = document.getElementById("dashboard-list");
  if (dashboardTarget) {
    if (dashboardItems.length === 0) {
      dashboardTarget.innerHTML = '<p class="empty-state">Nenhum acompanhamento registrado no momento.</p>';
    } else {
      dashboardTarget.innerHTML = dashboardItems
        .map((item) => `<li><div class="item-topline"><p class="item-title">${escapeHtml(item.title)}</p><span class="${badgeClass(item.tag)}">${escapeHtml(item.tag)}</span></div><p>${escapeHtml(item.text)}</p><p class="item-meta" style="margin-top: 6px; font-size: 12px;">${escapeHtml(item.date)}</p></li>`)
        .join("");
    }
  }
}

// Lógica de abertura de denúncia para leitura e transição de estado automática
async function lerDenuncia(id) {
  const denuncia = data.denuncias.find(item => String(item.id) === String(id));
  if (!denuncia) return;

  // Mostra o relato em formato de modal customizado
  showModal(
    "Visualização da Denúncia",
    `Categoria: ${denuncia.categoria}\nRecebida em: ${denuncia.createdAt}\nStatus Atual: ${denuncia.status}\n\nRelato:\n"${denuncia.descricao}"`,
    "info"
  );

  // Se a denúncia ainda constar como Não lida ("Aberta"), movemos para "Lida"
  if (denuncia.status === "Aberta") {
    if (!supabaseClient) {
      denuncia.status = "Lida";
      saveLocalData();
      renderAll();
    } else {
      try {
        const { data: updated, error } = await supabaseClient
          .from(TABLES.denuncias)
          .update({ status: "Lida" })
          .eq("id", id)
          .select()
          .single();
        
        if (error || !updated) throw error || new Error("Nenhuma linha alterada.");
        
        denuncia.status = "Lida";
        saveLocalData();
        renderAll();
      } catch (err) {
        console.error("Erro ao atualizar status da denúncia no Supabase:", err);
        showModal("Aviso de Permissão", "A denúncia não pôde ser atualizada. Você precisa rodar o script SQL de UPDATE no painel do Supabase para consertar as permissões.", "error");
      }
    }
  }
}

async function atualizarStatusDenuncia(id, status) {
  const denuncia = data.denuncias.find((item) => String(item.id) === String(id));
  if (!denuncia) return false;

  if (!supabaseClient) {
    denuncia.status = status;
    saveLocalData();
    renderAll();
    return true;
  }

  try {
    const { data: updated, error } = await supabaseClient
      .from(TABLES.denuncias)
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error || !updated) throw error || new Error("Nenhuma linha alterada.");

    mergeRealtimeRow("denuncias", updated, "UPDATE");
    renderRealtimeUpdate("denuncias");
    return true;
  } catch (err) {
    console.error("Erro ao atualizar status da denúncia no Supabase:", err);
    showModal("Aviso de Permissão", "A denúncia não pôde ser atualizada. Rode o supabase-schema.sql atualizado para liberar UPDATE em hub_denuncias.", "error");
    return false;
  }
}

function renderPublicVagas() {
  const selectedInput = document.getElementById("vaga-id");
  const selectedPanel = document.getElementById("selected-public-job");
  const list = document.getElementById("public-vagas-list");
  if (!selectedInput && !selectedPanel && !list) return;

  const openVagas = data.vagas.filter(v => v.status === "Aberta");
  const selectedVaga = new URLSearchParams(window.location.search).get("vaga");

  if (!openVagas.length) {
    if (list) list.innerHTML = '<p class="empty-state">Nenhuma vaga aberta no momento.</p>';
    if (selectedInput) selectedInput.value = "";
    if (selectedPanel) {
      selectedPanel.innerHTML = '<p class="empty-state">Nenhuma vaga aberta no momento.</p>';
    }
    return;
  }

  if (list) {
    list.innerHTML = openVagas.map(v => `
      <article class="item-card public-job-card">
        <div class="item-topline">
          <p class="item-title">${escapeHtml(v.cargo)}</p>
          <span class="tag">${escapeHtml(v.status)}</span>
        </div>
        <p>${escapeHtml(v.descricao || "Descricao nao informada.")}</p>
        <p><strong>Requisitos:</strong> ${escapeHtml(v.requisitos || "Nao informado.")}</p>
        <a class="primary-button button-link" href="candidatura.html?vaga=${encodeURIComponent(v.id)}">Candidatar-se</a>
      </article>
    `).join("");
  }

  if (selectedInput || selectedPanel) {
    const job = openVagas.find((item) => String(item.id) === String(selectedVaga));
    if (!job) {
      if (selectedInput) selectedInput.value = "";
      if (selectedPanel) {
        selectedPanel.innerHTML = '<p class="empty-state">Vaga nao encontrada ou fechada. Volte para a lista e escolha uma vaga aberta.</p>';
      }
      return;
    }

    if (selectedInput) selectedInput.value = job.id;
    if (selectedPanel) {
      selectedPanel.innerHTML = `
        <div class="item-topline">
          <p class="item-title">${escapeHtml(job.cargo)}</p>
          <span class="tag">${escapeHtml(job.status)}</span>
        </div>
        <p>${escapeHtml(job.descricao || "Descricao nao informada.")}</p>
        <p><strong>Requisitos:</strong> ${escapeHtml(job.requisitos || "Nao informado.")}</p>
      `;
    }
  }
}

function renderTeamUsers() {
  const users = getTeamUsers();

  renderCards("usuarios-list", users, (item) => `
    <article class="item-card">
      <div class="item-topline">
        <p class="item-title">${escapeHtml(item.nome)}</p>
        <div>
          <span class="tag">Ativo</span>
          <button type="button" class="tag alert" style="cursor: pointer; border: none; margin-left: 6px;" onclick="excluirUsuario('${item.id}')">Deletar</button>
        </div>
      </div>
      <p class="item-meta">Senha: <span id="senha-usuario-${escapeHtml(item.id)}">••••••</span></p>
      <p class="item-meta">Cargo: ${escapeHtml(item.cargo || "Sem cargo definido")}</p>
      <button type="button" class="secondary-link" style="width: fit-content; min-height: 30px; padding: 0 10px; font-size: 12px;" onclick="mostrarSenhaUsuario('${escapeHtml(item.id)}')">Mostrar senha</button>
      <p class="item-meta">Cadastro: ${escapeHtml(item.createdAt || "Hoje")}</p>
    </article>
  `);
}

function renderAccountSettings() {
  const nameInput = document.getElementById("conta-nome");
  const newNameInput = document.getElementById("novo-nome");
  const roleInput = document.getElementById("conta-cargo");
  const avatarPreview = document.getElementById("conta-avatar-preview");
  if (!nameInput && !roleInput && !newNameInput) return;

  const user = getCurrentUserRecord();
  if (nameInput) nameInput.value = getCurrentUserName();
  if (newNameInput) newNameInput.value = getCurrentUserName();
  if (roleInput) roleInput.value = user?.cargo || getCurrentUserRole() || "Sem cargo definido";

  if (avatarPreview) {
    avatarPreview.style.display = "block";
    if (user?.foto_perfil) {
      avatarPreview.src = user.foto_perfil;
    } else {
      avatarPreview.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2392a7a2'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
    }
  }
}

function renderChatChannels() {
  const target = document.getElementById("chat-channel-list");
  if (!target) return;

  const channels = getChatChannels();
  if (!channels.some((channel) => channel.id === activeChatChannel) || !isCurrentUserInChannel(activeChatChannel)) {
    activeChatChannel = channels[0]?.id || "";
  }

  if (!channels.length) {
    target.innerHTML = '<p class="empty-state">Nenhum canal interno disponivel.</p>';
    return;
  }

  target.innerHTML = channels
    .map((channel) => `
        <button class="channel-item ${channel.id === activeChatChannel ? "active" : ""}" data-chat-channel="${escapeHtml(channel.id)}" type="button">
          <span>${escapeHtml(channel.label)}</span>
        </button>
      `)
    .join("");
}

function renderAll() {
  renderCurrentUser();
  applyRoleAccess();
  renderAccountSettings();
  renderDashboard();
  renderPublicVagas();

  // Filtra as denúncias entre as listas de Não Lidas, Lidas e Arquivadas
  const naoLidas = data.denuncias.filter(item => item.status === "Aberta" || item.status === "Urgente");
  const lidas = data.denuncias.filter(item => item.status === "Lida");
  const arquivadas = data.denuncias.filter(item => item.status === "Arquivada");
  const selectDenunciasButton = document.getElementById("select-denuncias");
  const primaryDenunciasTitle = document.getElementById("denuncias-primary-title");
  const toggleArchivedDenunciasButton = document.getElementById("toggle-archived-denuncias");
  const exitSelectionButton = document.getElementById("exit-denuncias-selection");
  const openDenunciaPublicLink = document.getElementById("open-denuncia-public");
  if (denunciasSelectionMode) showArchivedDenuncias = false;

  if (selectDenunciasButton) {
    selectDenunciasButton.disabled = !naoLidas.length && !lidas.length;
    selectDenunciasButton.textContent = denunciasSelectionMode ? "Arquivar selecionadas" : "Selecionar denúncias";
    selectDenunciasButton.className = denunciasSelectionMode ? "danger-button" : "secondary-link";
  }
  if (primaryDenunciasTitle) primaryDenunciasTitle.textContent = showArchivedDenuncias ? "Arquivadas" : "Não Lidas";
  if (toggleArchivedDenunciasButton) {
    toggleArchivedDenunciasButton.textContent = showArchivedDenuncias ? "Ocultar arquivadas" : "Mostrar arquivadas";
    toggleArchivedDenunciasButton.disabled = false;
    toggleArchivedDenunciasButton.hidden = denunciasSelectionMode;
    toggleArchivedDenunciasButton.style.display = denunciasSelectionMode ? "none" : "";
  }
  if (exitSelectionButton) {
    exitSelectionButton.hidden = !denunciasSelectionMode;
    exitSelectionButton.style.display = denunciasSelectionMode ? "" : "none";
  }
  if (openDenunciaPublicLink) openDenunciaPublicLink.hidden = denunciasSelectionMode;

  const cardAction = (item, archived) =>
    denunciasSelectionMode && !archived
      ? `toggleDenunciaSelection(event, '${escapeHtml(item.id)}')`
      : `lerDenuncia('${escapeHtml(item.id)}')`;
  const cardTemplate = (item, archived = false) => `
    <article class="item-card ${denunciasSelectionMode && !archived ? "selectable-card" : ""}" style="cursor: pointer;" onclick="${cardAction(item, archived)}">
      <div class="item-topline">
        <p class="item-title">
          ${!archived && denunciasSelectionMode ? `<input class="denuncia-select" type="checkbox" value="${escapeHtml(item.id)}" aria-label="Selecionar denúncia de ${escapeHtml(item.createdAt)}" onclick="event.stopPropagation()" />` : ""}
          Denuncia anonima
        </p>
        <span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span>
      </div>
      <p>${escapeHtml(item.descricao.substring(0, 80))}${item.descricao.length > 80 ? '...' : ''}</p>
      <p class="item-meta">${escapeHtml(item.createdAt)} | Registrado por ${escapeHtml(item.createdBy || "Sistema")}</p>
      ${archived ? `<div class="job-actions" style="margin-top: 8px;"><button class="secondary-link" type="button" onclick="event.stopPropagation(); reabrirDenuncia('${escapeHtml(item.id)}')">Reabrir</button></div>` : ""}
    </article>
  `;

  if (showArchivedDenuncias) {
    const primaryTarget = document.getElementById("denuncias-nao-lidas");
    if (!arquivadas.length && primaryTarget) {
      primaryTarget.innerHTML = '<p class="empty-state">Sem denuncias arquivadas</p>';
    } else {
      renderCards("denuncias-nao-lidas", arquivadas, (item) => cardTemplate(item, true));
    }
  } else {
    renderCards("denuncias-nao-lidas", naoLidas, cardTemplate);
  }
  renderCards("denuncias-lidas", lidas, cardTemplate);

  renderChatChannels();
  renderChat();

  renderMaloteReport();
  renderCards("malotes-list", getFilteredMalotes(), (item) => `
    <article class="item-card">
      <div class="item-topline"><p class="item-title">Malote de EPI</p><span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span></div>
      <p><strong>Destino:</strong> ${escapeHtml(item.destino || "Nao informado")}</p>
      <p><strong>Origem:</strong> ${escapeHtml(item.origem || "Nao informada")}</p>
      ${renderMaloteEpisDetails(item.epis)}
      <p class="item-meta">${escapeHtml(item.createdAt)} | Registrado por ${escapeHtml(item.createdBy || "Sistema")}${item.updatedBy ? ` | Alterado por ${escapeHtml(item.updatedBy)}` : ""}</p>
      <div class="job-actions">
        <button class="secondary-link" type="button" onclick="editarMalote('${escapeHtml(item.id)}')">Editar</button>
        <button class="secondary-link" type="button" onclick="baixarDocumentoMalote('${escapeHtml(item.id)}')">Baixar documento</button>
        <button class="danger-button" type="button" onclick="excluirMalote('${escapeHtml(item.id)}')">Deletar</button>
      </div>
    </article>
  `);

  const chamadosAbertos = (data.chamados || []).filter((item) => item.status !== "Arquivado");
  const chamadosArquivados = (data.chamados || []).filter((item) => item.status === "Arquivado");
  const archiveButton = document.getElementById("archive-selected-chamados");
  if (archiveButton) {
    archiveButton.disabled = !chamadosAbertos.length;
    archiveButton.textContent = chamadosSelectionMode ? "Arquivar selecionados" : "Selecionar Arquivos";
  }
  const archivedPanel = document.getElementById("chamados-arquivados-panel");
  const toggleArchivedButton = document.getElementById("toggle-archived-chamados");
  if (archivedPanel) archivedPanel.style.display = showArchivedChamados ? "" : "none";
  if (toggleArchivedButton) {
    toggleArchivedButton.textContent = showArchivedChamados ? "Ocultar arquivados" : "Mostrar arquivados";
    toggleArchivedButton.disabled = !chamadosArquivados.length;
  }
  const chamadoCard = (item, archived = false) => `
    <article class="item-card ${chamadosSelectionMode && !archived ? "selectable-card" : ""}">
      <div class="item-topline">
        <p class="item-title">
          ${!archived && chamadosSelectionMode ? `<input class="chamado-select" type="checkbox" value="${escapeHtml(item.id)}" aria-label="Selecionar chamado de ${escapeHtml(item.solicitante)}" />` : ""}
          ${escapeHtml(item.unidade)}
        </p>
        <span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span>
      </div>
      <p><strong>Solicitante:</strong> ${escapeHtml(item.solicitante)}</p>
      ${item.setor ? `<p><strong>Setor:</strong> ${escapeHtml(item.setor)}</p>` : ""}
      <p><strong>EPIs:</strong> ${escapeHtml(item.epis)}</p>
      ${item.observacoes ? `<p><strong>Observacoes:</strong> ${escapeHtml(item.observacoes)}</p>` : ""}
      <p class="item-meta">${escapeHtml(item.createdAt)}</p>
      ${archived ? `<div class="job-actions"><button class="secondary-link" type="button" onclick="reabrirChamado('${escapeHtml(item.id)}')">Reabrir</button></div>` : ""}
    </article>
  `;

  renderCards("chamados-list", chamadosAbertos, (item) => chamadoCard(item));
  if (showArchivedChamados) {
    renderCards("chamados-arquivados-list", chamadosArquivados, (item) => chamadoCard(item, true));
  }

  renderCards("vagas-list", data.vagas, (item) => {
    const candidaturas = (data.candidaturas || []).filter(c => String(c.vaga_id) === String(item.id));
    let candidaturasHtml = `<p style="margin-top: 8px; font-size: 13px; color: var(--muted);">Nenhum currículo recebido.</p>`;
    
    if (candidaturas.length > 0) {
      candidaturasHtml = candidaturas.map(c => `
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center;">
          <p style="margin: 0; font-size: 13px; font-weight: 600; line-height: 1.55;">
            ${escapeHtml(c.nome)}<br />
            <span style="font-weight: normal; color: var(--muted);">CPF: ${escapeHtml(formatCpf(c.cpf))}</span><br />
            <span style="font-weight: normal; color: var(--muted);">Telefone: ${escapeHtml(formatPhone(c.telefone) || "Nao informado")}</span>
          </p>
          <a href="${escapeHtml(c.curriculo_url)}" target="_blank" class="secondary-link" style="min-height: 28px; padding: 0 10px; font-size: 12px;">Ver Currículo</a>
        </div>
      `).join("");
    }

    return `
      <article class="item-card">
        <div class="item-topline"><p class="item-title">${escapeHtml(item.cargo)}</p><span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span></div>
        <p>${escapeHtml(item.descricao || "Descricao nao informada.")}</p>
        <p><strong>Requisitos:</strong> ${escapeHtml(item.requisitos || "Nao informado.")}</p>
        <p class="item-meta">${escapeHtml(item.createdAt)} | Registrado por ${escapeHtml(item.createdBy || "Sistema")}</p>
        <div class="job-actions">
          <button class="secondary-link" type="button" onclick="editarVaga('${escapeHtml(item.id)}')">Editar</button>
          <button class="danger-button" type="button" onclick="excluirVaga('${escapeHtml(item.id)}')">Deletar</button>
        </div>
        <div style="margin-top: 16px; background: var(--surface-soft); padding: 16px; border-radius: var(--radius-md);"><p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--teal);">Currículos Recebidos (${candidaturas.length})</p>${candidaturasHtml}</div>
      </article>
    `;
  });

  renderDocumentRecords();
  renderTeamUsers();
}

function renderDocumentRecords() {
  const target = document.getElementById("document-records");
  if (!target) return;

  if (!documentRecords.length) {
    target.innerHTML = '<p class="empty-state">Nenhum registro salvo ainda.</p>';
    return;
  }

  target.innerHTML = documentRecords
    .map((item) => `
      <article class="item-card">
        <div class="item-topline">
          <p class="item-title">${escapeHtml(documentLabels[item.type] || item.type)}</p>
          <div>
            <span class="tag">${escapeHtml(item.createdAt)}</span>
            <button type="button" class="tag" style="cursor: pointer; border: none; margin-left: 6px; background: var(--teal-surface); color: var(--teal-dark);" onclick="editarDocumento('${item.id}')">Editar</button>
            <button type="button" class="tag alert" style="cursor: pointer; border: none; margin-left: 6px;" onclick="excluirDocumento('${item.id}')">Excluir</button>
          </div>
        </div>
        <p>${escapeHtml(item.summary)}</p>
        <p class="item-meta">${escapeHtml(item.details)}</p>
        <p class="item-meta">Registrado por ${escapeHtml(item.createdBy || "Sistema")}${item.updatedBy ? ` | Alterado por ${escapeHtml(item.updatedBy)}` : ""}${item.updatedAt ? ` em ${escapeHtml(item.updatedAt)}` : ""}</p>
      </article>
    `)
    .join("");
}

function renderChat() {
  const target = document.getElementById("chat-feed");
  if (!target) return;
  const currentUser = getCurrentUserName();
  const activeChannel = getActiveChatChannel();

  const title = document.getElementById("chat-title");
  const subtitle = document.getElementById("chat-subtitle");
  const messageInput = document.querySelector('#chat-form input[name="mensagem"]');
  const sendButton = document.querySelector("#chat-form .send-button");
  const fileButton = document.querySelector('#chat-form label[for="chat-file"]');
  const fileInput = document.getElementById("chat-file");
  if (!activeChannel) {
    if (title) title.textContent = "Comunicação interna";
    if (subtitle) subtitle.textContent = "Nenhum canal interno disponivel";
    if (messageInput) {
      messageInput.placeholder = "Nenhum canal disponivel";
      messageInput.disabled = true;
    }
    if (sendButton) sendButton.disabled = true;
    if (fileInput) fileInput.disabled = true;
    if (fileButton) fileButton.classList.add("disabled");
    target.innerHTML = '<p class="empty-state">Nenhum canal interno disponivel.</p>';
    return;
  }

  if (title) title.textContent = activeChannel.label;
  if (subtitle) subtitle.textContent = activeChannel.subtitle;
  if (messageInput) {
    messageInput.placeholder = activeChannel.id === GENERAL_CHANNEL ? "Escreva no chat geral" : `Mensagem para ${activeChannel.label}`;
    messageInput.disabled = false;
  }
  if (sendButton) sendButton.disabled = false;
  if (fileInput) fileInput.disabled = false;
  if (fileButton) fileButton.classList.remove("disabled");


  const messages = data.comunicados.filter((item) => {
    const channel = normalizeChatChannel(item.canal);
    if (channel !== activeChatChannel) return false;
    return (channel === GENERAL_CHANNEL && !isManagerUser()) || isCurrentUserInChannel(channel);
  });

  if (!messages.length) {
    target.innerHTML = '<p class="empty-state">Nenhuma mensagem neste chat ainda.</p>';
    return;
  }

  target.innerHTML = messages
    .slice()
    .reverse()
    .map((item) => {
      const attachment = item.arquivo
        ? `<a class="attachment-chip" href="${escapeHtml(item.arquivo.url || "#")}" target="_blank" rel="noreferrer">Arquivo: ${escapeHtml(item.arquivo.name)} ${escapeHtml(formatFileSize(item.arquivo.size))}</a>`
        : "";

      return `
        <article class="chat-message ${item.autor === currentUser ? "own" : ""}">
          <div class="chat-author">
            <span>${escapeHtml(item.autor)}</span>
            <time>${escapeHtml(item.createdAt)}</time>
          </div>
          ${item.mensagem ? `<p>${escapeHtml(item.mensagem)}</p>` : ""}
          ${attachment}
        </article>
      `;
    })
    .join("");

  target.scrollTop = target.scrollHeight;

  checkAndMarkChatAsRead();
}

document.querySelectorAll(".nav-item, [data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.externalUrl) {
      window.location.href = button.dataset.externalUrl;
      return;
    }
    if (isManagerUser() && !["comunicacao", "documentos", "conta"].includes(button.dataset.view)) {
      activateView("documentos");
      return;
    }
    activateView(button.dataset.view);
    checkAndMarkChatAsRead();
  });
});
document.getElementById("chat-channel-list")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-chat-channel]");
  if (!button) return;

  activeChatChannel = button.dataset.chatChannel || GENERAL_CHANNEL;
  renderChatChannels();
  renderChat();
});

document.getElementById("malote-destino-filter")?.addEventListener("change", () => {
  renderAll();
});

document.getElementById("archive-selected-chamados")?.addEventListener("click", () => {
  if (!chamadosSelectionMode) {
    chamadosSelectionMode = true;
    renderAll();
    return;
  }

  const selectedIds = Array.from(document.querySelectorAll("#chamados-list .chamado-select:checked"))
    .map((input) => input.value)
    .filter(Boolean);

  if (!selectedIds.length) {
    showModal("Nenhum chamado selecionado", "Selecione pelo menos um chamado para arquivar.", "error");
    return;
  }

  showConfirmActionModal({
    title: "Arquivar chamados",
    text: `Deseja arquivar ${selectedIds.length} chamado(s) selecionado(s)?`,
    confirmText: "Arquivar",
    onConfirm: async () => {
      const results = await Promise.all(selectedIds.map((id) => updateItem("chamados", id, { status: "Arquivado" })));
      if (results.every(Boolean)) {
        chamadosSelectionMode = false;
        renderAll();
        showModal("Chamados arquivados", "Os chamados selecionados foram movidos para Arquivados.", "info");
      }
    },
  });
});

document.getElementById("toggle-archived-chamados")?.addEventListener("click", () => {
  showArchivedChamados = !showArchivedChamados;
  renderAll();
});

document.getElementById("select-denuncias")?.addEventListener("click", () => {
  if (!denunciasSelectionMode) {
    denunciasSelectionMode = true;
    showArchivedDenuncias = false;
    renderAll();
    return;
  }

  const selectedIds = Array.from(document.querySelectorAll(".denuncia-select:checked"))
    .map((input) => input.value)
    .filter(Boolean);

  if (!selectedIds.length) {
    showModal("Nenhuma denúncia selecionada", "Selecione pelo menos uma denúncia para arquivar.", "error");
    return;
  }

  showConfirmActionModal({
    title: "Arquivar denúncias",
    text: `Deseja arquivar ${selectedIds.length} denúncia(s) selecionada(s)?`,
    confirmText: "Arquivar",
    onConfirm: async () => {
      const results = await Promise.all(selectedIds.map((id) => atualizarStatusDenuncia(id, "Arquivada")));
      if (results.every(Boolean)) {
        denunciasSelectionMode = false;
        renderAll();
        showModal("Denúncias arquivadas", "As denúncias selecionadas foram movidas para Arquivadas.", "info");
      }
    },
  });
});

document.getElementById("exit-denuncias-selection")?.addEventListener("click", () => {
  denunciasSelectionMode = false;
  renderAll();
});

document.getElementById("toggle-archived-denuncias")?.addEventListener("click", () => {
  showArchivedDenuncias = !showArchivedDenuncias;
  renderAll();
});

document.querySelectorAll(".doc-tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".doc-tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".doc-view").forEach((view) => view.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(`doc-${button.dataset.doc}`)?.classList.add("active");

    // Cancela a edição se o usuário trocar de aba de documento
    if (window.editingDocId) {
      window.editingDocId = null;
      document.querySelectorAll("[data-doc-form]").forEach(form => {
        form.reset();
        const btn = form.querySelector("button[type='submit']");
        if (btn && btn.dataset.originalText) btn.textContent = btn.dataset.originalText;
      });
    }
  });
});

document.querySelectorAll("[data-doc-form]").forEach((formElement) => {
  formElement.addEventListener("input", (event) => {
    if (event.target.name === "cpf") {
      event.target.value = formatCpf(event.target.value);
    }
    if (event.target.name === "rg") {
      event.target.value = formatRg(event.target.value);
    }
  });

  formElement.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const entries = [...form.entries()].filter(([, value]) => String(value || "").trim());
    const collaborator = form.get("colaborador") || form.get("cargo") || "Registro sem colaborador";
    const details = entries
      .filter(([key]) => key !== "colaborador")
      .slice(0, 4)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");

    if (window.editingDocId) {
      // Atualiza o documento existente
      const index = documentRecords.findIndex(d => d.id === window.editingDocId);
      if (index > -1) {
        documentRecords[index] = {
          ...documentRecords[index],
          summary: String(collaborator),
          details: details || "Registro salvo",
          formData: Object.fromEntries(entries),
          updatedBy: getCurrentUserName(),
          updatedAt: todayLabel(),
        };
      }
      window.editingDocId = null;
      const btn = event.currentTarget.querySelector("button[type='submit']");
      if (btn && btn.dataset.originalText) btn.textContent = btn.dataset.originalText;
    } else {
      // Cria um novo documento
      documentRecords.unshift({
        id: generateUUID(),
        type: event.currentTarget.dataset.docForm,
        summary: String(collaborator),
        details: details || "Registro salvo",
        formData: Object.fromEntries(entries),
        createdBy: getCurrentUserName(),
        createdAt: todayLabel(),
      });
    }

    saveDocumentRecords();
    renderDocumentRecords();
    event.currentTarget.reset();
  });
});

const denunciaForm = document.getElementById("denuncia-form");
if (denunciaForm) {
  denunciaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.target;
    const form = new FormData(formElement);
    const message = String(form.get("mensagem") || form.get("descricao") || "").trim();
    if (!message) return;

    const success = await addItem("denuncias", {
      identificacao: "Anonimo",
      categoria: "Denuncia anonima",
      descricao: message,
      status: "Aberta",
    });

    if (success) {
      formElement.reset();
      const feedback = document.getElementById("denuncia-feedback");
      if (feedback) {
        feedback.textContent = "Denuncia enviada com sucesso. Obrigado pelo relato.";
      }
    }
  });
}

const chatFile = document.getElementById("chat-file");
if (chatFile) {
  chatFile.addEventListener("change", (event) => {
    const file = event.currentTarget.files[0];
    if (file) {
      document.getElementById("selected-file").innerHTML = `${escapeHtml(file.name)} - ${formatFileSize(file.size)} <button type="button" onclick="document.getElementById('chat-file').value=''; document.getElementById('selected-file').textContent='Nenhum arquivo selecionado';" style="margin-left: 8px; background: none; border: none; color: var(--danger); cursor: pointer; font-weight: bold;" title="Remover anexo">X</button>`;
    } else {
      document.getElementById("selected-file").textContent = "Nenhum arquivo selecionado";
    }
  });
}

const chatForm = document.getElementById("chat-form");
if (chatForm) {
  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!activeChatChannel || (isManagerUser() && activeChatChannel === GENERAL_CHANNEL)) {
      showModal("Acao nao permitida", "Gerentes nao possuem acesso ao chat geral.", "error");
      return;
    }
    if (isDirectChannel(activeChatChannel) && !isCurrentUserInChannel(activeChatChannel)) {
      showModal("Acao nao permitida", "Voce nao participa deste chat individual.", "error");
      return;
    }

    const formElement = event.target;
    const form = new FormData(formElement);
    const file = form.get("arquivo");
    const message = String(form.get("mensagem") || "").trim();

    if (!message && (!file || !file.name)) return;

    let fileUrl = null;
    if (file && file.name) {
      try {
        fileUrl = await uploadChatFile(file);
      } catch (error) {
        console.error("Erro ao enviar arquivo:", error);
        setSyncStatus("Erro no anexo", false);
        showModal("Erro no Anexo", "Nao foi possivel enviar o arquivo. Confira o bucket hub-chat-files no Supabase.", "error");
        return; // Interrompe o envio se o arquivo falhar!
      }
    }

    const success = await addItem("comunicados", {
      autor: getCurrentUserName(),
      canal: activeChatChannel,
      mensagem: message,
      arquivo: file && file.name ? { name: file.name, size: file.size, type: file.type, url: fileUrl } : null,
    });

    if (success) {
      formElement.reset();
      document.getElementById("selected-file").textContent = "Nenhum arquivo selecionado";
    }
  });
}

const maloteForm = document.getElementById("malote-form");
if (maloteForm) {
  document.getElementById("adicionar-epi")?.addEventListener("click", () => {
    const list = document.getElementById("epi-list");
    if (!list) return;
    list.insertAdjacentHTML("beforeend", createChamadoEpiRow());
  });

  document.getElementById("epi-list")?.addEventListener("click", (event) => {
    const button = event.target.closest(".remove-epi");
    if (!button) return;
    const rows = document.querySelectorAll("#epi-list .epi-row");
    if (rows.length <= 1) return;
    button.closest(".epi-row")?.remove();
  });

  maloteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.target;
    const form = new FormData(formElement);
    const id = form.get("id");
    const epiItems = readEpiItems(formElement);
    if (!epiItems.length) {
      showModal("EPIs obrigatorios", "Adicione pelo menos um EPI com nome e quantidade.", "error");
      return;
    }

    const payload = {
      destino: form.get("destino"),
      origem: form.get("origem"),
      epis: formatEpiItems(epiItems),
      status: form.get("status"),
      createdBy: getCurrentUserName(),
    };
    const success = id ? await updateItem("malotes", id, { ...payload, updatedBy: getCurrentUserName() }) : await addItem("malotes", payload);
    if (success) {
      formElement.reset();
      formElement.elements.id.value = "";
      resetEpiRows();
      document.getElementById("cancelar-edicao-malote")?.setAttribute("hidden", "");
      formElement.querySelector('button[type="submit"]').textContent = "Salvar malote";
    }
  });
}

document.getElementById("cancelar-edicao-malote")?.addEventListener("click", () => {
  maloteForm.reset();
  maloteForm.elements.id.value = "";
  resetEpiRows();
  document.getElementById("cancelar-edicao-malote").setAttribute("hidden", "");
  maloteForm.querySelector('button[type="submit"]').textContent = "Salvar malote";
});

const vagaForm = document.getElementById("vaga-form");
if (vagaForm) {
  vagaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.target;
    const form = new FormData(formElement);
    const id = form.get("id");
    const payload = {
      cargo: form.get("cargo"),
      projeto: "",
      descricao: form.get("descricao"),
      requisitos: form.get("requisitos"),
      status: form.get("status"),
    };
    const success = id ? await updateItem("vagas", id, payload) : await addItem("vagas", payload);
    if (success) {
      formElement.reset();
      formElement.elements.id.value = "";
      document.getElementById("cancelar-edicao-vaga")?.setAttribute("hidden", "");
      formElement.querySelector('button[type="submit"]').textContent = "Salvar vaga";
    }
  });
}

document.getElementById("cancelar-edicao-vaga")?.addEventListener("click", () => {
  vagaForm.reset();
  vagaForm.elements.id.value = "";
  document.getElementById("cancelar-edicao-vaga").setAttribute("hidden", "");
  vagaForm.querySelector('button[type="submit"]').textContent = "Salvar vaga";
});

const usuarioForm = document.getElementById("usuario-form");
if (usuarioForm) {
  usuarioForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const success = await saveTeamUser({
      nome: form.get("nome"),
      senha: form.get("senha"),
      cargo: form.get("cargo"),
    });

    if (success) {
      formElement.reset();
    }
  });
}

const fotoPerfilInput = document.getElementById("foto-perfil-input");
if (fotoPerfilInput) {
  fotoPerfilInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    const preview = document.getElementById("conta-avatar-preview");
    const filenameLabel = document.getElementById("foto-perfil-filename");
    if (file) {
      if (filenameLabel) filenameLabel.textContent = file.name;
      if (preview) {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    } else {
      if (filenameLabel) filenameLabel.textContent = "Nenhuma foto selecionada";
    }
  });
}

function showResetPasswordModal() {
  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header info">Redefinir senha</div>
      <div class="modal-body">
        <label class="modal-password-label" style="margin-top: 0;">Senha atual
          <input id="modal-current-pwd" type="password" placeholder="Digite sua senha atual" autocomplete="current-password" />
        </label>
        <label class="modal-password-label">Nova senha
          <input id="modal-new-pwd" type="password" placeholder="Digite a nova senha" autocomplete="new-password" />
        </label>
        <label class="modal-password-label">Confirmar nova senha
          <input id="modal-confirm-pwd" type="password" placeholder="Confirme a nova senha" autocomplete="new-password" />
        </label>
        <p class="form-feedback error" id="modal-action-error" hidden style="margin-top: 16px; margin-bottom: 0;"></p>
      </div>
      <div class="modal-footer modal-footer-split">
        <button class="secondary-link" type="button" data-modal-cancel>Cancelar</button>
        <button class="primary-button" type="button" data-modal-confirm>Salvar senha</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  overlay.querySelector("[data-modal-cancel]").addEventListener("click", close);
  overlay.querySelector("[data-modal-confirm]").addEventListener("click", async () => {
    const currentPwd = overlay.querySelector("#modal-current-pwd").value.trim();
    const newPwd = overlay.querySelector("#modal-new-pwd").value.trim();
    const confirmPwd = overlay.querySelector("#modal-confirm-pwd").value.trim();
    const errorEl = overlay.querySelector("#modal-action-error");

    if (!currentPwd) {
      errorEl.textContent = "A senha atual é obrigatória.";
      errorEl.hidden = false;
      return;
    }
    if (!newPwd || newPwd.length < 3) {
      errorEl.textContent = "Use uma nova senha com pelo menos 3 caracteres.";
      errorEl.hidden = false;
      return;
    }
    if (newPwd !== confirmPwd) {
      errorEl.textContent = "A confirmação da nova senha não confere.";
      errorEl.hidden = false;
      return;
    }

    if (newPwd === currentPwd) {
      errorEl.textContent = "A nova senha não pode ser igual à senha atual.";
      errorEl.hidden = false;
      return;
    }

    const user = getCurrentUserRecord();
    if (!isLoginMatch(currentPwd, user.senha)) {
      errorEl.textContent = "A senha atual informada não confere.";
      errorEl.hidden = false;
      return;
    }

    errorEl.hidden = true;
    const success = await updateCurrentAccount(currentPwd, null, newPwd, null);
    if (success) {
      close();
      showModal("Senha atualizada", "Sua senha foi redefinida com sucesso.", "info");
    }
  });

  overlay.querySelectorAll("input").forEach(input => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        overlay.querySelector("[data-modal-confirm]").click();
      }
    });
  });

  document.body.appendChild(overlay);
  overlay.querySelector("#modal-current-pwd").focus();
}

const btnRedefinirSenha = document.getElementById("btn-redefinir-senha");
if (btnRedefinirSenha) {
  btnRedefinirSenha.addEventListener("click", () => {
    showResetPasswordModal();
  });
}

const contaForm = document.getElementById("conta-form");
if (contaForm) {
  contaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const newName = String(form.get("novo_nome") || "").trim();
    const fotoFile = form.get("foto_perfil");

    let fotoUrl = null;
    if (fotoFile && fotoFile.name && supabaseClient) {
      try {
        const safeName = fotoFile.name.replace(/[^a-z0-9_.-]/gi, "-");
        const path = `avatars/${Date.now()}-${generateUUID()}-${safeName}`;
        const { error: uploadError } = await supabaseClient.storage.from("hub-chat-files").upload(path, fotoFile);
        if (uploadError) throw uploadError;
        
        const { data: publicData } = supabaseClient.storage.from("hub-chat-files").getPublicUrl(path);
        fotoUrl = publicData.publicUrl;
      } catch (e) {
        console.error("Erro ao enviar foto", e);
        showModal("Erro", "Não foi possível enviar a foto de perfil.", "error");
        return;
      }
    }

    const success = await updateCurrentAccount("", newName, "", fotoUrl);
    if (success) {
      formElement.reset();
      const filenameLabel = document.getElementById("foto-perfil-filename");
      if (filenameLabel) filenameLabel.textContent = "Nenhuma foto selecionada";
      renderAccountSettings();
      renderCurrentUser();
      showModal("Conta atualizada", "Seus dados foram atualizados com sucesso.", "info");
    }
  });
}

const candidaturaForm = document.getElementById("candidatura-form");
if (candidaturaForm) {
  document.getElementById("telefone-input")?.addEventListener("input", (event) => {
    event.currentTarget.value = formatPhone(event.currentTarget.value);
  });

  document.getElementById("cpf-input")?.addEventListener("input", (event) => {
    event.currentTarget.value = formatCpf(event.currentTarget.value);
  });

  candidaturaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.target;
    const form = new FormData(formElement);
    const vaga_id = form.get("vaga_id");
    const nome = form.get("nome");
    const telefone = form.get("telefone");
    const cpf = form.get("cpf");
    const curriculo = form.get("curriculo");

    if (!vaga_id || !nome || !telefone || !cpf || !curriculo || !curriculo.name) {
      showModal("Vaga obrigatoria", "Abra a candidatura pelo botao Candidatar-se de uma vaga aberta.", "error");
      return;
    }

    const existing = (data.candidaturas || []).find(c => String(c.vaga_id) === String(vaga_id) && c.cpf === cpf);
    if (existing) {
      showModal("Aviso", "Você já enviou um currículo para esta vaga com este CPF.", "error");
      return;
    }

    try {
      let fileUrl = "Arquivo local (não enviado)";
      if (supabaseClient) {
        const safeName = curriculo.name.replace(/[^a-z0-9_.-]/gi, "-");
        const path = `${Date.now()}-${generateUUID()}-${safeName}`;
        const { error: uploadError } = await supabaseClient.storage.from("hub-curriculos").upload(path, curriculo);
        if (uploadError) throw uploadError;
        
        const { data: publicData } = supabaseClient.storage.from("hub-curriculos").getPublicUrl(path);
        fileUrl = publicData.publicUrl;
      }

      const success = await addItem("candidaturas", { vaga_id, nome, telefone, cpf, curriculo_url: fileUrl });
      if (success) {
        formElement.reset();
        document.getElementById("vaga-id").value = vaga_id;
        showModal("Sucesso", "Seu currículo foi enviado com sucesso!", "info");
      }
    } catch (error) {
      console.error(error);
      if (error.code === "23505") {
        showModal("Aviso", "Você já enviou um currículo para esta vaga com este CPF.", "error");
      } else {
        showModal("Erro", "Não foi possível enviar o currículo. Verifique sua conexão e tente novamente.", "error");
      }
    }
  });
}

const chamadoForm = document.getElementById("chamado-form");
if (chamadoForm) {
  document.getElementById("adicionar-epi")?.addEventListener("click", () => {
    const list = document.getElementById("epi-list");
    if (!list) return;
    list.insertAdjacentHTML("beforeend", createEpiRow());
  });

  document.getElementById("epi-list")?.addEventListener("click", (event) => {
    const button = event.target.closest(".remove-epi");
    if (!button) return;
    const rows = document.querySelectorAll("#epi-list .epi-row");
    if (rows.length <= 1) return;
    button.closest(".epi-row")?.remove();
  });

  chamadoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const epiItems = readEpiItems(formElement);
    if (!epiItems.length) {
      showModal("EPIs obrigatorios", "Adicione pelo menos um EPI com nome e quantidade.", "error");
      return;
    }

    const success = await addItem("chamados", {
      solicitante: form.get("solicitante"),
      unidade: form.get("unidade"),
      epis: formatEpiItems(epiItems),
      observacoes: form.get("observacoes"),
      status: "Aberto",
      createdBy: "Publico",
    });

    if (success) {
      formElement.reset();
      const list = document.getElementById("epi-list");
      if (list) list.innerHTML = createChamadoEpiRow();
      populateUnitSelects();
      populateEpiSelects();
      showModal("Chamado aberto", "Sua solicitacao de EPI foi registrada com sucesso.", "info");
    }
  });
}

function initializeAppData() {
  populateUnitSelects();
  populateEpiSelects();
  applyRoleAccess();
  renderAccountSettings();
  supabaseClient = getSupabaseClient();
  loadFromSupabase({ setupLive: true });
}

if (setupLogin()) {
  initializeAppData();
}

// Vincula a função globalmente ao escopo de janela (window) para que o atributo onclick do HTML consiga disparar a leitura.
window.lerDenuncia = lerDenuncia;

window.toggleDenunciaSelection = function(event, id) {
  event.stopPropagation();
  const checkbox = document.querySelector(`.denuncia-select[value="${CSS.escape(String(id))}"]`);
  if (checkbox) checkbox.checked = !checkbox.checked;
};

window.reabrirChamado = function(id) {
  showConfirmActionModal({
    title: "Reabrir chamado",
    text: "Deseja mover este chamado de volta para a lista de chamados abertos?",
    confirmText: "Reabrir",
    onConfirm: async () => {
      const success = await updateItem("chamados", id, { status: "Aberto" });
      if (success) showModal("Chamado reaberto", "O chamado voltou para a lista de abertos.", "info");
    },
  });
};

window.reabrirDenuncia = function(id) {
  showConfirmActionModal({
    title: "Reabrir denúncia",
    text: "Deseja mover esta denúncia de volta para a lista de Lidas?",
    confirmText: "Reabrir",
    onConfirm: async () => {
      const success = await atualizarStatusDenuncia(id, "Lida");
      if (success) {
        showModal("Denúncia reaberta", "A denúncia voltou para a lista de Lidas.", "info");
      }
    },
  });
};

// Lógica para preparar os formulários com os dados de um documento existente
window.editarDocumento = function(id) {
  const doc = documentRecords.find(d => d.id === id);
  if (!doc) return;

  window.editingDocId = id;

  document.querySelectorAll(".doc-tab").forEach((item) => item.classList.remove("active"));
  document.querySelectorAll(".doc-view").forEach((view) => view.classList.remove("active"));
  
  const tabButton = document.querySelector(`.doc-tab[data-doc="${doc.type}"]`);
  if (tabButton) tabButton.classList.add("active");
  
  const viewElement = document.getElementById(`doc-${doc.type}`);
  if (viewElement) viewElement.classList.add("active");

  const form = document.querySelector(`form[data-doc-form="${doc.type}"]`);
  if (form && doc.formData) {
    Object.entries(doc.formData).forEach(([key, value]) => {
      if (form.elements[key]) setFieldValue(form.elements[key], value);
    });
    const btn = form.querySelector("button[type='submit']");
    if (btn) {
      if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
      btn.textContent = "Salvar alterações";
    }
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// Lógica de exclusão rápida
window.excluirDocumento = function(id) {
  showConfirmActionModal({
    title: "Excluir registro",
    text: "Tem certeza que deseja excluir este registro?",
    confirmText: "Excluir",
    danger: true,
    onConfirm: () => {
      documentRecords = documentRecords.filter(d => d.id !== id);
      saveDocumentRecords();
      renderDocumentRecords();
    },
  });
};

window.excluirUsuario = async function(id) {
  const user = (data.usuarios || []).find((item) => String(item.id) === String(id));
  if (!user) return;

  showPasswordActionModal({
    title: "Deletar conta",
    text: `Confirme a senha de autorizacao para deletar ${user.nome} da equipe.`,
    confirmText: "Deletar",
    danger: true,
    onConfirm: async () => {
      await deleteTeamUser(id);
    },
  });
};

window.mostrarSenhaUsuario = function(id) {
  const user = (data.usuarios || []).find((item) => String(item.id) === String(id));
  if (!user) return;

  showPasswordActionModal({
    title: "Mostrar senha",
    text: `Confirme a senha de autorizacao para visualizar a senha de ${user.nome}.`,
    confirmText: "Mostrar senha",
    onConfirm: () => {
      const target = document.getElementById(`senha-usuario-${id}`);
      if (target) target.textContent = user.senha || "";
    },
  });
};

window.editarVaga = function(id) {
  const vaga = (data.vagas || []).find((item) => String(item.id) === String(id));
  const form = document.getElementById("vaga-form");
  if (!vaga || !form) return;

  form.elements.id.value = vaga.id;
  form.elements.cargo.value = vaga.cargo || "";
  form.elements.descricao.value = vaga.descricao || "";
  form.elements.requisitos.value = vaga.requisitos || "";
  form.elements.status.value = vaga.status || "Aberta";
  document.getElementById("cancelar-edicao-vaga")?.removeAttribute("hidden");
  form.querySelector('button[type="submit"]').textContent = "Salvar alteracoes";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
};

window.excluirVaga = async function(id) {
  const vaga = (data.vagas || []).find((item) => String(item.id) === String(id));
  if (!vaga) return;
  showConfirmActionModal({
    title: "Deletar vaga",
    text: `Tem certeza que deseja deletar a vaga "${vaga.cargo}"?`,
    confirmText: "Deletar",
    danger: true,
    onConfirm: async () => {
      await deleteItem("vagas", id);
    },
  });
};

window.editarMalote = function(id) {
  const malote = (data.malotes || []).find((item) => String(item.id) === String(id));
  const form = document.getElementById("malote-form");
  if (!malote || !form) return;

  setFieldValue(form.elements.id, malote.id);
  setFieldValue(form.elements.destino, malote.destino || "");
  setFieldValue(form.elements.origem, malote.origem || "");
  setFieldValue(form.elements.status, malote.status || "Separação");
  resetEpiRows(parseEpiItems(malote.epis));
  document.getElementById("cancelar-edicao-malote")?.removeAttribute("hidden");
  form.querySelector('button[type="submit"]').textContent = "Salvar alteracoes";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
};

window.baixarDocumentoMalote = function(id) {
  const malote = (data.malotes || []).find((item) => String(item.id) === String(id));
  if (!malote) return;

  const epiItems = parseEpiItems(malote.epis);
  const epiRows = (epiItems.length ? epiItems : [{ nome: malote.epis || "Nao informado", tamanho: "Nao se aplica", quantidade: "1" }])
    .map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.nome || "Nao informado")}</td>
        <td>${escapeHtml(item.tamanho || "Nao se aplica")}</td>
        <td>${escapeHtml(item.quantidade || "1")}</td>
      </tr>
    `)
    .join("");

  const conteudo = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { size: A4; margin: 16mm; }
          body { font-family: Arial, Helvetica, sans-serif; color: #111827; font-size: 11px; }
          .doc { border: 1px solid #111827; padding: 10px; }
          .top-note { border: 1px solid #9ca3af; padding: 6px; font-size: 9px; text-transform: uppercase; margin-bottom: 8px; }
          .header { display: table; width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          .header > div { display: table-cell; border: 1px solid #111827; padding: 8px; vertical-align: middle; }
          .brand { width: 58%; }
          .brand h1 { margin: 0; font-size: 20px; letter-spacing: 1px; }
          .brand p { margin: 4px 0 0; font-size: 10px; }
          .number { width: 22%; text-align: center; }
          .number strong { display: block; font-size: 18px; margin-top: 4px; }
          .status { width: 20%; text-align: center; }
          .section-title { background: #e5e7eb; border: 1px solid #111827; padding: 5px; font-weight: bold; text-transform: uppercase; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #111827; padding: 6px; vertical-align: top; }
          th { background: #f3f4f6; text-transform: uppercase; font-size: 9px; }
          .field-label { display: block; font-size: 8px; color: #374151; text-transform: uppercase; margin-bottom: 4px; }
          .field-value { font-size: 12px; font-weight: bold; min-height: 16px; }
          .muted { color: #6b7280; font-weight: normal; }
          .signature { height: 72px; }
        </style>
      </head>
      <body>
        <div class="doc">
          <div class="top-note">Recebemos os materiais constantes neste documento de malote de EPI.</div>
          <div class="header">
            <div class="brand">
              <h1>HUB RH</h1>
              <p>Controle interno de malotes de EPI</p>
              <p class="muted">Documento gerado automaticamente pelo sistema</p>
            </div>
            <div class="number">
              <span class="field-label">Nº do malote</span>
              <strong>${escapeHtml(String(malote.id || ""))}</strong>
            </div>
            <div class="status">
              <span class="field-label">Status</span>
              <div class="field-value">${escapeHtml(malote.status || "")}</div>
            </div>
          </div>

          <div class="section-title">Dados do malote</div>
          <table>
            <tr>
              <td>
                <span class="field-label">Destino</span>
                <div class="field-value">${escapeHtml(malote.destino || "Nao informado")}</div>
              </td>
              <td>
                <span class="field-label">Origem</span>
                <div class="field-value">${escapeHtml(malote.origem || "Nao informada")}</div>
              </td>
              <td>
                <span class="field-label">Data</span>
                <div class="field-value">${escapeHtml(malote.createdAt || "")}</div>
              </td>
            </tr>
            <tr>
              <td>
                <span class="field-label">Registrado por</span>
                <div class="field-value">${escapeHtml(malote.createdBy || "Sistema")}</div>
              </td>
              <td>
                <span class="field-label">Alterado por</span>
                <div class="field-value">${escapeHtml(malote.updatedBy || "Sem alteracoes")}</div>
              </td>
              <td>
                <span class="field-label">Emissao</span>
                <div class="field-value">${escapeHtml(formatDateTime(new Date().toISOString()))}</div>
              </td>
            </tr>
          </table>

          <div class="section-title">Dados dos EPIs</div>
          <table>
            <thead>
              <tr>
                <th style="width: 8%;">Item</th>
                <th>EPI</th>
                <th style="width: 22%;">Tamanho do EPI</th>
                <th style="width: 16%;">Quantidade</th>
              </tr>
            </thead>
            <tbody>${epiRows}</tbody>
          </table>
        </div>
      </body>
    </html>
  `;

  const blob = new Blob(["\ufeff", conteudo], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeNumero = String(malote.id || "malote").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "");
  link.href = url;
  link.download = `malote-${safeNumero || "sem-numero"}.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

window.excluirMalote = async function(id) {
  const malote = (data.malotes || []).find((item) => String(item.id) === String(id));
  if (!malote) return;
  showConfirmActionModal({
    title: "Deletar malote",
    text: `Tem certeza que deseja deletar o malote para "${malote.destino}"?`,
    confirmText: "Deletar",
    danger: true,
    onConfirm: async () => {
      await deleteItem("malotes", id);
    },
  });
};
