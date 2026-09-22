
HubModules.list.forEach((mod) => {
  TABLES[mod.collection] = mod.table;
  defaultData[mod.collection] = [];
});

let data = (() => {
  try {
    return loadLocalData();
  } catch (error) {
    console.error("Cache local invalido; iniciando com dados padrao:", error);
    return defaultData;
  }
})();
let postgresClient = null;
let realtimeChannel = null;
let activeChatChannel = "";
let refreshTimer = null;
let refreshInProgress = false;
let coreCollectionsRepairInProgress = false;
let currentAuthUser = null;
let currentUserProfile = null;
let appInitializationPromise = null;
const privateAvatarUrlCache = new Map();
const privateAvatarUrlRequests = new Map();
const chatMediaSignedUrlCache = new Map();
const TRANSPARENT_IMAGE_PLACEHOLDER = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
let chamadosSelectionMode = false;
let denunciasSelectionMode = false;
let dashboardNotificationOffset = 0;
let visibleDashboardActivityItems = [];
let allDashboardActivityItems = [];
let dashboardActivityItemsReady = false;
let presenceHeartbeatStarted = false;
let currentUserSettings = loadUserSettings();
let lastUnreadNotificationCount = 0;
let hubNotificationServiceWorkerRegistration = null;
let lastRealtimeNotificationSignature = "";
let hubPollingNotificationKeys = new Set();
let hubPollingNotificationsReady = false;
let shownNotificationKeys = loadShownNotificationKeys();
let initialNotificationSnapshotReady = false;
const HUB_NOTIFICATION_SERVICE_WORKER_PATH = "hub-notifications-sw.js";
let chatMessageFilterQuery = "";
let chatMessageFilterVisible = false;
const localChatEchoMessages = new Map();
const locallyDeletedChatMessageIds = new Set();
let chatMutationInFlight = 0;
let chatMutationVersion = 0;
let chatRefreshQueuedAfterMutation = false;
const chatClientId = generateUUID();
let realtimeBroadcastReady = false;
const pendingChatBroadcasts = [];
let readNotificationIds = loadReadNotificationIds();
let readRhMessageIds = loadReadRhMessageIds();
let dismissedNotificationIds = loadDismissedNotificationIds();
window.editingDocId = null;

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
  "00- Brasil",
];
UNIT_OPTIONS.splice(3, 1, "4- PL\u00C7");

function normalizeUnitText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const UNIT_ALIASES = {
  jrg: "13- JRG 1",
  jgr: "13- JRG 1",
};

function getCanonicalUnit(value) {
  const raw = String(value || "").trim();
  if (!raw) return raw;
  const normalized = normalizeUnitText(raw);
  const exactMatch = UNIT_OPTIONS.find((option) => normalizeUnitText(option) === normalized);
  if (exactMatch) return exactMatch;
  if (UNIT_ALIASES[normalized]) return UNIT_ALIASES[normalized];
  return raw;
}

const UNIT_CITY_ALIASES = {
  brasil: "Brasil",
  mtz: "Joinville",
  sbs: "Sao Bento do Sul",
  itj: "Itajai",
  plc: "Palhoca",
  gua: "Joinville",
  "dpa jc": "Joinville",
  "dpa iri": "Joinville",
  jpl: "Joinville",
  bc: "Balneario Camboriu",
  "gcs gpo": "Araquari",
  gcs: "Joinville",
  jrg: "Jaragua do Sul",
  brq: "Brusque",
  fln: "Florianopolis",
  fac: "Joinville",
  rng: "Rio Negrinho",
  bnu: "Blumenau",
  trinca: "Joinville",
  ara: "Araquari",
};

function getUnitCity(value) {
  const unit = getCanonicalUnit(value);
  const text = normalizeUnitText(unit).replace(/^\d+\s*-\s*/, "");
  if (!text || text.startsWith("selecione")) return "";

  const key = Object.keys(UNIT_CITY_ALIASES)
    .sort((a, b) => b.length - a.length)
    .find((alias) => text.includes(alias));
  return key ? UNIT_CITY_ALIASES[key] : "";
}

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

const UNIFORM_OPTIONS = [
  "Camiseta Operacional Fredy - Pneus",
  "Camiseta Chefe de Pátio - Fredy Pneus",
  "Moletom Operacional - Fredy Pneus",
  "Camisa Social Azul - Fredy Pneus",
  "Camisa Social Branca Fredy - Pneus",
  "Calça Operacional Fredy - Pneus",
  "Camiseta Operacional - GCS",
  "Camiseta Cinza Claro - GCS",
  "Camisa Polo - GCS",
  "Calça Operacional - GCS",
  "Bermuda Operacional - GCS",
  "Camiseta Operacional - JPL",
  "Camisa Polo - JPL",
  "Moletom Operacional - JPL",
  "Calça Operacional - JPL",
  "Camiseta - FAC",
];

const ITEM_TYPE_OPTIONS = {
  epi: {
    label: "EPIs",
    options: EPI_OPTIONS,
  },
  uniforme: {
    label: "Uniforme",
    options: UNIFORM_OPTIONS,
  },
  cracha: {
    label: "Crachá",
    options: [],
  },
};


function withTimeout(promise, ms, fallbackValue = null) {
  return Promise.race([
    promise,
    new Promise((resolve) => window.setTimeout(() => resolve(fallbackValue), ms)),
  ]);
}

async function loadUserProfile(authUser) {
  if (!authUser || !postgresClient) return null;
  const email = normalizeLoginName(authUser.email);
  const displayName = normalizeLoginName(getAuthUserDisplayName(authUser));
  const profileFilters = [
    email ? `email.ilike.${email}` : "",
    displayName && displayName !== "usuario" ? `nome.ilike.${displayName}` : "",
  ].filter(Boolean).join(",");

  if (!profileFilters) return null;

  try {
    let query = postgresClient.from(USERS_TABLE).select("id, nome, email, cpf, cargo, unidade, foto_perfil, configuracoes, created_by, created_at");
    if (profileFilters) query = query.or(profileFilters);
    const { data: profiles, error } = await query.limit(1);

    if (error && isMissingColumn(error, "unidade")) {
      let fallbackQuery = postgresClient
        .from(USERS_TABLE)
        .select("id, nome, email, cpf, cargo, foto_perfil, configuracoes, created_by, created_at");
      if (profileFilters) fallbackQuery = fallbackQuery.or(profileFilters);
      let fallback = await fallbackQuery.limit(1);
      if (fallback.error && isMissingColumn(fallback.error, "configuracoes")) {
        let basicFallbackQuery = postgresClient
          .from(USERS_TABLE)
          .select("id, nome, email, cpf, cargo, foto_perfil, created_by, created_at");
        if (profileFilters) basicFallbackQuery = basicFallbackQuery.or(profileFilters);
        fallback = await basicFallbackQuery.limit(1);
      }
      if (fallback.error) throw fallback.error;
      const profile = mapRows("usuarios", fallback.data || [])[0] || null;
      if (profile) {
        const profileWithEmail = { ...profile, email: profile.email || authUser.email || "", unidade: getDefaultUserUnit(profile.nome) };
        upsertLocalUser({ ...profileWithEmail, syncStatus: "active" });
        return profileWithEmail;
      }
    }

    if (error && isMissingColumn(error, "configuracoes")) {
      let fallbackQuery = postgresClient
        .from(USERS_TABLE)
        .select("id, nome, email, cpf, cargo, unidade, foto_perfil, created_by, created_at");
      if (profileFilters) fallbackQuery = fallbackQuery.or(profileFilters);
      const fallback = await fallbackQuery.limit(1);
      if (fallback.error) throw fallback.error;
      const profile = mapRows("usuarios", fallback.data || [])[0] || null;
      if (profile) {
        const profileWithEmail = { ...profile, email: profile.email || authUser.email || "", configuracoes: {} };
        upsertLocalUser({ ...profileWithEmail, syncStatus: "active" });
        return profileWithEmail;
      }
    }

    if (error && isMissingColumn(error, "email")) {
      const fallback = await postgresClient
        .from(USERS_TABLE)
        .select("id, nome, cargo, unidade, foto_perfil, created_by, created_at")
        .ilike("nome", displayName)
        .limit(1);
      if (fallback.error) throw fallback.error;
      const profile = mapRows("usuarios", fallback.data || [])[0] || null;
      if (profile) {
        const profileWithEmail = { ...profile, email: authUser.email || "" };
        upsertLocalUser({ ...profileWithEmail, syncStatus: "active" });
        return profileWithEmail;
      }
      return hasRealAuthIdentity(authUser) ? {
        id: authUser.id,
        nome: getAuthUserDisplayName(authUser),
        email: authUser.email || "",
        cargo: authUser.app_metadata?.cargo || "",
        foto_perfil: "",
        configuracoes: {},
        syncStatus: "auth",
        createdAt: todayLabel(),
      } : null;
    }

    if (error) throw error;
    const profile = mapRows("usuarios", profiles || [])[0] || null;
    if (profile) {
      upsertLocalUser({ ...profile, email: profile.email || authUser.email, syncStatus: "active" });
      return profile;
    }
    return hasRealAuthIdentity(authUser) ? {
      id: authUser.id,
      nome: getAuthUserDisplayName(authUser),
      email: authUser.email || "",
      cargo: authUser.app_metadata?.cargo || "",
      foto_perfil: "",
      configuracoes: {},
      syncStatus: "auth",
      createdAt: todayLabel(),
    } : null;
  } catch (error) {
    console.error("Erro ao carregar perfil do usuario:", error);
    return findLocalTeamUser(authUser.email) || findLocalTeamUser(getAuthUserDisplayName(authUser)) || (hasRealAuthIdentity(authUser) ? {
      id: authUser.id,
      nome: getAuthUserDisplayName(authUser),
      email: authUser.email || "",
      cargo: authUser.app_metadata?.cargo || "",
      foto_perfil: "",
      configuracoes: {},
      syncStatus: "auth",
      createdAt: todayLabel(),
    } : null);
  }
}

async function restoreAuthenticatedSession() {
  const persistedSession = buildPersistedAuthSession();
  if (persistedSession?.user) {
    const persisted = setAuthenticatedUser(persistedSession.user, null);
    if (!persisted) return false;
    const refreshSession = async () => {
      try {
        const timeoutMarker = { timedOut: true };
        const authSession = await withTimeout(getAuthSession(), 6000, timeoutMarker);
        if (authSession === timeoutMarker) {
          console.warn("Sessao remota demorou no reload; mantendo sessao local enquanto atualiza em segundo plano.");
          return true;
        }
        if (!authSession?.user) {
          console.warn("Sessao remota indisponivel no reload; mantendo sessao local ativa.");
          return true;
        }
        const sessionUser = hydratePersistedAuthUser(authSession.user);
        const profile = await withTimeout(loadUserProfile(sessionUser), 6000, null);
        setAuthenticatedUser(sessionUser, profile);
        return true;
      } catch (error) {
        console.warn("Sessao restaurada localmente; atualizacao remota ficou pendente:", error);
        return true;
      }
    };
    if (window.__hubReloadReauthenticated) {
      const refreshed = await refreshSession();
      return refreshed !== false;
    }
    refreshSession();
    return true;
  }

  let session = null;
  try {
    const authSession = await withTimeout(getAuthSession(), 6000, null);
    if (authSession?.user) session = { ...authSession, user: hydratePersistedAuthUser(authSession.user) };
  } catch (error) {
    console.warn("Sessao auth remota indisponivel, usando sessao local persistida:", error);
  }
  if (!session?.user) {
    clearAuthenticatedUser();
    return false;
  }

  const firstPersist = setAuthenticatedUser(session.user, null);
  if (!firstPersist) return false;
  const profile = await withTimeout(loadUserProfile(session.user), 6000, null);
  const finalPersist = setAuthenticatedUser(session.user, profile);
  if (!finalPersist) return false;
  return true;
}

async function validateLogin(identifier, password) {
  const client = postgresClient || getPostgreSQLClient();
  const normalizedIdentifier = String(identifier || "").trim();
  const normalizedPassword = String(password || "").trim();

  if (!client?.auth) {
    const errorMsg = document.getElementById("login-error");
    if (errorMsg) errorMsg.textContent = "Erro de conexão com o PostgreSQL.";
    return false;
  }

  let authData;
  let error;
  if (isValidCpf(normalizedIdentifier) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier)) {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-hub-client-id": getPublicClientId() },
      body: JSON.stringify({
        identifier: normalizedIdentifier,
        password: normalizedPassword,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMsg = document.getElementById("login-error");
      if (response.status === 429 && errorMsg) errorMsg.textContent = result.error || "Muitas tentativas. Tente novamente mais tarde.";
      return false;
    }
    const session = result.session;
    const setSession = await client.auth.setSession(session || {});
    authData = { ...setSession.data, user: session?.user };
    error = setSession.error;
  } else {
    const result = await client.auth.signInWithPassword({ email: normalizedIdentifier, password: normalizedPassword });
    authData = result.data;
    error = result.error;
  }

  if (error || !authData?.user) {
    console.error("Erro no login PostgreSQL Auth:", error);
    return false;
  }

  const profile = await loadUserProfile(authData.user);
  setAuthenticatedUser(authData.user, profile);
  return true;
}

async function verifyCurrentPassword(password) {
  if (!password) return false;

  const authUser = await getCurrentAuthUser();
  const email = authUser?.email || "";
  if (!email) return false;

  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier: email, password: String(password).trim() }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function isPublicPage() {
  return Boolean(
    document.querySelector("[data-public-denuncia]") ||
    document.querySelector("[data-public-feedbacks]") ||
    document.querySelector("[data-public-vagas]") ||
    document.querySelector("[data-public-contratados]") ||
    document.querySelector("[data-public-atestados]") ||
    document.querySelector("[data-public-clima]")
  );
}

function isPublicSubmissionFormPage() {
  return Boolean(
    document.querySelector("[data-public-denuncia]") ||
    document.querySelector("[data-public-feedbacks]") ||
    document.querySelector("[data-public-vagas]") ||
    document.querySelector("[data-public-chamados]") ||
    document.querySelector("[data-public-contratados]") ||
    document.querySelector("[data-public-atestados]") ||
    document.querySelector("[data-public-clima]")
  );
}

function isPublicJobsPage() {
  return Boolean(document.querySelector("[data-public-vagas]"));
}

function isLoginPage() {
  return window.location.pathname.endsWith('login.html');
}

function getLoginRedirectTarget() {
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  const allowedTargets = new Set(["index.html", "denuncia.html", "chamados.html", "vagas.html", "candidatura.html", "atestados.html"]);
  if (!next) return "index.html";
  if (/^https?:\/\//i.test(next)) return "index.html";
  const target = next.startsWith("/") ? next.slice(1) : next;
  const page = target.split("?")[0];
  return allowedTargets.has(page) ? target : "index.html";
}

async function logout() {
  if (postgresClient?.auth) await postgresClient.auth.signOut();
  clearAuthenticatedUser();
  window.location.href = "login.html";
}

async function setupLogin() {
  const loginForm = document.getElementById("login-form");
  const settingsLogoutButton = document.getElementById("settings-logout-button");

  clearLegacyTeamCredentials();
  if (!isLoginPage() && !isPublicPage() && window.__hubAuthEntryPromise) {
    const entryAuthenticated = await window.__hubAuthEntryPromise;
    if (!entryAuthenticated) return false;
  }
  postgresClient = postgresClient || getPostgreSQLClient();

  const hasAuthSession = isLoginPage() ? false : await restoreAuthenticatedSession();
  const hasValidDisplayIdentity = hasAuthSession && !isGenericAuthName(getCurrentUserName());

  if (hasAuthSession && !hasValidDisplayIdentity) {
    clearAuthenticatedUser();
    if (!isLoginPage() && !isPublicPage()) {
      window.location.replace(`login.html?next=${encodeURIComponent(window.location.pathname.split("/").pop() || "index.html")}`);
      return false;
    }
  }

  if (hasAuthSession && hasValidDisplayIdentity) {
    if (isLoginPage()) {
      window.location.replace(getLoginRedirectTarget());
      return false;
    }
  } else {
    if (!isLoginPage() && !isPublicPage()) {
      const next = `${window.location.pathname.split("/").pop() || "index.html"}${window.location.search || ""}`;
      window.location.href = `login.html?next=${encodeURIComponent(next)}`;
      return false;
    }
  }

  loginForm?.querySelector('[name="identificador"]')?.addEventListener("input", (event) => {
    const input = event.currentTarget;
    const value = String(input.value || "");
    if (/^[\d.\-\s]*$/.test(value)) input.value = formatCpf(value);
  });

  settingsLogoutButton?.addEventListener("click", logout);

  return hasAuthSession || isPublicPage();
}

function getPostgreSQLClient() {
  if (!window.HubPostgresClient?.createClient) return null;
  return window.HubPostgresClient.createClient();
}

function setSyncStatus(text, isOnline = false) {
  const target = document.getElementById("sync-status");
  if (!target) return;
  target.textContent = text;
  document.querySelector(".status-dot")?.classList.toggle("offline", !isOnline);
}

function loadLocalData() {
  const parsed = storageService.getSessionItem(STORAGE_KEY, storageService.getLocalItem(STORAGE_KEY));
  if (!parsed) return defaultData;

  parsed.comunicados = (parsed.comunicados || []).map((item) => ({
    id: item.id || generateUUID(),
    autor: item.autor || "Equipe RH",
    mensagem: item.mensagem || item.titulo || "",
    canal: normalizeChatChannel(item.canal),
    arquivo: item.arquivo || null,
    createdAt: item.createdAt || "Hoje",
    sortAt: item.sortAt || "",
  }));
  return {
    denuncias: parsed.denuncias || [],
    feedbacks: parsed.feedbacks || [],
    comunicados: parsed.comunicados || [],
    chamados: parsed.chamados || [],
    vagas: parsed.vagas || [],
    ...Object.fromEntries(HubModules.list.map((mod) => [mod.collection, parsed[mod.collection] || []])),
    documentosContratados: (parsed.documentosContratados || [])
      .filter((item) => !String(item.id || "").startsWith("local-") && !item.pendingSync)
      .map(mapContractorDocumentRow),
    candidaturas: parsed.candidaturas || [],
    atestados: (parsed.atestados || []).map(mapAtestadoRow),
    climaPesquisas: parsed.climaPesquisas || [],
    climaConfig: parsed.climaConfig || [],
    usuarios: mergeUsersByName(parsed.usuarios || defaultData.usuarios, loadTeamUsersStore()).map(sanitizeUserRecord),
    readReceipts: parsed.readReceipts || [],
  };
}

function disableSensitiveFieldAutofill() {
  document.querySelectorAll('input[type="password"], input[type="email"], input[name="cpf"], input[name="identificador"], input[name="senha"]').forEach((input) => {
    input.autocomplete = "off";
    input.dataset.lpignore = "true";
    input.dataset["1pIgnore"] = "true";
    input.dataset.formType = "other";
    input.setAttribute("data-bwignore", "true");
    input.setAttribute("data-dashlane-rid", "ignore");
    input.setAttribute("spellcheck", "false");
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("autocorrect", "off");
  });
}

function getPublicClientId() {
  let clientId = sessionStorage.getItem(PUBLIC_CLIENT_ID_KEY);
  if (!clientId) {
    clientId = crypto.randomUUID();
    sessionStorage.setItem(PUBLIC_CLIENT_ID_KEY, clientId);
  }
  return clientId;
}

function saveLocalData() {
  applyLocalChatState();
  if (data?.usuarios) {
    data.usuarios = data.usuarios.map(sanitizeUserRecord);
    saveTeamUsersStore(data.usuarios);
    syncTeamCredentials(data.usuarios);
  }
  storageService.setSessionItem(STORAGE_KEY, data);
  storageService.setLocalItem(STORAGE_KEY, data);
}
let _saveLocalDataTimer = null;
function saveLocalDataDebounced() {
  if (_saveLocalDataTimer) clearTimeout(_saveLocalDataTimer);
  _saveLocalDataTimer = setTimeout(() => { saveLocalData(); }, 300);
}

function hasMeaningfulDashboardData(state = data) {
  if (!state) return false;
  return [
    "denuncias",
    "feedbacks",
    "comunicados",
    "malotes",
    "chamados",
    "quadros",
    "vagas",
    "eventos",
    "documentosContratados",
    "candidaturas",
    "atestados",
    "usuarios",
  ].some((collection) => Array.isArray(state[collection]) && state[collection].length > 0);
}

function ensureRequiredTeamUsers() {
  if (!data.usuarios) data.usuarios = [];
}

function mergeUsersByName(currentUsers = [], incomingUsers = []) {
  const merged = new Map();

  [...currentUsers, ...incomingUsers].forEach((user) => {
    if (!user?.nome) return;
    const key = normalizeLoginName(user.nome);
    const existing = merged.get(key);
    merged.set(key, {
      ...(existing || {}),
      ...sanitizeUserRecord(user),
      id: user.id || existing?.id || generateUUID(),
      unidade: user.unidade || user.cargoUnidade || existing?.unidade || getDefaultUserUnit(user.nome),
      createdAt: user.createdAt || existing?.createdAt || todayLabel(),
    });
  });

  return [...merged.values()];
}

function loadReadRhMessageIds() {
  return loadAccountScopedIdSet(READ_RH_MESSAGES_KEY);
}

function saveReadRhMessageIds() {
  saveAccountScopedIdSet(READ_RH_MESSAGES_KEY, readRhMessageIds);
}

function loadReadNotificationIds() {
  return loadAccountScopedIdSet(READ_NOTIFICATIONS_KEY);
}

function saveReadNotificationIds() {
  saveAccountScopedIdSet(READ_NOTIFICATIONS_KEY, readNotificationIds);
}

function loadShownNotificationKeys() {
  return loadAccountScopedIdSet(SHOWN_NOTIFICATIONS_KEY);
}

function saveShownNotificationKeys() {
  saveAccountScopedIdSet(SHOWN_NOTIFICATIONS_KEY, shownNotificationKeys, 600);
}

function loadDismissedNotificationIds() {
  return loadAccountScopedIdSet(DISMISSED_NOTIFICATIONS_KEY);
}

function saveDismissedNotificationIds() {
  saveAccountScopedIdSet(DISMISSED_NOTIFICATIONS_KEY, dismissedNotificationIds);
}

function isNotificationDismissed(dismissKey) {
  return Boolean(dismissKey) && dismissedNotificationIds.has(String(dismissKey));
}

function reloadReadStateForCurrentUser() {
  readNotificationIds = loadReadNotificationIds();
  readRhMessageIds = loadReadRhMessageIds();
  shownNotificationKeys = loadShownNotificationKeys();
  dismissedNotificationIds = loadDismissedNotificationIds();
}

function getNotificationAccountKey() {
  return getNotificationAccountAliases()[0] || "local";
}

function getNotificationAccountAliases() {
  return [
    currentAuthUser?.id ||
      "",
    currentUserProfile?.id || "",
    normalizeLoginName(currentAuthUser?.email || ""),
    normalizeLoginName(currentUserProfile?.email || ""),
    normalizeLoginName(currentUserProfile?.cpf || ""),
    normalizeLoginName(getCurrentUserName() || ""),
  ]
    .map((value) => String(value || "").trim())
    .filter((value) => value && value !== "usuario" && value !== "local")
    .filter((value, index, list) => list.indexOf(value) === index);
}

function getAccountScopedStorageKey(baseKey) {
  return `${baseKey}:${getNotificationAccountKey()}`;
}

function getAccountScopedStorageKeys(baseKey) {
  const aliases = getNotificationAccountAliases();
  return [baseKey, ...aliases.map((alias) => `${baseKey}:${alias}`), getAccountScopedStorageKey(baseKey)]
    .filter(Boolean)
    .filter((key, index, list) => list.indexOf(key) === index);
}

function loadAccountScopedIdSet(baseKey) {
  const merged = new Set();
  getAccountScopedStorageKeys(baseKey).forEach((key) => {
    storageService.getLocalItem(key, []).forEach((id) => {
      if (id !== undefined && id !== null && String(id).trim()) merged.add(String(id));
    });
  });
  return merged;
}

function saveAccountScopedIdSet(baseKey, ids, limit = 0) {
  const values = [...ids].filter((id) => id !== undefined && id !== null && String(id).trim()).map(String);
  const safeValues = limit > 0 ? values.slice(-limit) : values;
  getAccountScopedStorageKeys(baseKey).forEach((key) => storageService.setLocalItem(key, safeValues));
}

function mergeReadReceiptRows(rows = []) {
  rows.forEach((row = {}) => {
    const itemType = row.item_type || row.itemType || "";
    const itemId = row.item_id || row.itemId || "";
    const notificationId = row.notification_id || row.notificationId || (itemType === "notification" ? itemId : "");
    const messageId = row.message_id || row.messageId || (itemType === "message" ? itemId : "");
    if (itemType === "dismissed") {
      if (itemId) dismissedNotificationIds.add(String(itemId));
      return;
    }
    if (notificationId) readNotificationIds.add(String(notificationId));
    if (messageId) readRhMessageIds.add(String(messageId));
  });
  saveReadNotificationIds();
  saveReadRhMessageIds();
  saveDismissedNotificationIds();
}

async function loadReadReceiptsFromPostgreSQL() {
  if (!postgresClient || !TABLES.readReceipts) return;

  const userKeys = getReadReceiptUserIds();
  if (!userKeys.length) return;
  try {
    const { data: rows, error } = await postgresClient
      .from(TABLES.readReceipts)
      .select("*")
      .in("user_id", userKeys)
      .limit(2000);
    if (error) throw error;
    mergeReadReceiptRows(rows || []);
  } catch (error) {
    if (!isMissingColumn(error, "user_id")) {
      console.warn("Nao foi possivel carregar notificacoes lidas do PostgreSQL:", error);
    }
  }
}

function getReadReceiptUserIds() {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return [currentUserProfile?.id, currentAuthUser?.id]
    .map((value) => String(value || "").trim())
    .filter((value) => uuidPattern.test(value))
    .filter((value, index, list) => list.indexOf(value) === index);
}

function syncReadReceiptsToPostgreSQL(notificationIds = [], messageIds = [], dismissedIds = []) {
  if (!postgresClient || !TABLES.readReceipts) return;
  const userKeys = getReadReceiptUserIds();
  if (!userKeys.length) return;
  const now = new Date().toISOString();
  const rows = userKeys.flatMap((userKey) => [
    ...notificationIds.map((id) => ({ user_id: userKey, item_type: "notification", item_id: String(id), read_at: now })),
    ...messageIds.map((id) => ({ user_id: userKey, item_type: "message", item_id: String(id), read_at: now })),
    ...dismissedIds.map((id) => ({ user_id: userKey, item_type: "dismissed", item_id: String(id), read_at: now })),
  ]).filter((row) => row.item_id);
  if (!rows.length) return;
  postgresClient
    .from(TABLES.readReceipts)
    .insert(rows)
    .ignoreConflicts()
    .then(({ error }) => {
      if (error && !isMissingColumn(error, "user_id")) {
        console.warn("Nao foi possivel sincronizar notificacoes lidas:", error);
      }
    });
}

function syncCurrentReadStateToPostgreSQL() {
  const migrationKey = getAccountScopedStorageKey("hub-read-receipts-migrated-v1");
  if (storageService.getLocalItem(migrationKey, false)) return;
  syncReadReceiptsToPostgreSQL([...readNotificationIds], [...readRhMessageIds]);
  storageService.setLocalItem(migrationKey, true);
}

function markNotificationsRead(notificationIds = [], messageIds = []) {
  const normalizedNotificationIds = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
  const normalizedMessageIds = Array.isArray(messageIds) ? messageIds : [messageIds];
  const cleanNotificationIds = normalizedNotificationIds
    .filter((id) => id !== undefined && id !== null && String(id).trim())
    .map(String);
  const cleanMessageIds = normalizedMessageIds
    .filter((id) => id !== undefined && id !== null && String(id).trim())
    .map(String);
  cleanNotificationIds.forEach((id) => {
    const messageMatch = id.match(/^mensagem-rh-(.+)$/);
    if (messageMatch?.[1] && !cleanMessageIds.includes(messageMatch[1])) {
      cleanMessageIds.push(messageMatch[1]);
    }
  });
  if (cleanNotificationIds.includes("mensagens-rh") && !cleanMessageIds.length) {
    getAccessibleRhMessages().forEach((item) => {
      const id = item?.id !== undefined && item?.id !== null ? String(item.id) : "";
      if (id && !cleanMessageIds.includes(id)) cleanMessageIds.push(id);
    });
  }
  let changed = false;

  cleanNotificationIds.forEach((id) => {
      if (!readNotificationIds.has(id)) {
        readNotificationIds.add(id);
        changed = true;
      }
    });

  cleanMessageIds.forEach((id) => {
      if (!readRhMessageIds.has(id)) {
        readRhMessageIds.add(id);
        changed = true;
      }
    });

  let shownChanged = false;
  cleanNotificationIds.forEach((id) => {
    if (shownNotificationKeys.has(id)) return;
    shownNotificationKeys.add(id);
    shownChanged = true;
  });
  cleanMessageIds.forEach((id) => {
    const shownKey = `mensagem-rh-${id}`;
    if (shownNotificationKeys.has(shownKey)) return;
    shownNotificationKeys.add(shownKey);
    shownChanged = true;
  });

  removeReadNotificationPopouts(cleanNotificationIds, cleanMessageIds);

  if (!changed && !shownChanged) return false;

  saveReadNotificationIds();
  saveReadRhMessageIds();
  if (shownChanged) saveShownNotificationKeys();
  syncReadReceiptsToPostgreSQL(cleanNotificationIds, cleanMessageIds);

  try { lastUnreadNotificationCount = getUnreadRhMessages().length; } catch (_) {}
  try { renderDashboard?.(); } catch (_) {}
  try { renderChatChannels?.(); } catch (_) {}

  return true;
}

function dismissNotifications(dismissKeys = []) {
  const cleanKeys = (Array.isArray(dismissKeys) ? dismissKeys : [dismissKeys])
    .filter((key) => key !== undefined && key !== null && String(key).trim())
    .map(String)
    .filter((key, index, list) => list.indexOf(key) === index);
  if (!cleanKeys.length) return false;

  let changed = false;
  cleanKeys.forEach((key) => {
    if (dismissedNotificationIds.has(key)) return;
    dismissedNotificationIds.add(key);
    changed = true;
  });
  if (!changed) return false;

  saveDismissedNotificationIds();
  syncReadReceiptsToPostgreSQL([], [], cleanKeys);

  try { renderDashboard?.(); } catch (_) {}
  return true;
}

function getAccessibleRhMessages() {
  const currentUser = getCurrentUserName();
  return (data.comunicados || []).filter(
    (item) => canAccessChatChannel(normalizeChatChannel(item.canal)) && item.autor !== currentUser
  );
}

function getUnreadRhMessages() {
  return getAccessibleRhMessages().filter((item) => !readRhMessageIds.has(String(item.id)));
}

function markRhMessagesRead() {
  const currentChannel = activeChatChannel;
  const unread = getUnreadRhMessages().filter((item) => normalizeChatChannel(item.canal) === currentChannel);
  if (!unread.length) return;
  const unreadIds = unread.map((item) => String(item.id)).filter(Boolean);
  markNotificationsRead(["mensagens-rh"], unreadIds);
}

function checkAndMarkChatAsRead() {
  const communicationView = document.getElementById("comunicacao");
  if (!communicationView?.classList.contains("active") || !canAccessChatChannel(activeChatChannel)) return;

  const currentChannel = activeChatChannel;
  const unread = getUnreadRhMessages().filter((item) => normalizeChatChannel(item.canal) === currentChannel);
  if (!unread.length) return;

  markRhMessagesRead();
  renderDashboard();
  renderChatChannels();
}

function renderCurrentUser() {
  const target = document.getElementById("current-user");
  const avatar = document.getElementById("current-user-avatar");
  if (!target && !avatar) return;

  const user = getCurrentUserRecord();
  if (target) target.textContent = getCurrentUserName();
  if (avatar) {
    if (user?.foto_perfil && isHttpUrl(user.foto_perfil)) {
      avatar.src = user.foto_perfil;
      avatar.style.display = "block";
    } else if (user?.foto_perfil && postgresClient) {
      createPrivateStorageUrl(getHubPostgreSQLConfig().chatFilesBucket || "hub-chat-files", user.foto_perfil)
        .then((signedUrl) => {
          avatar.src = signedUrl;
          avatar.style.display = "block";
        })
        .catch(() => {
          avatar.src = "";
          avatar.style.display = "none";
        });
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


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function badgeClass(value) {
  if (value === "Aberto") return "tag chamado-open";
  return ["Urgente", "Alta", "Aberta"].includes(value) ? "tag alert" : "tag";
}

function getFriendlyErrorMessage(message) {
  const text = String(message || "");
  return /remaining connection slots|pg_use_reserved_connections/i.test(text)
    ? "Aguarde e tente novamente"
    : text;
}

function showModal(title, text, type = "info") {
  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();
  const safeText = getFriendlyErrorMessage(text);

  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header ${type}">
        ${escapeHtml(title)}
      </div>
      <div class="modal-body">${escapeHtml(safeText)}</div>
      <div class="modal-footer">
        <button class="primary-button" data-action="close-modal">Entendi</button>
      </div>
    </div>
  `;
  overlay.querySelector('[data-action="close-modal"]').addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
}

function paintNextFrame() {
  if (typeof requestAnimationFrame !== "function") return Promise.resolve();
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function showPasswordActionModal({ title, text, confirmText = "Confirmar", danger = false, onConfirm, validatePassword = verifyCurrentPassword }) {
  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  const passwordInputName = `authorization_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header ${danger ? "error" : "info"}">${escapeHtml(title)}</div>
      <div class="modal-body">
        <p>${escapeHtml(text)}</p>
        <label class="modal-password-label">Senha de autorizacao
          <input id="modal-action-password" class="masked-password-input" name="${passwordInputName}" type="text" value="" autocomplete="off" inputmode="text" spellcheck="false" autocapitalize="off" autocorrect="off" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" data-form-type="other" data-dashlane-rid="ignore" placeholder="Digite a senha" />
        </label>
        <p class="form-feedback error" id="modal-action-error" hidden>Senha incorreta.</p>
      </div>
      <div class="modal-footer modal-footer-split">
        <button class="secondary-link" type="button" data-action="close-modal">Cancelar</button>
        <button class="${danger ? "danger-button" : "primary-button"}" type="button" data-action="modal-confirm">${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  overlay.querySelector('[data-action="close-modal"]').addEventListener("click", close);
  const passwordInput = overlay.querySelector("#modal-action-password");
  overlay.querySelector('[data-action="modal-confirm"]').addEventListener("click", async () => {
    const password = passwordInput.value;
    const error = overlay.querySelector("#modal-action-error");
    const isPasswordValid = await validatePassword(password);
    if (!isPasswordValid) {
      error.hidden = false;
      return;
    }

    await onConfirm(password);
    close();
  });

  passwordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      overlay.querySelector('[data-action="modal-confirm"]').click();
    }
  });

  document.body.appendChild(overlay);
  passwordInput.value = "";
  window.setTimeout(() => {
    passwordInput.value = "";
    passwordInput.focus();
  }, 0);
}

function showEditChatMessageModal(initialText = "") {
  return new Promise((resolve) => {
    const existing = document.getElementById("custom-modal");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "custom-modal";
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-card chat-edit-modal-card">
        <div class="modal-header info">Editar mensagem</div>
        <div class="modal-body">
          <label class="chat-edit-modal-label" for="chat-edit-message-input">Mensagem</label>
          <textarea id="chat-edit-message-input" class="chat-edit-modal-textarea" maxlength="4000" rows="5">${escapeHtml(initialText)}</textarea>
          <p class="form-feedback error" id="chat-edit-message-error" hidden>A mensagem editada nao pode ficar vazia.</p>
        </div>
        <div class="modal-footer modal-footer-split">
          <button class="secondary-link" type="button" data-action="cancel-edit-chat-message">Cancelar</button>
          <button class="primary-button" type="button" data-action="save-edit-chat-message">Salvar</button>
        </div>
      </div>
    `;

    const close = (value) => {
      overlay.remove();
      resolve(value);
    };
    const textarea = overlay.querySelector("#chat-edit-message-input");
    const error = overlay.querySelector("#chat-edit-message-error");
    overlay.querySelector('[data-action="cancel-edit-chat-message"]').addEventListener("click", () => close(null));
    overlay.querySelector('[data-action="save-edit-chat-message"]').addEventListener("click", () => {
      const nextText = String(textarea.value || "").trim();
      if (!nextText) {
        error.hidden = false;
        textarea.focus();
        return;
      }
      close(nextText);
    });
    textarea.addEventListener("input", () => {
      error.hidden = true;
    });
    textarea.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(null);
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        overlay.querySelector('[data-action="save-edit-chat-message"]').click();
      }
    });

    document.body.appendChild(overlay);
    textarea.focus();
    textarea.select();
  });
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
        <button class="secondary-link" type="button" data-action="close-modal">Cancelar</button>
        <button class="${danger ? "danger-button" : "primary-button"}" type="button" data-action="modal-confirm">${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  overlay.querySelector('[data-action="close-modal"]').addEventListener("click", close);
  overlay.querySelector('[data-action="modal-confirm"]').addEventListener("click", async () => {
    close();
    await paintNextFrame();
    await onConfirm();
  });

  document.body.appendChild(overlay);
  overlay.querySelector('[data-action="modal-confirm"]').focus();
}

function showPublicVagaFiltersModal() {
  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card public-filter-modal">
      <div class="modal-header info">Filtrar vagas</div>
      <div class="modal-body public-filter-modal-body">
        <button class="secondary-link public-filter-option" type="button" data-action="open-cargo-filter">Filtrar por Cargo</button>
      </div>
      <div class="modal-footer modal-footer-split">
        <button class="secondary-link" type="button" data-action="clear-vaga-filters">Limpar</button>
        <button class="primary-button" type="button" data-action="close-modal">Fechar</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector('[data-action="clear-vaga-filters"]')?.addEventListener("click", () => {
    publicVagaCargoFilter = "";
    publicVagaCidadeFilter = "";
    renderPublicVagas();
    close();
  });
  overlay.querySelector('[data-action="open-cargo-filter"]')?.addEventListener("click", () => {
    close();
    showPublicVagaSingleFilterModal("cargo");
  });
  overlay.querySelector('[data-action="close-modal"]')?.addEventListener("click", close);

  document.body.appendChild(overlay);
  overlay.querySelector('[data-action="open-cargo-filter"]')?.focus();
}

function showPublicVagaSingleFilterModal(type) {
  const title = "Filtrar por Cargo";
  const label = "Cargo";
  const inputId = "modal-vaga-cargo-filter";
  const currentValue = publicVagaCargoFilter;

  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card public-filter-modal">
      <div class="modal-header info">${escapeHtml(title)}</div>
      <div class="modal-body public-filter-modal-body">
        <label>${escapeHtml(label)}
          <input id="${inputId}" type="search" placeholder="Digite para filtrar" autocomplete="off" value="${escapeHtml(currentValue)}" />
        </label>
      </div>
      <div class="modal-footer modal-footer-split">
        <button class="secondary-link" type="button" data-action="back-vaga-filters">Voltar</button>
        <button class="primary-button" type="button" data-action="apply-vaga-filter">Filtrar</button>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  const apply = () => {
    const value = overlay.querySelector(`#${inputId}`)?.value.trim() || "";
    publicVagaCargoFilter = value;
    renderPublicVagas();
    close();
  };

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector('[data-action="back-vaga-filters"]')?.addEventListener("click", close);
  overlay.querySelector('[data-action="apply-vaga-filter"]')?.addEventListener("click", apply);
  overlay.querySelector(`#${inputId}`)?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      apply();
    }
  });

  document.body.appendChild(overlay);
  overlay.querySelector(`#${inputId}`)?.focus();
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

function getStoragePath(value, bucket) {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";
  if (!isHttpUrl(rawValue)) return rawValue;

  try {
    const url = new URL(rawValue);
    const publicMarker = `/storage/v1/object/public/${bucket}/`;
    const signedMarker = `/storage/v1/object/sign/${bucket}/`;
    const marker = url.pathname.includes(publicMarker) ? publicMarker : signedMarker;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex < 0) return rawValue;
    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return rawValue;
  }
}

