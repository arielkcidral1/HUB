(function () {
  const SESSION_KEYS = [
    "hub-rh-session",
    "hub-rh-session-user",
    "hub-rh-session-email",
    "hub-rh-session-role",
    "hub-postgres-session",
    "hub-rh-persisted-auth-user",
  ];

  function clearSession() {
    SESSION_KEYS.forEach((key) => {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    });
  }

  function redirectToLogin() {
    clearSession();
    window.location.replace("login.html?next=index.html&reauth=1");
  }

  function verifyRenderedIdentity() {
    const target = document.getElementById("current-user");
    const name = String(target?.textContent || "").trim().toLowerCase();
    if (!target || name === "usuario" || name === "voce" || name === "persisted-user") {
      redirectToLogin();
    }
  }

  Promise.resolve(window.__hubAuthEntryPromise)
    .then((authenticated) => {
      if (!authenticated) return;
      window.setTimeout(verifyRenderedIdentity, 1500);
    })
    .catch(() => redirectToLogin());
})();
