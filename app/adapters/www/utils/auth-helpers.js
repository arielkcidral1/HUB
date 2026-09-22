function isLoginMatch(value, expected) {
  return String(value || "").trim() === String(expected || "").trim();
}

function normalizeLoginName(value) {
  return String(value || "").trim().toLowerCase();
}

function getLoginDisplayName(value) {
  const normalized = normalizeLoginName(value);
  return findLocalTeamUser(value)?.nome || String(value || "").trim();
}

function stripAccents(value) {
  return normalizeLoginName(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getCurrentUserNameCandidates() {
  const user = getCurrentUserRecord?.() || {};
  return [
    getCurrentUserName?.(),
    user.nome,
    user.email,
    user.email ? String(user.email).split("@")[0] : "",
    currentAuthUser?.email,
    currentAuthUser?.email ? String(currentAuthUser.email).split("@")[0] : "",
    currentAuthUser?.user_metadata?.nome,
    currentAuthUser?.user_metadata?.name,
  ];
}

function currentUserMatchesName(...targets) {
  const normalizedTargets = targets.map(stripAccents);
  return getCurrentUserNameCandidates().some((candidate) => {
    const normalized = stripAccents(candidate);
    return normalizedTargets.some((target) => normalized === target || normalized.startsWith(target));
  });
}

function isFredericoUser() {
  return currentUserMatchesName("frederico");
}

function hasFredericoLevelAccess() {
  return isFredericoUser()
    || currentUserMatchesName("jucimara")
    || currentUserMatchesName("alex", "alexsandro")
    || currentUserMatchesName("alcione", "jose alcione")
    || currentUserMatchesName("andre barbosa")
    || currentUserMatchesName("maria luisa", "maria luiza");
}

// Cargo cadastrado (Gerente/Recepcionista) so restringe quem NAO esta na
// lista de acesso nivel Frederico; quem esta la mantem o titulo/cargo real
// mas nao fica limitado pelas restricoes de Gerente/Recepcionista.
function isRestrictedManagerUser() {
  return isManagerUser() && !hasFredericoLevelAccess();
}

function loadTeamUsersStore() {
  return storageService.getSessionItem(TEAM_USERS_KEY, []);
}

function saveTeamUsersStore(users) {
  storageService.setSessionItem(TEAM_USERS_KEY, users || []);
}

function loadTeamCredentialsStore() {
  return [];
}

function saveTeamCredentialsStore(users) {
  storageService.removeLocalItem(TEAM_CREDENTIALS_KEY);
  storageService.removeSessionItem(TEAM_CREDENTIALS_KEY);
}

function clearLegacyTeamCredentials() {
  storageService.removeLocalItem(TEAM_CREDENTIALS_KEY);
}

function sanitizeUserRecord(user = {}) {
  const { senha, ...safeUser } = user;
  const unidade = safeUser.unidade || safeUser.cargoUnidade || getDefaultUserUnit(safeUser.nome);
  return { ...safeUser, unidade };
}

function getDefaultUserUnit(nome = "") {
  return normalizeLoginName(nome).includes("eleandro") ? "GCS JLLE" : "Matriz";
}

function syncTeamCredentials(users) {
  saveTeamCredentialsStore([]);
}

function readStoredUsersFromHubData() {
  const parsed = storageService.getSessionItem(STORAGE_KEY, {});
  return parsed.usuarios || [];
}

function getStoredLoginUsers() {
  return mergeUsersByName(
    loadTeamCredentialsStore(),
    mergeUsersByName(loadTeamUsersStore(), readStoredUsersFromHubData())
  );
}

function persistTeamCredential(nome, senha) {
  saveTeamCredentialsStore([]);
}

function getAllLocalUsers() {
  return mergeUsersByName(getStoredLoginUsers(), data?.usuarios || []);
}

function findLocalTeamUser(value) {
  const normalized = normalizeLoginName(value);
  return getAllLocalUsers().find((user) =>
    normalizeLoginName(user.nome) === normalized ||
    normalizeLoginName(user.email) === normalized
  );
}

function getCurrentUserRecord() {
  return currentUserProfile ||
    findLocalTeamUser(currentAuthUser?.email || storageService.getLocalItem(`${SESSION_KEY}-email`) || storageService.getSessionItem(`${SESSION_KEY}-email`)) ||
    findLocalTeamUser(getCurrentUserName());
}

function formatRoleLabel(role) {
  const normalized = normalizeLoginName(role).replace(/\s+/g, "");
  if (normalized === "caixa/crediarista" || normalized === "caixa/credista") return "Caixa";
  return role;
}

function getUserRoleLabel(value) {
  const normalized = normalizeLoginName(value);
  const role = (data.usuarios || []).find((user) => normalizeLoginName(user.nome) === normalized)?.cargo || findLocalTeamUser(value)?.cargo || "";
  return role ? ` (${formatRoleLabel(role)})` : "";
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
  if (channelId === GENERAL_CHANNEL) return !isRestrictedManagerUser() && !isCashierUser();
  if (channelId === MANAGER_GENERAL_CHANNEL) return !isCashierUser();
  return isValidDirectChannel(channelId) && getDirectChannelUsers(channelId).includes(normalizeLoginName(getCurrentUserName()));
}

function isGeneralChatChannel(channelId) {
  return [GENERAL_CHANNEL, MANAGER_GENERAL_CHANNEL].includes(channelId);
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
      targetUser: user.nome,
      avatarPath: user.foto_perfil || ""
    }));

  let channels = isCashierUser()
    ? [...directChannels]
    : isRestrictedManagerUser()
    ? [
        { id: MANAGER_GENERAL_CHANNEL, label: "RH + Gerentes", subtitle: "Comunicação geral entre gerentes e equipe de RH", isGroup: true },
        ...directChannels,
      ]
    : [
        { id: GENERAL_CHANNEL, label: "Chat geral RH", subtitle: "Mensagens compartilhadas apenas pela equipe de RH", isGroup: true },
        { id: MANAGER_GENERAL_CHANNEL, label: "RH + Gerentes", subtitle: "Comunicação geral entre gerentes e equipe de RH", isGroup: true },
        ...directChannels,
      ];

  channels.sort((a, b) => {

    if (a.isGroup !== b.isGroup) return a.isGroup ? -1 : 1;
    const msgA = data.comunicados.find(m => normalizeChatChannel(m.canal) === a.id);
    const msgB = data.comunicados.find(m => normalizeChatChannel(m.canal) === b.id);
    if (!msgA && !msgB) return 0;
    if (msgA && !msgB) return -1;
    if (!msgA && msgB) return 1;
    return data.comunicados.indexOf(msgA) - data.comunicados.indexOf(msgB);
  });

  return channels;
}