async function createPrivateStorageUrl(bucket, value) {
  if (String(value || "").startsWith("data:")) return value;
  if (!postgresClient) throw new Error("PostgreSQL indisponivel.");
  if (isHttpUrl(value)) {
    const path = getStoragePath(value, bucket);
    if (path && path !== value) value = path;
  }

  const path = getStoragePath(value, bucket);
  try {
    const { data: signedData, error } = await postgresClient.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 5);
    if (!error && signedData?.signedUrl) return signedData.signedUrl;
    console.warn("URL assinada indisponivel, usando API local:", error);
  } catch (error) {
    console.warn("Falha ao assinar arquivo, usando API local:", error);
  }
  return `/api/files?path=${encodeURIComponent(path)}`;
}

function replacePrivateAvatarPlaceholders(path, signedUrl) {
  document.querySelectorAll("[data-private-avatar-path]").forEach((placeholder) => {
    if (placeholder.dataset.privateAvatarPath !== path) return;

    const image = document.createElement("img");
    image.className = "chat-avatar";
    image.src = signedUrl;
    image.alt = placeholder.dataset.privateAvatarAlt || "Avatar";
    placeholder.replaceWith(image);
  });
}

function requestPrivateAvatarUrl(path) {
  if (!path || isHttpUrl(path) || privateAvatarUrlCache.has(path) || privateAvatarUrlRequests.has(path)) return;

  const bucket = getHubPostgreSQLConfig().chatFilesBucket || "hub-chat-files";
  const request = createPrivateStorageUrl(bucket, path)
    .then((signedUrl) => {
      privateAvatarUrlCache.set(path, signedUrl);
      replacePrivateAvatarPlaceholders(path, signedUrl);
    })
    .catch((error) => console.warn("Nao foi possivel carregar avatar privado:", error))
    .finally(() => privateAvatarUrlRequests.delete(path));

  privateAvatarUrlRequests.set(path, request);
}

async function openPrivateStorageFile(bucket, value) {
  try {
    const signedUrl = await createPrivateStorageUrl(bucket, value);
    window.open(signedUrl, "_blank", "noopener,noreferrer");
  } catch (error) {
    console.error("Erro ao abrir arquivo privado:", error);
    showModal("Arquivo privado", "Nao foi possivel abrir o arquivo. Verifique se voce esta logado e tem permissao.", "error");
  }
}

function openChatImageModal(bucket, path, name) {
  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay chat-image-modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card chat-image-modal-card">
      <div class="modal-header info">
        ${escapeHtml(name)}
      </div>
      <div class="modal-body chat-image-modal-body">
        <img class="chat-image-modal-img" alt="${escapeHtml(name)}" />
      </div>
      <div class="modal-footer">
        <button class="secondary-link" data-action="close-modal">Fechar</button>
        <button class="primary-button" data-action="download-chat-image" data-chat-image-bucket="${escapeHtml(bucket)}" data-chat-image-path="${escapeHtml(path)}" data-chat-image-name="${escapeHtml(name)}">Baixar imagem</button>
      </div>
    </div>
  `;

  overlay.querySelector('[data-action="close-modal"]')?.addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);

  const image = overlay.querySelector(".chat-image-modal-img");
  if (!image) return;

  createPrivateStorageUrl(bucket, path)
    .then((signedUrl) => {
      image.src = signedUrl;
    })
    .catch((error) => {
      console.error("Nao foi possivel carregar imagem do chat:", error);
      image.alt = "Nao foi possivel carregar a imagem.";
    });
}

async function downloadPrivateStorageFile(bucket, value, filename = "documento") {
  try {
    const signedUrl = await createPrivateStorageUrl(bucket, value);
    await downloadUrlAsBlob(signedUrl, filename || "documento");
  } catch (error) {
    console.error("Erro ao baixar arquivo privado:", error);
    showModal("Arquivo privado", "Nao foi possivel baixar o arquivo. Verifique se voce esta logado e tem permissao.", "error");
  }
}

async function downloadUrlAsBlob(url, filename = "documento") {
  if (String(url || "").startsWith("data:")) {
    downloadBlob(dataUrlToBlob(url), filename);
    return;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao baixar o arquivo: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  downloadBlob(blob, filename);
}

function parseChatMessage(row) {
  const text = row.mensagem || "";
  const match = text.match(/^\[hub-channel:([^\]]+)\]\s*/);
  return {
      canal: normalizeChatChannel(match ? match[1] : row.canal),
    mensagem: match ? text.slice(match[0].length) : text,
  };
}

function parseChatPollMessage(value) {
  const text = getChatMessageText(value);
  if (!text.startsWith(CHAT_POLL_PREFIX)) return null;

  try {
    const poll = JSON.parse(text.slice(CHAT_POLL_PREFIX.length));
    const question = String(poll.question || "").trim();
    const options = Array.isArray(poll.options)
      ? poll.options.map((option) => String(option || "").trim()).filter(Boolean).slice(0, 8)
      : [];
    if (!question || options.length < 2) return null;

    return {
      question,
      options,
      votes: poll.votes && typeof poll.votes === "object" && !Array.isArray(poll.votes) ? poll.votes : {},
      createdBy: String(poll.createdBy || ""),
      createdAt: String(poll.createdAt || ""),
    };
  } catch (error) {
    console.warn("Enquete do chat invalida:", error);
    return null;
  }
}

function parseChatMessageEnvelope(value) {
  const text = String(value || "");
  if (!text.startsWith(CHAT_EDIT_PREFIX)) {
    return { text, edited: false, editedAt: "" };
  }

  try {
    const payload = JSON.parse(text.slice(CHAT_EDIT_PREFIX.length));
    return {
      text: String(payload.text || ""),
      edited: Boolean(payload.edited),
      editedAt: String(payload.editedAt || ""),
    };
  } catch {
    return { text, edited: false, editedAt: "" };
  }
}

function getChatMessageText(value) {
  return parseChatMessageEnvelope(value).text;
}

function serializeEditedChatMessage(text) {
  return `${CHAT_EDIT_PREFIX}${JSON.stringify({
    text: String(text || "").trim(),
    edited: true,
    editedAt: new Date().toISOString(),
  })}`;
}

function serializeChatPoll(poll) {
  const question = String(poll.question || "").trim().slice(0, 180);
  const options = (Array.isArray(poll.options) ? poll.options : [])
    .map((option) => String(option || "").trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 8);
  const votes = poll.votes && typeof poll.votes === "object" && !Array.isArray(poll.votes) ? poll.votes : {};

  return `${CHAT_POLL_PREFIX}${JSON.stringify({
    question,
    options,
    votes,
    createdBy: poll.createdBy || getCurrentUserName(),
    createdAt: poll.createdAt || new Date().toISOString(),
  })}`;
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseJsonObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (!value || typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function renderChatPoll(item, poll) {
  const votes = poll.votes || {};
  const voter = normalizeLoginName(getCurrentUserName());
  const selectedIndex = Number.isInteger(Number(votes[voter])) ? Number(votes[voter]) : -1;
  const totals = poll.options.map((_, index) =>
    Object.values(votes).filter((value) => Number(value) === index).length
  );
  const totalVotes = totals.reduce((sum, value) => sum + value, 0);

  const options = poll.options.map((option, index) => {
    const count = totals[index] || 0;
    const percent = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
    const selected = selectedIndex === index;
    return `
      <button class="chat-poll-option${selected ? " is-selected" : ""}" type="button" data-action="vote-chat-poll" data-id="${escapeHtml(item.id)}" data-option="${index}">
        <span class="chat-poll-option-top">
          <span>${escapeHtml(option)}</span>
          <strong>${percent}%</strong>
        </span>
        <span class="chat-poll-bar" aria-hidden="true"><span style="width: ${percent}%"></span></span>
        <span class="item-meta">${count} voto${count === 1 ? "" : "s"}${selected ? " é seu voto" : ""}</span>
      </button>
    `;
  }).join("");

  return `
    <div class="chat-poll-card">
      <span class="tag">Enquete</span>
      <h4>${escapeHtml(poll.question)}</h4>
      <div class="chat-poll-options">${options}</div>
      <p class="item-meta">${totalVotes} voto${totalVotes === 1 ? "" : "s"} no total</p>
    </div>
  `;
}

function mapAtestadoRow(row = {}) {
  return {
    id: row.id || generateUUID(),
    nome: row.nome || row.nome_completo || "",
    cpf: row.cpf || "",
    telefone: row.telefone || "",
    unidade: row.unidade || "",
    arquivoNome: row.arquivo_nome || row.arquivoNome || row.file_name || "Atestado",
    arquivoTamanho: Number(row.arquivo_tamanho || row.arquivoTamanho || 0),
    arquivoTipo: row.arquivo_tipo || row.arquivoTipo || "application/octet-stream",
    arquivoUrl: row.arquivo_url || row.arquivoUrl || row.storage_path || "",
    status: row.status || "Recebido",
    createdBy: row.created_by || "Publico",
    createdAt: row.created_at ? formatDateTime(row.created_at) : row.createdAt || todayLabel(),
    sortAt: row.created_at || row.sortAt || new Date().toISOString(),
  };
}

function mapRows(collection, rows) {
  const hubModule = HubModules.byCollection(collection);
  if (hubModule) return rows.map(hubModule.mapRow);

  if (collection === "readReceipts") {
    return rows.map((row) => ({
      id: row.id || `${row.user_id || row.user_key || "user"}:${row.item_id || row.notification_id || row.message_id || generateUUID()}`,
      userKey: row.user_id || row.user_key || "",
      itemType: row.item_type || "",
      itemId: row.item_id || "",
      notificationId: row.notification_id || (row.item_type === "notification" ? row.item_id : ""),
      messageId: row.message_id || (row.item_type === "message" ? row.item_id : ""),
      readAt: row.read_at || row.created_at || "",
    }));
  }

  if (collection === "denuncias") {
    return rows.map((row) => ({
      id: row.id,
      identificacao: row.identificacao,
      categoria: row.categoria,
      descricao: row.descricao,
      status: row.status || "Aberta",
      createdBy: row.created_by || "Sistema",
      createdAt: formatDateTime(row.created_at),
      sortAt: row.created_at || "",
    }));
  }

  if (collection === "feedbacks") {
    return rows.map((row) => ({
      id: row.id || generateUUID(),
      tipo: row.tipo || "Feedback",
      mensagem: row.mensagem || "",
      autorNome: row.autor_nome || row.autorNome || row.created_by || "Nao informado",
      autorEmail: row.autor_email || row.autorEmail || "",
      status: row.status || "Novo",
      createdBy: row.created_by || row.autor_nome || "Sistema",
      createdAt: row.created_at ? formatDateTime(row.created_at) : row.createdAt || todayLabel(),
      sortAt: row.created_at || row.sortAt || "",
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
        sortAt: row.created_at || "",
      };
    });
  }

  if (collection === "chamados") {
    return rows.map((row) => ({
      id: row.id,
      solicitante: row.solicitante,
      unidade: row.unidade,
      setor: row.setor || "",
      epis: row.epis,
      codigoSolicitacao: row.codigo_solicitacao || "",
      observacoes: row.observacoes || "",
      status: row.status || "Aberto",
      createdAt: formatDateTime(row.created_at),
      sortAt: row.created_at || "",
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
      createdAt: formatDateTime(row.created_at),
      sortAt: row.created_at || "",
    }));
  }
  if (collection === "climaPesquisas") {
    return rows.map((row) => ({
      id: row.id,
      respostas: row.respostas && typeof row.respostas === "object" ? row.respostas : {},
      sugestao: row.sugestao || "",
      createdAt: formatDateTime(row.created_at),
      sortAt: row.created_at || "",
    }));
  }
  if (collection === "climaConfig") {
    return rows.map((row) => ({
      id: row.id,
      aberto: Boolean(row.aberto),
      abertoEm: row.aberto_em || "",
      encerradoEm: row.encerrado_em || "",
    }));
  }
  if (collection === "atestados") {
    return rows.map(mapAtestadoRow);
  }

  if (collection === "documentosContratados") {
    return rows.map(mapContractorDocumentRow);
  }

  if (collection === "usuarios") {
    return rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      email: row.email || "",
      cpf: row.cpf || "",
      cargo: row.cargo || "",
      unidade: row.unidade || getDefaultUserUnit(row.nome),
      foto_perfil: row.foto_perfil || "",
      configuracoes: parseJsonObject(row.configuracoes),
      createdBy: row.created_by || getSystemFallbackAuthor(),
      createdAt: formatDate(row.created_at),
      sortAt: row.created_at || "",
    }));
  }

  return rows.map((row) => {
    const legacyDetails = parseLegacyJobDetails(row.projeto);
    return {
      id: row.id,
      cargo: row.cargo,
      unidade: row.unidade || "",
      projeto: "",
      descricao: row.descricao || legacyDetails.descricao,
      requisitos: row.requisitos || legacyDetails.requisitos,
      status: normalizeJobStatus(row.status),
      createdBy: row.created_by || getSystemFallbackAuthor(),
      createdAt: formatDate(row.created_at),
      sortAt: row.created_at || "",
    };
  });
}

function inferContractorDocumentSource(origemHtml = "", empresa = "") {
  const source = String(origemHtml || "").trim();
  if (source) return source;
  const normalizedCompany = String(empresa || "").toLowerCase();
  if (normalizedCompany.includes("fredy")) return "documentos-fredy.html";
  if (normalizedCompany.includes("besten")) return "documentos-besten.html";
  if (normalizedCompany.includes("achei")) return "documentos-achei.html";
  if (normalizedCompany.includes("trinca")) return "documentos-trinca.html";
  return "";
}

function parseContractorDocumentsValue(value) {
  const normalizeDoc = (doc = {}) => ({
    name: doc.name || doc.nome || doc.filename || doc.fileName || "documento",
    size: doc.size || doc.tamanho || 0,
    type: doc.type || doc.mime || doc.mimeType || doc.contentType || "application/octet-stream",
    dataUrl: doc.dataUrl || doc.data_url || doc.url || "",
    path: doc.path || doc.storagePath || doc.storage_path || "",
  });
  if (Array.isArray(value)) return value.map(normalizeDoc);
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(normalizeDoc) : parsed ? [normalizeDoc(parsed)] : [];
    } catch {
      return [];
    }
  }
  if (typeof value === "object") return [normalizeDoc(value)];
  return [];
}

function mapContractorDocumentRow(row = {}) {
  return {
    id: row.id,
    empresa: row.empresa || "",
    origemHtml: inferContractorDocumentSource(row.origem_html || row.origemHtml, row.empresa),
    nome: row.nome || "",
    cpf: row.cpf || "",
    telefone: row.telefone || "",
    email: row.email || "",
    documentos: parseContractorDocumentsValue(row.documentos),
    createdBy: row.created_by || row.createdBy || "Publico",
    createdAt: formatDateTime(row.created_at || row.createdAt),
    sortAt: row.created_at || row.sortAt || row.createdAt || "",
    pendingSync: Boolean(row.pendingSync),
  };
}

function getContractorDocumentIdentity(item = {}) {
  return [
    normalizeCpf(item.cpf || ""),
    String(item.nome || "").trim().toLowerCase(),
    String(item.empresa || "").trim().toLowerCase(),
    String(item.origemHtml || "").trim().toLowerCase(),
    String(item.createdAt || "").trim().toLowerCase(),
  ].join("|");
}

function mergeContractorDocuments(localItems = [], remoteItems = []) {
  const merged = [];
  const seen = new Set();
  [...localItems, ...remoteItems].forEach((item) => {
    const normalized = {
      ...item,
      origemHtml: inferContractorDocumentSource(item.origemHtml, item.empresa),
      documentos: Array.isArray(item.documentos) ? item.documentos : [],
    };
    const key = String(normalized.id || "").startsWith("local-")
      ? getContractorDocumentIdentity(normalized)
      : String(normalized.id || getContractorDocumentIdentity(normalized));
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(normalized);
  });
  return merged;
}

function loadPendingContractorDocuments() {
  return storageService.getLocalItem(CONTRACTOR_PENDING_DOCUMENTS_KEY, []);
}

function savePendingContractorDocuments(items = []) {
  storageService.setLocalItem(CONTRACTOR_PENDING_DOCUMENTS_KEY, items);
}

function addPendingContractorDocument(item) {
  const pending = mergeContractorDocuments([item], loadPendingContractorDocuments());
  savePendingContractorDocuments(pending);
  return pending;
}

function removePendingContractorDocument(id) {
  const remaining = loadPendingContractorDocuments().filter((item) => String(item.id) !== String(id));
  savePendingContractorDocuments(remaining);
  return remaining;
}

function rememberDeletedChatMessage(id) {
  if (!id) return;
  locallyDeletedChatMessageIds.add(String(id));
  localChatEchoMessages.delete(String(id));
  data.comunicados = (data.comunicados || []).filter((item) => String(item.id) !== String(id));
}

function forgetDeletedChatMessage(id) {
  if (!id) return;
  locallyDeletedChatMessageIds.delete(String(id));
  applyLocalChatState();
}

function applyLocalChatState() {
  data.comunicados = mergeLocalChatMessages(data.comunicados || [], data.comunicados || []);
  return data.comunicados;
}

function markChatMessageAsLocalEcho(message) {
  if (!message?.id) return message;
  const localMessage = { ...message, _localEcho: true };
  localChatEchoMessages.set(String(localMessage.id), localMessage);
  applyLocalChatState();
  return localMessage;
}

function forgetLocalChatEchoMessage(id) {
  if (!id) return;
  localChatEchoMessages.delete(String(id));
  applyLocalChatState();
}

function getChatMessageDedupKey(item = {}) {
  const attachment = item.arquivo || {};
  const createdTime = new Date(item.sortAt || item.createdAt || 0).getTime();
  const timeBucket = Number.isFinite(createdTime) && createdTime > 0 ? Math.floor(createdTime / 15000) : "";
  return [
    normalizeChatChannel(item.canal || ""),
    normalizeLoginName(item.autor || ""),
    String(item.mensagem || "").trim(),
    attachment.name || "",
    attachment.size || 0,
    timeBucket,
  ].join("|");
}

function dedupeChatMessages(messages = []) {
  const byId = new Set();
  const byLogicalKey = new Set();
  const result = [];

  (messages || [])
    .filter(Boolean)
    .sort((a, b) => getDashboardRecordSortValue(b) - getDashboardRecordSortValue(a))
    .forEach((item) => {
      const id = String(item.id || "");
      if (id && byId.has(id)) return;
      const logicalKey = getChatMessageDedupKey(item);
      if (logicalKey && byLogicalKey.has(logicalKey)) return;
      if (id) byId.add(id);
      if (logicalKey) byLogicalKey.add(logicalKey);
      result.push(item);
    });

  return result;
}

function mergeLocalChatMessages(freshMessages = [], currentMessages = data.comunicados || []) {
  const visibleFreshMessages = (freshMessages || []).filter((item) => !locallyDeletedChatMessageIds.has(String(item.id)));
  const freshIds = new Set(visibleFreshMessages.map((item) => String(item.id)));
  visibleFreshMessages.forEach((item) => {
    if (item?.id && !item._pending && !item._localEcho) localChatEchoMessages.delete(String(item.id));
  });

  const currentLocalMessages = (currentMessages || []).filter((item) => {
    const id = String(item?.id || "");
    if (!id || freshIds.has(id) || locallyDeletedChatMessageIds.has(id)) return false;
    return item._pending || item._localEcho;
  });
  const registeredLocalMessages = [...localChatEchoMessages.values()].filter((item) => {
    const id = String(item?.id || "");
    return id && !freshIds.has(id) && !locallyDeletedChatMessageIds.has(id);
  });
  const localById = new Map([...currentLocalMessages, ...registeredLocalMessages].map((item) => [String(item.id), item]));

  return dedupeChatMessages([...localById.values(), ...visibleFreshMessages]);
}

function beginChatMutation() {
  chatMutationInFlight += 1;
  chatMutationVersion += 1;
  return chatMutationVersion;
}

function shouldDeferChatRefresh(loadMutationVersion) {
  return chatMutationInFlight > 0 || loadMutationVersion !== chatMutationVersion;
}

function runQueuedChatRefreshAfterMutation() {
  if (!chatRefreshQueuedAfterMutation || chatMutationInFlight > 0) return;
  if (refreshInProgress) {
    window.setTimeout(runQueuedChatRefreshAfterMutation, 100);
    return;
  }

  chatRefreshQueuedAfterMutation = false;
  refreshFromPostgreSQL();
}

function queueChatRefreshAfterMutation() {
  chatRefreshQueuedAfterMutation = true;
  window.setTimeout(runQueuedChatRefreshAfterMutation, 0);
}

function endChatMutation() {
  chatMutationInFlight = Math.max(0, chatMutationInFlight - 1);
  runQueuedChatRefreshAfterMutation();
}

function isMatchingPendingChatMessage(pending, saved) {
  if (!pending?._pending || !saved) return false;
  if (pending._clientMutationId && saved._clientMutationId && pending._clientMutationId === saved._clientMutationId) return true;
  if (normalizeChatChannel(pending.canal) !== normalizeChatChannel(saved.canal)) return false;
  if (pending.autor !== saved.autor) return false;
  if ((pending.mensagem || "") !== (saved.mensagem || "")) return false;
  if ((pending.arquivo?.name || "") !== (saved.arquivo?.name || "")) return false;
  if ((pending.arquivo?.size || 0) !== (saved.arquivo?.size || 0)) return false;
  return true;
}

function applyChatMessageUpsert(message, options = {}) {
  if (!message?.id || !canAccessChatChannel(message.canal)) return false;
  if (options.forceRestore) forgetDeletedChatMessage(message.id);
  if (locallyDeletedChatMessageIds.has(String(message.id))) return false;

  const nextMessage = options.localEcho ? markChatMessageAsLocalEcho(message) : message;
  const current = data.comunicados || [];
  const clientMutationId = nextMessage._clientMutationId || "";
  const index = current.findIndex((item) =>
    String(item.id) === String(nextMessage.id) ||
    (clientMutationId && item._clientMutationId === clientMutationId) ||
    isMatchingPendingChatMessage(item, nextMessage)
  );

  if (index >= 0) {
    data.comunicados = current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...nextMessage } : item));
  } else {
    data.comunicados = [nextMessage, ...current];
  }

  applyLocalChatState();
  return true;
}

function renderInstantChatUpdate() {
  saveLocalDataDebounced();
  renderDashboard();
  renderChatChannels();
  renderChat({ skipPostRender: true });
}

function flushPendingChatBroadcasts() {
  if (!realtimeChannel || !realtimeBroadcastReady) return;
  while (pendingChatBroadcasts.length) {
    const { event, payload } = pendingChatBroadcasts.shift();
    sendChatRealtimeBroadcast(event, payload);
  }
}

function sendChatRealtimeBroadcastNow(event, payload = {}) {
  if (!realtimeChannel || !realtimeBroadcastReady) return false;
  try {
    const result = realtimeChannel.send({
      type: "broadcast",
      event,
      payload: {
        ...payload,
        senderClientId: chatClientId,
      },
    });
    if (result?.catch) result.catch((error) => console.warn("Broadcast do chat recusado:", error));
    return true;
  } catch (error) {
    console.warn("Nao foi possivel enviar broadcast do chat:", error);
    return false;
  }
}

function sendChatRealtimeBroadcast(event, payload = {}) {
  if (sendChatRealtimeBroadcastNow(event, payload)) return;
  pendingChatBroadcasts.push({ event, payload });
  if (!realtimeChannel && postgresClient) setupRealtime();
}

function handleChatRealtimeBroadcast(payload = {}) {
  if (!payload || payload.senderClientId === chatClientId) return;

  if (payload.action === "upsert" && payload.message) {
    if (applyChatMessageUpsert(payload.message, { localEcho: Boolean(payload.localEcho), forceRestore: Boolean(payload.forceRestore) })) {
      renderInstantChatUpdate();
    }
    return;
  }

  if (payload.action === "delete" && payload.id) {
    rememberDeletedChatMessage(payload.id);
    renderInstantChatUpdate();
  }
}

function mergeRealtimeRow(collection, row, action = "INSERT") {
  if (action === "DELETE") {
    if (collection === "usuarios") {
      removeLocalUser(row.id);
      return;
    }
    if (collection === "comunicados") rememberDeletedChatMessage(row.id);
    const current = data[collection] || [];
    data[collection] = current.filter((item) => String(item.id) !== String(row.id));
    return;
  }

  const mapped = mapRows(collection, [row])[0];
  if (collection === "comunicados" && locallyDeletedChatMessageIds.has(String(mapped.id))) return;
  const current = data[collection] || [];

  if (collection === "comunicados") {
    const pendingIndex = current.findIndex((item) => isMatchingPendingChatMessage(item, mapped));
    if (pendingIndex >= 0) {
      data[collection] = current.map((item, itemIndex) => (itemIndex === pendingIndex ? markChatMessageAsLocalEcho(mapped) : item));
      return;
    }
  }

  const index = current.findIndex((item) => String(item.id) === String(mapped.id) || (collection === "usuarios" && normalizeLoginName(item.nome) === normalizeLoginName(mapped.nome)));
  if (index >= 0) {
    data[collection] = current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...mapped } : item));
  } else {
    data[collection] = [mapped, ...current];
  }
  if (collection === "comunicados") data[collection] = dedupeChatMessages(data[collection]);
}

function renderRealtimeUpdate(collection) {
  if (collection === "comunicados") applyLocalChatState();
  saveLocalDataDebounced();

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

  if (collection === "chamados") {
    renderDashboard();
    renderChamadosSection();
    return;
  }

  if (collection === "malotes") {
    renderDashboard();
    renderMalotesSection();
    return;
  }

  if (collection === "denuncias") {
    renderDashboard();
    renderDenunciasSection();
    return;
  }

  if (collection === "feedbacks") {
    renderFeedbacksSection();
    return;
  }

  const hubModule = HubModules.byCollection(collection);
  if (hubModule) {
    hubModule.render();
    return;
  }

  renderAll();
}

function closeMobileMenu() {
  const shell = document.getElementById("app-shell");
  const toggle = document.getElementById("mobile-menu-toggle");
  document.querySelector(".mobile-menu-backdrop")?.remove();
  shell?.classList.remove("mobile-menu-open");
  toggle?.setAttribute("aria-expanded", "false");
}

function openMobileMenu() {
  const shell = document.getElementById("app-shell");
  const toggle = document.getElementById("mobile-menu-toggle");
  if (!shell || shell.classList.contains("mobile-menu-open")) return;
  const backdrop = document.createElement("button");
  backdrop.type = "button";
  backdrop.className = "mobile-menu-backdrop";
  backdrop.setAttribute("aria-label", "Fechar menu");
  backdrop.addEventListener("click", closeMobileMenu);
  document.body.appendChild(backdrop);
  shell.classList.add("mobile-menu-open");
  toggle?.setAttribute("aria-expanded", "true");
}

function toggleMobileMenu() {
  const shell = document.getElementById("app-shell");
  if (shell?.classList.contains("mobile-menu-open")) closeMobileMenu();
  else openMobileMenu();
}

function toDbPayload(collection, values) {
  const hubModule = HubModules.byCollection(collection);
  if (hubModule) return hubModule.toPayload(values);

  if (collection === "comunicados") {
    const payload = {
      autor: values.autor,
      canal: normalizeChatChannel(values.canal),
      mensagem: values.mensagem || "",
      created_by: values.createdBy || values.autor || getCurrentUserName(),
      arquivo_nome: values.arquivo?.name || null,
      arquivo_tamanho: values.arquivo?.size || null,
      arquivo_tipo: values.arquivo?.type || null,
      arquivo_url: values.arquivo?.url || null,
    };
    if (values.sortAt || values.createdAt) payload.created_at = values.sortAt || values.createdAt;
    return payload;
  }

  if (collection === "usuarios") {
    return {
      nome: values.nome,
      email: values.email || null,
      cpf: normalizeCpf(values.cpf) || null,
      cargo: values.cargo || "",
      unidade: values.unidade || getDefaultUserUnit(values.nome),
      created_by: values.createdBy || getCurrentUserName(),
    };
  }

  if (collection === "vagas") {
    return {
      cargo: values.cargo,
      unidade: values.unidade || "",
      descricao: values.descricao || "",
      requisitos: values.requisitos || "",
      status: values.status || "Aberta",
      created_by: values.createdBy || getCurrentUserName(),
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

  if (collection === "climaConfig") {
    const payload = { aberto: Boolean(values.aberto) };
    if ("abertoEm" in values) payload.aberto_em = values.abertoEm || null;
    if ("encerradoEm" in values) payload.encerrado_em = values.encerradoEm || null;
    return payload;
  }

  if (collection === "atestados") {
    return {
      nome: values.nome || "",
      cpf: values.cpf || "",
      telefone: values.telefone || "",
      unidade: values.unidade || "",
      arquivo_nome: values.arquivoNome || "Atestado",
      arquivo_tamanho: values.arquivoTamanho || 0,
      arquivo_tipo: values.arquivoTipo || "application/octet-stream",
      arquivo_url: values.arquivoUrl || "",
      status: values.status || "Recebido",
      created_by: values.createdBy || "Publico",
    };
  }

  if (collection === "documentosContratados") {
    return {
      empresa: values.empresa,
      origem_html: values.origemHtml || "",
      nome: values.nome,
      cpf: values.cpf,
      telefone: values.telefone || "",
      email: values.email || "",
      documentos: values.documentos || [],
      created_by: values.createdBy || "Publico",
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

function isMissingDbColumn(error, columnName) {
  const message = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`.toLowerCase();
  const column = String(columnName || "").toLowerCase();
  return Boolean(column) && (
    message.includes(column) ||
    message.includes(`column "${column}"`) ||
    message.includes(`coluna "${column}"`)
  );
}

async function selectPostgreSQLRows(table, { orderBy = "created_at", ascending = false, configure } = {}) {
  let query = postgresClient.from(table).select("*");
  if (typeof configure === "function") query = configure(query) || query;
  if (orderBy) query = query.order(orderBy, { ascending });

  let result = await query;
  if (result.error && orderBy && isMissingDbColumn(result.error, orderBy)) {
    let fallbackQuery = postgresClient.from(table).select("*");
    if (typeof configure === "function") fallbackQuery = configure(fallbackQuery) || fallbackQuery;
    result = await fallbackQuery;
  }
  return result;
}

