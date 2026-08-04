(function () {
  const VERIFIED_KEY = "hub-auth-loading-verified";
  const RECOVERY_DELAY_MS = 8000;
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

  document.documentElement.classList.add("auth-entry-pending");
  window.location.replace("account-loading.html?next=index.html");
})();