function getActiveChatChannel() {
  const channels = getChatChannels();
  return channels.find((channel) => channel.id === activeChatChannel) || null;
}

function getAllowedChatChannelIds() {
  return getChatChannels().map((channel) => channel.id);
}

function normalizeChatChannel(canal) {
  if (!canal || canal === GENERAL_CHANNEL) return GENERAL_CHANNEL;
  if (canal === MANAGER_GENERAL_CHANNEL) return MANAGER_GENERAL_CHANNEL;
  if (isDirectChannel(canal)) return canal;
  if (canal === RH_CHANNEL) return getDirectChannel(getCurrentUserName(), "Ariel");
  if (String(canal).startsWith("usuario:")) {
    return getDirectChannel(getCurrentUserName(), String(canal).slice("usuario:".length));
  }
  return canal;
}

function canAccessChatChannel(canal) {
  const channel = normalizeChatChannel(canal);
  return (
    (channel === GENERAL_CHANNEL && !isRestrictedManagerUser() && !isCashierUser()) ||
    (channel === MANAGER_GENERAL_CHANNEL && !isCashierUser()) ||
    (isValidDirectChannel(channel) && isCurrentUserInChannel(channel))
  );
}

function isAllowedLoginName(value) {
  return Boolean(findLocalTeamUser(value));
}

function debugLocalLoginNames() {
  return getAllLocalUsers().map((user) => normalizeLoginName(user.nome)).join(", ");
}