async function loadBootstrapRows() {
  try {
    const response = await fetch("/api/bootstrap", { credentials: "same-origin" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.data) {
      throw new Error(result?.error || "Bootstrap do PostgreSQL indisponivel.");
    }
    return result.data;
  } catch (error) {
    console.warn("Bootstrap do PostgreSQL falhou; usando carregamento por tabela:", error);
    return null;
  }
}

function shouldRepairCoreCollections() {
  return ["vagas", "malotes", "quadros", "documentosContratados"].some((collection) => !(data[collection] || []).length);
}

function getHubDataCounts() {
  return {
    comunicados: (data.comunicados || []).length,
    malotes: (data.malotes || []).length,
    quadros: (data.quadros || []).length,
    vagas: (data.vagas || []).length,
    documentosContratados: (data.documentosContratados || []).length,
    candidaturas: (data.candidaturas || []).length,
    usuarios: (data.usuarios || []).length,
  };
}

function publishHubDataCounts() {
  const counts = getHubDataCounts();
  window.__hubDataCounts = counts;
  document.body?.setAttribute("data-hub-counts", JSON.stringify(counts));
  return counts;
}

function mapBootstrapCollectionRows(collection, sourceRows = []) {
  const rows = collection === "comunicados"
    ? sourceRows.filter((row) => getAllowedChatChannelIds().includes(normalizeChatChannel(row.canal)))
    : sourceRows;
  return mapRows(collection, rows || []);
}

function applyBootstrapRowsToState(bootstrapRows, options = {}) {
  if (!bootstrapRows) return false;
  const { forceCore = false, overwriteEmpty = false } = options;
  const forceCollections = new Set(forceCore
    ? [
      "denuncias",
      "feedbacks",
      "comunicados",
      "chamados",
      "vagas",
      ...HubModules.list.map((mod) => mod.collection),
      "documentosContratados",
      "candidaturas",
      "atestados",
      "climaPesquisas",
      "readReceipts",
    ]
    : []);
  let changed = false;

  Object.keys(TABLES).forEach((collection) => {
    if (!Object.prototype.hasOwnProperty.call(bootstrapRows, collection)) return;
    const sourceRows = bootstrapRows[collection] || [];
    if (!sourceRows.length && !overwriteEmpty) return;
    if (collection !== "usuarios" && !forceCollections.has(collection) && (data[collection] || []).length) return;

    try {
      const mappedRows = mapBootstrapCollectionRows(collection, sourceRows);
      if (!mappedRows.length && !overwriteEmpty) return;
      if (collection === "usuarios") {
        data.usuarios = mergeUsersByName(data.usuarios || [], mappedRows);
      } else if (collection === "comunicados") {
        data.comunicados = mappedRows.length
          ? mergeLocalChatMessages(mappedRows, forceCollections.has(collection) ? [] : data.comunicados)
          : [];
      } else {
        data[collection] = mappedRows;
      }
      changed = true;
    } catch (error) {
      console.error("Erro ao aplicar dados do bootstrap no index:", { collection, error });
    }
  });

  if (changed) {
    saveLocalData();
    publishHubDataCounts();
  }
  return changed;
}

async function loadIndexBootstrapData(options = {}) {
  const { forceCore = true, overwriteEmpty = false, render = true } = options;
  const bootstrapRows = await loadBootstrapRows();
  const changed = applyBootstrapRowsToState(bootstrapRows, { forceCore, overwriteEmpty });
  if (changed && render) renderAll();
  return changed;
}

async function ensureViewBootstrapData(viewId) {
  const requiredByView = {
    comunicacao: ["comunicados", "usuarios"],
    malotes: ["malotes"],
    quadros: ["quadros"],
    vagas: ["vagas", "candidaturas"],
    "documentos-contratados": ["documentosContratados"],
  };
  const requiredCollections = requiredByView[viewId];
  if (!requiredCollections) return false;
  const shouldForceFreshView = ["malotes", "quadros", "documentos-contratados", "comunicacao"].includes(viewId);
  if (!shouldForceFreshView && !requiredCollections.some((collection) => !(data[collection] || []).length)) return false;

  try {
    const loaded = await loadIndexBootstrapData({ forceCore: true, overwriteEmpty: true, render: true });
    if (loaded) setSyncStatus("PostgreSQL EIXO online", true);
    return loaded;
  } catch (error) {
    console.error("Erro ao carregar dados da aba pelo bootstrap:", { viewId, error });
    return false;
  }
}

async function repairCoreCollectionsFromBootstrap() {
  if (coreCollectionsRepairInProgress || !shouldRepairCoreCollections()) return false;
  coreCollectionsRepairInProgress = true;
  try {
    return await loadIndexBootstrapData({ forceCore: false, render: true });
  } catch (error) {
    console.error("Erro ao reparar colecoes principais do PostgreSQL:", error);
    return false;
  } finally {
    coreCollectionsRepairInProgress = false;
  }
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

function normalizeJobStatus(value) {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (!normalized || normalized === "aberta" || normalized === "aberto") return "Aberta";
  if (normalized === "fechada" || normalized === "fechado") return "Fechada";
  return String(value || "Aberta").trim() || "Aberta";
}

function isOpenJobStatus(value) {
  return normalizeJobStatus(value) === "Aberta";
}

function withoutOptionalJobColumns(payload) {
  const { descricao, requisitos, unidade, created_by, ...rest } = payload;
  return rest;
}

function withoutOptionalApplicationColumns(payload) {
  const { telefone, created_by, ...rest } = payload;
  return rest;
}

async function loadFromPostgreSQL(options = {}) {
  const { setupLive = true } = options;
  const chatLoadMutationVersion = chatMutationVersion;

  if (!postgresClient) {
    const repaired = await repairCoreCollectionsFromBootstrap();
    setSyncStatus(repaired ? "PostgreSQL EIXO online" : "Modo local", repaired);
    renderAll();
    return repaired;
  }

  try {
    const bootstrapRows = await loadBootstrapRows();
    if (bootstrapRows) {
      const loaded = applyBootstrapRowsToState(bootstrapRows, { forceCore: true, overwriteEmpty: true });
      ensureRequiredTeamUsers();

      await loadReadReceiptsFromPostgreSQL();
      publishHubDataCounts();
      if (setupLive) {
        setupRealtime();
        setupAutoRefresh();
      }
      setSyncStatus("PostgreSQL EIXO online", true);
      if (setupLive) markCurrentNotificationsAsShown();
      renderAll();
      if (setupLive) rememberCurrentNotificationKeysForPolling();
      return loaded;
    }

    const usersResult = bootstrapRows ? { data: bootstrapRows.usuarios || [], error: null } : await selectPostgreSQLRows(USERS_TABLE, {
      orderBy: "created_at",
      ascending: false,
    });
    const userRows = usersResult.data || [];
    const usersError = usersResult.error;
    let usersLoadFailed = false;

    if (usersError) {
      usersLoadFailed = true;
      console.error("Erro ao carregar usuarios do PostgreSQL:", usersError);
      ensureRequiredTeamUsers();
    } else {
      const mappedUsers = mapRows("usuarios", userRows || []);
      const dbNames = mappedUsers.map((user) => normalizeLoginName(user.nome));
      data.usuarios = (data.usuarios || []).filter((localUser) => {
        const normalizedName = normalizeLoginName(localUser.nome);
        if (dbNames.includes(normalizedName)) return true;
        if (localUser.syncStatus === "local") {
          postgresClient.from(USERS_TABLE).insert({
            nome: localUser.nome,
            email: localUser.email || null,
            created_by: "Auto-Sync",
          }).then();
          return true;
        }
        return false;
      });
      data.usuarios = mergeUsersByName(data.usuarios, mappedUsers);
    }

    const requests = bootstrapRows
      ? Object.entries(TABLES)
        .filter(([collection]) => collection !== "usuarios")
        .map(([collection]) => {
          try {
            const rows = collection === "comunicados"
              ? (bootstrapRows[collection] || []).filter((row) => getAllowedChatChannelIds().includes(normalizeChatChannel(row.canal)))
              : bootstrapRows[collection] || [];
            return { status: "fulfilled", value: [collection, mapRows(collection, rows)] };
          } catch (error) {
            return { status: "rejected", reason: { collection, error } };
          }
        })
      : await Promise.allSettled(
        Object.entries(TABLES)
          .filter(([collection]) => collection !== "usuarios")
          .map(async ([collection, table]) => {
        const { data: rows, error } = await selectPostgreSQLRows(table, {
          orderBy: "created_at",
          ascending: false,
          configure(query) {
            return collection === "comunicados"
              ? query.in("canal", getAllowedChatChannelIds())
              : query;
          },
        });
        if (error) throw error;
        return [collection, mapRows(collection, rows || [])];
      })
      );

    requests.forEach((result) => {
      if (result.status === "fulfilled") {
        const [collection, rows] = result.value;

        if (collection === "comunicados") {
          if (shouldDeferChatRefresh(chatLoadMutationVersion)) {
            queueChatRefreshAfterMutation();
            return;
          }
          data[collection] = mergeLocalChatMessages(rows, data.comunicados);
          return;
        }

        data[collection] = rows;
      } else {
        console.error("Erro ao carregar colecao do PostgreSQL:", result.reason);
      }
    });
    await loadReadReceiptsFromPostgreSQL();
    ensureRequiredTeamUsers();
    saveLocalData();
    publishHubDataCounts();
    if (setupLive) {
      setupRealtime();
      setupAutoRefresh();
    }
    const hasFailures = usersLoadFailed || requests.some((result) => result.status === "rejected");
    setSyncStatus(hasFailures ? "PostgreSQL parcial" : "PostgreSQL EIXO online", !hasFailures);
    if (setupLive) markCurrentNotificationsAsShown();
    renderAll();
    if (setupLive) rememberCurrentNotificationKeysForPolling();
    return !hasFailures;
  } catch (error) {
    console.error("Erro ao carregar PostgreSQL:", error);
    setSyncStatus("PostgreSQL pendente", false);
    renderAll();
    return false;
  }
}

async function refreshFromPostgreSQL() {
  if (!postgresClient || refreshInProgress) return;

  refreshInProgress = true;
  try {
    await loadFromPostgreSQL({ setupLive: false });
    notifyNewItemsFromPolling();
  } finally {
    refreshInProgress = false;
  }
}

let lastAutoRefreshAt = 0;
const AUTO_REFRESH_MIN_GAP_MS = 60000;

function setupAutoRefresh() {
  if (refreshTimer) return;

  // O realtime (setupRealtime) e o canal principal de atualizacao; este poll
  // e so uma rede de seguranca de reconciliacao, por isso o intervalo e mais
  // longo e pausa quando a aba esta em segundo plano. O throttle evita que
  // trocar de aba repetidamente dispare varios refreshes em sequencia.
  refreshTimer = window.setInterval(() => {
    if (document.visibilityState !== "visible") return;
    if (Date.now() - lastAutoRefreshAt < AUTO_REFRESH_MIN_GAP_MS) return;
    lastAutoRefreshAt = Date.now();
    refreshFromPostgreSQL();
  }, 60000);
}

function setupRealtime() {
  if (!postgresClient || realtimeChannel) return;

  realtimeChannel = postgresClient.channel("hub-realtime-updates", {
    config: { broadcast: { self: false } },
  });

  realtimeChannel.on("broadcast", { event: "chat" }, ({ payload }) => {
    handleChatRealtimeBroadcast(payload);
  });

  Object.entries(TABLES).forEach(([collection, table]) => {
    realtimeChannel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload) => {
        const row = payload.eventType === "DELETE" ? payload.old : payload.new;
        if (!row) return;
        if (collection === "comunicados" && !canAccessChatChannel(row.canal)) return;

        const mappedRealtimeItem = mapRows(collection, [row])[0] || row;
        if (collection === "readReceipts") {
          if (!getNotificationAccountAliases().includes(String(mappedRealtimeItem.userKey || ""))) return;
          mergeReadReceiptRows([mappedRealtimeItem]);
          try { renderDashboard?.(); } catch (_) {}
          try { renderChatChannels?.(); } catch (_) {}
          try { window.notificationTracker?.loadNotifications?.(); } catch (_) {}
          return;
        }
        notifyRealtimeItem(collection, mappedRealtimeItem, payload.eventType);
        mergeRealtimeRow(collection, row, payload.eventType);
        renderRealtimeUpdate(collection);
      }
    );
  });

  realtimeChannel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      realtimeBroadcastReady = true;
      console.info("HUB realtime conectado");
      setSyncStatus("Tempo real online", true);
      flushPendingChatBroadcasts();
    } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
      realtimeBroadcastReady = false;
      console.warn("HUB realtime desconectado:", status);
      setSyncStatus("Reconectando...", false);

      try { realtimeChannel.unsubscribe(); } catch (_) {}
      realtimeChannel = null;
      setTimeout(() => {
        if (!realtimeChannel && postgresClient) {
          console.info("HUB realtime tentando reconectar...");
          setupRealtime();
          refreshFromPostgreSQL();
        }
      }, 3000);
    }
  });
}

async function uploadChatFile(file, channelId = activeChatChannel) {
  if (!file || !file.name) return null;

  const bucket = getHubPostgreSQLConfig().chatFilesBucket || "hub-chat-files";
  const safeName = safePublicFileName(file.name || "arquivo");
  const channel = safePublicFileName(normalizeChatChannel(channelId || GENERAL_CHANNEL)).replace(/\./g, "-") || GENERAL_CHANNEL;
  const path = `chat/${channel}/${Date.now()}-${generateUUID()}-${safeName}`;

  if (postgresClient?.storage?.from) {
    try {
      const { error } = await postgresClient.storage.from(bucket).upload(path, file, { contentType: getChatFileMimeType(file), upsert: false });
      if (!error) return path;
      console.warn("Storage do chat indisponivel, tentando API local:", error);
    } catch (error) {
      console.warn("Falha no storage do chat, tentando API local:", error);
    }
  }

  await uploadPublicFile(file, path);
  return path;
}

function getChatFileMimeType(fileOrAttachment) {
  const rawType = String(fileOrAttachment?.type || "").toLowerCase().trim();
  const baseType = rawType.split(";")[0].trim();
  if (baseType) return CHAT_FILE_MIME_ALIASES.get(baseType) || baseType;
  const extension = String(fileOrAttachment?.name || "").split(".").pop()?.toLowerCase() || "";
  return CHAT_FILE_EXTENSION_MIME_TYPES.get(extension) || "";
}

function isChatImageFile(fileOrAttachment) {
  return getChatFileMimeType(fileOrAttachment).startsWith("image/");
}

function isChatAudioFile(fileOrAttachment) {
  return getChatFileMimeType(fileOrAttachment).startsWith("audio/");
}

function validateChatFile(file) {
  if (!file || !file.name) return null;

  const mimeType = getChatFileMimeType(file);
  if (!CHAT_FILE_ALLOWED_MIME_TYPES.has(mimeType)) {
    return "Envie apenas imagens, videos, audios, PDF, Word ou Excel.";
  }

  if (file.size <= 0) {
    return "O arquivo enviado parece estar vazio.";
  }

  if (file.size > CHAT_FILE_MAX_SIZE_BYTES) {
    return "O arquivo do chat deve ter no maximo 3 MB.";
  }

  return null;
}

function syncChatFileInput() {
  const input = document.getElementById("chat-file");
  if (!input) return;
  const transfer = new DataTransfer();
  chatSelectedFiles.forEach((file) => transfer.items.add(file));
  input.files = transfer.files;
}

function getChatDefaultFileAccept() {
  return "image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/mp4,.m4a,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}

function closeChatAttachMenu() {
  const menu = document.getElementById("chat-attach-menu");
  const button = document.getElementById("chat-attach-menu-button");
  if (menu) menu.hidden = true;
  button?.setAttribute("aria-expanded", "false");
}

function closeChatEmojiMenu() {
  const menu = document.getElementById("chat-emoji-menu");
  const button = document.getElementById("chat-emoji-button");
  if (menu) menu.hidden = true;
  button?.setAttribute("aria-expanded", "false");
}

function toggleChatAttachMenu() {
  const menu = document.getElementById("chat-attach-menu");
  const button = document.getElementById("chat-attach-menu-button");
  if (!menu || !button || button.disabled) return;
  const nextOpen = menu.hidden;
  menu.hidden = !nextOpen;
  button.setAttribute("aria-expanded", String(nextOpen));
  if (nextOpen) closeChatEmojiMenu();
}

function renderChatEmojiMenu() {
  const menu = document.getElementById("chat-emoji-menu");
  if (!menu || menu.dataset.ready === "true") return;
  menu.innerHTML = CHAT_EMOJIS.map((emoji) => `
    <button type="button" class="chat-emoji-option" data-action="insert-chat-emoji" data-emoji="${escapeHtml(emoji)}" aria-label="Inserir ${escapeHtml(emoji)}">${escapeHtml(emoji)}</button>
  `).join("");
  menu.dataset.ready = "true";
}

function toggleChatEmojiMenu() {
  const menu = document.getElementById("chat-emoji-menu");
  const button = document.getElementById("chat-emoji-button");
  if (!menu || !button || button.disabled) return;
  renderChatEmojiMenu();
  const nextOpen = menu.hidden;
  menu.hidden = !nextOpen;
  button.setAttribute("aria-expanded", String(nextOpen));
  if (nextOpen) closeChatAttachMenu();
}

function insertChatEmoji(emoji) {
  const input = document.querySelector('#chat-form textarea[name="mensagem"]');
  if (!input || input.disabled) return;
  const value = input.value || "";
  const start = Number.isInteger(input.selectionStart) ? input.selectionStart : value.length;
  const end = Number.isInteger(input.selectionEnd) ? input.selectionEnd : start;
  input.value = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
  const cursor = start + String(emoji).length;
  input.focus();
  input.setSelectionRange(cursor, cursor);
}

function openChatFilePicker({ accept = getChatDefaultFileAccept(), capture = "" } = {}) {
  const input = document.getElementById("chat-file");
  if (!input) return;
  input.accept = accept;
  if (capture) input.setAttribute("capture", capture);
  else input.removeAttribute("capture");
  input.click();
}

function handleChatAttachOption(type) {
  closeChatAttachMenu();
  if (!activeChatChannel || !canAccessChatChannel(activeChatChannel)) {
    showModal("Selecione um chat", "Escolha um canal de comunicação antes de adicionar anexos.", "error");
    return;
  }

  switch (type) {
    case "document":
      openChatFilePicker({ accept: "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.pdf,.doc,.docx,.xls,.xlsx" });
      break;
    case "media":
      openChatFilePicker({ accept: "image/png,image/jpeg,image/webp,image/gif,video/*" });
      break;
    case "poll":
      showChatPollModal();
      break;
    default:
      openChatFilePicker();
      break;
  }
}

function setChatSelectedFile(file) {
  if (!file) return;
  chatSelectedFiles = [file];
  chatAttachmentPreviewIndex = 0;
  syncChatFileInput();
  renderChatAttachmentPreview(chatSelectedFiles);
}

function addChatSelectedFiles(files) {
  const nextFiles = Array.from(files || []).filter((file) => file && file.name);
  if (!nextFiles.length) return;
  chatSelectedFiles = [...chatSelectedFiles, ...nextFiles];
  syncChatFileInput();
  renderChatAttachmentPreview(chatSelectedFiles);
}

function removeChatSelectedFile(index) {
  const removedIndex = Number(index);
  chatSelectedFiles = chatSelectedFiles.filter((_, fileIndex) => fileIndex !== removedIndex);
  if (chatAttachmentPreviewIndex >= chatSelectedFiles.length) chatAttachmentPreviewIndex = Math.max(0, chatSelectedFiles.length - 1);
  else if (removedIndex < chatAttachmentPreviewIndex) chatAttachmentPreviewIndex -= 1;
  syncChatFileInput();
  renderChatAttachmentPreview(chatSelectedFiles);
}

function previewChatSelectedFile(index) {
  const nextIndex = Number(index);
  if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= chatSelectedFiles.length) return;
  chatAttachmentPreviewIndex = nextIndex;
  renderChatAttachmentPreview(chatSelectedFiles);
}

function getChatFileExtension(file) {
  const name = String(file?.name || "");
  const extension = name.includes(".") ? name.split(".").pop() : "";
  return (extension || getChatFileMimeType(file).split("/").pop() || "arquivo").toUpperCase();
}

function clearChatSelectedFile() {
  chatSelectedFiles = [];
  chatAttachmentPreviewIndex = 0;
  syncChatFileInput();
  renderChatAttachmentPreview([]);
}

function revokeChatAttachmentPreviewUrls() {
  chatAttachmentPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  chatAttachmentPreviewUrls = [];
  if (chatAttachmentPreviewUrl) {
    URL.revokeObjectURL(chatAttachmentPreviewUrl);
    chatAttachmentPreviewUrl = "";
  }
}

function clearChatPreviewImageSizing(panel) {
  panel?.style.removeProperty("--chat-preview-image-url");
}

function updateChatPreviewImageSizing(panel, imageUrl) {
  if (!panel || !imageUrl) return;
  panel.style.setProperty("--chat-preview-image-url", `url("${imageUrl}")`);
}

function renderChatAttachmentPreview(files) {
  const preview = document.getElementById("chat-attachment-preview");
  if (!preview) return;
  const composer = document.getElementById("chat-form") || preview.closest(".chat-composer");
  const panel = composer?.closest(".chat-panel") || preview.closest(".chat-panel");
  let composerStrip = document.getElementById("chat-composer-preview-strip");
  if (!composerStrip && composer) {
    composerStrip = document.createElement("div");
    composerStrip.id = "chat-composer-preview-strip";
    composerStrip.className = "chat-preview-strip chat-composer-preview-strip";
    composerStrip.setAttribute("aria-label", "Anexo selecionado");
    composer.appendChild(composerStrip);
  }

  revokeChatAttachmentPreviewUrls();

  const selectedFiles = Array.isArray(files) ? files.filter((file) => file && file.name) : files && files.name ? [files] : [];
  if (!selectedFiles.length) {
    preview.hidden = true;
    preview.innerHTML = "";
    if (composerStrip) {
      composerStrip.hidden = true;
      composerStrip.innerHTML = "";
    }
    composer?.classList.remove("has-attachment-preview");
    panel?.classList.remove("has-attachment-preview");
    clearChatPreviewImageSizing(panel);
    return;
  }
  composer?.classList.add("has-attachment-preview");
  panel?.classList.add("has-attachment-preview");
  if (panel && preview.parentElement !== panel) panel.appendChild(preview);

  chatAttachmentPreviewIndex = Math.min(Math.max(chatAttachmentPreviewIndex, 0), selectedFiles.length - 1);
  const file = selectedFiles[chatAttachmentPreviewIndex];
  const mimeType = getChatFileMimeType(file);
  const extension = getChatFileExtension(file);
  const size = formatFileSize(file.size);
  const fileName = escapeHtml(file.name);
  const meta = `${escapeHtml(size)} - ${escapeHtml(extension)}`;
  chatAttachmentPreviewUrl = URL.createObjectURL(file);
  chatAttachmentPreviewUrls.push(chatAttachmentPreviewUrl);

  let body = "";
  let activeChip = "";
  if (mimeType.startsWith("image/")) {
    updateChatPreviewImageSizing(panel, chatAttachmentPreviewUrl);
    body = `
      <div class="chat-preview-image-frame">
        <img class="chat-preview-image" src="${chatAttachmentPreviewUrl}" alt="Previa de ${fileName}">
      </div>`;
    activeChip = `<img class="chat-preview-chip-image" src="${chatAttachmentPreviewUrl}" alt="" aria-hidden="true">`;
  } else if (mimeType.startsWith("video/")) {
    clearChatPreviewImageSizing(panel);
    body = `
      <div class="chat-preview-image-frame chat-preview-video-frame">
        <canvas class="chat-preview-video-canvas" aria-hidden="true"></canvas>
        <video class="chat-preview-video" src="${chatAttachmentPreviewUrl}" preload="auto" playsinline aria-label="Previa de ${fileName}"></video>
        <button type="button" class="chat-preview-video-toggle" data-action="toggle-chat-preview-video" aria-label="Reproduzir video">▶</button>
      </div>`;
    activeChip = `<video class="chat-preview-chip-image" src="${chatAttachmentPreviewUrl}" muted preload="metadata" playsinline aria-hidden="true"></video>`;
  } else if (mimeType.startsWith("audio/")) {
    clearChatPreviewImageSizing(panel);
    body = `
      <div class="chat-preview-audio-card">
        <button type="button" class="chat-preview-audio-trash" data-action="clear-chat-file" title="Remover audio" aria-label="Remover audio">??</button>
        <audio class="chat-preview-audio-player" controls src="${chatAttachmentPreviewUrl}"></audio>
      </div>`;
    activeChip = `<span class="chat-preview-chip-icon" aria-hidden="true">AUD</span>`;
  } else {
    clearChatPreviewImageSizing(panel);
    const fileIcon = `<span class="chat-preview-chip-icon" aria-hidden="true">${escapeHtml(extension.slice(0, 3))}</span>`;
    body = `
      <div class="chat-preview-unavailable chat-preview-file-only" title="${meta}" aria-label="${meta}">
        <div class="chat-preview-file-icon" aria-hidden="true">${fileIcon}</div>
      </div>`;
    activeChip = fileIcon;
  }

  const chips = selectedFiles.map((item, index) => {
    const itemType = getChatFileMimeType(item);
    const itemExtension = escapeHtml(getChatFileExtension(item).slice(0, 3));
    let chipContent = `<span class="chat-preview-chip-icon" aria-hidden="true">${itemType.startsWith("audio/") ? "AUD" : itemExtension}</span>`;
    if (index === chatAttachmentPreviewIndex) chipContent = activeChip;
    else if (itemType.startsWith("image/") || itemType.startsWith("video/")) {
      const itemUrl = URL.createObjectURL(item);
      chatAttachmentPreviewUrls.push(itemUrl);
      chipContent = itemType.startsWith("video/")
        ? `<video class="chat-preview-chip-image" src="${itemUrl}" muted preload="metadata" playsinline aria-hidden="true"></video>`
        : `<img class="chat-preview-chip-image" src="${itemUrl}" alt="" aria-hidden="true">`;
    }

    return `
      <span class="chat-preview-chip-wrap">
        <button type="button" class="chat-preview-chip ${index === chatAttachmentPreviewIndex ? "is-active" : ""}" data-action="preview-chat-file" data-index="${index}" title="Visualizar ${escapeHtml(item.name)}" aria-label="Visualizar ${escapeHtml(item.name)}">
          ${chipContent}
        </button>
        <button type="button" class="chat-preview-chip-remove" data-action="remove-chat-file" data-index="${index}" title="Remover ${escapeHtml(item.name)}" aria-label="Remover ${escapeHtml(item.name)}">&times;</button>
      </span>`;
  }).join("");

  preview.innerHTML = `
    <button type="button" class="chat-preview-close" data-action="clear-chat-file" title="Remover anexo" aria-label="Remover anexo">&times;</button>
    <div class="chat-preview-title">${fileName}${selectedFiles.length > 1 ? ` + ${selectedFiles.length - 1} arquivo(s)` : ""}</div>
    <div class="chat-preview-body">${body}</div>
  `;
  preview.hidden = false;
  hydrateChatAttachmentPreviewVideo(preview);
  if (composerStrip) {
    composerStrip.innerHTML = `
      ${chips}
      <label class="chat-preview-add" for="chat-file" title="Trocar anexo" aria-label="Trocar anexo">+</label>
    `;
    composerStrip.hidden = false;
  }
}

function hydrateChatAttachmentPreviewVideo(preview) {
  const video = preview?.querySelector?.(".chat-preview-video");
  const canvas = preview?.querySelector?.(".chat-preview-video-canvas");
  const toggle = preview?.querySelector?.(".chat-preview-video-toggle");
  if (!video || video.dataset.previewHydrated === "true") return;
  video.dataset.previewHydrated = "true";
  let animationFrameId = 0;

  const drawVideoFrame = () => {
    if (!video.videoWidth || !video.videoHeight) return;
    try {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * scale));
      canvas.height = Math.max(1, Math.round(rect.height * scale));
      const context = canvas.getContext("2d");
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#0f1110";
      context.fillRect(0, 0, canvas.width, canvas.height);
      const canvasRatio = canvas.width / canvas.height;
      const videoRatio = video.videoWidth / video.videoHeight;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      if (videoRatio > canvasRatio) drawHeight = canvas.width / videoRatio;
      else drawWidth = canvas.height * videoRatio;
      const drawX = (canvas.width - drawWidth) / 2;
      const drawY = (canvas.height - drawHeight) / 2;
      context.drawImage(video, drawX, drawY, drawWidth, drawHeight);
    } catch (error) {
      console.warn("Nao foi possivel desenhar previa do video:", error);
    }
  };
  const syncToggle = () => {
    if (!toggle) return;
    toggle.textContent = video.paused ? "▶" : "⏸";
    toggle.setAttribute("aria-label", video.paused ? "Reproduzir video" : "Pausar video");
  };
  const drawWhilePlaying = () => {
    drawVideoFrame();
    if (!video.paused && !video.ended) animationFrameId = window.requestAnimationFrame(drawWhilePlaying);
  };

  video.addEventListener("loadeddata", drawVideoFrame, { once: true });
  video.addEventListener("seeked", drawVideoFrame);
  video.addEventListener("timeupdate", drawVideoFrame);
  video.addEventListener("play", () => {
    if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    syncToggle();
    drawWhilePlaying();
  });
  video.addEventListener("pause", () => {
    if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    animationFrameId = 0;
    syncToggle();
    drawVideoFrame();
  });
  video.addEventListener("ended", () => {
    if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    animationFrameId = 0;
    syncToggle();
    drawVideoFrame();
  });
  video.addEventListener("loadedmetadata", () => {
    const targetTime = Math.min(0.1, Math.max(0, Number(video.duration || 0) / 2));
    if (Number.isFinite(targetTime) && targetTime > 0) {
      try { video.currentTime = targetTime; } catch (_) {}
    }
  }, { once: true });

  try { video.load(); } catch (_) {}
  syncToggle();
}

function toggleChatAttachmentPreviewVideo() {
  const preview = document.getElementById("chat-attachment-preview");
  const video = preview?.querySelector?.(".chat-preview-video");
  if (!video) return;
  if (video.paused || video.ended) {
    video.play().catch((error) => {
      console.warn("Nao foi possivel reproduzir o video:", error);
    });
    return;
  }
  video.pause();
}

function resetAudioRecordButton() {
  const button = document.getElementById("record-audio-button");
  if (!button) return;
  button.title = "Gravar Áudio";
  button.setAttribute("aria-label", "Gravar Áudio");
  button.classList.remove("is-recording");
  button.classList.remove("is-processing");
  stopChatAudioTimer();
  updateChatAudioDuration(0);
  button.disabled = false;
}

function formatAudioDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateChatAudioDuration(totalSeconds) {
  const duration = document.getElementById("recording-duration");
  if (duration) duration.textContent = formatAudioDuration(totalSeconds);
}

function startChatAudioTimer() {
  stopChatAudioTimer();
  chatAudioStartedAt = Date.now();
  updateChatAudioDuration(0);
  chatAudioTimer = window.setInterval(() => {
    updateChatAudioDuration((Date.now() - chatAudioStartedAt) / 1000);
  }, 250);
}

function stopChatAudioTimer() {
  if (chatAudioTimer) {
    window.clearInterval(chatAudioTimer);
    chatAudioTimer = null;
  }
  chatAudioStartedAt = 0;
}

function stopChatAudioStream() {
  if (!chatAudioStream) return;
  chatAudioStream.getTracks().forEach((track) => track.stop());
  chatAudioStream = null;
}

function getSupportedChatAudioMimeType() {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return "";
  return [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ].find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function getChatAudioFileExtension(mimeType = "") {
  const normalizedType = getChatFileMimeType({ type: mimeType });
  if (normalizedType === "audio/mp4") return "m4a";
  if (normalizedType === "audio/ogg") return "ogg";
  if (normalizedType === "audio/wav") return "wav";
  if (normalizedType === "audio/mpeg") return "mp3";
  return "webm";
}

async function toggleChatAudioRecording() {
  const button = document.getElementById("record-audio-button");
  if (!button) return;

  if (chatAudioRecorder?.state === "recording") {
    chatAudioRecorder.stop();
    button.title = "Processando Áudio";
    button.setAttribute("aria-label", "Processando Áudio");
    button.classList.remove("is-recording");
    button.classList.add("is-processing");
    button.disabled = true;
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    showModal("Gravação indisponível", "Seu navegador não suporta gravação de Áudio neste canal.", "error");
    return;
  }

  try {
    chatAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getSupportedChatAudioMimeType();
    chatAudioChunks = [];
    chatAudioRecorder = new MediaRecorder(chatAudioStream, mimeType ? { mimeType } : undefined);
    chatAudioRecorder.addEventListener("dataavailable", (event) => {
      if (event.data?.size) chatAudioChunks.push(event.data);
    });
    chatAudioRecorder.addEventListener("stop", () => {
      const recordedMimeType = chatAudioRecorder?.mimeType || mimeType || "audio/webm";
      const type = getChatFileMimeType({ type: recordedMimeType, name: `audio.${getChatAudioFileExtension(recordedMimeType)}` }) || "audio/webm";
      const extension = getChatAudioFileExtension(type);
      const blob = new Blob(chatAudioChunks, { type });
      chatAudioRecorder = null;
      chatAudioChunks = [];
      stopChatAudioStream();
      resetAudioRecordButton();
      if (!blob.size) {
        showModal("Áudio vazio", "A gravação não capturou Áudio.", "error");
        return;
      }
      const file = new File([blob], `audio-chat-${Date.now()}.${extension}`, { type });
      const error = validateChatFile(file);
      if (error) {
        showModal("Anexo inválido", error, "error");
        return;
      }
      setChatSelectedFile(file);
    });
    chatAudioRecorder.start();
    startChatAudioTimer();
    button.title = "Parar gravação";
    button.setAttribute("aria-label", "Parar gravação");
    button.classList.add("is-recording");
    button.classList.remove("is-processing");
  } catch (error) {
    console.error("Erro ao gravar audio:", error);
    stopChatAudioStream();
    resetAudioRecordButton();
    const errorName = String(error?.name || "");
    const message = errorName === "NotAllowedError" || errorName === "SecurityError"
      ? "Não foi possível acessar o microfone. Verifique se a permissão do navegador está liberada para este site."
      : "Não foi possível iniciar a gravação de áudio. Verifique se há um microfone conectado e tente novamente.";
    showModal("Microfone indisponível", message, "error");
  }
}

function validateResumeFile(file) {
  if (!file || !file.name) {
    return "Anexe um curriculo em PDF, DOC ou DOCX.";
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const mimeType = String(file.type || "").toLowerCase();

  if (!RESUME_ALLOWED_EXTENSIONS.has(extension) || !RESUME_ALLOWED_MIME_TYPES.has(mimeType)) {
    return "Envie apenas arquivos PDF, DOC ou DOCX.";
  }

  if (file.size > RESUME_MAX_SIZE_BYTES) {
    return "O curriculo deve ter no maximo 3 MB.";
  }

  if (file.size <= 0) {
    return "O arquivo enviado parece estar vazio.";
  }

  return null;
}

function validateContractorDocumentFile(file) {
  if (!file || !file.name) return "Anexe pelo menos um documento.";
  if (file.size <= 0) return "Um dos arquivos enviados parece estar vazio.";
  if (file.size > CONTRACTOR_DOCUMENT_MAX_SIZE_BYTES) return "Cada documento deve ter no máximo 3 MB.";
  return null;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo anexado."));
    reader.readAsDataURL(file);
  });
}

