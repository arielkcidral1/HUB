(function () {
  const SESSION_KEY = "hub-rh-session";
  const POSTGRES_SESSION_KEY = "hub-postgres-session";
  const PERSISTED_USER_KEY = "hub-rh-persisted-auth-user";

  function setJson(storage, key, value) {
    storage.setItem(key, JSON.stringify(value));
  }

  function persistSession(session) {
    const user = session?.user;
    if (!user) return false;
    const name = user.user_metadata?.nome || user.user_metadata?.name || user.email?.split("@")[0] || "";
    const role = user.app_metadata?.cargo || user.user_metadata?.cargo || "";
    const stores = [window.localStorage, window.sessionStorage];
    stores.forEach((storage) => {
      setJson(storage, POSTGRES_SESSION_KEY, session);
      setJson(storage, SESSION_KEY, "active");
      setJson(storage, `${SESSION_KEY}-user`, name);
      setJson(storage, `${SESSION_KEY}-email`, user.email || "");
      setJson(storage, `${SESSION_KEY}-role`, role);
    });
    setJson(window.localStorage, PERSISTED_USER_KEY, user);
    return true;
  }

  function getRedirectTarget() {
    const next = new URLSearchParams(window.location.search).get("next") || "index.html";
    const target = next.startsWith("/") ? next.slice(1) : next;
    const page = target.split("?")[0];
    const allowed = new Set(["index.html", "denuncia.html", "chamados.html", "vagas.html", "candidatura.html", "atestados.html"]);
    return allowed.has(page) ? target : "index.html";
  }

  function bind() {
    const form = document.getElementById("login-form");
    if (!form || form.dataset.hubSubmitBound === "true") return;
    form.dataset.hubSubmitBound = "true";
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const button = form.querySelector('button[type="submit"]');
      const error = document.getElementById("login-error");
      const formData = new FormData(form);
      const identifier = String(formData.get("identificador") || "").trim();
      const password = String(formData.get("senha") || "").trim();
      if (button) button.disabled = true;
      if (error) error.textContent = "";
      try {
        const response = await fetch("/api/auth", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", "x-hub-client-id": crypto.randomUUID?.() || String(Date.now()) },
          body: JSON.stringify({ identifier, password }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !persistSession(result.session)) {
          if (error) error.textContent = result.error || "E-mail ou senha incorretos.";
          return;
        }
        window.location.replace(getRedirectTarget());
      } catch {
        if (error) error.textContent = "Não foi possível conectar ao sistema.";
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  bind();
  window.addEventListener("DOMContentLoaded", bind, { once: true });
})();