function hasPersistedAuthIdentity() {
  const persistedAuthUser = storageService.getLocalItem(PERSISTED_AUTH_USER_KEY);
  const persistedName = storageService.getLocalItem(`${SESSION_KEY}-user`) || storageService.getSessionItem(`${SESSION_KEY}-user`);
  const persistedEmail = storageService.getLocalItem(`${SESSION_KEY}-email`) || storageService.getSessionItem(`${SESSION_KEY}-email`);
  return hasRealAuthIdentity(currentAuthUser) ||
    hasRealAuthIdentity(currentUserProfile) ||
    hasRealAuthIdentity(persistedAuthUser) ||
    hasRealAuthIdentity({ email: persistedEmail, user_metadata: { nome: persistedName } });
}

function isAuthenticated() {
  const sessionIsActive = storageService.getSessionItem(SESSION_KEY) === "active" || storageService.getLocalItem(SESSION_KEY) === "active";
  return sessionIsActive && hasPersistedAuthIdentity();
}

function getCurrentUserName() {
  if (!isAuthenticated() && isPublicPage()) return "Publico";
  const profileName = currentUserProfile?.nome || "";
  const authName = currentAuthUser?.user_metadata?.nome || currentAuthUser?.user_metadata?.name || "";
  const storedName = storageService.getLocalItem(`${SESSION_KEY}-user`) || storageService.getSessionItem(`${SESSION_KEY}-user`) || "";
  return [profileName, authName, storedName].find((name) => name && !isGenericAuthName(name)) || "Voce";
}

const AuthHelper = {
  _getClaim(claim) {
    return currentAuthUser?.app_metadata?.[claim] || "";
  },
  getRole() {
    return this._getClaim("cargo") || currentUserProfile?.cargo || "";
  },
  isManager() {
    return normalizeLoginName(this.getRole()) === "gerente";
  },
  isRh() {
    return normalizeLoginName(this.getRole()) === "rh";
  },
  isCashier() {
    const role = normalizeLoginName(this.getRole()).replace(/\s+/g, "");
    return role === "caixa/crediarista" || role === "caixa/credista";
  },
};

function getSystemFallbackAuthor() {
  return isAuthenticated() ? getCurrentUserName() : "Sistema";
}

function getCurrentUserRole() {
  return AuthHelper.getRole();
}

function getCurrentUserNormalizedRole() {
  const user = getCurrentUserRecord?.() || {};

  return normalizeLoginName(user.cargo || AuthHelper.getRole() || currentUserProfile?.cargo || "");
}

function isManagerUser() {
  return getCurrentUserNormalizedRole() === "gerente";
}

function isRhUser() {
  return getCurrentUserNormalizedRole() === "rh";
}

function isCeoUser() {
  return getCurrentUserNormalizedRole() === "ceo";
}

function isReceptionistUser() {
  return getCurrentUserNormalizedRole() === "recepcionista";
}

function isCashierUser() {
  return AuthHelper.isCashier();
}

const MANAGER_ALLOWED_VIEWS = Object.freeze([
  "dashboard",
  "comunicacao",
  "quadros",
  "calendario",
  "documentos",
  "conta",
]);

const RECEPTIONIST_ALLOWED_VIEWS = Object.freeze([
  "dashboard",
  "comunicacao",
  "quadros",
  "calendario",
  "conta",
]);

const ALL_ALLOWED_VIEWS = Object.freeze([
  "dashboard", "denuncias", "comunicacao", "malotes", "chamados", "quadros",
  "vagas", "calendario", "documentos", "advertencias-suspensoes",
  "documentos-contratados", "gerenciamento-vt", "equipe", "conta",
]);

function getAllowedViewsForCurrentUser() {
  if (isRestrictedManagerUser()) return new Set(MANAGER_ALLOWED_VIEWS);
  if (isReceptionistUser() && !hasFredericoLevelAccess()) return new Set(RECEPTIONIST_ALLOWED_VIEWS);
  const allowed = new Set(ALL_ALLOWED_VIEWS);
  if (hasFredericoLevelAccess()) allowed.add("feedbacks");

  const canSeeDenuncias = hasFredericoLevelAccess()
    || currentUserMatchesName("vanessa");
  if (!canSeeDenuncias) allowed.delete("denuncias");

  if (currentUserMatchesName("ariel") || currentUserMatchesName("andre barbosa") || currentUserMatchesName("maria luisa", "maria luiza")) allowed.add("teste-clima");
  return allowed;
}