function safePublicFileName(fileName = "arquivo") {
  return String(fileName || "arquivo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_.-]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "arquivo";
}

function createContractorDocumentField(required = false) {
  return `
    <div class="contractor-document-field">
      <label>${required ? "Documentos" : "Documento adicional"}
        <input name="documentos" type="file" multiple ${required ? "required" : ""} />
      </label>
      ${required ? "" : '<button class="secondary-link contractor-remove-document-button" type="button" data-action="remover-documento-contratado">Remover</button>'}
    </div>
  `;
}

function resetContractorDocumentFields(container) {
  if (!container) return;
  container.innerHTML = createContractorDocumentField(true);
}

async function buildContractorDocumentPayload(documentos, batchId) {
  const files = Array.from(documentos || []);
  const uploadedDocuments = [];
  for (const file of files) {
    const safeName = safePublicFileName(file.name || "documento");
    const path = `contratados/${batchId}/${Date.now()}-${safeName}`;
    const upload = await uploadPublicFile(file, path);
    uploadedDocuments.push({
      name: String(file.name || "documento"),
      size: Number(file.size || 0),
      type: String(file.type || "application/octet-stream"),
      path: upload?.path || path,
    });
  }
  return uploadedDocuments;
}

async function uploadPublicFile(file, path = "") {
  if (!file || !file.name) return null;
  const response = await fetch("/api/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path,
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      dataUrl: await readFileAsDataUrl(file),
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Nao foi possivel enviar o arquivo.");
  return result;
}

function normalizeCpf(value) {
  return String(value || "").replace(/\D/g, "");
}

function isValidCpf(value) {
  const cpf = normalizeCpf(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (length) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) sum += Number(cpf[index]) * (length + 1 - index);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

function validatePublicFormSubmission(formElement) {
  const honeypot = String(formElement?.elements?.website?.value || "").trim();

  if (honeypot) {
    return "Nao foi possivel validar o envio. Recarregue a pagina e tente novamente.";
  }

  return null;
}

function getPublicChallengeToken(formElement) {
  return String(
    formElement?.querySelector('[name="cf-turnstile-response"]')?.value ||
    formElement?.elements?.turnstileToken?.value ||
    ""
  ).trim();
}

function loadTurnstileScript() {
  if (document.querySelector('script[data-turnstile-loader]')) return;

  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
  script.async = true;
  script.defer = true;
  script.dataset.turnstileLoader = "true";
  document.head.appendChild(script);
}

function ensurePublicCaptchaNotice(formElement) {
  const config = getHubPostgreSQLConfig();
  if (!formElement || !config.turnstileSiteKey || formElement.querySelector(".cf-turnstile")) return;

  loadTurnstileScript();
  const target = document.createElement("div");
  target.className = "cf-turnstile";
  target.dataset.sitekey = config.turnstileSiteKey;
  formElement.querySelector('button[type="submit"]')?.before(target);
}

async function submitPublicRecord(collection, payload, turnstileToken = "") {
  const table = TABLES[collection];
  if (!table) throw new Error("Tipo de envio invalido.");
  const response = await fetch(`/api/records?table=${encodeURIComponent(table)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-hub-client-id": getPublicClientId() },
    body: JSON.stringify({ rows: [{ ...payload, created_by: payload.created_by || "Publico" }] }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || "Envio publico bloqueado.");
    error.code = result.code;
    error.status = response.status;
    throw error;
  }

  return Array.isArray(result.data) ? result.data[0] : result.data;
}

async function submitPublicApplicationWithFile({ vaga_id, nome, telefone, cpf, curriculo, turnstileToken }) {
  const safeName = safePublicFileName(curriculo?.name || "curriculo.pdf");
  const resumePath = `${RESUME_PUBLIC_PREFIX}/${generateUUID()}/${safeName}`;
  const upload = await uploadPublicFile(curriculo, resumePath);
  const response = await fetch(`/api/records?table=${encodeURIComponent(TABLES.candidaturas)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-hub-client-id": getPublicClientId() },
    body: JSON.stringify({
      rows: [{
        vaga_id,
        nome,
        telefone,
        cpf,
        curriculo_url: upload?.path || resumePath,
        created_by: "Publico",
      }],
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || "Envio publico bloqueado.");
    error.code = result.code;
    error.status = response.status;
    throw error;
  }

  return Array.isArray(result.data) ? result.data[0] : result.data;
}

async function submitPublicContractorDocuments({ empresa, origemHtml, nome, telefone, cpf, email, documentos, accessPassword, turnstileToken }) {
  const uploadedDocuments = await buildContractorDocumentPayload(documentos, generateUUID());

  const attempts = [{ url: "/api/contractor-documents", type: "documentosContratados", localApi: true }];

  let lastError = null;
  for (const attempt of attempts) {
    const response = await fetch(attempt.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        empresa: String(empresa || ""),
        origemHtml: String(origemHtml || ""),
        nome: String(nome || ""),
        telefone: String(telefone || ""),
        cpf: String(cpf || ""),
        email: String(email || ""),
        accessPassword: String(accessPassword || ""),
        documentos: uploadedDocuments,
        turnstileToken: String(turnstileToken || ""),
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      const savedRecord = mapContractorDocumentRow(result.data || {});
      if (savedRecord.id) {
        data.documentosContratados = mergeContractorDocuments([savedRecord], data.documentosContratados || []);
        saveLocalData();
      }
      return result.data;
    }

    lastError = new Error(result.error || "Envio publico bloqueado.");
    lastError.code = result.code;
    lastError.status = response.status;
    const canTryNext = /tipo invalido|not found|not_found|funcao sem postgres_service_role_key|function not found|schema cache|row-level security/i.test(lastError.message)
      || [400, 401, 404, 405, 500].includes(response.status);
    if (!canTryNext) throw lastError;
  }

  throw new Error(lastError?.message || "Nao foi possivel salvar os documentos no PostgreSQL. O envio nao foi registrado para o RH.");
}

function isPublicInsertOnlyCollection(collection) {
  return isPublicSubmissionFormPage() && ["denuncias", "feedbacks", "chamados", "candidaturas", "documentosContratados", "climaPesquisas"].includes(collection);
}

function toPublicSubmissionPayload(collection, values) {
  if (collection === "denuncias") {
    return {
      identificacao: "Anonimo",
      categoria: "Denuncia anonima",
      descricao: String(values.descricao || "").trim(),
      status: "Aberta",
    };
  }

  if (collection === "feedbacks") {
    return {
      tipo: String(values.tipo || "Sugestao").trim(),
      mensagem: String(values.mensagem || "").trim(),
      autor_nome: String(values.autorNome || values.nome || "").trim(),
      autor_email: String(values.autorEmail || values.email || "").trim() || null,
      status: "Novo",
      created_by: String(values.autorNome || values.nome || "Formulario publico").trim(),
    };
  }

  if (collection === "chamados") {
    return {
      solicitante: String(values.solicitante || "").trim(),
      unidade: String(values.unidade || "").trim(),
      setor: String(values.setor || "").trim(),
      epis: String(values.epis || "").trim(),
      observacoes: String(values.observacoes || "").trim(),
      status: "Aberto",
      created_by: "Publico",
    };
  }

  return toDbPayload(collection, values);
}

function appendLocalInsertedItem(collection, values) {
  data[collection].unshift({
    id: generateUUID(),
    createdAt: todayLabel(),
    sortAt: new Date().toISOString(),
    createdBy: values.createdBy || getCurrentUserName(),
    ...values,
  });
}

async function addItem(collection, values) {
  if (!postgresClient) {
    appendLocalInsertedItem(collection, values);
    saveLocalData();
    renderAll();
    return true;
  }

  try {
    const isPublicInsert = isPublicInsertOnlyCollection(collection);
    const { _turnstileToken, ...cleanValues } = values;
    const payload = isPublicInsert
      ? toPublicSubmissionPayload(collection, cleanValues)
      : toDbPayload(collection, values);

    if (isPublicInsert) {
      const inserted = await submitPublicRecord(collection, payload, _turnstileToken);
      data[collection].unshift(inserted ? mapRows(collection, [inserted])[0] : {
        id: generateUUID(),
        createdAt: todayLabel(),
        sortAt: new Date().toISOString(),
        createdBy: values.createdBy || getCurrentUserName(),
        ...values,
      });
      if (!isPublicPage()) {
        saveLocalData();
        renderAll();
      }
      return true;
    }

    const { data: inserted, error } = await postgresClient
      .from(TABLES[collection])
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      if (isMissingCreatedByColumn(error)) {
        const { data: insertedWithoutAuthor, error: retryError } = await postgresClient
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
        setSyncStatus("PostgreSQL sem autoria", false);
        renderAll();
        return true;
      }

      if (collection === "malotes" && isMissingColumn(error, "updated_by")) {
        const { data: insertedWithoutEditor, error: retryError } = await postgresClient
          .from(TABLES[collection])
          .insert(withoutUpdatedBy(payload))
          .select("*")
          .single();

        if (retryError) throw retryError;

        data[collection].unshift({
          ...mapRows(collection, [insertedWithoutEditor])[0],
          createdBy: values.createdBy || getCurrentUserName(),
        });
        saveLocalData();
        setSyncStatus("PostgreSQL precisa migracao", false);
        renderAll();
        return true;
      }

      const legacyInsert = HubModules.byCollection(collection)?.insertFallbacks?.find((fallback) => isMissingColumn(error, fallback.column));
      if (legacyInsert) {
        const { data: insertedLegacy, error: retryError } = await postgresClient
          .from(TABLES[collection])
          .insert(legacyInsert.strip(payload))
          .select("*")
          .single();

        if (retryError) throw retryError;

        data[collection].unshift({
          ...mapRows(collection, [insertedLegacy])[0],
          ...legacyInsert.patch(values),
          createdBy: values.createdBy || getCurrentUserName(),
        });
        saveLocalData();
        setSyncStatus("PostgreSQL precisa migracao", false);
        renderAll();
        showModal("Banco precisa atualizar", legacyInsert.message, "info");
        return true;
      }

      if (collection === "vagas" && (isMissingColumn(error, "descricao") || isMissingColumn(error, "requisitos") || isMissingColumn(error, "unidade"))) {
        const { data: insertedLegacy, error: retryError } = await postgresClient
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
        setSyncStatus("PostgreSQL precisa migracao", false);
        renderAll();
        showModal("Banco precisa atualizar", "A vaga foi salva em modo compatibilidade. Rode o postgres-schema.sql atualizado para gravar descricao e requisitos em colunas proprias.", "info");
        return true;
      }

      if (collection === "candidaturas" && isMissingColumn(error, "telefone")) {
        const { data: insertedLegacy, error: retryError } = await postgresClient
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
        setSyncStatus("PostgreSQL precisa migracao", false);
        renderAll();
        showModal("Banco precisa atualizar", "A candidatura foi salva, mas rode o postgres-schema.sql atualizado para gravar telefone no banco.", "info");
        return true;
      }

      throw error;
    }

    data[collection].unshift(mapRows(collection, [inserted])[0]);
    saveLocalData();
    setSyncStatus("PostgreSQL EIXO online", true);
    renderAll();
    return true;
  } catch (error) {
    console.error("Erro ao salvar no PostgreSQL:", error);
if (collection === "eventos") {
      data[collection].unshift({
        id: generateUUID(),
        createdAt: todayLabel(),
        sortAt: new Date().toISOString(),
        createdBy: values.createdBy || getCurrentUserName(),
        ...values,
      });
      saveLocalData();
      setSyncStatus("Evento salvo localmente", false);
      renderAll();
      showModal("Evento salvo localmente", "Rode o SQL do calendario no PostgreSQL para sincronizar esta agenda entre computadores.", "info");
      return true;
    }
    setSyncStatus("Erro no PostgreSQL", false);
    const isRlsBlock = error?.code === "42501" || error?.message?.includes("row-level security") || error?.code === "PGRST301";
    const isNoRows = error?.code === "PGRST116";
    const message = isPublicInsertOnlyCollection(collection)
      ? (error?.message || "Nao foi possivel enviar o formulario publico.")
      : collection === "chamados"
        ? "Nao foi possivel abrir o chamado. Rode o arquivo fix-chamados-postgres.sql no PostgreSQL para criar a tabela hub_chamados."
        : collection === "vagas" && (isRlsBlock || isNoRows)
          ? "Sem permissao para salvar a vaga. Verifique se seu usuario tem cargo 'RH' na tabela hub_users e se o e-mail do perfil coincide com o e-mail do login. Rode o hub-vagas-fix.sql para corrigir."
          : collection === "vagas"
            ? `Nao foi possivel salvar a vaga. ${error?.message || "Confira se as colunas descricao, requisitos e created_by existem em hub_vagas (rode hub-vagas-fix.sql)."}`
            : HubModules.byCollection(collection)?.saveErrorMessage
              ? HubModules.byCollection(collection).saveErrorMessage(error)
              : "Nao foi possivel salvar no PostgreSQL. Confira se as tabelas hub_* existem no projeto EIXO.";
    showModal("Erro ao Salvar", message, "error");
    return false;
  }
}

async function addChatMessage(values) {
  if (!postgresClient) {
    return {
      id: generateUUID(),
      createdAt: todayLabel(),
      sortAt: new Date().toISOString(),
      createdBy: values.createdBy || getCurrentUserName(),
      ...values,
    };
  }

  try {
    const { data: inserted, error } = await postgresClient
      .from(TABLES.comunicados)
      .insert(toDbPayload("comunicados", values))
      .select("*")
      .single();

    if (error) throw error;

    setSyncStatus("PostgreSQL EIXO online", true);
    return mapRows("comunicados", [inserted])[0];
  } catch (error) {
    console.error("Erro ao salvar mensagem no PostgreSQL:", error);
    setSyncStatus("Erro no chat", false);
    showModal("Erro ao enviar", "Nao foi possivel enviar a mensagem. Confira a conexao e tente novamente.", "error");
    return null;
  }
}

async function deleteChatMessageRecord(id) {
  beginChatMutation();
  const current = data.comunicados || [];
  const removed = current.find((item) => String(item.id) === String(id));
  if (!removed) {
    endChatMutation();
    return false;
  }

  rememberDeletedChatMessage(id);
  sendChatRealtimeBroadcast("chat", { action: "delete", id });
  data.comunicados = current.filter((item) => String(item.id) !== String(id));
  saveLocalDataDebounced();
  renderChat({ skipPostRender: true });
  window.setTimeout(() => {
    renderDashboard();
    renderChatChannels();
  }, 0);

  if (!postgresClient || String(id).startsWith("pending-")) {
    endChatMutation();
    return true;
  }

  try {
    const { data: deletedRows, error } = await postgresClient
      .from(TABLES.comunicados)
      .delete()
      .eq("id", id)
      .select("id");

    if (error) throw error;
    if (!deletedRows?.length) throw new Error("Delete nao confirmado pelo PostgreSQL.");

    setSyncStatus("PostgreSQL EIXO online", true);
    return true;
  } catch (error) {
    console.error("Erro ao excluir mensagem no PostgreSQL:", error);
    forgetDeletedChatMessage(id);
    sendChatRealtimeBroadcast("chat", { action: "upsert", message: removed, localEcho: true, forceRestore: true });
    data.comunicados = [removed, ...(data.comunicados || []).filter((item) => String(item.id) !== String(id))];
    saveLocalDataDebounced();
    renderChat({ skipPostRender: true });
    window.setTimeout(() => {
      renderDashboard();
      renderChatChannels();
    }, 0);
    setSyncStatus("Erro no chat", false);
    showModal("Erro ao excluir", "Nao foi possivel excluir a mensagem. Confira a conexao e tente novamente.", "error");
    return false;
  } finally {
    endChatMutation();
  }
}

async function updateItem(collection, id, values) {
  if (!id) return false;

  if (!postgresClient) {
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
if (collection === "eventos") {
      delete payload.created_by;
      payload.updated_by = values.updatedBy || getCurrentUserName();
    }
    if (collection === "chamados") {
      delete payload.created_by;
    }
    if (collection === "vagas") {
      delete payload.created_by;
    }
    HubModules.byCollection(collection)?.prepareUpdate?.(payload);
    const { data: updated, error } = await postgresClient
      .from(TABLES[collection])
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (isMissingCreatedByColumn(error)) {
        const { data: updatedWithoutAuthor, error: retryError } = await postgresClient
          .from(TABLES[collection])
          .update(withoutCreatedBy(payload))
          .eq("id", id)
          .select("*")
          .single();

        if (retryError) throw retryError;
        mergeRealtimeRow(collection, updatedWithoutAuthor, "UPDATE");
        renderRealtimeUpdate(collection);
        setSyncStatus("PostgreSQL sem autoria", false);
        return true;
      }

      if ((collection === "malotes" || collection === "eventos") && isMissingColumn(error, "updated_by")) {
        const { data: updatedWithoutEditor, error: retryError } = await postgresClient
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
        setSyncStatus("PostgreSQL precisa migracao", false);
        return true;
      }

      if (collection === "vagas" && (isMissingColumn(error, "descricao") || isMissingColumn(error, "requisitos") || isMissingColumn(error, "unidade"))) {
        const { data: updatedLegacy, error: retryError } = await postgresClient
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
        setSyncStatus("PostgreSQL precisa migracao", false);
        showModal("Banco precisa atualizar", "A vaga foi atualizada em modo compatibilidade. Rode o postgres-schema.sql atualizado para gravar descricao e requisitos em colunas proprias.", "info");
        return true;
      }

      throw error;
    }

    mergeRealtimeRow(collection, updated, "UPDATE");
    renderRealtimeUpdate(collection);
    setSyncStatus("PostgreSQL EIXO online", true);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar no PostgreSQL:", error);
if (collection === "eventos") {
      data[collection] = (data[collection] || []).map((item) =>
        String(item.id) === String(id)
          ? { ...item, ...values, createdBy: item.createdBy || values.createdBy || getCurrentUserName(), updatedBy: values.updatedBy || getCurrentUserName() }
          : item
      );
      saveLocalData();
      setSyncStatus("Evento atualizado localmente", false);
      renderAll();
      showModal("Evento atualizado localmente", "Rode o SQL do calendario no PostgreSQL para sincronizar esta agenda entre computadores.", "info");
      return true;
    }
    setSyncStatus("Erro no PostgreSQL", false);
    const isRlsBlock = error?.code === "42501" || error?.message?.includes("row-level security") || error?.code === "PGRST301";
    const isNoRows   = error?.code === "PGRST116";
    const message =
      collection === "chamados"
        ? "O PostgreSQL bloqueou o arquivamento do chamado. Rode o arquivo fix-arquivar-chamados-postgres.sql no PostgreSQL para liberar UPDATE em hub_chamados."
        : collection === "vagas" && (isRlsBlock || isNoRows)
          ? "Sem permissao para editar a vaga. Verifique se seu usuario tem cargo 'RH' em hub_users com o mesmo e-mail do login."
          : collection === "vagas"
            ? `Nao foi possivel editar a vaga. ${error?.message || "Confira as colunas de hub_vagas (rode hub-vagas-fix.sql)."}`
            : "Nao foi possivel atualizar o registro no PostgreSQL.";
    showModal("Erro ao Atualizar", message, "error");
    return false;
  }
}

async function deleteItem(collection, id) {
  if (!id) return false;

  if (!postgresClient) {
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
      const { error: candidaturaError } = await postgresClient.from(TABLES.candidaturas).delete().eq("vaga_id", id);
      if (candidaturaError) throw candidaturaError;
    }

    const { data: deletedRows, error } = await postgresClient.from(TABLES[collection]).delete().eq("id", id).select("id");
    if (error) throw error;

    if (!deletedRows?.length) {
      setSyncStatus("Delete pendente no PostgreSQL", false);
      showModal("Permissao de Delete", "O PostgreSQL nao confirmou a exclusao da vaga. Rode o postgres-schema.sql atualizado para liberar DELETE em hub_vagas.", "error");
      await refreshFromPostgreSQL();
      return false;
    }

    data[collection] = (data[collection] || []).filter((item) => String(item.id) !== String(id));
    if (collection === "vagas") {
      data.candidaturas = (data.candidaturas || []).filter((item) => String(item.vaga_id) !== String(id));
    }
    saveLocalData();
    renderAll();
    setSyncStatus("PostgreSQL EIXO online", true);
    return true;
  } catch (error) {
    console.error("Erro ao deletar no PostgreSQL:", error);
if (collection === "eventos") {
      data[collection] = (data[collection] || []).filter((item) => String(item.id) !== String(id));
      saveLocalData();
      renderAll();
      setSyncStatus("Evento deletado localmente", false);
      showModal("Evento deletado localmente", "Rode o SQL do calendario no PostgreSQL para sincronizar esta agenda entre computadores.", "info");
      return true;
    }
    setSyncStatus("Erro no PostgreSQL", false);
    showModal("Erro ao Deletar", "Nao foi possivel deletar o registro no PostgreSQL.", "error");
    return false;
  }
}

function upsertLocalUser(values) {
  const normalizedName = normalizeLoginName(values.nome);
  const existingIndex = values.id ? data.usuarios.findIndex((user) => String(user.id) === String(values.id)) : data.usuarios.findIndex((user) => normalizeLoginName(user.nome) === normalizedName);
  const user = {
    id: values.id || (existingIndex >= 0 ? data.usuarios[existingIndex].id : generateUUID()),
    nome: getLoginDisplayName(values.nome) || values.nome,
    email: values.email || data.usuarios[existingIndex]?.email || "",
    cargo: values.cargo || data.usuarios[existingIndex]?.cargo || "",
    foto_perfil: values.foto_perfil || data.usuarios[existingIndex]?.foto_perfil || "",
    unidade: values.unidade || data.usuarios[existingIndex]?.unidade || getDefaultUserUnit(values.nome),
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
  const email = String(values.email || "").trim();
  const cpf = normalizeCpf(values.cpf);
  const cargo = String(values.cargo || "").trim();
  const unidade = String(values.unidade || getDefaultUserUnit(nome)).trim();
  if (!nome || !email) return false;
  if (!isValidCpf(cpf)) {
    showModal("CPF invalido", "Informe um CPF valido para liberar o login por CPF.", "error");
    return false;
  }
  if (!cargo) {
    showModal("Cargo obrigatorio", "Selecione um cargo para cadastrar o usuario.", "error");
    return false;
  }

  if (!postgresClient) {
    upsertLocalUser({ nome, email, cargo, unidade, syncStatus: "active" });
    return true;
  }

  try {
    const { data: existingRows, error: findError } = await postgresClient
      .from(USERS_TABLE)
      .select("id, nome, email, cpf")
      .or(`email.ilike.${email},cpf.eq.${cpf}`)
      .limit(1);

    let existing = null;
    if (findError && isMissingColumn(findError, "email")) {
      const fallback = await postgresClient
        .from(USERS_TABLE)
        .select("id, nome")
        .ilike("nome", nome)
        .limit(1);
      if (fallback.error) throw fallback.error;
      existing = fallback.data?.[0] || null;
    } else if (findError) {
      throw findError;
    } else {
      existing = existingRows?.[0] || null;
    }

    let query = existing
      ? postgresClient.from(USERS_TABLE).update({ nome, email, cpf, cargo, unidade, created_by: getCurrentUserName() }).eq("id", existing.id)
      : postgresClient.from(USERS_TABLE).insert({ nome, email, cpf, cargo, unidade, created_by: getCurrentUserName() });

    let result = await query.select("*");

    if (result.error && isMissingColumn(result.error, "unidade")) {
      query = existing
        ? postgresClient.from(USERS_TABLE).update({ nome, email, cpf, cargo, created_by: getCurrentUserName() }).eq("id", existing.id)
        : postgresClient.from(USERS_TABLE).insert({ nome, email, cpf, cargo, created_by: getCurrentUserName() });
      result = await query.select("*");
    }

    if (result.error && isMissingCreatedByColumn(result.error)) {
      query = existing
      ? postgresClient.from(USERS_TABLE).update({ nome, email, cpf, cargo }).eq("id", existing.id)
      : postgresClient.from(USERS_TABLE).insert({ nome, email, cpf, cargo });
      result = await query.select("*");
    }

    if (result.error && isMissingColumn(result.error, "email")) {
      query = existing
        ? postgresClient.from(USERS_TABLE).update({ nome, cargo, created_by: getCurrentUserName() }).eq("id", existing.id)
        : postgresClient.from(USERS_TABLE).insert({ nome, cargo, created_by: getCurrentUserName() });
      result = await query.select("*");
    }

    if (result.error) throw result.error;
    const savedRows = result.data;

    const saved = mapRows("usuarios", savedRows || [])[0] || { nome, email, cargo, createdAt: todayLabel() };
    upsertLocalUser({ ...saved, email: saved.email || email, cpf: saved.cpf || cpf, cargo: saved.cargo || cargo, unidade: saved.unidade || unidade, syncStatus: "active" });
    setSyncStatus("PostgreSQL EIXO online", true);
    showModal("Perfil salvo", "Crie ou atualize o usuário correspondente no PostgreSQL Auth para liberar o login.", "info");
    return true;
  } catch (error) {
    console.error("Erro ao salvar usuario no PostgreSQL:", error);
    upsertLocalUser({ nome, email, cargo, unidade, syncStatus: "local" });
    setSyncStatus("Usuario salvo local", false);
    showModal("Aviso de Banco de Dados", "O perfil foi salvo localmente. Crie o usuario no PostgreSQL Auth e confira a tabela hub_users.", "error");
    return true;
  }
}

async function loadPublicData() {
  if (!isPublicJobsPage()) return;

  try {
    const response = await fetch(`/api/records?table=${encodeURIComponent(TABLES.vagas)}&select=*&order=${encodeURIComponent(JSON.stringify([{ column: "created_at", ascending: false }]))}`);

    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Nao foi possivel carregar vagas publicas.");

    const rows = result.data || [];
    data.vagas = mapRows("vagas", rows || []);
    renderPublicVagas();
  } catch (error) {
    console.error("Erro ao carregar vagas publicas:", error);
    renderPublicVagas();
  }
}

async function loadIndexVagasData(options = {}) {
  const { render = true } = options;
  if (!document.getElementById("vagas-list")) return false;

  try {
    const order = encodeURIComponent(JSON.stringify([{ column: "created_at", ascending: false }]));
    const [vagasResponse, candidaturasResponse] = await Promise.all([
      fetch(`/api/records?table=${encodeURIComponent(TABLES.vagas)}&select=*&order=${order}`, { credentials: "same-origin" }),
      fetch(`/api/records?table=${encodeURIComponent(TABLES.candidaturas)}&select=*&order=${order}`, { credentials: "same-origin" }),
    ]);
    const vagasResult = await vagasResponse.json().catch(() => ({}));
    const candidaturasResult = await candidaturasResponse.json().catch(() => ({}));
    if (!vagasResponse.ok) throw new Error(vagasResult.error || "Nao foi possivel carregar vagas no index.");
    if (!candidaturasResponse.ok) throw new Error(candidaturasResult.error || "Nao foi possivel carregar curriculos no index.");

    data.vagas = mapRows("vagas", vagasResult.data || []);
    data.candidaturas = mapRows("candidaturas", candidaturasResult.data || []);
    saveLocalData();
    publishHubDataCounts();
    if (render) {
      safeRenderSection("vagas", renderVagasSection);
      safeRenderSection("dashboard", renderDashboard);
    }
    return true;
  } catch (error) {
    console.error("Erro ao carregar vagas e curriculos no index:", error);
    return false;
  }
}

async function updateCurrentAccount(currentPassword, newName, newPassword, newFotoUrl) {
  const user = getCurrentUserRecord();
  if (!user) {
    showModal("Conta nao encontrada", "Nao foi possivel localizar sua conta nesta sessao.", "error");
    return false;
  }

  const updatedUser = {
    ...user,
    nome: newName || user.nome,
    foto_perfil: newFotoUrl || user.foto_perfil,
    cargo: user.cargo || getCurrentUserRole(),
    syncStatus: user.syncStatus || "active",
  };

  if (newPassword && postgresClient?.auth) {
    if (currentPassword) {
      const isPasswordValid = await verifyCurrentPassword(currentPassword);
      if (!isPasswordValid) {
        showModal("Senha incorreta", "A senha atual informada nao confere.", "error");
        return false;
      }
    }
    const { error: authError } = await postgresClient.auth.updateUser({ password: newPassword });
    if (authError) {
      console.error("Erro ao atualizar senha no PostgreSQL Auth:", authError);
      showModal("Erro", "Nao foi possivel atualizar a senha no PostgreSQL Auth.", "error");
      return false;
    }
  }

  if (!postgresClient) {
    upsertLocalUser(updatedUser);
    if (newName) storageService.setSessionItem(`${SESSION_KEY}-user`, getLoginDisplayName(updatedUser.nome));
    return true;
  }

  try {
    const { data: rows, error } = await postgresClient
      .from(USERS_TABLE)
      .update({ nome: updatedUser.nome, foto_perfil: newFotoUrl || updatedUser.foto_perfil || null })
      .eq("id", updatedUser.id)
      .select("*");
    if (error) throw error;

    const saved = mapRows("usuarios", rows || [])[0] || updatedUser;
    const persistedUser = { ...updatedUser, ...saved };
    upsertLocalUser(persistedUser);

    currentUserProfile = { ...(currentUserProfile || {}), ...persistedUser };
    if (newName) storageService.setSessionItem(`${SESSION_KEY}-user`, getLoginDisplayName(updatedUser.nome));
    setSyncStatus("PostgreSQL EIXO online", true);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar conta:", error);
    upsertLocalUser({ ...updatedUser, syncStatus: "local" });
    if (newName) storageService.setSessionItem(`${SESSION_KEY}-user`, getLoginDisplayName(updatedUser.nome));
    setSyncStatus("Conta atualizada local", false);
    showModal("Atualizacao local", "Os dados foram alterados localmente. Rode os SQLs atualizados no PostgreSQL se o banco bloquear as colunas.", "info");
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

  if (!postgresClient || !localUser) {
    removeLocalUser(id);
    return true;
  }

  try {
    const { error } = await postgresClient
      .from(USERS_TABLE)
      .delete()
      .eq("id", localUser.id);

    if (error) throw error;

    removeLocalUser(id);
    setSyncStatus("PostgreSQL EIXO online", true);
    return true;
  } catch (error) {
    console.error("Erro ao excluir usuario no PostgreSQL:", error);
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

  if (isAuthenticated() && !isPublicPage() && !canAccessView(viewId)) {
    if (viewId !== "dashboard" && canAccessView("dashboard")) activateView("dashboard");
    return;
  }
  const previousViewId = document.querySelector(".view.active")?.id || "";
  if (previousViewId === "comunicacao" && viewId !== "comunicacao" && chatSelectedFiles.length) {
    clearChatSelectedFile();
  }
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
  document.querySelectorAll(".user-chip").forEach((chip) => chip.classList.toggle("active", viewId === "conta"));
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  ensureViewBootstrapData(viewId);
  if (viewId === "vagas") {
    loadIndexVagasData({ render: true });
  }
  if (viewId === "documentos-contratados") {
    refreshFromPostgreSQL();
  }
}

function closeUserMenuDropdown() {
  const menu = document.getElementById("user-menu");
  const dropdown = document.getElementById("user-menu-dropdown");
  const trigger = document.getElementById("user-menu-trigger");
  if (!menu || !dropdown) return;
  menu.classList.remove("open");
  dropdown.hidden = true;
  trigger?.setAttribute("aria-expanded", "false");
}

function openUserMenuDropdown() {
  const menu = document.getElementById("user-menu");
  const dropdown = document.getElementById("user-menu-dropdown");
  const trigger = document.getElementById("user-menu-trigger");
  if (!menu || !dropdown) return;
  updateUserMenuHeader();
  menu.classList.add("open");
  dropdown.hidden = false;
  trigger?.setAttribute("aria-expanded", "true");
}

function toggleUserMenuDropdown() {
  const dropdown = document.getElementById("user-menu-dropdown");
  if (!dropdown) return;
  if (dropdown.hidden) {
    openUserMenuDropdown();
  } else {
    closeUserMenuDropdown();
  }
}

function updateUserMenuHeader() {
  const nameEl = document.getElementById("user-menu-name");
  const roleEl = document.getElementById("user-menu-role");
  const avatarEl = document.getElementById("user-menu-avatar");
  const user = getCurrentUserRecord?.();
  if (nameEl) nameEl.textContent = getCurrentUserName?.() || "Usuario";
  if (roleEl) roleEl.textContent = user?.cargo || getCurrentUserRole?.() || "Colaborador HUB";
  if (avatarEl) {
    if (user?.foto_perfil && isHttpUrl(user.foto_perfil)) {
      avatarEl.src = user.foto_perfil;
    } else if (user?.foto_perfil && postgresClient) {
      createPrivateStorageUrl(getHubPostgreSQLConfig().chatFilesBucket || "hub-chat-files", user.foto_perfil)
        .then((signedUrl) => { avatarEl.src = signedUrl; })
        .catch(() => {});
    }
  }
}

function setupUserMenuDropdown() {
  const trigger = document.getElementById("user-menu-trigger");
  const dropdown = document.getElementById("user-menu-dropdown");
  if (!trigger || !dropdown) return;
  if (trigger.dataset.menuReady === "true") return;
  trigger.dataset.menuReady = "true";

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleUserMenuDropdown();
  });

  dropdown.querySelectorAll(".user-menu-item[data-view]").forEach((item) => {
    item.addEventListener("click", () => {
      const panelId = item.dataset.settingsTarget || "settings-account-panel";
      activateView(item.dataset.view || "conta");
      showSettingsPanel(panelId);
      renderAccountSettings();
      closeUserMenuDropdown();
    });
  });

  document.getElementById("user-menu-logout")?.addEventListener("click", () => {
    closeUserMenuDropdown();
    logout();
  });

  document.addEventListener("click", (event) => {
    const menu = document.getElementById("user-menu");
    if (menu && !menu.contains(event.target)) closeUserMenuDropdown();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeUserMenuDropdown();
  });
}

document.addEventListener("DOMContentLoaded", setupUserMenuDropdown);
if (document.readyState === "complete" || document.readyState === "interactive") {
  setupUserMenuDropdown();
}

function formatCurrencyBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
}

function parseBrazilianCurrency(value) {
  const normalized = String(value || "").replace(/[^\d,]/g, "").replace(",", ".");
  return Number(normalized) || 0;
}

function formatCurrencyInput(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 6);
  if (!digits) return "";
  const padded = digits.padStart(3, "0");
  const reais = String(Number(padded.slice(0, -2)));
  const centavos = padded.slice(-2);
  return `${reais},${centavos}`;
}

function formatVtReportDateTime(value = new Date()) {
  if (value instanceof Date) {
    return value.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return String(value || "")
    .replace(/(\d{1,2}:\d{2}):\d{2}/, "$1")
    .replace(/,\s*/g, " ")
    .trim();
}

function xmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function columnName(index) {
  let name = "";
  let current = index;
  while (current >= 0) {
    name = String.fromCharCode((current % 26) + 65) + name;
    current = Math.floor(current / 26) - 1;
  }
  return name;
}

function worksheetCellXml(value, rowIndex, colIndex, styleId = 0) {
  const ref = `${columnName(colIndex)}${rowIndex}`;
  const styleAttribute = styleId ? ` s="${styleId}"` : "";
  if (typeof value === "number") return `<c r="${ref}"${styleAttribute}><v>${Number.isFinite(value) ? value : 0}</v></c>`;
  return `<c r="${ref}"${styleAttribute} t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
}

function worksheetRowXml(values, rowIndex, styleId = 0) {
  return `<row r="${rowIndex}">${values.map((value, colIndex) => worksheetCellXml(value, rowIndex, colIndex, styleId)).join("")}</row>`;
}

function makeCrc32Table() {
  const table = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
}

const CRC32_TABLE = makeCrc32Table();

function crc32(bytes) {
  let crc = 0xffffffff;
  bytes.forEach((byte) => {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(bytes, value) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(bytes, value) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function appendBytes(target, bytes) {
  bytes.forEach((byte) => target.push(byte));
}

function createZipBlob(files, mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
  const encoder = new TextEncoder();
  const output = [];
  const central = [];
  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const contentBytes = typeof file.content === "string" ? encoder.encode(file.content) : file.content;
    const crc = crc32(contentBytes);
    const offset = output.length;
    writeUint32(output, 0x04034b50);
    writeUint16(output, 20);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint32(output, crc);
    writeUint32(output, contentBytes.length);
    writeUint32(output, contentBytes.length);
    writeUint16(output, nameBytes.length);
    writeUint16(output, 0);
    appendBytes(output, nameBytes);
    appendBytes(output, contentBytes);

    writeUint32(central, 0x02014b50);
    writeUint16(central, 20);
    writeUint16(central, 20);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint32(central, crc);
    writeUint32(central, contentBytes.length);
    writeUint32(central, contentBytes.length);
    writeUint16(central, nameBytes.length);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint32(central, 0);
    writeUint32(central, offset);
    appendBytes(central, nameBytes);
  });
  const centralOffset = output.length;
  appendBytes(output, central);
  writeUint32(output, 0x06054b50);
  writeUint16(output, 0);
  writeUint16(output, 0);
  writeUint16(output, files.length);
  writeUint16(output, files.length);
  writeUint32(output, central.length);
  writeUint32(output, centralOffset);
  writeUint16(output, 0);
  return new Blob([new Uint8Array(output)], { type: mimeType });
}

function applyRoleAccess() {
  if (!isAuthenticated() || isPublicPage() || !document.querySelector(".nav-list")) return;
  refreshCurrentUserRoleFromData();

  const chamadosUrls = new Set(["chamados.html", "https://hub-opal-nine.vercel.app/chamados.html"]);
  const denunciaUrls = new Set(["denuncia.html", "https://hub-opal-nine.vercel.app/denuncia.html"]);
  const feedbacksUrls = new Set(["feedbacks.html", "https://hub-opal-nine.vercel.app/feedbacks.html"]);
  const allowedViews = getAllowedViewsForCurrentUser();
  const allowedExternalUrls = isCashierUser() || isManagerUser()
    ? new Set([...chamadosUrls, ...denunciaUrls])
    : new Set();
  if (isManagerUser()) feedbacksUrls.forEach((url) => allowedExternalUrls.add(url));
  if (currentUserMatchesName("maria luisa")) allowedExternalUrls.clear();

  document.querySelectorAll(".nav-item").forEach((button) => {
    const allowed = button.dataset.externalUrl
      ? allowedExternalUrls.has(button.dataset.externalUrl)
      : allowedViews.has(button.dataset.view);
    button.hidden = !allowed;
    button.disabled = !allowed;
    button.style.display = allowed ? "" : "none";
  });

  document.querySelectorAll(".view").forEach((view) => {
    if (!allowedViews.has(view.id)) view.classList.remove("active");
  });

  const activeView = document.querySelector(".view.active");
  if (!activeView || !allowedViews.has(activeView.id)) activateView("dashboard");
}

function getViewForCollection(collection) {
  const views = {
    comunicados: "comunicacao",
    denuncias: "denuncias",
    chamados: "chamados",
    candidaturas: "vagas",
    vagas: "vagas",
    documentosContratados: "documentos-contratados",
    atestados: "documentos",
    usuarios: "equipe",
    climaPesquisas: "teste-clima",
  };
  return views[String(collection || "")] || HubModules.byCollection(collection)?.view || "dashboard";
}

function getDashboardItemView(item = {}) {
  if (item.view) return item.view;
  const kind = String(item.kind || "");
  if (kind === "notificacao" || kind === "mensagem") return "comunicacao";
  if (kind === "denuncia") return "denuncias";
  if (kind === "chamado") return "chamados";
  if (kind === "vaga") return "vagas";
  if (kind === "malote") return "malotes";
  if (kind === "contratado") return "documentos-contratados";
  return "dashboard";
}

function isArchivedRecord(item) {
  return ["arquivado", "arquivada"].includes(String(item?.status || "").trim().toLowerCase());
}

function isSystemAuditAuthor(value) {
  return String(value || "").trim().toLowerCase() === "sistema";
}

function getDashboardSystemUpdateMeta(item = {}) {
  if (isSystemAuditAuthor(item.updatedBy)) return "Atualização do sistema";
  if (isSystemAuditAuthor(item.createdBy)) return "Registro do sistema";
  return "";
}

function getDashboardActivityTimeValue(value) {
  if (!value) return 0;
  const text = String(value).trim();
  if (!text) return 0;
  const normalized = text.toLowerCase();
  if (normalized === "hoje") return new Date().setHours(0, 0, 0, 0);
  if (["agora", "recentemente"].includes(normalized)) return Date.now();

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.getTime();

  const brDateTime = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s*(\d{1,2}):(\d{2}))?/);
  if (brDateTime) {
    const [, day, month, year, hour = "0", minute = "0"] = brDateTime;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
  }

  const isoDateTime = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (isoDateTime) {
    const [, year, month, day, hour = "0", minute = "0"] = isoDateTime;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
  }

  return 0;
}

function getDashboardRecordSortValue(item = {}, fallbackIndex = 0) {
  const candidates = [
    item.sortAt,
    item.updatedSortAt,
    item.updatedAt,
    item.createdSortAt,
    item.createdAt,
    item.dateTime,
    item.date,
  ];

  for (const candidate of candidates) {
    const time = getDashboardActivityTimeValue(candidate);
    if (time) return time;
  }

  return 0 - fallbackIndex;
}

function getDashboardItemSortValue(item = {}, fallbackIndex = 0) {
  const time = getDashboardRecordSortValue(item, fallbackIndex);
  return time || (0 - fallbackIndex);
}

function getDashboardNotificationId(kind, item = {}) {
  const id = item.id ?? item.notificationId ?? item.codigoSolicitacao ?? item.createdAt ?? item.sortAt;
  if (!id) return `${kind || "geral"}-${Date.now()}`;
  return `${kind || "geral"}-${id}`;
}

function isDashboardNotificationRead(item = {}) {
  if (!item.notificationId) return false;
  return readNotificationIds.has(String(item.notificationId));
}

function isDashboardActivityReadForOrdering(item = {}) {
  if (Array.isArray(item.messageIds) && item.messageIds.length) {
    return item.messageIds.every((id) => readRhMessageIds.has(String(id)));
  }
  return isDashboardNotificationRead(item);
}

function applyDashboardScopeToMetricCards() {
  const allowedViews = getAllowedViewsForCurrentUser();
  const isManager = isRestrictedManagerUser();
  document.querySelectorAll(".metric-card-link[data-view]").forEach((card) => {

    let allowed = allowedViews.has(card.dataset.view);
    if (isManager && card.querySelector("#metric-documentos")) allowed = false;

    if (card.querySelector("#metric-chamados-hoje") && !isRhUser()) allowed = false;
    card.hidden = !allowed;
    card.style.display = allowed ? "" : "none";
  });
}

function renderDashboard() {
  if (!document.getElementById("metric-denuncias")) return;

  applyDashboardScopeToMetricCards();
  document.getElementById("metric-denuncias").textContent = data.denuncias.filter((item) => item.status === "Aberta" || item.status === "Urgente").length;
  const unreadRhMessages = getUnreadRhMessages();
  notifyUnreadRhMessages(unreadRhMessages.length);
  if (document.getElementById("metric-comunicados")) {
    document.getElementById("metric-comunicados").textContent = unreadRhMessages.length;
  }
  if (document.getElementById("metric-vagas")) {
    document.getElementById("metric-vagas").textContent = (data.candidaturas || []).filter((item) => isTodayDateTimeLabel(item.createdAt)).length;
  }
  const upcomingEvents = getUpcomingEvents();
  if (document.getElementById("metric-eventos")) {
    document.getElementById("metric-eventos").textContent = upcomingEvents.length;
  }
  if (document.getElementById("metric-documentos")) {

    const documentosContratados = canAccessView("documentos-contratados")
      ? (data.documentosContratados || []).filter((item) => !isArchivedRecord(item) && isTodayDateTimeLabel(item.createdAt)).length
      : 0;
    document.getElementById("metric-documentos").textContent = documentosContratados;
  }
  if (document.getElementById("metric-chamados-hoje")) {
    document.getElementById("metric-chamados-hoje").textContent = data.chamados
      .filter((item) => item.status === "Aberto" && isTodayLabel(item.createdAt))
      .length;
  }

  const accessibleRhMessages = typeof getAccessibleRhMessages === "function" ? getAccessibleRhMessages() : [];
  const sortedRhMessagesNewestFirst = [...accessibleRhMessages]
    .sort((a, b) => getDashboardRecordSortValue(b) - getDashboardRecordSortValue(a));
  const sortedRhMessagesOldestFirst = [...accessibleRhMessages]
    .sort((a, b) => getDashboardRecordSortValue(a) - getDashboardRecordSortValue(b));
  const groupedMessages = [];

  if (sortedRhMessagesNewestFirst.length) {
    const messageIds = sortedRhMessagesNewestFirst.map((msg) => msg.id).filter(Boolean).map(String);
    const unreadMessageIds = messageIds.filter((id) => !readRhMessageIds.has(String(id)));
    const latestMessage = sortedRhMessagesNewestFirst[0] || {};
    const hasUnread = unreadMessageIds.length > 0;
    groupedMessages.push({
      kind: "notificacao",
      notificationId: "mensagens-rh",

      dismissKey: `mensagens-rh:${latestMessage.id || messageIds[0] || "vazio"}`,
      messageIds,
      chatMessages: sortedRhMessagesOldestFirst,
      title: "Mensagens do RH",
      text: hasUnread
        ? `${unreadMessageIds.length} nova(s) de ${messageIds.length} mensagem(ns)`
        : `${messageIds.length} mensagem(ns) no acompanhamento`,
      details: sortedRhMessagesOldestFirst
        .slice(-20)
        .map((msg) => `${msg.createdAt || "Sem data"} - ${msg.autor || "Equipe"}: ${msg.mensagem || "Nova notificação recebida."}`)
        .join("\n\n"),
      detailsHeader: "Comunicação",
      tag: hasUnread ? "Nova" : "Lida",
      date: latestMessage.createdAt,
      dateTime: latestMessage.sortAt || latestMessage.createdAt,
      messageCount: messageIds.length,
      unread: hasUnread,
    });
  }

  const dashboardItems = [
    ...groupedMessages,
    ...data.denuncias
      .filter(item => item.status === "Aberta" || item.status === "Urgente")
      .map((item) => ({
        kind: "denuncia",
        notificationId: getDashboardNotificationId("denuncia", item),
        title: "Denúncia anônima",
        text: item.descricao || "Nova denúncia recebida.",
        details: `${getDashboardSystemUpdateMeta(item) ? `${getDashboardSystemUpdateMeta(item)}\n` : ""}Status: ${item.status || "Aberta"}\nRecebida em: ${item.createdAt || "Não informado"}\n\n${item.descricao || "Sem descrição."}`,
        tag: item.status,
        date: item.createdAt,
        dateTime: item.sortAt || item.updatedSortAt || item.createdAt,
        systemUpdate: Boolean(getDashboardSystemUpdateMeta(item)),
        meta: getDashboardSystemUpdateMeta(item),
      })),
    ...data.chamados
      .filter((item) => item.status === "Aberto")
      .map((item) => {
        const items = parseEpiItems(item.epis);
        const itemDetails = items.length
          ? items.map((epi) => `${epi.nome}${epi.tamanho ? ` - Tam. ${epi.tamanho}` : ""} - Qtd. ${epi.quantidade}`).join("\n")
          : item.epis || "Não informados";
        return {
          kind: "chamado",
          notificationId: getDashboardNotificationId("chamado", item),
          title: `Chamado - ${item.unidade}`,
          text: item.epis || "Itens não informados.",
          details: `${getDashboardSystemUpdateMeta(item) ? `${getDashboardSystemUpdateMeta(item)}\n` : ""}Solicitante: ${item.solicitante || "Não informado"}\nUnidade: ${item.unidade || "Não informada"}\nSetor: ${item.setor || "Não informado"}\nItens solicitados:\n${itemDetails}\nObservações: ${item.observacoes || "Nenhuma"}\nData: ${item.createdAt || "Não informada"}`,
          tag: item.status,
          date: item.createdAt,
          dateTime: item.sortAt || item.updatedSortAt || item.createdAt,
          systemUpdate: Boolean(getDashboardSystemUpdateMeta(item)),
          meta: getDashboardSystemUpdateMeta(item),
        };
      }),
    ...(data.candidaturas || [])
      .map((item) => {
        const vaga = (data.vagas || []).find((vagaItem) => String(vagaItem.id) === String(item.vaga_id));
        return {
          kind: "vaga",
          notificationId: getDashboardNotificationId("candidatura", item),
          title: `Curriculo - ${vaga?.cargo || "Vaga"}`,
          text: item.nome || "Novo curriculo recebido.",
          details: `Candidato: ${item.nome || "Nao informado"}\nCPF: ${formatCpf(item.cpf || "") || "Nao informado"}\nTelefone: ${formatPhone(item.telefone || "") || item.telefone || "Nao informado"}\nVaga: ${vaga?.cargo || item.vaga_id || "Nao informada"}\nUnidade: ${vaga?.unidade || "Nao informada"}\nRecebido em: ${item.createdAt || "Nao informado"}`,
          tag: "Curriculo",
          date: item.createdAt,
          dateTime: item.sortAt || item.createdAt,
          view: "vagas",
        };
      }),
    ...(data.documentosContratados || [])
      .map((item) => {
        const origem = getContractorSourceLabel(item.origemHtml, item.empresa) || "Documento";
        return {
          kind: "contratado",
          notificationId: getDashboardNotificationId("contratado", item),
          title: `Documentos - ${item.nome || "Contratado"}`,
          text: `${origem} - ${(item.documentos || []).length} documento(s) enviado(s).`,
          details: `Nome: ${item.nome || "Nao informado"}\nCPF: ${formatCpf(item.cpf || "") || "Nao informado"}\nTelefone: ${formatPhone(item.telefone || "") || item.telefone || "Nao informado"}\nOrigem: ${origem}\nDocumentos enviados: ${(item.documentos || []).length}\nRecebido em: ${item.createdAt || "Nao informado"}`,
          tag: origem,
          date: item.createdAt,
          dateTime: item.sortAt || item.createdAt,
          view: "documentos-contratados",
        };
      })  ];

  const sortedDashboardItems = dashboardItems
    .filter((item) => canAccessView(getDashboardItemView(item)))
    .filter((item) => !isNotificationDismissed(item.dismissKey || item.notificationId))
    .map((item, index) => ({ ...item, _sortIndex: index }));
  sortedDashboardItems.sort((a, b) => {
    const aRead = isDashboardActivityReadForOrdering(a);
    const bRead = isDashboardActivityReadForOrdering(b);
    if (aRead !== bRead) return aRead ? 1 : -1;
    return getDashboardItemSortValue(b, b._sortIndex) - getDashboardItemSortValue(a, a._sortIndex);
  });

  const dashboardPageSize = 3;
  dashboardNotificationOffset = 0;

  const unreadDashboardItems = sortedDashboardItems.filter((item) => !isDashboardActivityReadForOrdering(item));
  const visibleDashboardItems = unreadDashboardItems.slice(0, dashboardPageSize);
  allDashboardActivityItems = sortedDashboardItems;
  dashboardActivityItemsReady = true;
  visibleDashboardActivityItems = visibleDashboardItems;
  const previousDashboardButton = document.getElementById("dashboard-notifications-prev");
  const nextDashboardButton = document.getElementById("dashboard-notifications-next");
  if (previousDashboardButton) previousDashboardButton.hidden = true;
  if (nextDashboardButton) {
    nextDashboardButton.hidden = true;
    nextDashboardButton.textContent = "Ver proximas";
  }

  const dashboardTarget = document.getElementById("dashboard-list");
  if (dashboardTarget) {
    if (!currentUserSettings.dashboardNotificationBadges) {
      allDashboardActivityItems = [];
      dashboardActivityItemsReady = true;
      visibleDashboardActivityItems = [];
      dashboardTarget.innerHTML = '<p class="empty-state">Novidades ocultas pelas suas configuracoes.</p>';
      if (previousDashboardButton) previousDashboardButton.hidden = true;
      if (nextDashboardButton) nextDashboardButton.hidden = true;
      renderDashboardCalendar(upcomingEvents);
      return;
    }
    if (visibleDashboardItems.length === 0) {
      dashboardTarget.innerHTML = '<p class="empty-state">Nenhuma pendencia para acompanhar no momento.</p>';
    } else {
      dashboardTarget.innerHTML = visibleDashboardItems
        .map((item, index) => {
          const itemRead = isDashboardActivityReadForOrdering(item);
          const visualTag = itemRead && !item.systemUpdate ? "Lida" : item.tag;
          const visualBadgeClass = item.systemUpdate ? "tag" : badgeClass(item.tag || visualTag);
          return `<li class="dashboard-activity dashboard-activity-${escapeHtml(item.kind)}${item.systemUpdate ? " system-update" : ""}" data-read="${itemRead ? "true" : "false"}" data-action="open-dashboard-activity" data-index="${index}" tabindex="0" role="button"><span class="dashboard-activity-mark" aria-hidden="true"></span><div class="dashboard-activity-content"><div class="item-topline"><p class="item-title">${escapeHtml(item.title)}</p><span class="${visualBadgeClass}">${escapeHtml(item.systemUpdate ? "Sistema" : visualTag)}</span></div><p>${escapeHtml(String(item.text).slice(0, 96))}${String(item.text).length > 96 ? "..." : ""}</p><p class="item-meta meta-sm">${escapeHtml([item.date, item.meta].filter(Boolean).join(" | "))}</p></div></li>`;
        })
        .join("");
    }
  }

  renderDashboardCalendar(upcomingEvents);
}

async function syncRecordStatusSilently(collection, id, status) {
  if (!postgresClient || !TABLES[collection]) return;
  try {
    const { data: updated, error } = await postgresClient
      .from(TABLES[collection])
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error || !updated) throw error || new Error("Nenhuma linha alterada.");
    mergeRealtimeRow(collection, updated, "UPDATE");
    renderRealtimeUpdate(collection);
    setSyncStatus("PostgreSQL EIXO online", true);
  } catch (error) {
    console.error("Erro ao sincronizar arquivamento no PostgreSQL:", error);
    setSyncStatus("Sincronizacao pendente", false);
  }
}

function getPublicVagaCidade(vaga = {}) {
  const match = String(vaga.descricao || "").match(/(?:^|\n)Cidade:\s*([^\n]+)/i);
  return match ? match[1].trim() : "";
}

function uniqueSortedValues(values = []) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
}

function isDatalistInUse(datalistId) {
  const active = document.activeElement;
  return Boolean(active?.matches?.(`input[list="${datalistId}"]`));
}

function syncPublicVagaFilterInput(id, value) {
  const input = document.getElementById(id);
  if (input && document.activeElement === input) return;
  if (input && input.value !== value) input.value = value;
}

function fillPublicVagaDatalist(id, values = []) {
  const datalist = document.getElementById(id);
  if (!datalist) return;
  if (isDatalistInUse(id)) return;
  datalist.innerHTML = uniqueSortedValues(values)
    .map((value) => `<option value="${escapeHtml(value)}"></option>`)
    .join("");
}

function updatePublicVagaFilterOptions(openVagas = []) {
  fillPublicVagaDatalist("public-vaga-cargo-options", openVagas.map((vaga) => vaga.cargo));
  fillPublicVagaDatalist("public-vaga-cidade-options", openVagas.map(getPublicVagaCidade));
}

function updatePublicVagaFilterControls(openVagas = []) {
  syncPublicVagaFilterInput("public-vaga-cargo-filter", publicVagaCargoFilter);
  syncPublicVagaFilterInput("public-vaga-cidade-filter", publicVagaCidadeFilter);
  updatePublicVagaFilterOptions(openVagas);
  const clearButton = document.getElementById("clear-public-vaga-filters");
  if (clearButton) {
    clearButton.hidden = !Boolean(publicVagaCargoFilter || publicVagaCidadeFilter);
  }
}

function renderPublicVagas() {
  const selectedInput = document.getElementById("vaga-id");
  const selectedPanel = document.getElementById("selected-public-job");
  const list = document.getElementById("public-vagas-list");
  if (!selectedInput && !selectedPanel && !list) return;

  const cargoFilter = String(publicVagaCargoFilter || "").trim().toLowerCase();
  const cidadeFilter = String(publicVagaCidadeFilter || "").trim().toLowerCase();
  const allOpenVagas = data.vagas.filter(v => isOpenJobStatus(v.status));
  updatePublicVagaFilterControls(allOpenVagas);
  const openVagas = allOpenVagas
    .filter(v => !cargoFilter || String(v.cargo || "").toLowerCase().includes(cargoFilter))
    .filter(v => !cidadeFilter || getPublicVagaCidade(v).toLowerCase().includes(cidadeFilter));
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
        <p><strong>Unidade destinada:</strong> ${escapeHtml(getCanonicalUnit(v.unidade) || "Nao informada.")}</p>
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
        <p><strong>Unidade destinada:</strong> ${escapeHtml(getCanonicalUnit(job.unidade) || "Nao informada.")}</p>
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
        <div class="inline-flex">
          ${getAuthorAvatar(item.nome)}
          <p class="item-title flush-bottom">${escapeHtml(item.nome)}</p>
        </div>
        <div>
          <span class="tag">Ativo</span>
          <button type="button" class="tag alert tag-button" data-action="excluir-usuario" data-id="${item.id}">Deletar</button>
        </div>
      </div>
      <p class="item-meta section-top">E-mail: ${escapeHtml(item.email || "Cadastre no PostgreSQL Auth")}</p>
      <p class="item-meta">Cargo: ${escapeHtml(item.cargo || "Sem cargo definido")}</p>
      <p class="item-meta">Unidade: ${escapeHtml(item.unidade || getDefaultUserUnit(item.nome))}</p>
      <p class="item-meta compact-top">Cadastro: ${escapeHtml(item.createdAt || "Hoje")}</p>
    </article>
  `);
}

function renderAccountSettings() {
  const nameInput = document.getElementById("conta-nome");
  const newNameInput = document.getElementById("novo-nome");
  const roleInput = document.getElementById("conta-cargo");
  const avatarPreview = document.getElementById("conta-avatar-preview");
  const settingsAvatar = document.getElementById("settings-user-avatar");
  const settingsName = document.getElementById("settings-user-name");
  const settingsRole = document.getElementById("settings-user-role");
  if (!nameInput && !roleInput && !newNameInput && !settingsName) return;

  const user = getCurrentUserRecord();
  const currentName = getCurrentUserName();
  const currentRole = user?.cargo || getCurrentUserRole() || "Sem cargo definido";
  if (nameInput) nameInput.value = currentName;
  if (newNameInput) newNameInput.value = currentName;
  if (roleInput) roleInput.value = currentRole;
  if (settingsName) settingsName.textContent = currentName;
  if (settingsRole) settingsRole.textContent = currentRole;
  document.getElementById("user-menu-role")?.classList.toggle("hidden", currentUserSettings.hidePresence);
  if (settingsRole) settingsRole.hidden = currentUserSettings.hidePresence;

  if (avatarPreview) {
    avatarPreview.style.display = "block";
    if (user?.foto_perfil && isHttpUrl(user.foto_perfil)) {
      avatarPreview.src = user.foto_perfil;
      if (settingsAvatar) settingsAvatar.src = user.foto_perfil;
    } else if (user?.foto_perfil && postgresClient) {
      createPrivateStorageUrl(getHubPostgreSQLConfig().chatFilesBucket || "hub-chat-files", user.foto_perfil)
        .then((signedUrl) => {
          avatarPreview.src = signedUrl;
          if (settingsAvatar) settingsAvatar.src = signedUrl;
        })
        .catch(() => {
          avatarPreview.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2392a7a2'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
          if (settingsAvatar) settingsAvatar.src = avatarPreview.src;
        });
    } else {
      avatarPreview.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2392a7a2'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
      if (settingsAvatar) settingsAvatar.src = avatarPreview.src;
    }
  }
}

function showSettingsPanel(panelId) {
  if (panelId && String(panelId).startsWith("settings-")) {
    activateView("conta");
  }
  document.querySelectorAll("[data-settings-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.settingsPanel === panelId);
  });
  document.querySelectorAll("[data-settings-target]").forEach((button) => {
    button.classList.toggle("active", button.dataset.settingsTarget === panelId);
  });
}

