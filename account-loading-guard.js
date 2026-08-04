(function () {
  const SESSION_KEY = "hub-rh-session";
  const PERSISTED_AUTH_USER_KEY = "hub-rh-persisted-auth-user";
  const POSTGRES_SESSION_KEY = "hub-postgres-session";
  const LIMIT_MS = 2000;

  function readJson(key) {
    try {
      return JSON.parse(window.localStorage.getItem(key) || "null");
    } catch (_) {
      return null;
    }
  }

  function hasStoredIdentity() {
    const persistedUser = readJson(PERSISTED_AUTH_USER_KEY);
    const postgresUser = readJson(POSTGRES_SESSION_KEY)?.user;
    const name = readJson(`${SESSION_KEY}-user`) || readJson(`${SESSION_KEY}-email`);
    const normalizedName = String(persistedUser?.user_metadata?.nome || postgresUser?.user_metadata?.nome || name || "").trim().toLowerCase();
    return Boolean(
      persistedUser?.email ||
      postgresUser?.email ||
      (persistedUser?.user_metadata?.nome && normalizedName !== "usuario") ||
      (postgresUser?.user_metadata?.nome && normalizedName !== "usuario") ||
      (name && normalizedName !== "usuario")
    );
  }

  function redirectToLogin() {
    const page = window.location.pathname.split("/").pop() || "index.html";
    window.location.replace(`login.html?next=${encodeURIComponent(page + (window.location.search || ""))}`);
  }

  window.setTimeout(() => {
    const shell = document.getElementById("app-shell");
    if (!shell?.classList.contains("is-locked")) return;

    const active = readJson(SESSION_KEY) === "active";
    if (active && hasStoredIdentity()) {
      window.setTimeout(() => {
        const currentShell = document.getElementById("app-shell");
        const stillActive = readJson(SESSION_KEY) === "active";
        if (!currentShell?.classList.contains("is-locked") || !stillActive || !hasStoredIdentity()) return;
        currentShell.classList.remove("is-locked");
        currentShell.classList.add("is-ready");
      }, LIMIT_MS);
      return;
    }

    redirectToLogin();
  }, LIMIT_MS);
})();
