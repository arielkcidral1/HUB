(function () {
  const SESSION_KEY = "hub-rh-session";
  const POSTGRES_SESSION_KEY = "hub-postgres-session";
  const PERSISTED_USER_KEY = "hub-rh-persisted-auth-user";
  const MAX_AUTH_PENDING_MS = 2500;

  function readJson(key) {
    try {
      return JSON.parse(window.localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  }

  function hasStoredIdentity() {
    const sessionActive = readJson(SESSION_KEY) === "active";
    const persistedUser = readJson(PERSISTED_USER_KEY);
    const postgresUser = readJson(POSTGRES_SESSION_KEY)?.user;
    const email = String(persistedUser?.email || postgresUser?.email || readJson(`${SESSION_KEY}-email`) || "").trim();
    const name = String(persistedUser?.user_metadata?.nome || postgresUser?.user_metadata?.nome || readJson(`${SESSION_KEY}-user`) || "").trim().toLowerCase();
    return Boolean(sessionActive && (email || (name && !["usuario", "voce", "persisted-user"].includes(name))));
  }

  function redirectToLogin() {
    document.documentElement.classList.remove("auth-entry-pending");
    window.location.replace("login.html?next=index.html");
  }

  function releasePendingView() {
    document.documentElement.classList.remove("auth-entry-pending");
  }

  function waitForAuthenticatedRender(startedAt = Date.now()) {
    if (window.__hubAuthReady) {
      releasePendingView();
      return;
    }
    if (Date.now() - startedAt >= MAX_AUTH_PENDING_MS) {
      if (hasStoredIdentity()) releasePendingView();
      else redirectToLogin();
      return;
    }
    window.setTimeout(() => waitForAuthenticatedRender(startedAt), 100);
  }

  Promise.resolve(window.__hubAuthEntryPromise)
    .then((authenticated) => {
      if (!authenticated) {
        redirectToLogin();
        return;
      }
      waitForAuthenticatedRender();
    })
    .catch(() => redirectToLogin());
})();