function normalizeSettingsText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function filterSettingsItems(query) {
  const normalizedQuery = normalizeSettingsText(query);
  document.querySelectorAll("[data-settings-target]").forEach((button) => {
    const haystack = normalizeSettingsText(`${button.textContent || ""} ${button.dataset.settingsKeywords || ""}`);
    button.hidden = Boolean(normalizedQuery) && !haystack.includes(normalizedQuery);
  });
}

function getUserSettingsStorageKey() {
  const userKey = currentAuthUser?.id || currentUserProfile?.email || currentUserProfile?.cpf || "local";
  return `${USER_SETTINGS_STORAGE_KEY}:${userKey}`;
}

function migrateUserSettingsToCurrentKey(settings) {
  const currentKey = getUserSettingsStorageKey();
  if (currentKey.endsWith(":local")) return;
  try {
    if (!localStorage.getItem(currentKey)) {
      localStorage.setItem(currentKey, JSON.stringify(normalizeUserSettings(settings)));
    }
  } catch {

  }
}

function normalizeUserSettings(settings = {}) {
  const normalized = { ...USER_SETTINGS_DEFAULTS, ...settings };
  if (!["normal", "small", "large"].includes(normalized.messageSize)) normalized.messageSize = "normal";
  if (!Array.isArray(normalized.boardOrder)) normalized.boardOrder = [];
  Object.keys(USER_SETTINGS_DEFAULTS).forEach((key) => {
    if (typeof USER_SETTINGS_DEFAULTS[key] === "boolean") normalized[key] = Boolean(normalized[key]);
  });
  return normalized;
}

function loadUserSettings() {
  try {
    const saved = localStorage.getItem(getUserSettingsStorageKey()) || localStorage.getItem(USER_SETTINGS_STORAGE_KEY);
    const settings = normalizeUserSettings(saved ? JSON.parse(saved) : {});
    migrateUserSettingsToCurrentKey(settings);
    return settings;
  } catch {
    return normalizeUserSettings();
  }
}

function saveUserSettings(settings = currentUserSettings) {
  currentUserSettings = normalizeUserSettings(settings);
  try {
    localStorage.setItem(getUserSettingsStorageKey(), JSON.stringify(currentUserSettings));
    localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(currentUserSettings));
  } catch {
    localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(currentUserSettings));
  }
  syncUserSettingsToServer(currentUserSettings);
}

async function syncUserSettingsToServer(settings = currentUserSettings) {
  if (!postgresClient || !currentUserProfile?.id) return;
  try {
    const normalizedSettings = normalizeUserSettings(settings);
    const { error } = await postgresClient
      .from(USERS_TABLE)
      .update({ configuracoes: normalizedSettings })
      .eq("id", currentUserProfile.id);
    if (error) {
      if (isMissingColumn(error, "configuracoes")) return;
      throw error;
    }
    currentUserProfile = { ...currentUserProfile, configuracoes: normalizedSettings };
  } catch (error) {
    console.warn("Nao foi possivel salvar configuracoes do usuario no PostgreSQL:", error);
  }
}

function reloadUserSettingsForCurrentUser() {
  currentUserSettings = loadUserSettings();
  const localSettings = currentUserSettings;
  const serverSettings = currentUserProfile?.configuracoes;
  currentUserSettings = serverSettings && Object.keys(serverSettings).length
    ? normalizeUserSettings({ ...localSettings, ...serverSettings })
    : localSettings;
  try {
    localStorage.setItem(getUserSettingsStorageKey(), JSON.stringify(currentUserSettings));
  } catch {

  }
  applyUserSettings();
  renderAccountSettings();
}

function syncUserSettingsControls() {
  document.querySelectorAll("[data-user-setting]").forEach((field) => {
    const key = field.dataset.userSetting;
    if (!(key in currentUserSettings)) return;
    if (field.type === "checkbox") {
      field.checked = Boolean(currentUserSettings[key]);
    } else {
      field.value = currentUserSettings[key];
    }
  });
}

function applyUserSettings() {
  currentUserSettings = normalizeUserSettings(currentUserSettings);
  const isIndexPage = Boolean(document.getElementById("app-shell"));
  document.documentElement.setAttribute("data-theme", isIndexPage && currentUserSettings.darkMode ? "dark" : "light");
  document.body?.classList.toggle("user-setting-compact", currentUserSettings.compactMode);
  document.body?.classList.toggle("user-setting-message-small", currentUserSettings.messageSize === "small");
  document.body?.classList.toggle("user-setting-message-large", currentUserSettings.messageSize === "large");
  document.body?.classList.toggle("user-setting-blur-previews", currentUserSettings.blurChatPreviews);
  document.body?.classList.toggle("user-setting-hide-presence", currentUserSettings.hidePresence);
  document.body?.classList.toggle("user-setting-local-privacy", currentUserSettings.localPrivacyMode);

  const emojiWrap = document.querySelector(".chat-emoji-menu-wrap");
  if (emojiWrap) {
    emojiWrap.hidden = !currentUserSettings.showEmojiButton;
    if (!currentUserSettings.showEmojiButton) closeChatEmojiMenu();
  }

  const dashboardTarget = document.getElementById("dashboard-list");
  const previousDashboardButton = document.getElementById("dashboard-notifications-prev");
  const nextDashboardButton = document.getElementById("dashboard-notifications-next");
  if (!currentUserSettings.dashboardNotificationBadges) {
    visibleDashboardActivityItems = [];
    if (dashboardTarget) dashboardTarget.innerHTML = '<p class="empty-state">Novidades ocultas pelas suas configuracoes.</p>';
    if (previousDashboardButton) previousDashboardButton.hidden = true;
    if (nextDashboardButton) nextDashboardButton.hidden = true;
  }

  syncUserSettingsControls();
}

function updateUserSetting(key, rawValue) {
  if (!(key in USER_SETTINGS_DEFAULTS)) return;
  const value = typeof USER_SETTINGS_DEFAULTS[key] === "boolean" ? Boolean(rawValue) : rawValue;
  const nextSettings = normalizeUserSettings({ ...currentUserSettings, [key]: value });
  saveUserSettings(nextSettings);
  applyUserSettings();
  renderAccountSettings();
  if (key === "dashboardNotificationBadges") renderDashboard();
  if (key === "desktopNotifications" && nextSettings.desktopNotifications) requestDesktopNotificationPermission();
}

function isBrowserNotificationSupported() {
  return "Notification" in window;
}

async function registerHubNotificationServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  if (hubNotificationServiceWorkerRegistration) return hubNotificationServiceWorkerRegistration;

  try {
    hubNotificationServiceWorkerRegistration = await navigator.serviceWorker.register(HUB_NOTIFICATION_SERVICE_WORKER_PATH, {
      scope: "./",
    });
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event?.data?.type === "HUB_OPEN_NOTIFICATIONS") {
        const payload = event.data || {};
        markNotificationsRead(payload.notificationId ? [payload.notificationId] : [], payload.messageIds || []);
        openNotificationTrackerFromPopout();
      }
    });
    return hubNotificationServiceWorkerRegistration;
  } catch (error) {
    console.warn("Service Worker de notificações não pode ser registrado:", error);
    return null;
  }
}

async function requestDesktopNotificationPermission({ showSuccess = true } = {}) {
  localStorage.setItem(getNotificationPermissionDismissedKey(), "true");
  if (!isBrowserNotificationSupported()) {
    showModal("Notificações indisponíveis", "Este navegador não suporta notificações do sistema.", "error");
    currentUserSettings.desktopNotifications = false;
    saveUserSettings(currentUserSettings);
    syncUserSettingsControls();
    return "unsupported";
  }

  currentUserSettings.desktopNotifications = true;
  saveUserSettings(currentUserSettings);
  syncUserSettingsControls();
  await registerHubNotificationServiceWorker();

  if (Notification.permission === "granted") {
    removeDesktopNotificationPermissionPrompt();
    return "granted";
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      removeDesktopNotificationPermissionPrompt();
      if (showSuccess) {
        await showBrowserDesktopNotification("Notificações ativadas", "Agora o HUB pode avisar mesmo quando você estiver em outra aba.", {
          type: "geral",
          icon: "\u{1F514}",
          tag: "hub-rh-notificacoes-ativadas",
          requireInteraction: true,
        });
        showUserNotificationPopout("Notificações ativadas", "Avisos externos do HUB foram liberados neste navegador.", {
          type: "geral",
          icon: "\u{1F514}",
          duration: 7000,
          hint: "Você também receberá o aviso nativo do navegador",
        });
      }
      return "granted";
    }

    currentUserSettings.desktopNotifications = false;
    saveUserSettings(currentUserSettings);
    syncUserSettingsControls();
    showDesktopNotificationPermissionPrompt(true);
    return permission;
  } catch (error) {
    console.warn("Permissão de notificações não pode ser solicitada:", error);
    showDesktopNotificationPermissionPrompt(true);
    return "error";
  }
}

const HUB_NOTIFICATION_PERMISSION_PROMPT_ID = "hub-notification-permission-prompt";
let hubNotificationPermissionInteractionBound = false;

function getNotificationPermissionDismissedKey() {
  const identity = normalizeLoginName(
    currentUserProfile?.email ||
    currentAuthUser?.email ||
    storageService.getLocalItem(`${SESSION_KEY}-email`) ||
    getCurrentUserName()
  ) || "anon";
  return `hub-notification-permission-dismissed-${identity}`;
}

function removeDesktopNotificationPermissionPrompt() {
  document.getElementById(HUB_NOTIFICATION_PERMISSION_PROMPT_ID)?.remove();
}

function showDesktopNotificationPermissionPrompt(isBlocked = false) {
  if (!isAuthenticated() || !isBrowserNotificationSupported()) return;
  if (Notification.permission === "granted") {
    localStorage.setItem(getNotificationPermissionDismissedKey(), "true");
    removeDesktopNotificationPermissionPrompt();
    return;
  }
  if (!isBlocked && localStorage.getItem(getNotificationPermissionDismissedKey()) === "true") return;

  let prompt = document.getElementById(HUB_NOTIFICATION_PERMISSION_PROMPT_ID);
  if (!prompt) {
    prompt = document.createElement("div");
    prompt.id = HUB_NOTIFICATION_PERMISSION_PROMPT_ID;
    prompt.className = "hub-notification-permission-prompt";
    prompt.setAttribute("role", "status");
    prompt.innerHTML = `
      <div class="hub-notification-permission-icon">??</div>
      <div class="hub-notification-permission-text">
        <strong>Ative as notificações do HUB</strong>
        <p data-permission-message></p>
      </div>
      <button class="secondary-button" type="button" data-permission-dismiss>Depois</button>
      <button class="secondary-button" type="button" data-permission-test>Testar aviso</button>
      <button class="primary-button" type="button" data-permission-enable>Permitir notificações</button>
    `;
    document.body.appendChild(prompt);
    prompt.querySelector("[data-permission-enable]")?.addEventListener("click", () => requestDesktopNotificationPermission());
    prompt.querySelector("[data-permission-test]")?.addEventListener("click", async () => {
      const permission = Notification.permission === "granted"
        ? "granted"
        : await requestDesktopNotificationPermission({ showSuccess: false });

      if (permission !== "granted") {
        showUserNotificationPopout("Permissão pendente", "O navegador ainda não liberou as notificações externas do HUB.", {
          type: "geral",
          icon: "\u{26A0}\u{FE0F}",
          duration: 9000,
          hint: "Libere no cadeado do navegador: Notificações > Permitir",
        });
        return;
      }

      const shown = await showBrowserDesktopNotification("Teste de notificação HUB", "Este é o aviso visual que aparecerá fora da aba do HUB.", {
        type: "geral",
        icon: "\u{1F514}",
        tag: `hub-rh-teste-${Date.now()}`,
        requireInteraction: true,
      });
      showUserNotificationPopout(shown ? "Teste enviado" : "Teste bloqueado", shown
        ? "A notificação nativa do navegador foi disparada. Verifique o canto da tela ou a central de notificações."
        : "O navegador bloqueou o aviso externo. Confira as permissões do site.", {
        type: "geral",
        icon: shown ? "\u{2705}" : "\u{1F6AB}",
        duration: 10000,
        hint: shown ? "Se estiver em outra aba, o aviso aparecerá fora do HUB" : "Cadeado do navegador > Notificações > Permitir",
      });
    });
    prompt.querySelector("[data-permission-dismiss]")?.addEventListener("click", () => {
      localStorage.setItem(getNotificationPermissionDismissedKey(), "true");
      prompt.remove();
    });
  }

  const message = prompt.querySelector("[data-permission-message]");
  if (message) {
    message.textContent = isBlocked || Notification.permission === "denied"
      ? "O navegador bloqueou a permissão. Libere notificações do site nas configurações do navegador para receber avisos fora do HUB."
      : "Clique em Permitir para receber popout do navegador mesmo quando estiver em outra aba, como ChatGPT, e com som mais forte.";
  }
}

function armDesktopNotificationPermissionRequest() {
  if (!isAuthenticated() || !isBrowserNotificationSupported()) return;
  if (Notification.permission === "granted") {
    localStorage.setItem(getNotificationPermissionDismissedKey(), "true");
    removeDesktopNotificationPermissionPrompt();
    registerHubNotificationServiceWorker();
    return;
  }
  if (localStorage.getItem(getNotificationPermissionDismissedKey()) === "true") return;

  currentUserSettings.desktopNotifications = true;
  saveUserSettings(currentUserSettings);
  showDesktopNotificationPermissionPrompt(Notification.permission === "denied");

  if (hubNotificationPermissionInteractionBound || Notification.permission === "denied") return;
  hubNotificationPermissionInteractionBound = true;

  const askOnce = () => {
    if (!isAuthenticated() || Notification.permission !== "default") return;
    requestDesktopNotificationPermission();
  };

  document.addEventListener("click", askOnce, { once: true, capture: true });
  document.addEventListener("keydown", askOnce, { once: true, capture: true });
  document.addEventListener("touchstart", askOnce, { once: true, capture: true });
}

function playNotificationTone(audioContext, destination, frequency, startAt, duration, peakVolume, waveType = "square") {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = waveType;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peakVolume), startAt + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.04);
}

function playUserNotificationSound() {
  if (!currentUserSettings.notificationSound) return;
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(1.85, audioContext.currentTime);
    masterGain.connect(audioContext.destination);

    const now = audioContext.currentTime;
    playNotificationTone(audioContext, masterGain, 880, now, 0.30, 0.88, "square");
    playNotificationTone(audioContext, masterGain, 1320, now + 0.25, 0.34, 0.95, "square");
    playNotificationTone(audioContext, masterGain, 1046, now + 0.55, 0.32, 0.86, "sawtooth");
    playNotificationTone(audioContext, masterGain, 1568, now + 0.82, 0.36, 0.92, "square");

    window.setTimeout(() => {
      try { audioContext.close?.(); } catch (_) {}
    }, 1700);
  } catch {

  }
}

const HUB_NOTIFICATION_POPOUT_CONTAINER_ID = "hub-notification-popout-container";

function ensureUserNotificationPopoutContainer() {
  let container = document.getElementById(HUB_NOTIFICATION_POPOUT_CONTAINER_ID);
  if (container) return container;

  container = document.createElement("div");
  container.id = HUB_NOTIFICATION_POPOUT_CONTAINER_ID;
  container.className = "hub-notification-popout-container";
  container.setAttribute("aria-live", "polite");
  container.setAttribute("aria-atomic", "false");
  document.body.appendChild(container);
  return container;
}

function removeUserNotificationPopout(popout) {
  if (!popout || popout.dataset.closing === "true") return;
  popout.dataset.closing = "true";
  popout.classList.add("is-leaving");
  window.setTimeout(() => popout.remove(), 180);
}

function removeReadNotificationPopouts(notificationIds = [], messageIds = []) {
  const notificationSet = new Set((Array.isArray(notificationIds) ? notificationIds : [notificationIds]).filter(Boolean).map(String));
  const messageSet = new Set((Array.isArray(messageIds) ? messageIds : [messageIds]).filter(Boolean).map(String));
  if (!notificationSet.size && !messageSet.size) return;

  document.querySelectorAll(".hub-notification-popout").forEach((popout) => {
    const popoutNotificationIds = String(popout.dataset.notificationIds || "").split(",").filter(Boolean);
    const popoutMessageIds = String(popout.dataset.messageIds || "").split(",").filter(Boolean);
    const matchesNotification = popoutNotificationIds.some((id) => notificationSet.has(id));
    const matchesMessage = popoutMessageIds.some((id) => messageSet.has(id));
    if (matchesNotification || matchesMessage) removeUserNotificationPopout(popout);
  });
}

function showUserNotificationPopout(title, message, options = {}) {
  try {
    const container = ensureUserNotificationPopoutContainer();
    const popout = document.createElement("article");
    popout.className = `hub-notification-popout ${options.type || "mensagem"}`;
    popout.tabIndex = 0;
    popout.setAttribute("role", "button");
    popout.setAttribute("aria-label", `${title}. ${message}`);
    popout.dataset.notificationIds = (options.notificationIds || []).filter(Boolean).map(String).join(",");
    popout.dataset.messageIds = (options.messageIds || []).filter(Boolean).map(String).join(",");

    const icon = document.createElement("div");
    icon.className = "hub-notification-popout-icon";
    icon.textContent = options.icon || "\u{1F514}";

    const content = document.createElement("div");
    content.className = "hub-notification-popout-content";

    const heading = document.createElement("strong");
    heading.textContent = title || "Nova notificação";

    const body = document.createElement("p");
    body.textContent = message || "Você possui uma nova atualização no HUB.";

    const hint = document.createElement("span");
    hint.textContent = options.hint || "Clique para abrir o acompanhamento";

    content.append(heading, body, hint);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "hub-notification-popout-close";
    closeButton.setAttribute("aria-label", "Fechar notificação");
    closeButton.textContent = "×";

    popout.append(icon, content, closeButton);
    container.prepend(popout);

    const timer = window.setTimeout(() => removeUserNotificationPopout(popout), options.duration || 12000);

    closeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      window.clearTimeout(timer);
      removeUserNotificationPopout(popout);
    });

    const openCallback = () => {
      window.clearTimeout(timer);
      if (typeof options.onClick === "function") options.onClick();
      removeUserNotificationPopout(popout);
    };

    popout.addEventListener("click", openCallback);
    popout.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openCallback();
      }
    });

    const popouts = [...container.querySelectorAll(".hub-notification-popout")];
    popouts.slice(4).forEach(removeUserNotificationPopout);
  } catch (error) {
    console.warn("Não foi possível exibir o popout de notificação:", error);
  }
}

function openNotificationTrackerFromPopout() {
  if (openNotificationTrackerSafely()) return;
  window.location.href = "index.html?open=acompanhamento";
}

function openNotificationTrackerSafely() {
  try {
    if (!window.notificationTracker && document.getElementById("tracker-modal")) {
      window.notificationTracker = new NotificationTracker();
    }
    if (window.notificationTracker && typeof window.notificationTracker.openModal === "function") {
      window.notificationTracker.openModal();
      return true;
    }
  } catch (error) {
    console.warn("Nao foi possivel iniciar o acompanhamento automaticamente:", error);
  }

  const modal = document.getElementById("tracker-modal");
  if (!modal) return false;
  modal.removeAttribute("hidden");
  document.body.style.overflow = "hidden";
  document.getElementById("tracker-search")?.focus();
  return true;
}

async function showBrowserDesktopNotification(title, body, options = {}) {
  if (!isBrowserNotificationSupported()) return false;

  if (Notification.permission !== "granted") {
    showDesktopNotificationPermissionPrompt(Notification.permission === "denied");
    return false;
  }

  const targetUrl = new URL("index.html?open=acompanhamento", window.location.origin);
  if (options.notificationId) targetUrl.searchParams.set("markNotification", options.notificationId);
  const messageIds = Array.isArray(options.messageIds) ? options.messageIds.map(String).filter(Boolean) : [];
  if (messageIds.length) targetUrl.searchParams.set("markMessages", messageIds.join(","));

  const notificationOptions = {
    body: body || "Você tem uma nova notificação no HUB.",
    icon: "assets/logo.svg",
    badge: "assets/logo.svg",
    tag: options.tag || `hub-rh-notificacao-${Date.now()}`,
    renotify: true,
    requireInteraction: Boolean(options.requireInteraction ?? true),
    silent: false,
    timestamp: Date.now(),
    vibrate: [220, 90, 220, 90, 280],
    data: {
      url: targetUrl.href,
      type: options.type || "geral",
      notificationId: options.notificationId || "",
      messageIds,
    },
  };

  const showViaServiceWorker = async () => {
    try {
      const registration = await registerHubNotificationServiceWorker();
      const readyPromise = navigator.serviceWorker?.ready?.catch?.(() => registration) || Promise.resolve(registration);
      const readyRegistration = await Promise.race([
        readyPromise,
        new Promise((resolve) => window.setTimeout(() => resolve(registration), 1600)),
      ]);
      if (readyRegistration?.showNotification) {
        await readyRegistration.showNotification(title || "HUB RH", notificationOptions);
        return true;
      }
    } catch (swError) {
      console.warn("Notificação via Service Worker bloqueada:", swError);
    }
    return false;
  };

  const showDirect = () => {
    try {
      const notification = new Notification(title || "HUB RH", notificationOptions);
      notification.onclick = () => {
        try { markNotificationsRead(options.notificationId ? [options.notificationId] : [], messageIds); } catch (_) {}
        window.focus?.();
        openNotificationTrackerFromPopout();
        notification.close?.();
      };
      return true;
    } catch (directError) {
      console.warn("Notificação direta do navegador bloqueada:", directError);
      return false;
    }
  };

  if (document.visibilityState === "hidden" || !document.hasFocus?.()) {
    if (await showViaServiceWorker()) return true;
    if (showDirect()) return true;
  } else {
    if (showDirect()) return true;
    if (await showViaServiceWorker()) return true;
  }

  return false;
}

let hubOriginalDocumentTitle = document.title;
let hubNotificationTitleTimer = null;

function flashHubDocumentTitle(title = "Nova notificação") {
  try {
    hubOriginalDocumentTitle = hubOriginalDocumentTitle || document.title;
    if (hubNotificationTitleTimer) window.clearInterval(hubNotificationTitleTimer);
    let visible = false;
    let ticks = 0;
    hubNotificationTitleTimer = window.setInterval(() => {
      ticks += 1;
      visible = !visible;
      document.title = visible ? `?? ${title}` : hubOriginalDocumentTitle;
      if (ticks >= 20 || document.visibilityState === "visible") {
        window.clearInterval(hubNotificationTitleTimer);
        hubNotificationTitleTimer = null;
        document.title = hubOriginalDocumentTitle;
      }
    }, 900);
  } catch (_) {}
}

function updateHubAppBadge(count = 0) {
  try {
    if (navigator.setAppBadge && count > 0) {
      navigator.setAppBadge(count);
    } else if (navigator.clearAppBadge && count <= 0) {
      navigator.clearAppBadge();
    }
  } catch (_) {}
}

function showHubCrossPageNotification(title, message, options = {}) {
  if (!options.skipSound) playUserNotificationSound();
  updateHubAppBadge(1);
  if (document.visibilityState === "hidden" || !document.hasFocus?.()) {
    flashHubDocumentTitle(title || "Nova notificação");
  }

  const openAndMark = () => {
    markNotificationsRead(options.notificationId ? [options.notificationId] : [], options.messageIds || []);
    openNotificationTrackerFromPopout();
  };

  showUserNotificationPopout(title, message, {
    type: options.type,
    icon: options.icon,
    notificationIds: options.notificationId ? [options.notificationId] : [],
    messageIds: options.messageIds || [],
    duration: options.duration || 15000,
    hint: options.hint || "Clique para marcar como lida e abrir o acompanhamento",
    onClick: openAndMark,
  });
  if (!options.skipDesktop) {
    showBrowserDesktopNotification(title, message, {
      type: options.type,
      tag: options.tag,
      requireInteraction: options.requireInteraction,
      notificationId: options.notificationId,
      messageIds: options.messageIds || [],
    });
  }
}

