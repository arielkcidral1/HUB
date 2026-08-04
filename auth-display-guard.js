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
    window.location.replace("login.html?next=index.html");
  }

  function verifyRenderedIdentity() {
    const target = document.getElementById("current-user");
    const name = String(target?.textContent || "").trim().toLowerCase();
    if (!target || name === "usuario" || name === "voce" || name === "persisted-user") {
      redirectToLogin();
    }
  }

  function waitForAuthenticatedRender(startedAt = Date.now()) {
    if (window.__hubAuthReady) {
      verifyRenderedIdentity();
      return;
    }
    if (Date.now() - startedAt >= 10000) {
      redirectToLogin();
      return;
    }
    window.setTimeout(() => waitForAuthenticatedRender(startedAt), 100);
  }

  Promise.resolve(window.__hubAuthEntryPromise)
    .then((authenticated) => {
      if (!authenticated) return;
      waitForAuthenticatedRender();
    })
    .catch(() => redirectToLogin());
})();
