(function () {
  const VERIFIED_KEY = "hub-auth-loading-verified";
  const value = window.localStorage.getItem(VERIFIED_KEY);
  if (value === "1") {
    window.localStorage.removeItem(VERIFIED_KEY);
    return;
  }

  document.documentElement.classList.add("auth-entry-pending");
  window.location.replace("account-loading.html?next=index.html");
})();