function getRealtimeNotificationText(collection, item = {}) {
  if (collection === "comunicados") {
    const author = item.autor || "Comunicação";
    const text = getChatMessageText(item.mensagem) || "Nova mensagem recebida.";
    return {
      title: `Comunicação - ${author}`,
      message: text.length > 110 ? `${text.slice(0, 107)}...` : text,
      icon: "\u{1F4AC}",
      type: "mensagem",
      tag: `hub-rh-comunicacao-${item.id || Date.now()}`,
    };
  }

  if (collection === "denuncias") {
    return {
      title: "Nova denúncia recebida",
      message: item.descricao || "Uma nova denúncia foi registrada no HUB.",
      icon: "\u{1F4E2}",
      type: "denuncia",
      tag: `hub-rh-denuncia-${item.id || Date.now()}`,
    };
  }

  if (collection === "chamados") {
    return {
      title: "Novo chamado de EPI",
      message: [item.solicitante, item.unidade, item.status].filter(Boolean).join(" - ") || "Um novo chamado foi registrado.",
      icon: "\u{1F527}",
      type: "chamado",
      tag: `hub-rh-chamado-${item.id || Date.now()}`,
    };
  }

  if (collection === "documentosContratados") {
    const quantidade = (item.documentos || []).length;
    return {
      title: "Documentos de contratado recebidos",
      message: [item.nome, item.empresa, quantidade ? `${quantidade} arquivo(s)` : ""].filter(Boolean).join(" - ")
        || "Um contratado enviou documentos pelo formulario publico.",
      icon: "\u{1F4C4}",
      type: "documento",
      tag: `hub-rh-documentos-contratados-${item.id || Date.now()}`,
    };
  }

  if (collection === "candidaturas") {
    const vaga = (data.vagas || []).find((vagaItem) => String(vagaItem.id) === String(item.vaga_id));
    return {
      title: "Curriculo recebido",
      message: [item.nome, vaga?.cargo].filter(Boolean).join(" - ") || "Um curriculo foi enviado para uma vaga.",
      icon: "\u{1F4BC}",
      type: "vaga",
      tag: `hub-rh-candidatura-${item.id || Date.now()}`,
    };
  }
  return null;
}

function shouldNotifyRealtimeItem(collection, item = {}, action = "INSERT") {
  if (!isAuthenticated()) return false;
  if (!item || action === "DELETE") return false;
  if (!["INSERT", "UPDATE"].includes(action)) return false;
  if (["usuarios", "vagas", "atestados"].includes(collection)) return false;
  if (HubModules.byCollection(collection)?.silent) return false;

  if (!canAccessView(getViewForCollection(collection))) return false;

  const signature = [collection, action, item.id || "", item.updatedAt || item.updated_at || item.createdAt || item.created_at || ""].join("|");
  if (signature && signature === lastRealtimeNotificationSignature) return false;

  const currentName = normalizeLoginName(getCurrentUserName());
  const author = normalizeLoginName(item.autor || item.createdBy || item.updatedBy || item.solicitante || "");
  const pageIsVisible = document.visibilityState === "visible" && document.hasFocus?.();
  if (collection === "comunicados" && author && author === currentName && pageIsVisible) return false;

  if (collection === "chamados" && author && author === currentName) return false;

  lastRealtimeNotificationSignature = signature;
  return true;
}

function getNotificationPollingKey(collection, item = {}) {
  if (!collection || !item) return "";
  const identity = item.id || item.notificationId || item.codigoSolicitacao || item.createdAt || item.created_at || "";
  if (!identity) return "";
  const version = item.updatedAt || item.updated_at || item.sortAt || item.createdAt || item.created_at || "";
  return `${collection}|${identity}|${version}`;
}

function wasNotificationAlreadyShown(key) {
  if (!key) return false;
  if (shownNotificationKeys.has(key)) return true;
  shownNotificationKeys.add(key);
  saveShownNotificationKeys();
  return false;
}

function markCurrentNotificationsAsShown() {
  const keys = getNotificationPollingCandidates().map((entry) => entry.key).filter(Boolean);
  const unreadMessageKeys = getUnreadRhMessages()
    .map((item) => item.id)
    .filter(Boolean)
    .map((id) => `mensagem-rh-${id}`);
  let changed = false;
  [...keys, ...unreadMessageKeys].forEach((key) => {
    if (shownNotificationKeys.has(key)) return;
    shownNotificationKeys.add(key);
    changed = true;
  });
  if (changed) saveShownNotificationKeys();
  lastUnreadNotificationCount = getUnreadRhMessages().length;
  initialNotificationSnapshotReady = true;
}

function getNotificationPollingCandidates() {
  const sourceData = typeof data === "object" && data ? data : {};
  const candidates = [];
  const allowedCollections = ["comunicados", "denuncias", "chamados", "candidaturas", "documentosContratados"];

  allowedCollections.forEach((collection) => {
    const rows = Array.isArray(sourceData[collection]) ? sourceData[collection] : [];
    rows.forEach((item) => {
      if (!item) return;
      if (collection === "comunicados" && !canAccessChatChannel(item.canal)) return;
      const key = getNotificationPollingKey(collection, item);
      if (!key) return;
      candidates.push({ collection, item, key, time: getDashboardRecordSortValue(item) || Date.now() });
    });
  });

  return candidates.sort((a, b) => a.time - b.time);
}

function rememberCurrentNotificationKeysForPolling() {
  hubPollingNotificationKeys = new Set(getNotificationPollingCandidates().map((entry) => entry.key));
  hubPollingNotificationsReady = true;
}

function notifyNewItemsFromPolling() {
  if (!isAuthenticated()) return;
  const candidates = getNotificationPollingCandidates();
  if (!hubPollingNotificationsReady) {
    hubPollingNotificationKeys = new Set(candidates.map((entry) => entry.key));
    hubPollingNotificationsReady = true;
    return;
  }

  candidates.forEach(({ collection, item, key }) => {
    if (hubPollingNotificationKeys.has(key)) return;
    hubPollingNotificationKeys.add(key);
    notifyRealtimeItem(collection, item, "INSERT");
  });
}

function notifyRealtimeItem(collection, item = {}, action = "INSERT") {
  const pollingKey = getNotificationPollingKey(collection, item);
  if (wasNotificationAlreadyShown(pollingKey || `${collection}|${action}|${item.id || ""}`)) return;
  if (!shouldNotifyRealtimeItem(collection, item, action)) return;
  const notification = getRealtimeNotificationText(collection, item);
  if (!notification) return;

  const actionLabel = action === "UPDATE" ? "Atualização" : "Nova notificação";
  showHubCrossPageNotification(notification.title, notification.message || actionLabel, {
    type: notification.type,
    icon: notification.icon,
    tag: notification.tag,
    requireInteraction: true,
    notificationId: `${notification.type || collection}-${item.id || Date.now()}`,
    messageIds: collection === "comunicados" && item.id ? [item.id] : [],
  });

  if (pollingKey) hubPollingNotificationKeys.add(pollingKey);
}

function startAuthenticatedNotificationsOnAnyPage() {
  if (!isAuthenticated() || !postgresClient) return;
  registerHubNotificationServiceWorker();
  armDesktopNotificationPermissionRequest();
  setupRealtime();
  setupAutoRefresh();
}

function notifyUnreadRhMessages(count) {
  if (!initialNotificationSnapshotReady) {
    markCurrentNotificationsAsShown();
    lastUnreadNotificationCount = count;
    return;
  }

  const unreadIds = getUnreadRhMessages().map((item) => item.id).filter(Boolean).map(String);
  const newUnreadIds = unreadIds.filter((id) => !shownNotificationKeys.has(`mensagem-rh-${id}`));
  if (!newUnreadIds.length) {
    lastUnreadNotificationCount = count;
    return;
  }

  const newMessageCount = newUnreadIds.length;
  const messageText = `${newMessageCount} nova(s) mensagem(ns) nao lida(s).`;

  newUnreadIds.forEach((id) => wasNotificationAlreadyShown(`mensagem-rh-${id}`));
  playUserNotificationSound();
  if (currentUserSettings.desktopNotifications && isBrowserNotificationSupported() && Notification.permission === "granted") {
    const notification = new Notification("Comunicação", {
      body: messageText,
      icon: "assets/logo.svg",
      badge: "assets/logo.svg",
      tag: "hub-rh-comunicacao",
      requireInteraction: true,
    });
    notification.onclick = () => {
      try { markNotificationsRead([`mensagem-rh-${newUnreadIds[0] || Date.now()}`], newUnreadIds); } catch (_) {}
      window.focus?.();
      openNotificationTrackerFromPopout();
      notification.close?.();
    };
  }

  showHubCrossPageNotification("Comunicação", messageText, {
    type: "mensagem",
    icon: "\u{1F4AC}",
    tag: "hub-rh-comunicacao",
    requireInteraction: true,
    notificationId: `mensagem-rh-${newUnreadIds[0] || Date.now()}`,
    messageIds: newUnreadIds,
    skipSound: true,
    skipDesktop: true,
  });

  lastUnreadNotificationCount = count;
}

function getChatMessageFilterText(item = {}) {
  const attachment = item.arquivo && typeof item.arquivo === "object" ? item.arquivo : null;
  return normalizeSettingsText([
    item.autor,
    getChatMessageText(item.mensagem),
    item.createdAt,
    attachment?.name,
    attachment?.type,
    attachment?.mimeType,
  ].filter(Boolean).join(" "));
}

function syncChatMessageFilterVisibility() {
  const wrap = document.getElementById("chat-message-filter-wrap");
  const input = document.getElementById("chat-message-filter");
  const shouldShow = Boolean(chatMessageFilterVisible && activeChatChannel);
  if (wrap) wrap.hidden = !shouldShow;
  if (input) {
    input.disabled = !activeChatChannel;
    if (!shouldShow && input.value) input.value = "";
  }
}

function clearChatMessageFilter() {
  chatMessageFilterQuery = "";
  chatMessageFilterVisible = false;
  syncChatMessageFilterVisibility();
}

function focusChatMessageFilter() {
  activateView("comunicacao");
  if (!activeChatChannel) {
    renderChat();
    return;
  }
  chatMessageFilterVisible = true;
  syncChatMessageFilterVisibility();
  const filterInput = document.getElementById("chat-message-filter");
  if (filterInput) {
    filterInput.focus();
    filterInput.select();
  }
}

function resetChatComposerState() {
  const chatForm = document.getElementById("chat-form");
  const messageInput = chatForm?.querySelector('textarea[name="mensagem"]');
  if (messageInput) messageInput.value = "";
  clearChatSelectedFile();
}

function closeActiveChat() {
  if (!activeChatChannel) return false;
  activeChatChannel = "";
  clearChatMessageFilter();
  resetChatComposerState();
  closeChatAttachMenu();
  closeChatEmojiMenu();
  renderChatChannels();
  renderChat();
  return true;
}

function wrapChatSelection(prefix, suffix = prefix) {
  const input = document.querySelector('#chat-form textarea[name="mensagem"]');
  if (!input || input.disabled) return false;
  const value = input.value || "";
  const start = Number.isInteger(input.selectionStart) ? input.selectionStart : value.length;
  const end = Number.isInteger(input.selectionEnd) ? input.selectionEnd : start;
  const selected = value.slice(start, end);
  input.value = `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`;
  const cursorStart = start + prefix.length;
  const cursorEnd = cursorStart + selected.length;
  input.focus();
  input.setSelectionRange(cursorStart, cursorEnd || cursorStart);
  return true;
}

function applyChatEditingShortcut(key) {
  const normalizedKey = String(key || "").toLowerCase();
  if (normalizedKey === "b") return wrapChatSelection("**");
  if (normalizedKey === "i") return wrapChatSelection("_");
  if (normalizedKey === "u") return wrapChatSelection("<u>", "</u>");
  return false;
}

function linkifyChatText(html = "") {
  return html.replace(/(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi, (match) => {
    let url = match;
    let trail = "";
    const trailMatch = url.match(/[.,!?;:)\]"'”’]+$/);
    if (trailMatch) {
      trail = trailMatch[0];
      url = url.slice(0, -trail.length);
    }
    if (!url) return match;
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow" class="chat-link">${url}</a>${trail}`;
  });
}

function renderFormattedChatText(message = "") {
  let html = escapeHtml(message);
  html = linkifyChatText(html);
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");
  html = html.replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, "<u>$1</u>");
  return html.replace(/\n/g, "<br>");
}

function handleSettingsKeyboardShortcut(event) {
  if (event.defaultPrevented || event.isComposing) return;
  const target = event.target;
  const isTyping = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
  if (event.key === "Escape") {
    closeChatAttachMenu();
    closeChatEmojiMenu();
    closeUserMenuDropdown();
    if (document.getElementById("comunicacao")?.classList.contains("active") && closeActiveChat()) {
      event.preventDefault();
    }
    return;
  }
  if (!currentUserSettings.keyboardShortcuts) return;
  if (!event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.key.toLowerCase() === "k") {
    event.preventDefault();
    focusChatMessageFilter();
    return;
  }
  if (["b", "i", "u"].includes(event.key.toLowerCase()) && target?.matches?.('#chat-form textarea[name="mensagem"]')) {
    event.preventDefault();
    applyChatEditingShortcut(event.key);
    return;
  }
  if (/^[0-9]$/.test(event.key) && !isTyping) {
    const visibleNavButtons = [...document.querySelectorAll(".nav-item[data-view]")].filter((button) => !button.hidden);
    const shortcutIndex = event.key === "0" ? 9 : Number(event.key) - 1;
    const button = visibleNavButtons[shortcutIndex];
    if (button) {
      event.preventDefault();
      activateView(button.dataset.view);
      closeMobileMenu();
    }
  }
}

function renderChatChannels() {
  const target = document.getElementById("chat-channel-list");
  if (!target) return;

  const channels = getChatChannels();
  if (activeChatChannel && (!channels.some((channel) => channel.id === activeChatChannel) || !canAccessChatChannel(activeChatChannel))) {
    activeChatChannel = "";
  }

  if (!channels.length) {
    target.innerHTML = '<p class="empty-state">Nenhum canal interno disponivel.</p>';
    return;
  }

  target.innerHTML = channels
    .map((channel) => {
      const unreadCount = getUnreadRhMessages().filter(item => normalizeChatChannel(item.canal) === channel.id).length;
      const badge = unreadCount > 0 ? `<span class="chat-badge">${unreadCount}</span>` : "";

      let avatarHtml = "";
      if (channel.isGroup) {
        avatarHtml = `<div class="chat-avatar-fallback"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>`;
      } else if (channel.targetUser) {
        avatarHtml = getAuthorAvatar(channel.targetUser, channel.avatarPath);
      }

      return `
        <button class="channel-item ${channel.isGroup ? "is-group" : ""} ${channel.id === activeChatChannel ? "active" : ""}" data-chat-channel="${escapeHtml(channel.id)}" type="button">
          <div class="inline-flex-sm channel-item-body">
            ${avatarHtml}
            <span class="clip-text">${escapeHtml(channel.label)}</span>
          </div>
          ${badge}
        </button>
      `;
    })
    .join("");
}

function recordRenderError(section, error) {
  const detail = {
    section,
    message: error?.message || String(error),
    stack: error?.stack || "",
    at: new Date().toISOString(),
  };
  window.__hubRenderErrors = Array.isArray(window.__hubRenderErrors) ? window.__hubRenderErrors : [];
  window.__hubRenderErrors.push(detail);
  console.error(`Erro ao renderizar ${section}:`, error);
  document.body?.setAttribute("data-hub-render-error", section);
}

function safeRenderSection(section, renderFn) {
  try {
    return renderFn();
  } catch (error) {
    recordRenderError(section, error);
    return null;
  }
}

function renderMalotesSection() {
  renderAll();
}

function renderAll() {
  safeRenderSection("local-chat-state", applyLocalChatState);
  safeRenderSection("current-user", renderCurrentUser);
  safeRenderSection("role-access", applyRoleAccess);
  safeRenderSection("account-settings", renderAccountSettings);
  safeRenderSection("dashboard", renderDashboard);
  safeRenderSection("public-vagas", renderPublicVagas);

  safeRenderSection("denuncias", renderDenunciasSection);
  safeRenderSection("feedbacks", renderFeedbacksSection);

  safeRenderSection("chat-channels", renderChatChannels);
  safeRenderSection("chat", renderChat);

  HubModules.list.forEach((mod) => safeRenderSection(mod.view, mod.render));
  safeRenderSection("documentos-contratados", renderDocumentosContratados);

  safeRenderSection("chamados", renderChamadosSection);

  safeRenderSection("vagas", renderVagasSection);

  safeRenderSection("equipe", renderTeamUsers);
  safeRenderSection("data-counts", publishHubDataCounts);

  if (shouldRepairCoreCollections()) {
    window.setTimeout(() => {
      repairCoreCollectionsFromBootstrap();
    }, 0);
  }
}

function getAuthorAvatar(authorName, knownAvatarPath = "") {
  const normalizedAuthor = normalizeLoginName(authorName);
  const user = (data.usuarios || []).find((u) => normalizeLoginName(u.nome) === normalizedAuthor)
    || ([normalizeLoginName(getCurrentUserName()), normalizeLoginName(currentUserProfile?.nome)].includes(normalizedAuthor)
      ? currentUserProfile
      : null);
  const avatarPath = knownAvatarPath || user?.foto_perfil || "";
  if (avatarPath && isHttpUrl(avatarPath)) {
    return `<img src="${escapeHtml(avatarPath)}" alt="${escapeHtml(authorName)}" class="chat-avatar" />`;
  }
  if (avatarPath) {
    const signedUrl = privateAvatarUrlCache.get(avatarPath);
    if (signedUrl) {
      return `<img src="${escapeHtml(signedUrl)}" alt="${escapeHtml(authorName)}" class="chat-avatar" />`;
    }

    requestPrivateAvatarUrl(avatarPath);
    const initial = String(authorName || "?").charAt(0).toUpperCase();
    return `<div class="chat-avatar-fallback" data-private-avatar-path="${escapeHtml(avatarPath)}" data-private-avatar-alt="${escapeHtml(authorName)}">${initial}</div>`;
  }
  const initial = String(authorName || "?").charAt(0).toUpperCase();
  return `<div class="chat-avatar-fallback">${initial}</div>`;
}

function renderNotificationChatThread(messages = [], options = {}) {
  const normalizedMessages = Array.isArray(messages) ? [...messages] : [];
  normalizedMessages.sort((a, b) => {
    const aTime = typeof getDashboardRecordSortValue === "function" ? getDashboardRecordSortValue(a) : new Date(a?.createdAt || 0).getTime();
    const bTime = typeof getDashboardRecordSortValue === "function" ? getDashboardRecordSortValue(b) : new Date(b?.createdAt || 0).getTime();
    return aTime - bTime;
  });

  if (!normalizedMessages.length) {
    return `<p class="empty-state">Nenhuma mensagem disponível para exibição.</p>`;
  }

  const currentUser = typeof getCurrentUserName === "function" ? getCurrentUserName() : "";
  let previousDate = "";

  const html = normalizedMessages.map((item) => {
    const messageDate = typeof getChatMessageDate === "function" ? getChatMessageDate(item.createdAt) : "";
    const messageTime = typeof getChatMessageTimeLabel === "function" ? getChatMessageTimeLabel(item.createdAt) : (item.createdAt || "");
    const separator = messageDate && messageDate !== previousDate
      ? `<div class="chat-date-separator">${escapeHtml(messageDate)}</div>`
      : "";
    previousDate = messageDate || previousDate;

    const authorName = item.autor || "Equipe";
    const initial = escapeHtml(String(authorName).trim().charAt(0).toUpperCase() || "?");
    const avatar = `<div class="chat-avatar-fallback">${initial}</div>`;
    const visibleMessage = typeof getChatMessageText === "function" ? getChatMessageText(item.mensagem) : item.mensagem;
    const formattedMessage = visibleMessage
      ? (typeof renderFormattedChatText === "function" ? renderFormattedChatText(visibleMessage) : escapeHtml(visibleMessage))
      : "";
    const attachment = item.arquivo && typeof renderChatAttachment === "function" ? renderChatAttachment(item.arquivo) : "";

    return `${separator}
      <article class="chat-message ${authorName === currentUser ? "own" : ""}">
        <div class="chat-message-header">
          ${avatar}
          <div class="chat-author">
            <span>${escapeHtml(authorName)}</span>
            <time>${escapeHtml(messageTime)}</time>
          </div>
        </div>
        ${formattedMessage ? `<p>${formattedMessage}</p>` : ""}
        ${attachment}
      </article>`;
  }).join("");

  return `<div class="tracker-chat-thread${options.compact ? " compact" : ""}">${html}</div>`;
}

function openDashboardActivity(index) {
  const item = visibleDashboardActivityItems[Number(index)];
  if (!item) return;

  markNotificationsRead(item.notificationId ? [item.notificationId] : [], item.messageIds || []);

  const hasChatMessages = Array.isArray(item.chatMessages) && item.chatMessages.length;

  if (hasChatMessages && window.notificationTracker && typeof window.notificationTracker.openModal === "function") {
    const tracker = window.notificationTracker;
    tracker.openModal();

    const trackerNotification = (tracker.notifications || []).find((notification) => (
      String(notification.id) === "mensagens-rh"
      || String(notification.id) === String(item.notificationId || "")
      || notification.type === "mensagem"
    ));

    const fallbackNotification = {
      id: "mensagens-rh",
      type: "mensagem",
      title: item.title || "Mensagens do RH",
      description: item.text || "Mensagens no acompanhamento",
      details: item.details || "",
      time: item.date || item.createdAt || "Recentemente",
      dateTime: typeof tracker.getTimeValue === "function"
        ? tracker.getTimeValue(item.dateTime || item.date || item.createdAt || Date.now())
        : Date.now(),
      unread: Boolean(item.unread),
      status: item.unread ? "unread" : "pending",
      view: "comunicacao",
      icon: "\u{1F4AC}",
      badgeText: item.unread ? "Não lido" : "",
      messageIds: Array.isArray(item.messageIds) ? item.messageIds.map(String) : [],
      chatMessages: item.chatMessages,
    };

    const notificationToOpen = trackerNotification || fallbackNotification;
    const readNotification = typeof tracker.markNotificationRead === "function"
      ? tracker.markNotificationRead(notificationToOpen)
      : notificationToOpen;

    if (typeof tracker.showDetailView === "function") {
      tracker.showDetailView(readNotification || notificationToOpen);
    }

    renderDashboard();
    return;
  }

  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  let detailContent = "";

  if (hasChatMessages) {
    detailContent = `
      <div class="tracker-notification-detail mensagem dashboard-message-detail-fallback">
        <div class="tracker-detail-card">
          <div class="tracker-detail-topline">
            <div class="tracker-detail-icon">??</div>
            <div>
              <span class="tracker-notification-type">Mensagem RH</span>
              <h3>${escapeHtml(item.title || "Mensagens do RH")}</h3>
              ${item.text ? `<p>${escapeHtml(item.text)}</p>` : ""}
            </div>
          </div>
          <div class="tracker-detail-body">${renderNotificationChatThread(item.chatMessages)}</div>
        </div>
      </div>`;
  } else {
    const details = String(item.details || item.text || "Sem detalhes disponíveis.")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const detailMarkup = [];
    for (let detailIndex = 0; detailIndex < details.length; detailIndex += 1) {
      const detail = details[detailIndex];
      if (/^Itens (do malote|solicitados):$/i.test(detail)) {
        const itemLines = [];
        while (details[detailIndex + 1] && !/^(Observações|Status|Data):/i.test(details[detailIndex + 1])) {
          detailIndex += 1;
          itemLines.push(details[detailIndex]);
        }
        detailMarkup.push(`<li class="dashboard-detail-section"><strong>${escapeHtml(detail)}</strong><ul>${itemLines.map((itemLine) => `<li>${escapeHtml(itemLine)}</li>`).join("")}</ul></li>`);
        continue;
      }
      detailMarkup.push(`<li>${escapeHtml(detail)}</li>`);
    }
    detailContent = `<ul class="dashboard-detail-list">${detailMarkup.join("")}</ul>`;
  }

  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header info">${escapeHtml(item.title)}</div>
      <div class="modal-body">${detailContent}</div>
      <div class="modal-footer"><button class="primary-button" data-action="close-modal">Entendi</button></div>
    </div>
  `;
  overlay.querySelector('[data-action="close-modal"]')?.addEventListener("click", () => {
    overlay.remove();
    renderDashboard();
    window.notificationTracker?.loadNotifications?.();
  });
  document.body.appendChild(overlay);
}

document.getElementById("dashboard-notifications-next")?.addEventListener("click", () => {
  dashboardNotificationOffset += 3;
  renderDashboard();
});

document.getElementById("dashboard-notifications-prev")?.addEventListener("click", () => {
  dashboardNotificationOffset = Math.max(0, dashboardNotificationOffset - 3);
  renderDashboard();
});

function renderChat(options = {}) {
  const { skipPostRender = false } = options;
  const target = document.getElementById("chat-feed");
  if (!target) return;
  const currentUser = getCurrentUserName();
  const activeChannel = getActiveChatChannel();

  const title = document.getElementById("chat-title");
  const subtitle = document.getElementById("chat-subtitle");
  const messageInput = document.querySelector('#chat-form textarea[name="mensagem"]');
  const sendButton = document.querySelector("#chat-form .send-button");
  const fileButton = document.getElementById("chat-attach-menu-button");
  const fileInput = document.getElementById("chat-file");
  const emojiButton = document.getElementById("chat-emoji-button");
  const recordButton = document.getElementById("record-audio-button");
  const pollButton = document.getElementById("create-poll-button");
  const filterInput = document.getElementById("chat-message-filter");
  const pollMenuOption = document.querySelector('[data-attach-type="poll"]');
  const chatForm = document.getElementById("chat-form");
  if (!activeChannel) {
    clearChatMessageFilter();
    if (title) title.textContent = "Comunicação interna";
    if (subtitle) subtitle.textContent = "Selecione um canal para abrir a conversa";
    if (messageInput) {
      messageInput.placeholder = "Escolha um chat ao lado para enviar mensagens";
      messageInput.disabled = true;
    }
    if (sendButton) sendButton.disabled = true;
    if (fileInput) fileInput.disabled = true;
    if (emojiButton) emojiButton.disabled = true;
    if (recordButton) recordButton.disabled = true;
    if (filterInput) filterInput.disabled = true;
    if (pollButton) {
      pollButton.hidden = true;
      pollButton.disabled = true;
    }
    if (pollMenuOption) pollMenuOption.hidden = true;
    if (fileButton) {
      fileButton.disabled = true;
      fileButton.classList.add("disabled");
    }
    if (chatForm) chatForm.hidden = true;
    closeChatAttachMenu();
    closeChatEmojiMenu();
    target.innerHTML = `
      <div class="chat-empty-state chat-empty-state-lg">
        <img src="assets/logo.svg" alt="HUB" />
        <strong>HUB</strong>
      </div>
    `;
    return;
  }

  if (title) title.textContent = activeChannel.label;
  if (subtitle) subtitle.textContent = activeChannel.subtitle;
  if (chatForm) chatForm.hidden = false;
  if (messageInput) {
    messageInput.placeholder = isGeneralChatChannel(activeChannel.id) ? `Escreva em ${activeChannel.label}` : `Mensagem para ${activeChannel.label}`;
    messageInput.disabled = false;
  }
  if (sendButton) sendButton.disabled = false;
  if (fileInput) fileInput.disabled = false;
  if (emojiButton) emojiButton.disabled = false;
  if (recordButton) recordButton.disabled = false;
  if (filterInput) filterInput.disabled = false;
  syncChatMessageFilterVisibility();
  if (pollButton) {
    const canCreatePoll = isGeneralChatChannel(activeChannel.id);
    pollButton.hidden = true;
    pollButton.disabled = !canCreatePoll;
    if (pollMenuOption) pollMenuOption.hidden = !canCreatePoll;
  }
  if (fileButton) {
    fileButton.disabled = false;
    fileButton.classList.remove("disabled");
  }

  const normalizedFilter = normalizeSettingsText(chatMessageFilterQuery);
  const messages = mergeLocalChatMessages(data.comunicados || [], data.comunicados || []).filter((item) => {
    const channel = normalizeChatChannel(item.canal);
    if (channel !== activeChatChannel) return false;
    if (!canAccessChatChannel(channel)) return false;
    return !normalizedFilter || getChatMessageFilterText(item).includes(normalizedFilter);
  }).sort(compareChatMessagesOldestFirst);

  if (!messages.length) {
    target.innerHTML = normalizedFilter
      ? '<p class="empty-state">Nenhuma mensagem encontrada para este filtro.</p>'
      : '<p class="empty-state">Nenhuma mensagem neste chat ainda.</p>';
    return;
  }

  let previousDate = "";
  const chatHtml = messages.map((item) => {
    const attachment = renderChatAttachment(item.arquivo);
    const envelope = parseChatMessageEnvelope(item.mensagem);
    const poll = parseChatPollMessage(item.mensagem);
    const messageBody = poll
      ? renderChatPoll(item, poll)
      : envelope.text
        ? `<p>${renderFormattedChatText(envelope.text)}</p>`
        : "";
    const messageDate = getChatMessageDate(item.createdAt);
    const messageTime = getChatMessageTimeLabel(item.createdAt);
    const editedLabel = envelope.edited ? '<span class="chat-edited-label">Editada</span>' : "";

    const separator = messageDate && messageDate !== previousDate
      ? `<div class="chat-date-separator">${escapeHtml(messageDate)}</div>`
      : "";

    previousDate = messageDate || previousDate;

    return `${separator}
      <article class="chat-message ${item.autor === currentUser ? "own" : ""}" data-chat-message-id="${escapeHtml(item.id)}">
        <div class="chat-message-header">
          ${getAuthorAvatar(item.autor)}
          <div class="chat-author">
            <span>${escapeHtml(item.autor)}</span>
            <time>${escapeHtml(messageTime)}</time>${editedLabel}
          </div>
        </div>
        ${messageBody}
        ${attachment}
      </article>
    `;
  }).join("");

  target.innerHTML = chatHtml;

  scrollChatFeedToBottom();
  if (skipPostRender) return;

  hydrateChatMediaPreviews();

  checkAndMarkChatAsRead();
}

function scrollChatFeedToBottom() {
  const target = document.getElementById("chat-feed");
  if (!target) return;
  target.scrollTop = target.scrollHeight;
}

function renderChatAttachment(attachment) {
  if (!attachment) return "";

  const bucket = escapeHtml(getHubPostgreSQLConfig().chatFilesBucket || "hub-chat-files");
  const path = escapeHtml(attachment.url || "");
  const name = escapeHtml(attachment.name || "Arquivo");
  const size = escapeHtml(formatFileSize(attachment.size));
  const chip = `<button class="attachment-chip" type="button" data-private-storage-bucket="${bucket}" data-private-storage-path="${path}">Arquivo: ${name} ${size}</button>`;

  if (!attachment.url) return chip;

  if (isChatImageFile(attachment)) {
    const cacheKey = `${bucket}:${path}`;
    const src = chatMediaSignedUrlCache.has(cacheKey) ? chatMediaSignedUrlCache.get(cacheKey) : TRANSPARENT_IMAGE_PLACEHOLDER;
    return `
      <div class="chat-attachment chat-image-attachment">
        <img
          class="chat-image-preview"
          src="${src}"
          loading="lazy"
          data-action="open-chat-image"
          data-chat-image-bucket="${bucket}"
          data-chat-image-path="${path}"
          data-chat-image-name="${name}"
          alt="${name}"
          data-chat-image-preview
        />
      </div>
    `;
  }

  if (isChatAudioFile(attachment)) {
    return `
      <div class="chat-attachment chat-audio-attachment">
        <audio class="chat-audio-preview" controls preload="metadata" data-chat-audio-preview data-chat-audio-bucket="${bucket}" data-chat-audio-path="${path}"></audio>
        ${chip}
      </div>
    `;
  }

  return chip;
}

function createChatPollOptionField(index, required = false) {
  const canRemove = index > 2;
  return `
    <div class="chat-poll-option-editor" data-chat-poll-option>
      <label>Opção ${index}
        <input name="opcao" type="text" maxlength="80" placeholder="${required ? (index === 1 ? "Primeira opção" : "Segunda opção") : "Opcional"}" ${required ? "required" : ""} />
      </label>
      ${canRemove ? `<button class="secondary-link chat-poll-remove-option" type="button" data-action="remove-chat-poll-option" aria-label="Excluir opção ${index}">Excluir</button>` : ""}
    </div>
  `;
}

function refreshChatPollOptionFields(formElement) {
  const list = formElement?.querySelector("#chat-poll-options");
  if (!list) return;
  list.querySelectorAll("[data-chat-poll-option]").forEach((field, index) => {
    const optionNumber = index + 1;
    const label = field.querySelector("label");
    const input = field.querySelector('input[name="opcao"]');
    const removeButton = field.querySelector('[data-action="remove-chat-poll-option"]');
    if (label) label.firstChild.textContent = `Opção ${optionNumber}`;
    if (input) {
      input.required = optionNumber <= 2;
      if (optionNumber === 1) input.placeholder = "Primeira opção";
      else if (optionNumber === 2) input.placeholder = "Segunda opção";
      else input.placeholder = "Opcional";
    }
    if (removeButton) {
      removeButton.hidden = optionNumber <= 2;
      removeButton.setAttribute("aria-label", `Excluir opção ${optionNumber}`);
    }
  });
}

function addChatPollOptionField(formElement) {
  const list = formElement?.querySelector("#chat-poll-options");
  if (!list) return;
  const currentTotal = list.querySelectorAll('input[name="opcao"]').length;
  if (currentTotal >= 8) {
    showModal("Limite de opções", "A enquete pode ter no máximo 8 opções.", "info");
    return;
  }
  list.insertAdjacentHTML("beforeend", createChatPollOptionField(currentTotal + 1));
  refreshChatPollOptionFields(formElement);
  list.querySelector('[data-chat-poll-option]:last-child input')?.focus();
}

function removeChatPollOptionField(button) {
  const formElement = button?.closest("#chat-poll-form");
  const list = formElement?.querySelector("#chat-poll-options");
  const fields = list?.querySelectorAll("[data-chat-poll-option]") || [];
  if (fields.length <= 2) {
    showModal("Mínimo de opções", "A enquete precisa ter pelo menos 2 opções.", "info");
    return;
  }
  button.closest("[data-chat-poll-option]")?.remove();
  refreshChatPollOptionFields(formElement);
}

function showChatPollModal() {
  const activeChannel = getActiveChatChannel();
  if (!activeChannel || !isGeneralChatChannel(activeChannel.id)) {
    showModal("Enquete indisponivel", "As enquetes podem ser criadas somente nos chats de grupo.", "error");
    return;
  }

  document.getElementById("custom-modal")?.remove();
  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header info">Criar enquete</div>
      <form class="modal-body chat-poll-form" id="chat-poll-form">
        <label>Pergunta
          <input name="pergunta" type="text" maxlength="180" placeholder="Ex: Qual melhor dia para reunião?" required />
        </label>
        <div class="chat-poll-options-editor" id="chat-poll-options">
          ${createChatPollOptionField(1, true)}
          ${createChatPollOptionField(2, true)}
        </div>
        <button class="secondary-link chat-poll-add-option" type="button" data-action="add-chat-poll-option">Adicionar opção</button>
      </form>
      <div class="modal-footer">
        <button class="secondary-link" type="button" data-action="close-modal">Cancelar</button>
        <button class="primary-button" type="submit" form="chat-poll-form">Criar enquete</button>
      </div>
    </div>
  `;

  overlay.querySelector('[data-action="close-modal"]')?.addEventListener("click", () => overlay.remove());
  overlay.querySelector("#chat-poll-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const created = await criarEnqueteChat(event.currentTarget);
    if (created) overlay.remove();
  });
  overlay.querySelector('[data-action="add-chat-poll-option"]')?.addEventListener("click", () => {
    addChatPollOptionField(overlay.querySelector("#chat-poll-form"));
  });
  overlay.querySelector("#chat-poll-options")?.addEventListener("click", (event) => {
    const removeButton = event.target.closest('[data-action="remove-chat-poll-option"]');
    if (removeButton) removeChatPollOptionField(removeButton);
  });

  document.body.appendChild(overlay);
  overlay.querySelector('input[name="pergunta"]')?.focus();
}

async function criarEnqueteChat(formElement) {
  const activeChannel = getActiveChatChannel();
  if (!activeChannel || !isGeneralChatChannel(activeChannel.id) || !canAccessChatChannel(activeChannel.id)) {
    showModal("Acao nao permitida", "Voce so pode criar enquetes nos grupos que participa.", "error");
    return false;
  }

  const form = new FormData(formElement);
  const question = String(form.get("pergunta") || "").trim();
  const options = form.getAll("opcao").map((value) => String(value || "").trim()).filter(Boolean);
  const uniqueOptions = [...new Set(options.map((option) => option.toLocaleLowerCase("pt-BR")))];

  if (!question) {
    showModal("Pergunta obrigatoria", "Informe a pergunta da enquete.", "error");
    return false;
  }
  if (options.length < 2 || uniqueOptions.length < 2) {
    showModal("Opcoes obrigatorias", "Informe pelo menos duas opcoes diferentes para a enquete.", "error");
    return false;
  }

  return addItem("comunicados", {
    autor: getCurrentUserName(),
    canal: activeChannel.id,
    mensagem: serializeChatPoll({ question, options, votes: {}, createdBy: getCurrentUserName() }),
    arquivo: null,
  });
}

