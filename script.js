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
window.editingDocId = null;

const documentLabels = {
  admissao: "Checklist de Admissao",
  ausencia: "Entrevista ausencia",
  desligamento: "Entrevista de Desligamento",
  beneficios: "Adesao plano saude e odonto",
  "feedback-operacional": "Feedback operacional",
  "feedback-fredy": "Feedback Fredy Pneus",
};

const UNIT_OPTIONS = [
  "1- MTZ",
  "2- SBS",
  "3- ITJ 1",
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
  if (channelId === GENERAL_CHANNEL) return true;
  return isValidDirectChannel(channelId) && getDirectChannelUsers(channelId).includes(normalizeLoginName(getCurrentUserName()));
}

function getTeamUsers() {
  return (data.usuarios || [])
    .slice()
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"));
}

function getChatChannels() {
  const currentUser = getCurrentUserName();
  return [
    { id: GENERAL_CHANNEL, label: "Chat geral", subtitle: "Mensagens e arquivos compartilhados pela equipe" },
    ...getTeamUsers().filter((user) => normalizeLoginName(user.nome) !== normalizeLoginName(currentUser)).map((user) => ({
      id: getDirectChannel(currentUser, user.nome),
      label: user.nome,
      subtitle: `Conversa individual com ${user.nome}`,
    })),
  ];
}

function getActiveChatChannel() {
  return getChatChannels().find((channel) => channel.id === activeChatChannel) || getChatChannels()[0];
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
  return channel === GENERAL_CHANNEL || (isValidDirectChannel(channel) && isCurrentUserInChannel(channel));
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

function setAuthenticatedUser(name) {
  sessionStorage.setItem(SESSION_KEY, "active");
  sessionStorage.setItem(`${SESSION_KEY}-user`, getLoginDisplayName(name));
}

function clearAuthenticatedUser() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(`${SESSION_KEY}-user`);
}

