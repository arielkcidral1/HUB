(function () {
  const SESSION_KEY = "hub-rh-session";
  const USER_KEY = `${SESSION_KEY}-user`;
  const EMAIL_KEY = `${SESSION_KEY}-email`;
  const ROLE_KEY = `${SESSION_KEY}-role`;
  const POSTGRES_SESSION_KEY = "hub-postgres-session";
  const PERSISTED_USER_KEY = "hub-rh-persisted-auth-user";
  const AUTH_REQUEST_TIMEOUT_MS = 3000;

  document.documentElement.classList.add("auth-entry-pending");

  function isRealUser(user) {
    const email = String(user?.email || "").trim();
    const name = String(user?.user_metadata?.nome || user?.user_metadata?.name || "").trim().toLowerCase();
    return Boolean(email || (name && !["usuario", "voce", "persisted-user"].includes(name)));
  }

  function readJson(key) {
    try {
      return JSON.parse(window.localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  }

  function hasStoredIdentity() {
    const persistedUser = readJson(PERSISTED_USER_KEY);
    const postgresUser = readJson(POSTGRES_SESSION_KEY)?.user;
    const storedEmail = readJson(EMAIL_KEY) || "";
    const storedName = String(readJson(USER_KEY) || "").trim().toLowerCase();
    return Boolean(
      isRealUser(persistedUser) ||
      isRealUser(postgresUser) ||
      storedEmail ||
      (storedName && !["usuario", "voce", "persisted-user"].includes(storedName))
    );
  }

  function getStoredUser() {
    return readJson(PERSISTED_USER_KEY) || readJson(POSTGRES_SESSION_KEY)?.user || null;
  }

  async function hasRecentActivity() {
    const user = getStoredUser();
    const conditions = [
      user?.id ? { column: "id", op: "eq", value: user.id } : null,
      user?.email ? { column: "email", op: "eq", value: user.email } : null,
      user?.user_metadata?.nome ? { column: "nome", op: "eq", value: user.user_metadata.nome } : null,
    ].filter(Boolean);
    if (!conditions.length) return false;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2500);
    try {
      const filters = encodeURIComponent(JSON.stringify([{ op: "or", conditions }]));
      const response = await fetch(`/api/records?table=hub_users&select=id,nome,email,is_online,last_seen&filters=${filters}&limit=1`, {
        credentials: "same-origin",
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      const row = result?.data?.[0];
      const lastSeen = Date.parse(row?.last_seen || "");
      const age = Date.now() - lastSeen;
      return Boolean(row?.is_online === true && age >= -3000 && age <= 3000);
    } catch {
      return false;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function clearStoredSession() {
    [SESSION_KEY, USER_KEY, EMAIL_KEY, ROLE_KEY, POSTGRES_SESSION_KEY, PERSISTED_USER_KEY].forEach((key) => {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    });
  }

  async function suspendPresenceOnReload(user) {
    if (!user) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 1000);
    try {
      await fetch("/api/auth/heartbeat", {
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          online: false,
          userId: user.id || "",
          email: user.email || "",
          nome: user.user_metadata?.nome || user.user_metadata?.name || "",
        }),
        signal: controller.signal,
      });
    } catch {
      // A falha breve de presenca nao impede a reautenticacao da conta.
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function redirectToLogin() {
    clearStoredSession();
    window.location.replace("login.html?next=index.html");
  }

  async function reauthenticateOnReload() {
    const navigation = performance.getEntriesByType?.("navigation")?.[0];
    if (navigation?.type !== "reload") return reauthenticateInDatabase();
    const previousUser = getStoredUser();
    await suspendPresenceOnReload(previousUser);
    clearStoredSession();
    // A sessao HttpOnly continua disponivel para a reautenticacao automatica.
    // Durante o reload, a presenca fica suspensa e volta ao iniciar o painel.
    return reauthenticateInDatabase();
  }

  function persistAuthenticatedSession(session) {
    const user = session?.user;
    if (!isRealUser(user)) return false;
    const name = user.user_metadata?.nome || user.user_metadata?.name || user.email?.split("@")[0] || "";
    const role = user.app_metadata?.cargo || user.user_metadata?.cargo || "";
    const raw = JSON.stringify(session);
    window.localStorage.setItem(POSTGRES_SESSION_KEY, raw);
    window.sessionStorage.setItem(POSTGRES_SESSION_KEY, raw);
    window.localStorage.setItem(PERSISTED_USER_KEY, JSON.stringify(user));
    window.localStorage.setItem(SESSION_KEY, JSON.stringify("active"));
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify("active"));
    window.localStorage.setItem(USER_KEY, JSON.stringify(name));
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(name));
    window.localStorage.setItem(EMAIL_KEY, JSON.stringify(user.email || ""));
    window.sessionStorage.setItem(EMAIL_KEY, JSON.stringify(user.email || ""));
    window.localStorage.setItem(ROLE_KEY, JSON.stringify(role));
    window.sessionStorage.setItem(ROLE_KEY, JSON.stringify(role));
    return true;
  }

  async function reauthenticateInDatabase() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "session" }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !persistAuthenticatedSession(result?.session)) {
        redirectToLogin();
        return false;
      }
      return true;
    } catch (error) {
      redirectToLogin();
      return false;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  // Do not initialize a private page until the persistent auth cookie is valid.
  window.__hubAuthEntryPromise = reauthenticateOnReload();
  window.__hubAuthEntryPromise.then((authenticated) => {
    if (!authenticated) return;
    document.documentElement.classList.remove("auth-entry-pending");
  });
})();
