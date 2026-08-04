(function () {
  const SESSION_KEY = "hub-rh-session";
  const USER_KEY = `${SESSION_KEY}-user`;
  const EMAIL_KEY = `${SESSION_KEY}-email`;
  const ROLE_KEY = `${SESSION_KEY}-role`;
  const POSTGRES_SESSION_KEY = "hub-postgres-session";
  const PERSISTED_USER_KEY = "hub-rh-persisted-auth-user";
  const AUTH_REQUEST_TIMEOUT_MS = 3000;
  const RECOVERY_DELAY_MS = 8000;

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

  function clearStoredSession() {
    [SESSION_KEY, USER_KEY, EMAIL_KEY, ROLE_KEY, POSTGRES_SESSION_KEY, PERSISTED_USER_KEY].forEach((key) => {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    });
  }

  function redirectToLogin() {
    clearStoredSession();
    window.location.replace("login.html?next=index.html");
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
    const localIdentityAvailable = hasStoredIdentity();
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
      if (localIdentityAvailable && error?.name === "AbortError") return true;
      if (localIdentityAvailable) return true;
      window.location.replace("account-loading.html?next=index.html");
      return false;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  window.__hubAuthEntryPromise = reauthenticateInDatabase();
  window.setTimeout(() => {
    if (document.documentElement.classList.contains("auth-entry-pending")) {
      window.location.replace("account-loading.html?next=index.html");
    }
  }, RECOVERY_DELAY_MS);
})();