function canAccessView(view) {
  return getAllowedViewsForCurrentUser().has(String(view || ""));
}

function refreshCurrentUserRoleFromData() {
  if (!isAuthenticated() || !currentUserProfile) return;
  const user = findLocalTeamUser(currentAuthUser?.email || getCurrentUserName());
  if (user?.cargo) currentUserProfile = { ...currentUserProfile, cargo: user.cargo };
}

function getAuthUserDisplayName(authUser) {
  const candidate = authUser?.user_metadata?.nome || authUser?.user_metadata?.name || "";
  return !isGenericAuthName(candidate)
    ? candidate
    : authUser?.email?.split("@")[0] || "Usuario";
}

function isGenericAuthName(value) {
  const normalized = normalizeLoginName(value);
  return !normalized || normalized === "usuario" || normalized === "voce" || normalized === "você" || normalized === "persisted-user";
}

function hasRealAuthIdentity(authUser = {}) {
  const email = String(authUser?.email || "").trim();
  const name = authUser?.nome || authUser?.user_metadata?.nome || authUser?.user_metadata?.name || "";
  return Boolean(email || !isGenericAuthName(name));
}

function getPersistedAuthFields() {
  const postgresSession = storageService.getLocalItem(POSTGRES_SESSION_KEY, {});
  const postgresUser = postgresSession?.user || window.__hubAuthenticatedSession?.user || {};
  return {
    nome: storageService.getLocalItem(`${SESSION_KEY}-user`) || storageService.getSessionItem(`${SESSION_KEY}-user`) || postgresUser?.user_metadata?.nome || postgresUser?.user_metadata?.name || "",
    email: storageService.getLocalItem(`${SESSION_KEY}-email`) || storageService.getSessionItem(`${SESSION_KEY}-email`) || postgresUser?.email || "",
    cargo: storageService.getLocalItem(`${SESSION_KEY}-role`) || storageService.getSessionItem(`${SESSION_KEY}-role`) || postgresUser?.app_metadata?.cargo || postgresUser?.user_metadata?.cargo || "",
  };
}

function hydratePersistedAuthUser(authUser = {}) {
  const persisted = getPersistedAuthFields();
  const nome = authUser?.user_metadata?.nome || authUser?.user_metadata?.name || persisted.nome || "";
  const email = authUser?.email || persisted.email || "";
  const cargo = authUser?.app_metadata?.cargo || authUser?.user_metadata?.cargo || authUser?.cargo || persisted.cargo || "";
  return {
    ...authUser,
    id: authUser?.id || email || normalizeLoginName(nome) || "persisted-user",
    email,
    user_metadata: {
      ...(authUser?.user_metadata || {}),
      nome,
      cargo,
    },
    app_metadata: {
      ...(authUser?.app_metadata || {}),
      cargo,
    },
  };
}

function buildPersistedAuthSession() {
  const postgresSession = storageService.getLocalItem(POSTGRES_SESSION_KEY, null);
  const entrySession = window.__hubAuthenticatedSession || null;
  const hasHubSession = storageService.getLocalItem(SESSION_KEY) === "active" || storageService.getSessionItem(SESSION_KEY) === "active";
  if (!hasHubSession && !postgresSession?.user && !entrySession?.user) return null;
  const persistedAuthUser = storageService.getLocalItem(PERSISTED_AUTH_USER_KEY);
  const { nome, email, cargo } = getPersistedAuthFields();
  const hydratedPersistedUser = hydratePersistedAuthUser(persistedAuthUser || postgresSession?.user || entrySession?.user || {});
  if (hasRealAuthIdentity(hydratedPersistedUser)) {
    return { user: hydratedPersistedUser };
  }
  if (!email && isGenericAuthName(nome)) return null;

  return {
    user: hydratePersistedAuthUser({
      id: email || normalizeLoginName(nome) || "persisted-user",
      email,
      user_metadata: { nome, cargo },
      app_metadata: { cargo },
    }),
  };
}

