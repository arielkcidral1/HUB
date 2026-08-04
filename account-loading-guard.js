(function () {
  const SESSION_KEY = "hub-rh-session";
  const PERSISTED_AUTH_USER_KEY = "hub-rh-persisted-auth-user";
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
    const name = readJson(`${SESSION_KEY}-user`) || readJson(`${SESSION_KEY}-email`);
    return Boolean(
      persistedUser?.id ||
      persistedUser?.email ||
      persistedUser?.user_metadata?.nome ||
      name
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
      shell.classList.remove("is-locked");
      shell.classList.add("is-ready");
      return;
    }

    redirectToLogin();
  }, LIMIT_MS);
})();
