(function () {
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
    if (Date.now() - startedAt >= 30000) {
      releasePendingView();
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
