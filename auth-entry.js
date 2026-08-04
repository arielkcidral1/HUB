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

  function hasRealStoredIdentity() {
    const persistedUser = readJson(PERSISTED_USER_KEY);
    const postgresUser = readJson(POSTGRES_SESSION_KEY)?.user;
    const email = persistedUser?.email || postgresUser?.email || window.localStorage.getItem("hub-rh-session-email");
    const name = String(
      persistedUser?.user_metadata?.nome ||
      postgresUser?.user_metadata?.nome ||
      window.localStorage.getItem("hub-rh-session-user") ||
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