async function validateLogin(name, password) {
  const normalizedName = normalizeLoginName(name);
  const normalizedPassword = String(password || "").trim();

  const localMatch = validateLocalLogin(normalizedName, normalizedPassword);
  if (localMatch) return true;

  const client = supabaseClient || getSupabaseClient();

  if (!client) {
    console.warn("Não foi possível conectar ao banco. Verifique se o login.html possui os scripts do Supabase.");
    const errorMsg = document.getElementById("login-error");
    if (errorMsg) errorMsg.textContent = "Erro de conexão. Verifique os scripts do banco.";
    return false;
  }

  try {
    const { data: users, error } = await client
      .from(USERS_TABLE)
      .select("nome, senha");

    if (error) throw error;

    const dbMatch = (users || []).find(
      (u) => normalizeLoginName(u.nome) === normalizedName && String(u.senha).trim() === normalizedPassword
    );

    return Boolean(dbMatch);
  } catch (error) {
    console.error("Erro ao validar usuario no Supabase:", error);
    const errorMsg = document.getElementById("login-error");
    if (errorMsg) errorMsg.textContent = "Erro de banco de dados. A tabela hub_users existe?";
    return false;
  }
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
    const requiredRecord = {
      id: existingIndex >= 0 ? data.usuarios[existingIndex].id : generateUUID(),
      nome: requiredUser.nome,
      senha: requiredUser.senha,
      syncStatus: existingIndex >= 0 ? data.usuarios[existingIndex].syncStatus : "local",
      createdAt: existingIndex >= 0 ? data.usuarios[existingIndex].createdAt : todayLabel(),
    };

    if (existingIndex >= 0) {
      data.usuarios[existingIndex] = requiredRecord;
    } else {
      data.usuarios.push(requiredRecord);
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
  if (!target) return;
  target.textContent = getCurrentUserName();
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
    .map((item) => `${item.nome} (${item.quantidade})`)
    .join(", ");
}

function readEpiItems(formElement) {
  return [...formElement.querySelectorAll(".epi-row")]
    .map((row) => ({
      nome: row.querySelector('[name="epi_nome[]"]')?.value.trim() || "",
      quantidade: row.querySelector('[name="epi_quantidade[]"]')?.value.trim() || "",
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

function resetEpiRows(items = [{ nome: "", quantidade: "" }]) {
  const list = document.getElementById("epi-list");
  if (!list) return;
  list.innerHTML = items.length ? items.map((item) => createEpiRow(item.nome, item.quantidade)).join("") : createEpiRow();
}

function parseEpiItems(value) {
  return String(value || "")
    .split(",")
    .map((part) => {
      const text = part.trim();
      const match = text.match(/^(.*?)\s*\(([^)]+)\)$/);
      return {
        nome: (match ? match[1] : text).trim(),
        quantidade: (match ? match[2] : "1").trim(),
      };
    })
    .filter((item) => item.nome);
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
      telefone: row.telefone || "",
      unidade: row.unidade,
      setor: row.setor,
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
    return {
      solicitante: values.solicitante,
      telefone: values.telefone || "",
      unidade: values.unidade,
      setor: values.setor,
      epis: values.epis,
      observacoes: values.observacoes || "",
      status: values.status || "Aberto",
      created_by: values.createdBy || getCurrentUserName(),
    };
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
    showModal("Erro ao Salvar", "Nao foi possivel salvar no Supabase. Confira se as tabelas hub_* existem no projeto EIXO.", "error");
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
    showModal("Erro ao Atualizar", "Nao foi possivel atualizar o registro no Supabase.", "error");
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
  const existingIndex = data.usuarios.findIndex((user) => normalizeLoginName(user.nome) === normalizedName);
  const user = {
    id: values.id || (existingIndex >= 0 ? data.usuarios[existingIndex].id : generateUUID()),
    nome: getLoginDisplayName(values.nome) || values.nome,
    senha: values.senha,
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
  if (!nome || !senha) return false;
  persistTeamCredential(nome, senha);

  if (!supabaseClient) {
    upsertLocalUser({ nome, senha, syncStatus: "active" });
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
      ? supabaseClient.from(USERS_TABLE).update({ nome, senha, created_by: getCurrentUserName() }).eq("id", existing.id)
      : supabaseClient.from(USERS_TABLE).insert({ nome, senha, created_by: getCurrentUserName() });

    let result = await query.select("*");

    if (result.error && isMissingCreatedByColumn(result.error)) {
      query = existing
        ? supabaseClient.from(USERS_TABLE).update({ nome, senha }).eq("id", existing.id)
        : supabaseClient.from(USERS_TABLE).insert({ nome, senha });
      result = await query.select("*");
    }

    if (result.error) throw result.error;
    const savedRows = result.data;

    const saved = mapRows("usuarios", savedRows || [])[0] || { nome, senha, createdAt: todayLabel() };
    upsertLocalUser({ ...saved, syncStatus: "active" });
    setSyncStatus("Supabase EIXO online", true);
    return true;
  } catch (error) {
    console.error("Erro ao salvar usuario no Supabase:", error);
    upsertLocalUser({ nome, senha, syncStatus: "local" });
    setSyncStatus("Usuario salvo local", false);
    showModal("Aviso de Banco de Dados", "O usuário foi salvo apenas localmente. Para que o login funcione em outros computadores, execute o código SQL de criação da tabela 'hub_users' no painel do Supabase.", "error");
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

function renderDashboard() {
  if (!document.getElementById("metric-denuncias")) return;

  document.getElementById("metric-denuncias").textContent = data.denuncias.filter((item) => item.status !== "Lida" && item.status !== "Fechada").length;
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

  // Filtra itens prioritários sem incluir atualizacoes do canal de comunicacao.
  const priorityItems = [
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
  ].slice(0, 6);

  // Compila atividades de todos os outros módulos na lista de recentes
  const recentItems = [
    ...data.malotes.map((item) => ({ title: `Malote: ${item.destino}`, text: `Origem: ${item.origem || "Nao informada"} | ${item.epis}`, tag: item.status, date: item.createdAt })),
    ...data.chamados.map((item) => ({ title: `Chamado: ${item.unidade}`, text: item.epis, tag: item.status, date: item.createdAt })),
    ...data.vagas.map((item) => ({ title: `Vaga: ${item.cargo}`, text: item.descricao, tag: item.status, date: item.createdAt })),
    ...documentRecords.map((item) => ({ title: `Doc: ${documentLabels[item.type] || item.type}`, text: item.summary, tag: "Registro", date: item.createdAt }))
  ].slice(0, 6);

  const priorityTarget = document.getElementById("priority-list");
  if (priorityTarget) {
    if (priorityItems.length === 0) {
      priorityTarget.innerHTML = '<p class="empty-state">Nenhuma pendência prioritária no momento.</p>';
    } else {
      priorityTarget.innerHTML = priorityItems
        .map((item) => `<li><div class="item-topline"><p class="item-title">${escapeHtml(item.title)}</p><span class="${badgeClass(item.tag)}">${escapeHtml(item.tag)}</span></div><p>${escapeHtml(item.text)}</p><p class="item-meta" style="margin-top: 6px; font-size: 12px;">${escapeHtml(item.date)}</p></li>`)
        .join("");
    }
  }

  const recentTarget = document.getElementById("recent-list");
  if (recentTarget) {
    if (recentItems.length === 0) {
      recentTarget.innerHTML = '<p class="empty-state">Nenhuma atividade recente registrada.</p>';
    } else {
      recentTarget.innerHTML = recentItems
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
      <button type="button" class="secondary-link" style="width: fit-content; min-height: 30px; padding: 0 10px; font-size: 12px;" onclick="mostrarSenhaUsuario('${escapeHtml(item.id)}')">Mostrar senha</button>
      <p class="item-meta">Cadastro: ${escapeHtml(item.createdAt || "Hoje")}</p>
    </article>
  `);
}

function renderChatChannels() {
  const target = document.getElementById("chat-channel-list");
  if (!target) return;

  const channels = getChatChannels();
  if (!channels.some((channel) => channel.id === activeChatChannel) || !isCurrentUserInChannel(activeChatChannel)) {
    activeChatChannel = GENERAL_CHANNEL;
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
  renderDashboard();
  renderPublicVagas();

  // Filtra as denúncias entre as listas de Não Lidas e Lidas
  const naoLidas = data.denuncias.filter(item => item.status === "Aberta");
  const lidas = data.denuncias.filter(item => item.status === "Lida");

  const cardTemplate = (item) => `
    <article class="item-card" style="cursor: pointer;" onclick="lerDenuncia('${item.id}')">
      <div class="item-topline">
        <p class="item-title">Denuncia anonima</p>
        <span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span>
      </div>
      <p>${escapeHtml(item.descricao.substring(0, 80))}${item.descricao.length > 80 ? '...' : ''}</p>
      <p class="item-meta">${escapeHtml(item.createdAt)} | Registrado por ${escapeHtml(item.createdBy || "Sistema")}</p>
    </article>
  `;

  renderCards("denuncias-nao-lidas", naoLidas, cardTemplate);
  renderCards("denuncias-lidas", lidas, cardTemplate);

  renderChatChannels();
  renderChat();

  renderMaloteReport();
  renderCards("malotes-list", getFilteredMalotes(), (item) => `
    <article class="item-card">
      <div class="item-topline"><p class="item-title">${escapeHtml(item.destino)}</p><span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span></div>
      <p><strong>Origem:</strong> ${escapeHtml(item.origem || "Nao informada")}</p>
      <p>${escapeHtml(item.epis)}</p>
      <p class="item-meta">${escapeHtml(item.createdAt)} | Registrado por ${escapeHtml(item.createdBy || "Sistema")}${item.updatedBy ? ` | Alterado por ${escapeHtml(item.updatedBy)}` : ""}</p>
      <div class="job-actions">
        <button class="secondary-link" type="button" onclick="editarMalote('${escapeHtml(item.id)}')">Editar</button>
        <button class="secondary-link" type="button" onclick="baixarDocumentoMalote('${escapeHtml(item.id)}')">Baixar documento</button>
        <button class="danger-button" type="button" onclick="excluirMalote('${escapeHtml(item.id)}')">Deletar</button>
      </div>
    </article>
  `);

  renderCards("chamados-list", data.chamados, (item) => `
    <article class="item-card">
      <div class="item-topline">
        <p class="item-title">${escapeHtml(item.unidade)}</p>
        <span class="${badgeClass(item.status)}">${escapeHtml(item.status)}</span>
      </div>
      <p><strong>Solicitante:</strong> ${escapeHtml(item.solicitante)}</p>
      <p><strong>Telefone:</strong> ${escapeHtml(formatPhone(item.telefone) || "Nao informado")}</p>
      <p><strong>Setor:</strong> ${escapeHtml(item.setor)}</p>
      <p><strong>EPIs:</strong> ${escapeHtml(item.epis)}</p>
      ${item.observacoes ? `<p><strong>Observacoes:</strong> ${escapeHtml(item.observacoes)}</p>` : ""}
      <p class="item-meta">${escapeHtml(item.createdAt)}</p>
    </article>
  `);

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
    return channel === GENERAL_CHANNEL || isCurrentUserInChannel(channel);
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

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.view).classList.add("active");
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
    list.insertAdjacentHTML("beforeend", createEpiRow());
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
    });

    if (success) {
      formElement.reset();
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
  document.getElementById("telefone-input")?.addEventListener("input", (event) => {
    event.currentTarget.value = formatPhone(event.currentTarget.value);
  });

  chamadoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const success = await addItem("chamados", {
      solicitante: form.get("solicitante"),
      telefone: form.get("telefone"),
      unidade: form.get("unidade"),
      setor: form.get("setor"),
      epis: form.get("epis"),
      observacoes: form.get("observacoes"),
      status: "Aberto",
      createdBy: "Publico",
    });

    if (success) {
      formElement.reset();
      populateUnitSelects();
      showModal("Chamado aberto", "Sua solicitacao de EPI foi registrada com sucesso.", "info");
    }
  });
}

function initializeAppData() {
  populateUnitSelects();
  supabaseClient = getSupabaseClient();
  loadFromSupabase({ setupLive: true });
}

if (setupLogin()) {
  initializeAppData();
}

// Vincula a função globalmente ao escopo de janela (window) para que o atributo onclick do HTML consiga disparar a leitura.
window.lerDenuncia = lerDenuncia;

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

  const conteudo = [
    "DOCUMENTO DO MALOTE",
    "",
    `Destino: ${malote.destino || ""}`,
    `Origem: ${malote.origem || ""}`,
    `Status: ${malote.status || ""}`,
    `Data: ${malote.createdAt || ""}`,
    `Registrado por: ${malote.createdBy || "Sistema"}`,
    malote.updatedBy ? `Alterado por: ${malote.updatedBy}` : "",
    "",
    "EPIs:",
    ...(parseEpiItems(malote.epis).length
      ? parseEpiItems(malote.epis).map((item) => `- ${item.nome}: ${item.quantidade}`)
      : [`- ${malote.epis || "Nao informado"}`]),
  ].join("\n");

  const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeDestino = String(malote.destino || "malote").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "");
  link.href = url;
  link.download = `malote-${safeDestino || malote.id}.txt`;
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
