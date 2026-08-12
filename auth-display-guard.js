(function () {
  function redirectToLogin() {
    document.documentElement.classList.remove("auth-entry-pending");
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
      document.documentElement.classList.remove("auth-entry-pending");
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