async function votarEnqueteChat(messageId, optionIndex) {
  const message = (data.comunicados || []).find((item) => String(item.id) === String(messageId));
  const poll = parseChatPollMessage(message?.mensagem);
  const activeChannel = normalizeChatChannel(message?.canal);
  const selectedIndex = Number(optionIndex);

  if (!message || !poll || !Number.isInteger(selectedIndex) || !poll.options[selectedIndex]) return;
  if (!isGeneralChatChannel(activeChannel) || !canAccessChatChannel(activeChannel)) {
    showModal("Acao nao permitida", "Voce nao possui acesso a esta enquete.", "error");
    return;
  }

  const voter = normalizeLoginName(getCurrentUserName());
  poll.votes = poll.votes && typeof poll.votes === "object" && !Array.isArray(poll.votes) ? poll.votes : {};
  poll.votes[voter] = selectedIndex;
  const nextMessage = serializeChatPoll(poll);
  const previousMessage = message.mensagem;

  message.mensagem = nextMessage;
  renderChat();

  const success = await updateItem("comunicados", message.id, {
    autor: message.autor,
    canal: activeChannel,
    mensagem: nextMessage,
    arquivo: message.arquivo || null,
    createdBy: message.createdBy || message.autor,
  });

  if (!success) {
    message.mensagem = previousMessage;
    renderChat();
  }
}

function hydrateChatMediaPreviews() {
  document.querySelectorAll("[data-chat-image-preview], [data-chat-audio-preview]").forEach((media) => {
    const path = media.dataset.chatImagePath || media.dataset.chatAudioPath || media.dataset.privateStoragePath || "";
    const bucket = media.dataset.chatImageBucket || media.dataset.chatAudioBucket || media.dataset.privateStorageBucket || getHubPostgreSQLConfig().chatFilesBucket || "hub-chat-files";
    if (!path || media.dataset.previewLoaded === "true") return;

    const cacheKey = `${bucket}:${path}`;
    if (chatMediaSignedUrlCache.has(cacheKey)) {
      media.addEventListener("load", scrollChatFeedToBottom, { once: true });
      media.addEventListener("loadedmetadata", scrollChatFeedToBottom, { once: true });
      media.src = chatMediaSignedUrlCache.get(cacheKey);
      media.dataset.previewLoaded = "true";
      requestChatFeedBottomScroll();
      return;
    }

    createPrivateStorageUrl(bucket, path)
      .then((signedUrl) => {
        chatMediaSignedUrlCache.set(cacheKey, signedUrl);
        media.addEventListener("load", scrollChatFeedToBottom, { once: true });
        media.addEventListener("loadedmetadata", scrollChatFeedToBottom, { once: true });
        media.src = signedUrl;
        media.dataset.previewLoaded = "true";
        requestChatFeedBottomScroll();
      })
      .catch((error) => {
        console.warn("Nao foi possivel carregar previa do anexo:", error);
        media.removeAttribute("src");
        delete media.dataset.previewLoaded;
      });
  });
}

function requestChatFeedBottomScroll() {
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(scrollChatFeedToBottom);
    return;
  }
  window.setTimeout(scrollChatFeedToBottom, 0);
}

document.querySelectorAll(".nav-item, [data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.externalUrl) {
      if (document.querySelector(".view.active")?.id === "comunicacao" && chatSelectedFiles.length) clearChatSelectedFile();
      closeMobileMenu();
      window.location.href = button.dataset.externalUrl;
      return;
    }
    activateView(button.dataset.view);
    closeMobileMenu();
    checkAndMarkChatAsRead();
  });
});

document.getElementById("mobile-menu-toggle")?.addEventListener("click", toggleMobileMenu);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMobileMenu();
    HubModules.list.forEach((mod) => mod.onEscape?.());
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 900) closeMobileMenu();
});

document.getElementById("chat-channel-list")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-chat-channel]");
  if (!button) return;

  const nextChatChannel = button.dataset.chatChannel || GENERAL_CHANNEL;
  if (nextChatChannel !== activeChatChannel && chatSelectedFiles.length) clearChatSelectedFile();
  activeChatChannel = nextChatChannel;
  clearChatMessageFilter();
  renderChatChannels();
  renderChat();
});

document.getElementById("chat-message-filter")?.addEventListener("input", (event) => {
  chatMessageFilterQuery = event.currentTarget.value || "";
  renderChat();
});

document.getElementById("chat-message-filter-close")?.addEventListener("click", (event) => {
  event.preventDefault();
  clearChatMessageFilter();
});


document.getElementById("public-vaga-cargo-filter")?.addEventListener("input", (event) => {
  publicVagaCargoFilter = event.currentTarget.value.trim();
  renderPublicVagas();
});
document.getElementById("public-vaga-cidade-filter")?.addEventListener("input", (event) => {
  publicVagaCidadeFilter = event.currentTarget.value.trim();
  renderPublicVagas();
});
document.getElementById("clear-public-vaga-filters")?.addEventListener("click", () => {
  publicVagaCargoFilter = "";
  publicVagaCidadeFilter = "";
  renderPublicVagas();
});

const denunciaForm = document.getElementById("denuncia-form");
if (denunciaForm) {
  ensurePublicCaptchaNotice(denunciaForm);

  denunciaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.target;
    const publicFormError = validatePublicFormSubmission(formElement);
    if (publicFormError) {
      showModal("Envio bloqueado", publicFormError, "error");
      return;
    }
    const form = new FormData(formElement);
    const turnstileToken = getPublicChallengeToken(formElement);
    const message = String(form.get("mensagem") || form.get("descricao") || "").trim();
    if (message.length < 1 || message.length > 4000) {
      showModal("Mensagem inválida", "Descreva a situação com até 4000 caracteres.", "error");
      return;
    }

    const success = await addItem("denuncias", {
      identificacao: "Anônimo",
      categoria: "Denúncia anônima",
      descricao: message,
      status: "Aberta",
      _turnstileToken: turnstileToken,
    });

    if (success) {
      formElement.reset();
      const feedback = document.getElementById("denuncia-feedback");
      if (feedback) {
        feedback.textContent = "Denúncia enviada com sucesso. Obrigado pelo relato.";
      }
      showModal("Denúncia enviada", "Seu relato foi enviado com sucesso e será analisado pela equipe responsável.", "info");
    }
  });
}

const chatFile = document.getElementById("chat-file");
if (chatFile) {
  chatFile.addEventListener("change", (event) => {
    const files = Array.from(event.currentTarget.files || []).filter((file) => file && file.name);
    if (files.length) {
      const fileError = files.map(validateChatFile).find(Boolean);
      if (fileError) {
        event.currentTarget.value = "";
        clearChatSelectedFile();
        showModal("Anexo invalido", fileError, "error");
        return;
      }
      addChatSelectedFiles(files);
    } else {
      clearChatSelectedFile();
    }
  });
}

const publicFeedbackForm = document.getElementById("feedbacks-form");
if (publicFeedbackForm) {
  publicFeedbackForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const publicFormError = validatePublicFormSubmission(formElement);
    if (publicFormError) {
      showModal("Envio bloqueado", publicFormError, "error");
      return;
    }

    const form = new FormData(formElement);
    const nome = String(form.get("nome") || "").trim();
    const mensagem = String(form.get("mensagem") || "").trim();

    if (nome.length < 2) {
      showModal("Identificacao obrigatoria", "Informe seu nome para enviar a mensagem.", "error");
      return;
    }
    if (mensagem.length < 1 || mensagem.length > 4000) {
      showModal("Mensagem invalida", "Descreva sua sugestao ou reclamacao com ate 4000 caracteres.", "error");
      return;
    }

    const success = await addItem("feedbacks", {
      tipo: "Mensagem",
      autorNome: nome,
      mensagem,
      _turnstileToken: getPublicChallengeToken(formElement),
    });

    if (success) {
      formElement.reset();
      const feedback = document.getElementById("feedbacks-feedback");
      if (feedback) feedback.textContent = "Mensagem enviada com sucesso. Obrigado por falar com nossa diretoria.";
      showModal("Mensagem enviada", "Sua mensagem foi enviada para a diretoria.", "info");
    }
  });
}

document.getElementById("record-audio-button")?.addEventListener("click", () => {
  toggleChatAudioRecording();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".chat-attach-menu-wrap")) closeChatAttachMenu();
  if (!event.target.closest(".chat-emoji-menu-wrap")) closeChatEmojiMenu();
});

const chatForm = document.getElementById("chat-form");
if (chatForm) {
  const chatMessageInput = chatForm.querySelector('textarea[name="mensagem"]');
  chatMessageInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
    if (!currentUserSettings.enterToSend && !event.ctrlKey) return;
    event.preventDefault();
    chatForm.requestSubmit();
  });

  chatForm.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
    if (!currentUserSettings.enterToSend && !event.ctrlKey) return;
    if (event.target === chatMessageInput) return;
    if (event.target.tagName === "BUTTON") return;
    event.preventDefault();
    chatForm.requestSubmit();
  });

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!activeChatChannel || !canAccessChatChannel(activeChatChannel)) {
      showModal("Acao nao permitida", "Voce nao possui acesso a este canal.", "error");
      return;
    }
    if (isDirectChannel(activeChatChannel) && !isCurrentUserInChannel(activeChatChannel)) {
      showModal("Acao nao permitida", "Voce nao participa deste chat individual.", "error");
      return;
    }

    const formElement = event.target;
    const form = new FormData(formElement);
    const files = chatSelectedFiles.length
      ? [...chatSelectedFiles]
      : form.getAll("arquivo").filter((file) => file && file.name);
    const message = String(form.get("mensagem") || "").trim();

    if (!message && !files.length) return;
    const fileError = files.map(validateChatFile).find(Boolean);
    if (fileError) {
      showModal("Anexo invalido", fileError, "error");
      return;
    }

    const messageAuthor = getCurrentUserName();
    const messageChannel = activeChatChannel;
    const pendingCreatedAt = new Date().toISOString();
    const pendingBaseTime = Date.now();
    const clientMutationId = generateUUID();
    beginChatMutation();

    const pendingMessages = files.length
      ? files.map((file, index) => {
        const attachmentType = getChatFileMimeType(file);
        const pendingIso = new Date(pendingBaseTime + index).toISOString();
        return {
          id: "pending-" + generateUUID(),
          autor: messageAuthor,
          canal: messageChannel,
          mensagem: index === 0 ? message : "",
          arquivo: { name: file.name, size: file.size, type: attachmentType, url: null },
          createdAt: pendingCreatedAt,
          sortAt: pendingCreatedAt,
          _pending: true,
          _clientMutationId: `${clientMutationId}-${index}`,
        };
      })
      : [{
        id: "pending-" + generateUUID(),
        autor: messageAuthor,
        canal: messageChannel,
        mensagem: message,
        arquivo: null,
        createdAt: pendingCreatedAt,
        sortAt: pendingCreatedAt,
        _pending: true,
        _clientMutationId: clientMutationId,
      }];
    const pendingIds = new Set(pendingMessages.map((item) => item.id));
    pendingMessages.forEach((item) => markChatMessageAsLocalEcho(item));
    data.comunicados = mergeLocalChatMessages([...pendingMessages, ...(data.comunicados || [])], data.comunicados);
    renderChat({ skipPostRender: true });

    formElement.reset();
    clearChatSelectedFile();
    window.setTimeout(() => {
      renderDashboard();
      renderChatChannels();
    }, 0);

    window.setTimeout(async () => {
    try {

    const uploadedFiles = [];
    try {
      for (const file of files) {
        const attachmentType = getChatFileMimeType(file);
        const fileUrl = await uploadChatFile(file, messageChannel);
        uploadedFiles.push({ name: file.name, size: file.size, type: attachmentType, url: fileUrl });
      }
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);

      pendingMessages.forEach((item) => {
        sendChatRealtimeBroadcast("chat", { action: "delete", id: item.id });
      });
      pendingMessages.forEach((item) => forgetLocalChatEchoMessage(item.id));
      data.comunicados = (data.comunicados || []).filter((m) => !pendingIds.has(m.id));
      renderChat({ skipPostRender: true });
      setSyncStatus("Erro no anexo", false);
      showModal("Erro no Anexo", error?.message || "Nao foi possivel enviar um dos arquivos. Verifique a conexao e tente novamente.", "error");
      return;
    }
    const payloads = uploadedFiles.length
      ? uploadedFiles.map((arquivo, index) => ({
        autor: messageAuthor,
        canal: messageChannel,
        mensagem: index === 0 ? message : "",
        arquivo,
        _clientMutationId: `${clientMutationId}-${index}`,
      }))
      : [{
        autor: messageAuthor,
        canal: messageChannel,
        mensagem: message,
        arquivo: null,
        _clientMutationId: clientMutationId,
      }];

    const savedMessages = (await Promise.all(payloads.map((payload) => addChatMessage(payload))))
      .map((savedMessage, index) => markChatMessageAsLocalEcho(savedMessage ? {
        ...savedMessage,
        _clientMutationId: payloads[index]._clientMutationId,
      } : savedMessage));
    pendingMessages.forEach((item) => forgetLocalChatEchoMessage(item.id));
    savedMessages.filter(Boolean).forEach((item) => {
      sendChatRealtimeBroadcast("chat", { action: "upsert", message: item, localEcho: true });
    });
    pendingMessages.forEach((item, index) => {
      if (!savedMessages[index]) sendChatRealtimeBroadcast("chat", { action: "delete", id: item.id });
    });
    const replacements = new Map(pendingMessages.map((pending, index) => [pending.id, savedMessages[index]]));
    data.comunicados = dedupeChatMessages((data.comunicados || [])
      .map((item) => replacements.get(item.id) || item)
      .filter((item) => item && (!item._pending || !pendingIds.has(item.id))));
    saveLocalDataDebounced();
    renderDashboard();
    renderChatChannels();
    renderChat({ skipPostRender: true });

    if (savedMessages.some((message) => !message)) {
      renderChat({ skipPostRender: true });
    }
    } finally {
      endChatMutation();
    }
    }, 0);
  });
}

document.addEventListener("click", (event) => {
  const downloadUrlButton = event.target.closest("[data-download-url]");
  if (downloadUrlButton) {
    event.preventDefault();
    downloadUrlAsBlob(downloadUrlButton.dataset.downloadUrl, downloadUrlButton.dataset.downloadName || "documento")
      .catch((error) => {
        console.error("Erro ao baixar arquivo:", error);
        showModal("Download", "Nao foi possivel baixar o arquivo. Tente novamente ou contate o administrador.", "error");
      });
    return;
  }

  const privateFileButton = event.target.closest("[data-private-storage-path]");
  if (privateFileButton) {
    event.preventDefault();
    downloadPrivateStorageFile(
      privateFileButton.dataset.privateStorageBucket,
      privateFileButton.dataset.privateStoragePath,
      privateFileButton.dataset.privateStorageName || "documento",
    );
    return;
  }
});

const usuarioForm = document.getElementById("usuario-form");
if (usuarioForm) {
  usuarioForm.querySelector('[name="cpf"]')?.addEventListener("input", (event) => {
    event.currentTarget.value = formatCpf(event.currentTarget.value);
  });

  usuarioForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const success = await saveTeamUser({
      nome: form.get("nome"),
      email: form.get("email"),
      cpf: form.get("cpf"),
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
        <label class="modal-password-label flush-top">Senha atual
          <input id="modal-current-pwd" type="password" placeholder="Digite sua senha atual" autocomplete="current-password" />
        </label>
        <label class="modal-password-label">Nova senha
          <input id="modal-new-pwd" type="password" placeholder="Digite a nova senha" autocomplete="new-password" />
        </label>
        <label class="modal-password-label">Confirmar nova senha
          <input id="modal-confirm-pwd" type="password" placeholder="Confirme a nova senha" autocomplete="new-password" />
        </label>
        <p class="form-feedback error modal-error-spacing" id="modal-action-error" hidden></p>
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
      errorEl.textContent = "A senha atual - obrigatória.";
      errorEl.hidden = false;
      return;
    }
    if (!newPwd || newPwd.length < 12) {
      errorEl.textContent = "Use uma nova senha com pelo menos 12 caracteres.";
      errorEl.hidden = false;
      return;
    }
    if (newPwd !== confirmPwd) {
      errorEl.textContent = "A confirmação da nova senha não confere.";
      errorEl.hidden = false;
      return;
    }

    if (newPwd === currentPwd) {
      errorEl.textContent = "A nova senha não pode ser igual - senha atual.";
      errorEl.hidden = false;
      return;
    }

    const isPasswordValid = await verifyCurrentPassword(currentPwd);
    if (!isPasswordValid) {
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

document.querySelectorAll("[data-settings-target]").forEach((button) => {
  button.addEventListener("click", () => showSettingsPanel(button.dataset.settingsTarget));
});

document.getElementById("settings-search-input")?.addEventListener("input", (event) => {
  filterSettingsItems(event.currentTarget.value);
});

document.querySelectorAll("[data-user-setting]").forEach((field) => {
  field.addEventListener("change", (event) => {
    const input = event.currentTarget;
    updateUserSetting(input.dataset.userSetting, input.type === "checkbox" ? input.checked : input.value);
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("#record-context-menu")) document.getElementById("record-context-menu")?.remove();
  if (!event.target.closest("#chat-message-context-menu")) document.getElementById("chat-message-context-menu")?.remove();
  if (!event.target.closest("#event-context-menu")) document.getElementById("event-context-menu")?.remove();
  if (!event.target.closest("#candidatura-context-menu")) document.getElementById("candidatura-context-menu")?.remove();
});

document.addEventListener("contextmenu", (event) => {
  const eventCard = event.target.closest("[data-event-card]");
  if (eventCard) {
    event.preventDefault();
    document.getElementById("custom-modal")?.remove();
    openEventContextMenu(event, eventCard.dataset.id);
    return;
  }
  const chatMessage = event.target.closest("[data-chat-message-id]");
  if (chatMessage) {
    event.preventDefault();
    openChatMessageContextMenu(event, chatMessage.dataset.chatMessageId);
    return;
  }
  const candidaturaRow = event.target.closest("[data-candidatura-context]");
  if (candidaturaRow && candidaturaRow.dataset.id) {
    event.preventDefault();
    openCandidaturaContextMenu(event, candidaturaRow.dataset.id);
    return;
  }
  const recordCard = event.target.closest("[data-record-context]");
  if (recordCard) {
    const type = recordCard.dataset.recordContext;
    if ((type === "denuncia" || type === "chamado" || type === "feedback") && recordCard.dataset.id) {
      event.preventDefault();
      openRecordContextMenu(event, type, recordCard.dataset.id);
      return;
    }
  }
});

document.addEventListener("keydown", handleSettingsKeyboardShortcut);

function initializeAccountSettingsForm() {
  currentUserSettings = loadUserSettings();
  applyUserSettings();
  renderAccountSettings();

  const fotoInput = document.getElementById("foto-perfil-input");
  if (fotoInput) {
    fotoInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      const filenameLabel = document.getElementById("foto-perfil-filename");
      if (file && filenameLabel) {
        filenameLabel.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
      } else if (filenameLabel) {
        filenameLabel.textContent = "Nenhuma foto selecionada";
      }
    });
  }
}

function validateAccountUpdate(newName, fotoFile) {
  const errors = [];

  if (newName && newName.length < 2) {
    errors.push("Nome deve ter pelo menos 2 caracteres.");
  }

  if (newName && newName.length > 100) {
    errors.push("Nome nao pode ter mais de 100 caracteres.");
  }

  if (fotoFile && fotoFile.name) {
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowedTypes.has(fotoFile.type)) {
      errors.push("Use uma imagem em formato JPG, PNG ou WEBP.");
    }

    const maxSizeMB = 5;
    if (fotoFile.size > maxSizeMB * 1024 * 1024) {
      errors.push(`Imagem nao pode exceder ${maxSizeMB} MB.`);
    }

    if (fotoFile.size < 1) {
      errors.push("Arquivo de imagem invalido.");
    }
  }

  return { isValid: errors.length === 0, errors };
}

function setAccountFormLoading(isLoading) {
  const submitBtn = document.querySelector("#conta-form .primary-button");
  if (submitBtn) {
    submitBtn.disabled = isLoading;
    submitBtn.style.opacity = isLoading ? "0.6" : "1";
    submitBtn.textContent = isLoading ? "Atualizando..." : "Atualizar conta";
  }
}

const contaForm = document.getElementById("conta-form");
if (contaForm) {
  contaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const newName = String(form.get("novo_nome") || "").trim();
    const fotoFile = form.get("foto_perfil");

    const validation = validateAccountUpdate(newName, fotoFile);
    if (!validation.isValid) {
      showModal("Erro de validacao", validation.errors.join("\n"), "error");
      return;
    }

    setAccountFormLoading(true);

    let fotoUrl = null;
    if (fotoFile && fotoFile.name && postgresClient) {
      try {
        const safeName = fotoFile.name.replace(/[^a-z0-9_.-]/gi, "-");
        const path = `avatars/${Date.now()}-${generateUUID()}-${safeName}`;
        const { error: uploadError } = await postgresClient.storage
          .from(getHubPostgreSQLConfig().chatFilesBucket || "hub-chat-files")
          .upload(path, fotoFile, { contentType: fotoFile.type, upsert: false });
        if (uploadError) throw uploadError;

        fotoUrl = path;
      } catch (e) {
        console.error("Erro ao enviar foto", e);
        setAccountFormLoading(false);
        showModal("Erro", e.message || "Nao foi possivel enviar a foto de perfil.", "error");
        return;
      }
    }

    const success = await updateCurrentAccount("", newName || null, "", fotoUrl);
    setAccountFormLoading(false);

    if (success) {
      formElement.reset();
      const filenameLabel = document.getElementById("foto-perfil-filename");
      if (filenameLabel) filenameLabel.textContent = "Nenhuma foto selecionada";
      renderAccountSettings();
      renderCurrentUser();
      showModal("Conta atualizada", "Seus dados foram atualizados com sucesso.", "success");
    }
  });
}

document.querySelectorAll("[data-settings-target]").forEach((button) => {
  if (button.dataset.settingsTarget === "settings-account-panel") {
    button.addEventListener("click", () => {
      setTimeout(initializeAccountSettingsForm, 100);
    });
  }
});

initializeAccountSettingsForm();

const candidaturaForm = document.getElementById("candidatura-form");
if (candidaturaForm) {
  ensurePublicCaptchaNotice(candidaturaForm);

  document.getElementById("telefone-input")?.addEventListener("input", (event) => {
    event.currentTarget.value = formatPhone(event.currentTarget.value);
  });

  document.getElementById("cpf-input")?.addEventListener("input", (event) => {
    event.currentTarget.value = formatCpf(event.currentTarget.value);
  });

  candidaturaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.target;
    const publicFormError = validatePublicFormSubmission(formElement);
    if (publicFormError) {
      showModal("Envio bloqueado", publicFormError, "error");
      return;
    }
    const form = new FormData(formElement);
    const turnstileToken = getPublicChallengeToken(formElement);
    const vaga_id = form.get("vaga_id");
    const nome = form.get("nome");
    const telefone = form.get("telefone");
    const cpf = form.get("cpf");
    const curriculo = form.get("curriculo");

    if (!vaga_id || !nome || !telefone || !cpf || !curriculo || !curriculo.name) {
      showModal("Vaga obrigatoria", "Abra a candidatura pelo botao Candidatar-se de uma vaga aberta.", "error");
      return;
    }

    const resumeError = validateResumeFile(curriculo);
    if (resumeError) {
      showModal("Curriculo invalido", resumeError, "error");
      return;
    }

    const existing = (data.candidaturas || []).find(c => String(c.vaga_id) === String(vaga_id) && c.cpf === cpf);
    if (existing) {
      showModal("Aviso", "Você já enviou um currículo para esta vaga com este CPF.", "error");
      return;
    }

    try {
      const inserted = await submitPublicApplicationWithFile({ vaga_id, nome, telefone, cpf, curriculo, turnstileToken });
      data.candidaturas.unshift(mapRows("candidaturas", [inserted])[0]);
      formElement.reset();
      document.getElementById("vaga-id").value = vaga_id;
      showModal("Sucesso", "Seu currículo foi enviado com sucesso!", "info");
    } catch (error) {
      console.error(error);
      if (error.code === "23505") {
        showModal("Aviso", "Você já enviou um currículo para esta vaga com este CPF.", "error");
      } else {
        showModal("Erro", error.message || "Não foi possível enviar o currículo. Verifique sua conexão e tente novamente.", "error");
      }
    }
  });
}

const contratadoDocForm = document.getElementById("contratado-doc-form");
if (contratadoDocForm) {
  ensurePublicCaptchaNotice(contratadoDocForm);
  const contractorLayout = document.querySelector("[data-public-contratados]");
  const contractorPasswordForm = document.getElementById("contractor-password-form");
  const contractorDocumentsFields = document.getElementById("contractor-documents-fields");
  const addContractorDocumentButton = document.getElementById("adicionar-documento-contratado");
  let contractorAccessPassword = "";

  addContractorDocumentButton?.addEventListener("click", () => {
    contractorDocumentsFields?.insertAdjacentHTML("beforeend", createContractorDocumentField(false));
  });

  contractorDocumentsFields?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='remover-documento-contratado']");
    if (!button) return;
    const fields = contractorDocumentsFields.querySelectorAll(".contractor-document-field");
    if (fields.length <= 1) return;
    button.closest(".contractor-document-field")?.remove();
  });

  contractorPasswordForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("senha_acesso") || "").trim();
    const empresa = String(contractorLayout?.dataset.contractorCompany || "");
    const submitButton = contractorPasswordForm.querySelector("button[type='submit']");
    if (submitButton) submitButton.disabled = true;
    try {
      const response = await fetch("/api/contractor-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verify: true, empresa, accessPassword: password }),
      });
      if (!response.ok) {
        showModal("Senha incorreta", "A senha informada não libera esta página.", "error");
        return;
      }
    } catch (error) {
      console.error(error);
      showModal("Erro", "Não foi possível verificar a senha. Verifique sua conexão e tente novamente.", "error");
      return;
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
    contractorAccessPassword = password;
    contractorPasswordForm.hidden = true;
    contratadoDocForm.hidden = false;
  });

  document.querySelectorAll("[data-toggle-public-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.togglePublicPassword || "");
      if (!input) return;
      const isVisible = input.type === "text";
      input.type = isVisible ? "password" : "text";
      button.textContent = isVisible ? "Exibir" : "Ocultar";
      button.setAttribute("aria-pressed", String(!isVisible));
    });
  });

  document.getElementById("telefone-input")?.addEventListener("input", (event) => {
    event.currentTarget.value = formatPhone(event.currentTarget.value);
  });

  document.getElementById("cpf-input")?.addEventListener("input", (event) => {
    event.currentTarget.value = formatCpf(event.currentTarget.value);
  });

  contratadoDocForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const publicFormError = validatePublicFormSubmission(formElement);
    if (publicFormError) {
      showModal("Envio bloqueado", publicFormError, "error");
      return;
    }

    const form = new FormData(formElement);
    const empresa = String(form.get("empresa") || formElement.dataset.company || "").trim();
    const origemHtml = String(form.get("origem_html") || contractorLayout?.dataset.contractorSource || window.location.pathname.split("/").pop() || "").trim();
    const nome = String(form.get("nome") || "").trim();
    const telefone = String(form.get("telefone") || "").trim();
    const cpf = String(form.get("cpf") || "").trim();
    const email = String(form.get("email") || "").trim();
    const documentos = form.getAll("documentos").filter((file) => file && file.name);
    const turnstileToken = getPublicChallengeToken(formElement);

    if (!empresa || !nome || !telefone || !cpf || !email || !documentos.length) {
      showModal("Dados obrigatórios", "Preencha todos os dados e anexe pelo menos um documento.", "error");
      return;
    }

    if (!isValidCpf(cpf)) {
      showModal("CPF inválido", "Informe um CPF válido no formato 000.000.000-00.", "error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      showModal("E-mail inválido", "Informe um e-mail válido para contato.", "error");
      return;
    }

    const fileError = documentos.map(validateContractorDocumentFile).find(Boolean);
    if (fileError) {
      showModal("Documento inválido", fileError, "error");
      return;
    }

    showConfirmActionModal({
      title: "Confirmar envio",
      text: "Confira se todos os documentos solicitados foram anexados antes de continuar. O envio é único: depois de enviado, não será possível reenviar ou editar os documentos.",
      confirmText: "Enviar documentos",
      onConfirm: async () => {
        try {
          await submitPublicContractorDocuments({ empresa, origemHtml, nome, telefone, cpf, email, documentos, accessPassword: contractorAccessPassword, turnstileToken });
          formElement.reset();
          resetContractorDocumentFields(contractorDocumentsFields);
          showModal("Documentos enviados", "Os documentos foram enviados com sucesso para o RH.", "info");
        } catch (error) {
          console.error(error);
          const message = /duplicate key|23505|CPF ja possui envio|CPF já possui envio/i.test(error.message || "")
            ? "Este CPF já possui um envio de documentos registrado."
            : error.message || "Não foi possível enviar os documentos. Tente novamente.";
          showModal("Erro", message, "error");
        }
      },
    });
  });
}

const chamadoForm = document.getElementById("chamado-form");
if (chamadoForm) {
  ensurePublicCaptchaNotice(chamadoForm);

  document.getElementById("adicionar-colaborador-chamado")?.addEventListener("click", () => {
    const list = document.getElementById("epi-list");
    if (!list) return;
    list.insertAdjacentHTML("afterbegin", createChamadoCollaboratorBlock());
    populateEpiSelects();
  });

  document.getElementById("epi-list")?.addEventListener("click", (event) => {
    const addItemButton = event.target.closest(".add-chamado-item");
    if (addItemButton) {
      const block = addItemButton.closest("[data-chamado-collaborator]");
      const itemsList = block?.querySelector("[data-chamado-collaborator-items]");
      if (!itemsList) return;
      itemsList.insertAdjacentHTML("afterbegin", createMaloteItemRow());
      populateEpiSelects();
      return;
    }

    const removeCollaboratorButton = event.target.closest(".remove-chamado-collaborator");
    if (removeCollaboratorButton) {
      const blocks = document.querySelectorAll("#epi-list [data-chamado-collaborator]");
      if (blocks.length <= 1) return;
      removeCollaboratorButton.closest("[data-chamado-collaborator]")?.remove();
      return;
    }

    const button = event.target.closest(".remove-epi");
    if (!button) return;
    const block = button.closest("[data-chamado-collaborator]");
    const rows = block?.querySelectorAll(".epi-row") || [];
    if (rows.length <= 1) return;
    button.closest(".epi-row")?.remove();
  });

  document.getElementById("epi-list")?.addEventListener("change", (event) => {
    const typeSelect = event.target.closest("[data-item-type-select]");
    if (!typeSelect) return;
    const row = typeSelect.closest(".epi-row");
    const fieldsContainer = row?.querySelector("[data-epi-row-fields]");
    if (fieldsContainer) fieldsContainer.innerHTML = renderEpiRowFields(typeSelect.value, {});
  });

  document.getElementById("epi-list")?.addEventListener("input", (event) => {
    const cpfInput = event.target.closest('[name="cracha_cpf[]"]');
    if (!cpfInput) return;
    cpfInput.value = formatCpf(cpfInput.value);
  });

  chamadoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const publicFormError = validatePublicFormSubmission(formElement);
    if (publicFormError) {
      showModal("Envio bloqueado", publicFormError, "error");
      return;
    }
    const form = new FormData(formElement);
    const turnstileToken = getPublicChallengeToken(formElement);
    const colaboradores = readChamadoCollaborators(formElement);
    if (!colaboradores.length || colaboradores.some((group) => !hasFullName(group.colaborador))) {
      showModal("Colaborador e EPIs obrigatorios", "Informe nome e sobrenome do colaborador e adicione pelo menos um EPI ou uniforme para ele.", "error");
      return;
    }
    const epiItems = flattenCollaboratorItems(colaboradores);

    const success = await addItem("chamados", {
  solicitante: form.get("solicitante"),
      unidade: form.get("unidade"),
      epis: formatEpiItems(epiItems),
      observacoes: form.get("observacoes"),
      status: "Aberto",
      createdBy: "Publico",
      _turnstileToken: turnstileToken,
    });

    if (success) {
      formElement.reset();
      resetChamadoCollaborators();
      populateUnitSelects();
      populateEpiSelects();
      showModal("Chamado aberto", "Sua solicitacao de EPI foi registrada com sucesso.", "info");
    }
  });
}

function prefillChamadoRequester() {
  const input = document.querySelector('#chamado-form [name="solicitante"]');
  if (!input) return;
  input.value = currentUserProfile?.nome || getCurrentUserName() || "";
  input.readOnly = true;
  input.classList.add("readonly-field");
}

async function initializeAppData() {
  const shell = document.getElementById("app-shell");
  populateUnitSelects();
  populateEpiSelects();
  postgresClient = getPostgreSQLClient();
  if (isPublicPage()) {
    shell?.classList.remove("is-locked");
    shell?.classList.add("is-ready");
    loadPublicData();
    startAuthenticatedNotificationsOnAnyPage();
    window.__hubAuthReady = true;
    document.documentElement.classList.remove("auth-entry-pending");
    return;
  }
  if (!isAuthenticated()) {
    shell?.classList.add("is-locked");
    shell?.classList.remove("is-ready");
    window.location.replace(`login.html?next=${encodeURIComponent(window.location.pathname.split("/").pop() || "index.html")}`);
    return;
  }
  applyRoleAccess();
  prefillChamadoRequester();
  renderAccountSettings();
  registerHubNotificationServiceWorker();
  armDesktopNotificationPermissionRequest();
  const postgresLoad = loadFromPostgreSQL({ setupLive: true });
  const postgresLoaded = await withTimeout(postgresLoad, POSTGRES_BOOT_TIMEOUT_MS, false);
  if (postgresLoaded === false) {
    setSyncStatus("PostgreSQL carregando em segundo plano", false);
  }
  shell?.classList.remove("is-locked");
  shell?.classList.add("is-ready");
  if (postgresLoaded === false) {
    try {
      renderAll();
    } catch (error) {
      console.error("Erro ao renderizar painel apos destravar loading:", error);
    }
  }
  window.setTimeout(() => {
    loadIndexBootstrapData({ forceCore: true, render: true })
      .then((loaded) => {
        if (loaded) setSyncStatus("PostgreSQL EIXO online", true);
      })
      .catch((error) => console.error("Erro ao reforcar dados do index pelo bootstrap:", error));
    loadIndexVagasData({ render: true });
  }, 0);
  setupPresenceHeartbeat();

  window.__hubAuthReady = true;
  document.documentElement.classList.remove("auth-entry-pending");
}

function startAppInitialization() {
  if (!appInitializationPromise) {
    appInitializationPromise = initializeAppData()
      .catch((error) => {
        console.error("Erro ao inicializar painel:", error);
        if (!isLoginPage() && !isPublicPage() && isAuthenticated()) {
          const shell = document.getElementById("app-shell");
          shell?.classList.remove("is-locked");
          shell?.classList.add("is-ready");
          window.__hubAuthReady = true;
          document.documentElement.classList.remove("auth-entry-pending");
          try {
            renderAll();
          } catch (renderError) {
            console.error("Erro ao renderizar painel apos falha de inicializacao:", renderError);
          }
          return true;
        }
        throw error;
      })
      .finally(() => {
        appInitializationPromise = null;
      });
  }
  return appInitializationPromise;
}

function unlockAccountLoadingWithSession() {
  const shell = document.getElementById("app-shell");
  if (!shell?.classList.contains("is-locked")) return true;
  if (!isAuthenticated()) return false;
  shell.classList.remove("is-locked");
  shell.classList.add("is-ready");
  try {
    renderAll();
  } catch (error) {
    console.error("Erro ao renderizar painel apos restaurar sessao:", error);
  }
  setupPresenceHeartbeat();
  return true;
}

function armAccountLoadingReauth() {
  if (isLoginPage() || isPublicPage()) return;
  window.setTimeout(async () => {
    const shell = document.getElementById("app-shell");
    if (!shell?.classList.contains("is-locked")) return;
    if (!isAuthenticated()) {
      const restored = await withTimeout(restoreAuthenticatedSession(), ACCOUNT_LOADING_REAUTH_MS, false);
      if (!restored) {
        window.location.replace(`login.html?next=${encodeURIComponent(window.location.pathname.split("/").pop() || "index.html")}`);
        return;
      }
    }
    await withTimeout(startAppInitialization(), POSTGRES_BOOT_TIMEOUT_MS, null);
    if (!unlockAccountLoadingWithSession()) {
      window.location.replace(`login.html?next=${encodeURIComponent(window.location.pathname.split("/").pop() || "index.html")}`);
    }
  }, ACCOUNT_LOADING_REAUTH_MS);
}

function setupPresenceHeartbeat() {
  if (presenceHeartbeatStarted) return;
  presenceHeartbeatStarted = true;

  let lastHeartbeatAt = 0;
  const HEARTBEAT_MIN_GAP_MS = 60000;

  const sendHeartbeat = () => {
    if (!isAuthenticated()) return;
    if (document.visibilityState !== "visible") return;
    if (Date.now() - lastHeartbeatAt < HEARTBEAT_MIN_GAP_MS) return;
    lastHeartbeatAt = Date.now();
    fetch("/api/auth/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).then((response) => {
      if (response.status !== 401) return;

      // Nao adianta tentar restaurar do cache local: o servidor ja confirmou
      // que a sessao foi encerrada (ex.: login em outra maquina).
      clearAuthenticatedUser();
      window.location.replace(`login.html?next=${encodeURIComponent(window.location.pathname.split("/").pop() || "index.html")}`);
    }).catch(() => {});
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") sendHeartbeat();
  });

  sendHeartbeat(true);
  window.setInterval(() => sendHeartbeat(true), 30000);
  setupPresencePolling();
}