function setAuthenticatedUser(authUser, profile = null) {
  const persisted = getPersistedAuthFields();
  const hydratedAuthUser = hydratePersistedAuthUser(authUser || {});
  currentAuthUser = hydratedAuthUser || null;
  currentUserProfile = profile || null;
  const authDisplayName = getAuthUserDisplayName(hydratedAuthUser);
  const profileName = profile?.nome || "";
  const displayName = (!isGenericAuthName(profileName) ? profileName : "") ||
    (normalizeLoginName(authDisplayName) === "usuario" ? persisted.nome : authDisplayName) ||
    persisted.nome;
  if (!profile && !hydratedAuthUser?.email && isGenericAuthName(displayName)) return false;
  const persistedAuthUser = {
    ...hydratedAuthUser,
    email: profile?.email || hydratedAuthUser?.email || persisted.email || "",
    user_metadata: {
      ...(hydratedAuthUser?.user_metadata || {}),
      nome: displayName,
      cargo: profile?.cargo || hydratedAuthUser?.cargo || hydratedAuthUser?.app_metadata?.cargo || hydratedAuthUser?.user_metadata?.cargo || persisted.cargo || "",
    },
    app_metadata: {
      ...(hydratedAuthUser?.app_metadata || {}),
      cargo: profile?.cargo || hydratedAuthUser?.cargo || hydratedAuthUser?.app_metadata?.cargo || hydratedAuthUser?.user_metadata?.cargo || persisted.cargo || "",
    },
  };
  storageService.setSessionItem(SESSION_KEY, "active");
  storageService.setLocalItem(SESSION_KEY, "active");
  storageService.setLocalItem(PERSISTED_AUTH_USER_KEY, persistedAuthUser);
  storageService.removeLocalItem(LAST_ACCOUNT_KEY);
  storageService.removeSessionItem(LAST_ACCOUNT_KEY);
  storageService.setSessionItem(`${SESSION_KEY}-user`, getLoginDisplayName(displayName));
  storageService.setLocalItem(`${SESSION_KEY}-user`, getLoginDisplayName(displayName));
  storageService.setSessionItem(`${SESSION_KEY}-email`, persistedAuthUser.email || "");
  storageService.setLocalItem(`${SESSION_KEY}-email`, persistedAuthUser.email || "");
  storageService.setSessionItem(`${SESSION_KEY}-role`, persistedAuthUser.app_metadata?.cargo || "");
  storageService.setLocalItem(`${SESSION_KEY}-role`, persistedAuthUser.app_metadata?.cargo || "");
  reloadUserSettingsForCurrentUser();
  renderCurrentUser();
  updateUserMenuHeader();
  return true;
}

function clearSensitiveClientCache() {
  SENSITIVE_CLIENT_CACHE_KEYS.forEach((key) => {
    storageService.removeLocalItem(key);
    storageService.removeSessionItem(key);
  });
}

function clearAuthenticatedUser() {
  currentAuthUser = null;
  currentUserProfile = null;
  storageService.removeSessionItem(SESSION_KEY);
  storageService.removeSessionItem(`${SESSION_KEY}-user`);
  storageService.removeSessionItem(`${SESSION_KEY}-role`);
  storageService.removeSessionItem(`${SESSION_KEY}-email`);
  storageService.removeLocalItem(PERSISTED_AUTH_USER_KEY);
  storageService.removeLocalItem(SESSION_KEY);
  storageService.removeLocalItem(`${SESSION_KEY}-user`);
  storageService.removeLocalItem(`${SESSION_KEY}-role`);
  storageService.removeLocalItem(`${SESSION_KEY}-email`);
  clearSensitiveClientCache();
  currentUserSettings = normalizeUserSettings();
  applyUserSettings();
}

async function getCurrentAuthUser() {
  const client = postgresClient || getPostgreSQLClient();
  if (!client?.auth) return null;
  const { data, error } = await client.auth.getUser();
  if (error) return null;
  return data?.user || null;
}

async function getAuthSession() {
  const client = postgresClient || getPostgreSQLClient();
  if (!client?.auth) return null;
  const { data, error } = await client.auth.getSession();
  if (error) return null;
  return data?.session || null;
}
