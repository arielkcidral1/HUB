(function () {
  const VERIFIED_KEY = "hub-auth-loading-verified";
  const RECOVERY_DELAY_MS = 8000;
  const PERSISTED_USER_KEY = "hub-rh-persisted-auth-user";
  const POSTGRES_SESSION_KEY = "hub-postgres-session";

  function readJson(key) {
    try {
      return JSON.parse(window.localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  }

  function readStoredValue(key) {
    const raw = window.localStorage.getItem(key);
    if (!raw) return "";
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  function hasRealStoredIdentity() {
    const persistedUser = readJson(PERSISTED_USER_KEY);
    const postgresUser = readJson(POSTGRES_SESSION_KEY)?.user;
    const email = persistedUser?.email || postgresUser?.email || readStoredValue("hub-rh-session-email");
    const name = String(
      persistedUser?.user_metadata?.nome ||
      postgresUser?.user_metadata?.nome ||
      readStoredValue("hub-rh-session-user") ||
      ""
    ).trim().toLowerCase();
    return Boolean(email || (name && !["usuario", "voce", "persisted-user"].includes(name)));
  }

  const recoverFromBlankPage = () => {
    if (!document.documentElement.classList.contains("auth-entry-pending")) return;
    window.location.replace("account-loading.html?next=index.html");
  };
  window.setTimeout(recoverFromBlankPage, RECOVERY_DELAY_MS);
  const value = window.localStorage.getItem(VERIFIED_KEY);
  if (value === "1") {
    window.localStorage.removeItem(VERIFIED_KEY);
    document.documentElement.classList.add("auth-entry-pending");
    return;
  }

  if (hasRealStoredIdentity()) {
    document.documentElement.classList.add("auth-entry-pending");
    return;
  }

  document.documentElement.classList.add("auth-entry-pending");
  window.location.replace("account-loading.html?next=index.html");
})();