function setupPresencePolling() {
  const poll = async () => {
    if (!isAuthenticated() || !postgresClient) return;
    try {
      const { data: rows, error } = await postgresClient
        .from(USERS_TABLE)
        .select("*")
        .order("nome", { ascending: true });
      if (error) throw error;
      data.usuarios = mergeUsersByName(data.usuarios || [], mapRows("usuarios", rows || []));
      saveTeamUsersStore(data.usuarios);
      renderChatChannels();
      renderChat();
    } catch (_) {
      // Mantem o ultimo estado conhecido se a consulta falhar.
    }
  };

  poll();
  window.setInterval(poll, 30000);
}

disableSensitiveFieldAutofill();
armAccountLoadingReauth();

setupLogin().then((canInitialize) => {
  if (canInitialize) return startAppInitialization();
  return null;
}).catch((error) => {
  console.error("Erro ao validar login:", error);
  if (!isLoginPage() && !isPublicPage()) {
    window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname.split("/").pop() || "index.html")}`;
    return;
  }
  if (isPublicPage()) startAppInitialization();
});

async function excluirRegistrosArquivadosPermanentemente(collection, table, rotuloPlural) {
  const arquivados = (data[collection] || []).filter((item) => isArchivedRecord(item));
  if (!arquivados.length) {
    showModal(`Nada para apagar`, `Nao ha ${rotuloPlural} arquivados no momento.`, "info");
    return;
  }

  showPasswordActionModal({
    title: `Apagar ${rotuloPlural} arquivados`,
    text: `Confirme a senha de autorizacao para apagar definitivamente ${arquivados.length} ${rotuloPlural} arquivados. Essa acao nao pode ser desfeita.`,
    confirmText: "Apagar",
    danger: true,
    validatePassword: async (password) => verifyAuthorizationPassword(password),
    onConfirm: async () => {
      const ids = arquivados.map((item) => item.id);
      if (postgresClient) {
        try {
          const { error } = await postgresClient.from(table).delete().in("id", ids);
          if (error) throw error;
        } catch (error) {
          console.error(`Erro ao apagar ${collection} arquivados no PostgreSQL:`, error);
          showModal("Erro ao apagar", `Nao foi possivel apagar os ${rotuloPlural} arquivados no PostgreSQL. Tente novamente.`, "error");
          return;
        }
      }
      data[collection] = (data[collection] || []).filter((item) => !isArchivedRecord(item));
      saveLocalData();
      renderAll();
      showModal("Registros apagados", `Os ${rotuloPlural} arquivados foram apagados definitivamente.`, "info");
    },
  });
}

async function excluirRegistroArquivadoIndividualmente(collection, table, id, labelFrase) {
  showPasswordActionModal({
    title: "Apagar registro arquivado",
    text: `Confirme a senha de autorizacao para apagar definitivamente ${labelFrase}. Essa acao nao pode ser desfeita.`,
    confirmText: "Apagar",
    danger: true,
    validatePassword: async (password) => verifyAuthorizationPassword(password),
    onConfirm: async () => {
      if (postgresClient) {
        try {
          const { error } = await postgresClient.from(table).delete().eq("id", id);
          if (error) throw error;
        } catch (error) {
          console.error(`Erro ao apagar ${collection} no PostgreSQL:`, error);
          showModal("Erro ao apagar", "Nao foi possivel apagar o registro no PostgreSQL. Tente novamente.", "error");
          return;
        }
      }
      data[collection] = (data[collection] || []).filter((record) => String(record.id) !== String(id));
      saveLocalData();
      renderAll();
      showModal("Registro apagado", "O registro foi apagado definitivamente.", "info");
    },
  });
}

function getChatMessageById(id) {
  return (data.comunicados || []).find((item) => String(item.id) === String(id));
}

function canEditChatMessage(message) {
  if (!message || message.autor !== getCurrentUserName()) return false;
  if (parseChatPollMessage(message.mensagem)) return false;
  const sentAt = getChatMessageTime(message.sortAt || message.createdAt);
  return sentAt > 0 && Date.now() - sentAt <= CHAT_EDIT_WINDOW_MS;
}

function canDeleteChatMessage(message) {
  if (!message || message.autor !== getCurrentUserName()) return false;
  const sentAt = getChatMessageTime(message.sortAt || message.createdAt);
  return sentAt > 0 && Date.now() - sentAt <= CHAT_DELETE_WINDOW_MS;
}

async function editChatMessage(id) {
  const message = getChatMessageById(id);
  if (!message) return;
  if (!canEditChatMessage(message)) {
    showModal("Edicao indisponivel", "A mensagem so pode ser editada em ate 15 minutos apos o envio.", "error");
    return;
  }
  const nextText = await showEditChatMessageModal(getChatMessageText(message.mensagem));
  if (nextText == null) return;
  const trimmed = String(nextText || "").trim();
  if (!trimmed) {
    showModal("Mensagem obrigatoria", "A mensagem editada nao pode ficar vazia.", "error");
    return;
  }
  if (trimmed.length > 4000) {
    showModal("Mensagem muito longa", "A mensagem deve ter no maximo 4000 caracteres.", "error");
    return;
  }
  await updateItem("comunicados", id, {
    autor: message.autor,
    canal: message.canal,
    mensagem: serializeEditedChatMessage(trimmed),
    arquivo: message.arquivo || null,
    createdBy: message.createdBy || message.autor,
  });
}

async function deleteChatMessage(id) {
  const message = getChatMessageById(id);
  if (!message || message.autor !== getCurrentUserName()) return;
  if (!canDeleteChatMessage(message)) {
    showModal("Exclusao indisponivel", "A mensagem so pode ser excluida em ate 24 horas apos o envio.", "error");
    return;
  }
  showConfirmActionModal({
    title: "Excluir mensagem",
    text: "Deseja excluir esta mensagem do chat?",
    danger: true,
    confirmText: "Excluir",
    onConfirm: () => {
      deleteChatMessageRecord(id);
    },
  });
}

function openChatMessageContextMenu(event, id) {
  document.getElementById("chat-message-context-menu")?.remove();
  const message = getChatMessageById(id);
  if (!message || message.autor !== getCurrentUserName()) return;
  const canEdit = canEditChatMessage(message);
  const canDelete = canDeleteChatMessage(message);
  if (!canEdit && !canDelete) return;
  const menu = document.createElement("div");
  menu.id = "chat-message-context-menu";
  menu.className = "board-context-menu chat-message-context-menu";
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  menu.innerHTML = `
    ${canEdit ? '<button type="button" data-chat-message-action="edit">Editar mensagem</button>' : ""}
    ${canDelete ? '<button type="button" class="danger" data-chat-message-action="delete">Excluir mensagem</button>' : ""}
  `;
  menu.addEventListener("click", async (clickEvent) => {
    const actionButton = clickEvent.target.closest("[data-chat-message-action]");
    if (!actionButton || actionButton.disabled) return;
    const action = actionButton.dataset.chatMessageAction;
    menu.remove();
    if (action === "edit") await editChatMessage(id);
    if (action === "delete") await deleteChatMessage(id);
  });
  document.body.appendChild(menu);
}

function openRecordContextMenu(event, type, id) {
  document.getElementById("record-context-menu")?.remove();
  const recordsByType = { denuncia: data.denuncias, chamado: data.chamados, feedback: data.feedbacks };
  const item = (recordsByType[type] || []).find((record) => String(record.id) === String(id));
  if (!item) return;

  const menu = document.createElement("div");
  menu.id = "record-context-menu";
  menu.className = "board-context-menu record-context-menu";
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;

  if (isArchivedRecord(item)) {

    const collectionsByType = { denuncia: "denuncias", chamado: "chamados", feedback: "feedbacks" };
    const tablesByType = { denuncia: TABLES.denuncias, chamado: TABLES.chamados, feedback: TABLES.feedbacks };
    const deleteLabels = { denuncia: "Excluir denúncia", chamado: "Excluir chamado", feedback: "Excluir feedback" };
    const deleteLabelFrases = { denuncia: "esta denúncia", chamado: "este chamado", feedback: "este feedback" };
    menu.innerHTML = `<button type="button" class="danger" data-record-menu-action="delete">${deleteLabels[type] || "Excluir"}</button>`;
    menu.addEventListener("click", (clickEvent) => {
      const actionButton = clickEvent.target.closest("[data-record-menu-action]");
      if (actionButton?.dataset.recordMenuAction !== "delete") return;
      menu.remove();
      excluirRegistroArquivadoIndividualmente(collectionsByType[type], tablesByType[type], id, deleteLabelFrases[type] || "este registro");
    });
    document.body.appendChild(menu);
    return;
  }

  const labels = { denuncia: "Arquivar denúncia", chamado: "Arquivar chamado", feedback: "Arquivar feedback" };
  menu.innerHTML = `<button type="button" class="danger" data-record-menu-action="archive">${labels[type] || "Arquivar"}</button>`;
  menu.addEventListener("click", async (clickEvent) => {
    const actionButton = clickEvent.target.closest("[data-record-menu-action]");
    const action = actionButton?.dataset.recordMenuAction;
    if (action !== "archive") return;
    actionButton.disabled = true;
    actionButton.textContent = "Arquivando...";
    menu.remove();
    if (type === "denuncia") await arquivarDenunciaPorContexto(id);
    if (type === "chamado") await arquivarChamadoPorContexto(id);
    if (type === "feedback") await arquivarFeedbackPorContexto(id);
  });
  document.body.appendChild(menu);
}

async function excluirUsuario(id) {
  const user = (data.usuarios || []).find((item) => String(item.id) === String(id));
  if (!user) return;

  showPasswordActionModal({
    title: "Deletar conta",
    text: `Confirme a senha de autorizacao para deletar ${user.nome} da equipe.`,
    confirmText: "Deletar",
    danger: true,
    validatePassword: async (password) => verifyAuthorizationPassword(password),
    onConfirm: async () => {
      await deleteTeamUser(id);
    },
  });
};

async function verifyAuthorizationPassword(password) {
  const response = await fetch("/api/malote-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ validateOnly: true, password }),
  });
  if (response.ok) return true;
  const result = await response.json().catch(() => ({}));

  if (result.error === "Senha de autorizacao invalida.") return false;

  return response.status !== 401 && response.status !== 403;
}

document.addEventListener('click', (event) => {
  if (event.target.closest("#dashboard-notifications-tracker")) {
    event.preventDefault();
    openNotificationTrackerSafely();
    return;
  }

  const target = event.target.closest('[data-action]');
  if (!target) return;

  const { action, id } = target.dataset;
  if (HubModules.runAction(action, id, target)) return;

  if (action === 'no-op') {
    event.stopPropagation();
    return;
  }

  if (['reabrir-denuncia', 'reabrir-chamado', 'reabrir-feedback', 'editar-evento', 'excluir-evento'].includes(action)) {
    event.stopPropagation();
  }

  switch (action) {
    case 'ler-denuncia':
      lerDenuncia(id);
      break;
    case 'ler-feedback':
      lerFeedback(id);
      break;
    case 'reabrir-denuncia':
      reabrirDenuncia(id);
      break;
    case 'reabrir-chamado':
      reabrirChamado(id);
      break;
    case 'reabrir-feedback':
      reabrirFeedback(id);
      break;
    case 'open-dashboard-activity': openDashboardActivity(target.dataset.index); break;
    case 'visualizar-evento': visualizarEvento(id); break;
    case 'editar-vaga': editarVaga(id); break;
    case 'excluir-vaga': excluirVaga(id); break;
    case 'editar-evento':
      document.getElementById("custom-modal")?.remove();
      editarEvento(id);
      break;
    case 'excluir-evento': excluirEvento(id); break;
    case 'excluir-documento-contratado': excluirDocumentoContratado(id); break;
    case 'ver-clima-pesquisa': verClimaPesquisa(id); break;
    case 'excluir-clima-pesquisa': excluirClimaPesquisa(id); break;
    case 'excluir-usuario': excluirUsuario(id); break;
    case 'clear-chat-file':
      clearChatSelectedFile();
      break;
    case 'remove-chat-file':
      removeChatSelectedFile(target.dataset.index);
      break;
    case 'preview-chat-file':
      previewChatSelectedFile(target.dataset.index);
      break;
    case 'toggle-chat-preview-video':
      toggleChatAttachmentPreviewVideo();
      break;
    case 'toggle-chat-attach-menu':
      event.preventDefault();
      toggleChatAttachMenu();
      break;
    case 'chat-attach-option':
      event.preventDefault();
      handleChatAttachOption(target.dataset.attachType);
      break;
    case 'toggle-chat-emoji-menu':
      event.preventDefault();
      toggleChatEmojiMenu();
      break;
    case 'insert-chat-emoji':
      event.preventDefault();
      insertChatEmoji(target.dataset.emoji || "");
      break;
    case 'open-chat-poll':
      showChatPollModal();
      break;
    case 'vote-chat-poll':
      votarEnqueteChat(id, target.dataset.option);
      break;
    case 'open-chat-image':
      openChatImageModal(target.dataset.chatImageBucket, target.dataset.chatImagePath, target.dataset.chatImageName || "Imagem");
      break;
    case 'download-chat-image':
      downloadPrivateStorageFile(target.dataset.chatImageBucket, target.dataset.chatImagePath, target.dataset.chatImageName || "imagem");
      break;
    case 'close-modal':
      target.closest('.modal-overlay')?.remove();
      break;
  }
});

class NotificationTracker {
  constructor() {
    this.modal = document.getElementById("tracker-modal");
    this.modalOverlay = document.getElementById("tracker-modal-overlay");
    this.modalClose = document.getElementById("tracker-modal-close");
    this.openBtn = document.getElementById("dashboard-notifications-tracker");
    this.notificationsList = document.getElementById("tracker-notifications-list");
    this.emptyState = document.getElementById("tracker-empty");
    this.modalContent = this.modal?.querySelector(".tracker-modal-content");
    this.modalTitle = document.getElementById("tracker-modal-title");
    this.modalSubtitle = this.modal?.querySelector(".tracker-modal-header .item-meta");
    this.filtersArea = this.modal?.querySelector(".tracker-modal-filters");
    this.statsArea = this.modal?.querySelector(".tracker-modal-stats");
    this.listArea = this.modal?.querySelector(".tracker-modal-list");
    this.footerArea = this.modal?.querySelector(".tracker-modal-footer");
    this.detailArea = null;

    this.filterType = document.getElementById("tracker-filter-type");
    this.searchInput = document.getElementById("tracker-search");
    this.sortSelect = document.getElementById("tracker-sort");

    this.statTotal = document.getElementById("tracker-stat-total");
    this.statUnread = document.getElementById("tracker-stat-unread");
    this.statPending = document.getElementById("tracker-stat-pending");

    this.markAllReadBtn = document.getElementById("tracker-mark-all-read");
    this.clearAllBtn = document.getElementById("tracker-clear-all");

    this.notifications = [];
    this.filteredNotifications = [];

    this.init();
  }

  init() {
    this.openBtn?.addEventListener("click", () => this.openModal());
    this.modalClose?.addEventListener("click", () => this.closeModal());
    this.modalOverlay?.addEventListener("click", () => this.closeModal());
    this.filterType?.addEventListener("change", () => this.applyFilters());
    this.searchInput?.addEventListener("input", () => this.applyFilters());
    this.sortSelect?.addEventListener("change", () => this.applySorting());
    this.markAllReadBtn?.addEventListener("click", () => this.markAllRead());
    this.clearAllBtn?.addEventListener("click", () => this.clearAll());

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !this.modal?.hidden) this.closeModal();
    });

    this.loadNotifications();
  }

  openModal() {
    if (!this.modal) return;
    this.showListView();
    this.loadNotifications();
    this.modal.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    this.searchInput?.focus();
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.setAttribute("hidden", "");
    document.body.style.overflow = "";
  }

  loadNotifications() {
    this.notifications = this.collectNotifications();
    this.applyFilters();
    this.updateStats();
  }

  collectNotifications() {
    const notifications = [];
    const sourceData = typeof data === "object" && data ? data : {};

    const pushNotification = (item = {}) => {
      const type = item.type || "geral";
      const originalStatus = item.status || "pending";
      const time = item.time || item.date || item.createdAt || "Recentemente";
      const rawDateTime = item.sortAt || item.updatedSortAt || item.updatedAt || item.createdSortAt || item.createdAt || item.dateTime || item.date || time;
      const id = String(item.id || `${type}-${notifications.length}-${Date.now()}`);

      const dismissKey = String(item.dismissKey || id);
      if (isNotificationDismissed(dismissKey)) return;

      const targetView = item.view || this.getViewForType(type);
      if (typeof canAccessView === "function" && !canAccessView(targetView)) return;
      const hasBeenRead = readNotificationIds.has(id);
      const unread = Boolean(item.unread || originalStatus === "unread" || originalStatus === "urgent") && !hasBeenRead;
      const status = hasBeenRead && originalStatus === "unread" ? "pending" : originalStatus;

      notifications.push({
        id,
        dismissKey,
        type,
        title: item.title || "Notificação",
        description: item.description || item.text || "",
        details: item.details || item.description || item.text || "",
        time,
        dateTime: this.getTimeValue(rawDateTime),
        unread,
        status,
        view: item.view || this.getViewForType(type),
        icon: item.icon || this.getIconForType(type),
        badgeText: unread ? (item.badgeText || this.getBadgeText(status)) : (status === "urgent" ? this.getBadgeText(status) : ""),
        sequence: notifications.length,
        messageIds: Array.isArray(item.messageIds) ? item.messageIds.map(String) : [],
        chatMessages: Array.isArray(item.chatMessages) ? item.chatMessages : [],
      });
    };

    const dashboardItems = Array.isArray(allDashboardActivityItems) ? allDashboardActivityItems : [];
    if (dashboardActivityItemsReady) {
      dashboardItems.forEach((item = {}) => {
        const type = item.kind === "notificacao" ? "mensagem" : (item.kind || "geral");
        const isUrgent = String(item.tag || "").toLowerCase() === "urgente";
        const isRead = typeof isDashboardActivityReadForOrdering === "function"
          ? isDashboardActivityReadForOrdering(item)
          : false;
        const originalStatus = isRead ? "pending" : (isUrgent ? "urgent" : "unread");
        pushNotification({
          id: item.notificationId || `${type}-${item.id || item._sortIndex || notifications.length}`,
          dismissKey: item.dismissKey || item.notificationId,
          type,
          title: item.title || "Notificacao",
          description: item.text || "",
          details: item.details || item.text || "",
          time: item.date || item.createdAt || "Recentemente",
          dateTime: item.dateTime || item.sortAt || item.updatedSortAt || item.date || item.createdAt || "Recentemente",
          status: originalStatus,
          unread: !isRead,
          view: item.view || this.getViewForType(type),
          badgeText: isRead ? "" : (isUrgent ? "Urgente" : "Nao lido"),
          messageIds: Array.isArray(item.messageIds) ? item.messageIds.map(String) : [],
          chatMessages: Array.isArray(item.chatMessages) ? item.chatMessages : [],
        });
      });
      return notifications.sort((a, b) => (b.dateTime - a.dateTime) || (a.sequence - b.sequence));
    }

    const accessibleMessages = typeof getAccessibleRhMessages === "function" ? getAccessibleRhMessages() : [];
    const sortedMessagesNewestFirst = [...accessibleMessages]
      .sort((a, b) => this.getTimeValue(b.sortAt || b.createdAt) - this.getTimeValue(a.sortAt || a.createdAt));
    const sortedMessagesOldestFirst = [...accessibleMessages]
      .sort((a, b) => this.getTimeValue(a.sortAt || a.createdAt) - this.getTimeValue(b.sortAt || b.createdAt));

    if (sortedMessagesNewestFirst.length) {
      const messageIds = sortedMessagesNewestFirst.map((message) => message.id).filter(Boolean).map(String);
      const unreadMessageIds = messageIds.filter((id) => !readRhMessageIds.has(String(id)));
      const latestMessage = sortedMessagesNewestFirst[0] || {};
      const hasUnread = unreadMessageIds.length > 0;

      pushNotification({
        id: "mensagens-rh",
        dismissKey: `mensagens-rh:${latestMessage.id || messageIds[0] || "vazio"}`,
        type: "mensagem",
        title: "Mensagens do RH",
        description: hasUnread
          ? `${unreadMessageIds.length} nova(s) de ${messageIds.length} mensagem(ns)`
          : `${messageIds.length} mensagem(ns) no acompanhamento`,
        details: sortedMessagesOldestFirst
          .slice(-20)
          .map((message) => `${message.createdAt || "Sem data"} - ${message.autor || "Equipe"}: ${message.mensagem || "Nova mensagem."}`)
          .join("\n\n"),
        time: latestMessage.createdAt || "Agora",
        dateTime: latestMessage.sortAt || latestMessage.createdAt || "Agora",
        status: hasUnread ? "unread" : "pending",
        unread: hasUnread,
        view: "comunicacao",
        messageIds,
        chatMessages: sortedMessagesOldestFirst,
        badgeText: hasUnread ? "Não lido" : "Lida",
      });
    }

    (sourceData.denuncias || [])
      .filter((item) => item.status === "Aberta" || item.status === "Urgente")
      .forEach((item) => pushNotification({
        id: `denuncia-${item.id}`,
        type: "denuncia",
        title: "Denúncia anônima",
        description: item.descricao || "Nova denúncia recebida.",
        details: `${typeof getDashboardSystemUpdateMeta === "function" && getDashboardSystemUpdateMeta(item) ? `${getDashboardSystemUpdateMeta(item)}\n` : ""}Status: ${item.status || "Aberta"}\nRecebida em: ${item.createdAt || "Não informado"}\n\n${item.descricao || "Sem descrição."}`,
        time: item.createdAt || "Recentemente",
        dateTime: item.sortAt || item.updatedSortAt || item.createdAt || "Recentemente",
        status: item.status === "Urgente" ? "urgent" : "pending",
        unread: true,
        view: "denuncias",
      }));

    (sourceData.chamados || [])
      .filter((item) => item.status === "Aberto")
      .forEach((item) => {
        const items = typeof parseEpiItems === "function" ? parseEpiItems(item.epis) : [];
        const itemDetails = items.length
          ? items.map((epi) => `${epi.nome}${epi.tamanho ? ` - Tam. ${epi.tamanho}` : ""} - Qtd. ${epi.quantidade}`).join("\n")
          : item.epis || "Não informados";
        pushNotification({
          id: `chamado-${item.id}`,
          type: "chamado",
          title: `Chamado - ${item.unidade || "Unidade não informada"}`,
          description: item.epis || "Itens não informados.",
          details: `${typeof getDashboardSystemUpdateMeta === "function" && getDashboardSystemUpdateMeta(item) ? `${getDashboardSystemUpdateMeta(item)}\n` : ""}Solicitante: ${item.solicitante || "Não informado"}\nUnidade: ${item.unidade || "Não informada"}\nSetor: ${item.setor || "Não informado"}\nItens solicitados:\n${itemDetails}\nObservações: ${item.observacoes || "Nenhuma"}\nData: ${item.createdAt || "Não informada"}`,
          time: item.createdAt || "Recentemente",
          dateTime: item.sortAt || item.updatedSortAt || item.createdAt || "Recentemente",
          status: "pending",
          unread: true,
          view: "chamados",
        });
      });

    (sourceData.candidaturas || [])
      .forEach((item) => {
        const vaga = (sourceData.vagas || []).find((vagaItem) => String(vagaItem.id) === String(item.vaga_id));
        pushNotification({
          id: `candidatura-${item.id}`,
          type: "vaga",
          title: `Curriculo - ${vaga?.cargo || "Vaga"}`,
          description: item.nome || "Novo curriculo recebido.",
          details: `Candidato: ${item.nome || "Nao informado"}\nCPF: ${typeof formatCpf === "function" ? formatCpf(item.cpf || "") : item.cpf || "Nao informado"}\nTelefone: ${typeof formatPhone === "function" ? formatPhone(item.telefone || "") || item.telefone : item.telefone || "Nao informado"}\nVaga: ${vaga?.cargo || item.vaga_id || "Nao informada"}\nUnidade: ${vaga?.unidade || "Nao informada"}\nRecebido em: ${item.createdAt || "Nao informado"}`,
          time: item.createdAt || "Recentemente",
          dateTime: item.sortAt || item.createdAt || "Recentemente",
          status: "pending",
          unread: true,
          view: "vagas",
        });
      });
    return notifications.sort((a, b) => (b.dateTime - a.dateTime) || (a.sequence - b.sequence));
  }

  getTimeValue(value) {
    if (value instanceof Date) return value.getTime();
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (!value) return 0;

    const text = String(value).trim();
    if (!text) return 0;

    if (/^\d{10,13}$/.test(text)) {
      const numericTime = Number(text);
      return text.length === 10 ? numericTime * 1000 : numericTime;
    }

    const normalized = text.toLowerCase();
    if (normalized === "hoje") return new Date().setHours(0, 0, 0, 0);
    if (normalized === "agora" || normalized === "recentemente") return Date.now();

    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();

    const brDateTime = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s*(\d{1,2}):(\d{2}))?/);
    if (brDateTime) {
      const [, day, month, year, hour = "0", minute = "0"] = brDateTime;
      return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
    }

    const isoDateTime = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
    if (isoDateTime) {
      const [, year, month, day, hour = "0", minute = "0"] = isoDateTime;
      return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
    }

    return 0;
  }

  getViewForType(type) {
    const views = {
      denuncia: "denuncias",
      mensagem: "comunicacao",
      malote: "malotes",
      chamado: "chamados",
      vaga: "vagas",
      evento: "calendario",
      documento: "documentos",
      contratado: "documentos-contratados",
      atestado: "atestados",
      quadro: "quadros",
      disciplinar: "advertencias-suspensoes",
    };
    return views[type] || "dashboard";
  }

  getIconForType(type) {
    const icons = {
      denuncia: "&#128226;",
      mensagem: "&#128172;",
      malote: "&#128230;",
      chamado: "&#128295;",
      vaga: "&#128188;",
      evento: "&#128197;",
      documento: "&#128196;",
      contratado: "&#128193;",
      atestado: "&#128203;",
      quadro: "&#9638;",
      disciplinar: "&#9888;",
      geral: "&#128276;",
    };
    return icons[type] || icons.geral;
  }

  getBadgeText(status) {
    const badges = {
      unread: "Não lido",
      pending: "Pendente",
      resolved: "Resolvido",
      urgent: "Urgente",
    };
    return badges[status] || "";
  }

  applyFilters() {
    const filterValue = this.filterType?.value || "";
    const searchValue = (this.searchInput?.value || "").trim().toLowerCase();

    this.filteredNotifications = this.notifications.filter((notif) => {
      const typeMatch = !filterValue || notif.type === filterValue;
      const searchText = [notif.title, notif.description, notif.details, notif.time, this.humanizeType(notif.type)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const searchMatch = !searchValue || searchText.includes(searchValue);
      return typeMatch && searchMatch;
    });

    this.applySorting();
    this.updateStats();
  }

  applySorting() {
    const sortValue = this.sortSelect?.value || "recente";
    const priorityOrder = { urgent: 0, unread: 1, pending: 2, resolved: 3 };

    this.filteredNotifications.sort((a, b) => {
      if (sortValue === "antigo") return a.dateTime - b.dateTime;
      if (sortValue === "tipo") return this.humanizeType(a.type).localeCompare(this.humanizeType(b.type), "pt-BR");
      if (sortValue === "prioridade") {
        const priorityDiff = (priorityOrder[a.status] ?? 999) - (priorityOrder[b.status] ?? 999);
        return priorityDiff || b.dateTime - a.dateTime;
      }
      return b.dateTime - a.dateTime;
    });

    this.renderNotifications();
  }

  sortNotifications(order) {
    if (this.sortSelect) this.sortSelect.value = order;
    this.applySorting();
  }

  renderNotifications() {
    if (!this.notificationsList) return;

    this.notificationsList.innerHTML = "";

    if (!this.filteredNotifications.length) {
      this.emptyState?.removeAttribute("hidden");
      return;
    }

    this.emptyState?.setAttribute("hidden", "");

    this.filteredNotifications.forEach((notif) => {
      const li = document.createElement("li");
      li.className = `tracker-notification-item ${notif.type}`;
      if (notif.unread) li.classList.add("unread");
      li.tabIndex = 0;
      li.setAttribute("role", "button");
      li.setAttribute("aria-label", `Abrir ${this.humanizeType(notif.type)}: ${notif.title}`);

      const badgeClass = notif.status === "urgent" ? "pending" : notif.status;
      const badgeHTML = notif.badgeText ? `<span class="tracker-badge ${badgeClass}">${this.escapeHtml(notif.badgeText)}</span>` : "";

      li.innerHTML = `
        <div class="tracker-notification-icon">${notif.icon}</div>
        <div class="tracker-notification-content">
          <div class="tracker-notification-type">${this.humanizeType(notif.type)}</div>
          <h3 class="tracker-notification-title">${this.escapeHtml(notif.title)}</h3>
          ${notif.description ? `<p class="tracker-notification-description">${this.escapeHtml(notif.description)}</p>` : ""}
          <div class="tracker-notification-time">${this.escapeHtml(notif.time)}</div>
        </div>
        <div class="tracker-notification-badge">${badgeHTML}</div>
      `;

      const openNotification = () => this.openNotification(notif);
      li.addEventListener("click", openNotification);
      li.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openNotification();
        }
      });

      this.notificationsList.appendChild(li);
    });
  }

  openNotification(notif) {
    const readNotif = this.markNotificationRead(notif);
    this.showDetailView(readNotif || notif);
  }

  markNotificationRead(notif = {}) {
    if (!notif?.id) return notif;

    markNotificationsRead([notif.id], notif.messageIds || []);

    const updateReadState = (item) => {
      if (String(item.id) !== String(notif.id)) return item;
      return {
        ...item,
        unread: false,
        status: item.status === "unread" ? "pending" : item.status,
        badgeText: item.status === "urgent" ? this.getBadgeText("urgent") : "",
      };
    };

    this.notifications = this.notifications.map(updateReadState);
    this.filteredNotifications = this.filteredNotifications.map(updateReadState);
    this.updateStats();
    this.renderNotifications();

    return this.notifications.find((item) => String(item.id) === String(notif.id)) || { ...notif, unread: false };
  }

  showDetailView(notif = {}) {
    if (!this.modalContent) return;

    this.filtersArea?.setAttribute("hidden", "");
    this.statsArea?.setAttribute("hidden", "");
    this.listArea?.setAttribute("hidden", "");
    this.footerArea?.setAttribute("hidden", "");
    this.emptyState?.setAttribute("hidden", "");

    if (this.modalTitle) this.modalTitle.textContent = notif.title || "Notificação";
    if (this.modalSubtitle) {
      this.modalSubtitle.textContent = [this.humanizeType(notif.type), notif.time].filter(Boolean).join(" - ") || "Detalhe da notificação";
    }

    this.detailArea?.remove();
    const detail = document.createElement("div");
    detail.className = `tracker-notification-detail ${notif.type || "geral"}`;
    detail.innerHTML = `
      <div class="tracker-detail-card">
        <div class="tracker-detail-topline">
          <div class="tracker-detail-icon">${notif.icon || this.getIconForType(notif.type)}</div>
          <div>
            <span class="tracker-notification-type">${this.escapeHtml(this.humanizeType(notif.type))}</span>
            <h3>${this.escapeHtml(notif.title || "Notificação")}</h3>
            ${notif.description ? `<p>${this.escapeHtml(notif.description)}</p>` : ""}
          </div>
        </div>
        <div class="tracker-detail-meta">
          ${notif.badgeText ? `<span class="tracker-badge ${notif.status === "urgent" ? "pending" : notif.status}">${this.escapeHtml(notif.badgeText)}</span>` : ""}
          ${notif.time ? `<span>${this.escapeHtml(notif.time)}</span>` : ""}
        </div>
        <div class="tracker-detail-body">${notif.type === "mensagem" && Array.isArray(notif.chatMessages) && notif.chatMessages.length ? renderNotificationChatThread(notif.chatMessages) : this.formatDetailText(notif.details || notif.description || "Sem detalhes adicionais.")}</div>
      </div>
      <div class="tracker-detail-actions">
        <button class="primary-button" type="button" data-tracker-back>Entendi</button>
      </div>
    `;

    this.footerArea?.after(detail);
    this.detailArea = detail;
    detail.querySelector("[data-tracker-back]")?.addEventListener("click", () => this.showListView());
    detail.querySelector("[data-tracker-back]")?.focus();
  }

  showListView() {
    this.detailArea?.remove();
    this.detailArea = null;
    this.filtersArea?.removeAttribute("hidden");
    this.statsArea?.removeAttribute("hidden");
    this.listArea?.removeAttribute("hidden");
    this.footerArea?.removeAttribute("hidden");

    if (this.modalTitle) this.modalTitle.textContent = "Acompanhamento Completo";
    if (this.modalSubtitle) this.modalSubtitle.textContent = "Todas as notificações e pendências";
    this.renderNotifications();
  }

  formatDetailText(text) {
    return String(text ?? "")
      .split("\n")
      .map((line) => line.trim())
      .map((line) => line ? `<p>${this.escapeHtml(line)}</p>` : `<br />`)
      .join("");
  }

  humanizeType(type) {
    const types = {
      denuncia: "Denúncia",
      mensagem: "Mensagem RH",
      malote: "Malote",
      chamado: "Chamado",
      vaga: "Vaga",
      evento: "Evento",
      documento: "Documento",
      contratado: "Documento de Contratado",
      atestado: "Atestado",
      geral: "Geral",
    };
    return types[type] || type;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text ?? "");
    return div.innerHTML;
  }

  updateStats() {
    const total = this.notifications.length;
    const unread = this.notifications.filter((notif) => notif.unread).length;
    const pending = this.notifications.filter((notif) => notif.status === "pending" || notif.status === "urgent").length;

    if (this.statTotal) this.statTotal.textContent = total;
    if (this.statUnread) this.statUnread.textContent = unread;
    if (this.statPending) this.statPending.textContent = pending;
  }

  markAllRead() {
    this.notifications.forEach((notif) => {
      markNotificationsRead([notif.id], notif.messageIds || []);
    });
    this.notifications = this.notifications.map((notif) => ({
      ...notif,
      unread: false,
      status: notif.status === "unread" ? "pending" : notif.status,
      badgeText: notif.status === "urgent" ? this.getBadgeText("urgent") : "",
    }));
    this.applyFilters();
    this.updateStats();
    this.showNotification("Todas as notificações foram marcadas como lidas.");
  }

  clearAll() {
    showConfirmActionModal({
      title: "Apagar notificações",
      text: "Apagar estas notificações da sua conta? Elas somem em todos os aparelhos onde você usa o HUB.",
      confirmText: "Apagar",
      danger: true,
      onConfirm: async () => {
        const dismissKeys = this.notifications.map((notif) => notif.dismissKey || notif.id).filter(Boolean);
        dismissNotifications(dismissKeys);
        this.notifications = [];
        this.filteredNotifications = [];
        this.renderNotifications();
        this.updateStats();
        this.showNotification("Notificações apagadas da sua conta em todos os aparelhos.");
      },
    });
  }

  showNotification(message) {
    if (typeof showModal === "function") {
      showModal("Acompanhamento", message, "info");
      return;
    }
    console.log(message);
  }
}

function maybeOpenNotificationTrackerFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const notificationId = params.get("markNotification");
    const messageIds = (params.get("markMessages") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (notificationId || messageIds.length) {
      markNotificationsRead(notificationId ? [notificationId] : [], messageIds);
    }

    if (params.get("open") !== "acompanhamento") return;
    window.setTimeout(() => openNotificationTrackerFromPopout(), 350);
  } catch (_) {}
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    window.notificationTracker = new NotificationTracker();
  } catch (error) {
    console.warn("Nao foi possivel iniciar o acompanhamento no carregamento:", error);
  }
  maybeOpenNotificationTrackerFromUrl();
});

function setupFormScrollGrid({ listId, formId, expandedWorkspaceClass, expandedListClass, offsetAfterForm = 96, expandOnce = false }) {
  const form = document.getElementById(formId);
  const list = document.getElementById(listId);
  const workspace = form?.closest(".workspace");
  if (!form || !list || !workspace) return;

  const expandMargin = Math.max(0, Number(offsetAfterForm) || 0);
  const collapseMargin = expandMargin + 180;
  let expanded = false;

  function applyState(nextExpanded) {
    if (nextExpanded === expanded) return;
    expanded = nextExpanded;
    list.classList.toggle(expandedListClass, expanded);
    workspace.classList.toggle(expandedWorkspaceClass, expanded);
  }

  function updateState() {
    if (expandOnce && expanded) return;
    const formBottom = form.getBoundingClientRect().bottom;
    if (!expanded && formBottom < expandMargin) {
      applyState(true);
    } else if (!expandOnce && expanded && formBottom > collapseMargin) {
      applyState(false);
    }
  }

  function resetInitialState() {
    expanded = false;
    list.classList.remove(expandedListClass);
    workspace.classList.remove(expandedWorkspaceClass);
  }

  resetInitialState();
  window.addEventListener("scroll", updateState, { passive: true });
  window.addEventListener("resize", resetInitialState);
}

function setupEquipeFormScrollGrid() {
  setupFormScrollGrid({
    listId: "usuarios-list",
    formId: "usuario-form",
    expandedWorkspaceClass: "equipe-workspace-expanded",
    expandedListClass: "equipe-two-col",
    offsetAfterForm: 140,
    expandOnce: true,
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupEquipeFormScrollGrid();
});

window.addEventListener("storage", (event) => {
  if (!event.key || ![READ_NOTIFICATIONS_KEY, READ_RH_MESSAGES_KEY, SHOWN_NOTIFICATIONS_KEY].some((key) => event.key === key || event.key.startsWith(`${key}:`))) return;
  reloadReadStateForCurrentUser();
  try { renderDashboard?.(); } catch (_) {}
  try { renderChatChannels?.(); } catch (_) {}
  try { window.notificationTracker?.loadNotifications?.(); } catch (_) {}
});

document.addEventListener('DOMContentLoaded', () => {
  const prevBtn = document.getElementById('dashboard-notifications-prev');
  const nextBtn = document.getElementById('dashboard-notifications-next');

  if (prevBtn) prevBtn.style.display = 'none';
  if (nextBtn) nextBtn.style.display = 'none';
});
