// Restringe a aba Equipe ao usuario Ariel e adiciona o painel "Feedbacks e Sugestoes" em Conta.
// ponytail: carrega DEPOIS de script.js (ao contrario dos modulos de pagina) porque decora
// applyRoleAccess, activateView, showSettingsPanel e renderAccountSettings, que so existem
// depois que script.js executa.

(function setupArielAccessAndFeedbackModule() {
  const FEEDBACK_TABLE = "hub_feedbacks";
  const FEEDBACK_LOCAL_KEY = "hub-feedbacks-local-v1";
  const FEEDBACK_PANEL_ID = "settings-feedback-panel";

  function normalizeAccessName(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim()
      .toLowerCase();
  }

  function getCurrentUserEmailSafe() {
    return (
      currentUserProfile?.email ||
      currentAuthUser?.email ||
      storageService.getSessionItem(`${SESSION_KEY}-email`) ||
      ""
    );
  }

  function getCurrentUserNameSafe() {
    return currentUserProfile?.nome || getCurrentUserName?.() || currentAuthUser?.user_metadata?.nome || "Usuario";
  }

  function isArielUser() {
    const user = getCurrentUserRecord?.() || {};
    const email = getCurrentUserEmailSafe();
    const candidates = [
      getCurrentUserName?.(),
      user.nome,
      user.email,
      user.email ? String(user.email).split("@")[0] : "",
      email,
      email ? String(email).split("@")[0] : "",
      currentAuthUser?.user_metadata?.nome,
      currentAuthUser?.user_metadata?.name,
    ];
    return candidates.some((candidate) => normalizeAccessName(candidate) === "ariel" || normalizeAccessName(candidate) === "andre barbosa");
  }

  window.isArielUser = isArielUser;

  function getFallbackViewForCurrentUser() {
    if (isCashierUser?.()) return "comunicacao";
    if (isManagerUser?.()) return "documentos";
    return "dashboard";
  }

  function applyArielTeamAccess() {
    if (isPublicPage?.()) return;
    const canAccessTeam = isArielUser();

    document.querySelectorAll('[data-view="equipe"]').forEach((button) => {
      button.hidden = !canAccessTeam;
      button.disabled = !canAccessTeam;
      button.style.display = canAccessTeam ? "" : "none";
      button.setAttribute("aria-hidden", canAccessTeam ? "false" : "true");
    });

    const equipeView = document.getElementById("equipe");
    if (!canAccessTeam && equipeView?.classList.contains("active")) {
      activateView?.(getFallbackViewForCurrentUser());
    }
  }

  try {
    const originalApplyRoleAccess = applyRoleAccess;
    applyRoleAccess = function patchedApplyRoleAccess() {
      originalApplyRoleAccess?.();
      applyArielTeamAccess();
    };
  } catch (_) {}

  try {
    const originalActivateView = activateView;
    activateView = function patchedActivateView(viewId) {
      if (viewId === "equipe" && !isArielUser()) {
        showModal?.("Acesso restrito", "A aba Equipe está disponível somente para o usuário Ariel.", "warning");
        return originalActivateView?.(getFallbackViewForCurrentUser());
      }
      return originalActivateView?.(viewId);
    };
  } catch (_) {}

  document.addEventListener("click", (event) => {
    const equipeButton = event.target.closest?.('[data-view="equipe"]');
    if (!equipeButton) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (!isArielUser()) {
        showModal?.("Acesso restrito", "A aba Equipe está disponível somente para o usuário Ariel.", "warning");
      activateView?.(getFallbackViewForCurrentUser());
      return;
    }

    activateView?.("equipe");
    closeMobileMenu?.();
  }, true);

  function createFeedbackSettingsButton() {
    return `
      <button class="settings-item" type="button" data-settings-target="${FEEDBACK_PANEL_ID}" data-settings-keywords="feedback reclamacao reclamacoes sugestao sugestoes melhoria usuario">
        <span class="settings-item-icon settings-icon-feedback" aria-hidden="true"></span>
        <span><strong>Feedbacks e Sugestões</strong><small>Feedbacks, reclamações e sugestões</small></span>
      </button>
    `;
  }

  function repairFeedbackEncoding(root = document) {
    const decode = (value) => {
      const source = String(value || "").replace(/Ã‡/g, "Ç").replace(/�/g, "");
      if (!/[ÂÃâ]/.test(source)) return source;
      try {
        const bytes = Uint8Array.from(source, (char) => char.charCodeAt(0));
        return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        return source;
      }
    };

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const fixed = decode(node.nodeValue);
      if (fixed !== node.nodeValue) node.nodeValue = fixed;
    });

    root.querySelectorAll?.("[placeholder], [value], [data-settings-keywords]").forEach((element) => {
      ["placeholder", "value", "data-settings-keywords"].forEach((attribute) => {
        if (!element.hasAttribute(attribute)) return;
        const fixed = decode(element.getAttribute(attribute));
        if (fixed !== element.getAttribute(attribute)) element.setAttribute(attribute, fixed);
      });
    });
  }

  function createFeedbackDropdownButton() {
    const subtitle = isArielUser()
      ? "Visualizar feedbacks, reclamações e sugestões"
      : "Enviar feedback, reclamação ou sugestão";
    return `
      <button type="button" class="user-menu-item" data-view="conta" data-settings-target="${FEEDBACK_PANEL_ID}" role="menuitem">
        <span class="user-menu-icon user-menu-icon-feedback" aria-hidden="true"></span>
        <span class="user-menu-item-text">
          <strong>Feedbacks e Sugestões</strong>
          <small>${subtitle}</small>
        </span>
      </button>
    `;
  }

  function createFeedbackPanel() {
    return `
      <section class="panel settings-detail-panel" data-settings-panel="${FEEDBACK_PANEL_ID}">
        <div class="panel-header">
          <h2>Feedbacks, reclamações e sugestões</h2>
        </div>
        <p class="item-meta" id="hub-feedback-panel-description">Use este espaço para enviar melhorias, reclamações ou sugestões sobre o HUB e processos internos.</p>

        <form class="hub-feedback-form settings-section" id="hub-feedback-form">
          <h3>Novo envio</h3>
          <label>Tipo
            <select id="hub-feedback-type" required>
              <option value="Feedback">Feedback</option>
              <option value="Reclamação">Reclamação</option>
              <option value="Sugestão">Sugestão</option>
            </select>
          </label>
          <label>Mensagem
            <textarea id="hub-feedback-message" placeholder="Descreva aqui seu feedback, reclamação ou sugestão..." required></textarea>
          </label>
          <button class="primary-button" type="submit">Enviar</button>
        </form>

        <div class="settings-section" id="hub-feedback-admin-area" hidden>
          <div class="hub-feedback-admin-note">
            <strong>Visualização do Ariel:</strong> aqui aparecem os feedbacks, reclamações e sugestões enviados pelos usuários.
          </div>
          <div class="hub-feedback-toolbar section-top">
            <h3 class="flush-bottom">Envios recebidos</h3>
            <select class="hub-feedback-filter" id="hub-feedback-filter">
              <option value="todos">Todos</option>
              <option value="Feedback">Feedback</option>
              <option value="Reclamação">Reclamação</option>
              <option value="Sugestão">Sugestão</option>
            </select>
          </div>
          <div class="hub-feedback-list" id="hub-feedback-admin-list"></div>
        </div>

        <div class="settings-section" id="hub-feedback-user-area">
          <h3>Meus envios</h3>
          <div class="hub-feedback-list" id="hub-feedback-user-list"></div>
        </div>
      </section>
    `;
  }

  function bindFeedbackSettingsButton(button) {
    if (!button || button.dataset.feedbackReady === "true") return;
    button.dataset.feedbackReady = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      activateView?.("conta");
      ensureFeedbackSettingsUi();
      showSettingsPanel?.(FEEDBACK_PANEL_ID);
      renderFeedbackPanel();
      closeUserMenuDropdown?.();
    });
  }

  function ensureFeedbackSettingsUi() {
    if (isPublicPage?.()) return;

    const settingsList = document.getElementById("settings-list");
    if (settingsList && !settingsList.querySelector(`[data-settings-target="${FEEDBACK_PANEL_ID}"]`)) {
      const shortcutsButton = settingsList.querySelector('[data-settings-target="settings-shortcuts-panel"]');
      shortcutsButton?.insertAdjacentHTML("afterend", createFeedbackSettingsButton());
    }

    const dropdown = document.getElementById("user-menu-dropdown");
    if (dropdown && !dropdown.querySelector(`[data-settings-target="${FEEDBACK_PANEL_ID}"]`)) {
      const shortcutsMenuButton = dropdown.querySelector('[data-settings-target="settings-shortcuts-panel"]');
      shortcutsMenuButton?.insertAdjacentHTML("afterend", createFeedbackDropdownButton());
    }

    const settingsDetail = document.querySelector(".settings-detail");
    if (settingsDetail && !settingsDetail.querySelector(`[data-settings-panel="${FEEDBACK_PANEL_ID}"]`)) {
      const shortcutsPanel = settingsDetail.querySelector('[data-settings-panel="settings-shortcuts-panel"]');
      shortcutsPanel?.insertAdjacentHTML("afterend", createFeedbackPanel());
    }

    repairFeedbackEncoding(document);

    document.querySelectorAll(`[data-settings-target="${FEEDBACK_PANEL_ID}"]`).forEach(bindFeedbackSettingsButton);
    bindFeedbackForm();
    document.getElementById("hub-feedback-filter")?.addEventListener("change", renderFeedbackPanel);
    updateFeedbackVisibility();
  }

  function getLocalFeedbacks() {
    return storageService.getLocalItem(FEEDBACK_LOCAL_KEY, []);
  }

  function saveLocalFeedbacks(items) {
    storageService.setLocalItem(FEEDBACK_LOCAL_KEY, items || []);
  }

  function mapFeedbackRow(row = {}) {
    return {
      id: row.id || generateUUID(),
      tipo: row.tipo || "Feedback",
      mensagem: row.mensagem || "",
      autorNome: row.autor_nome || row.autorNome || row.created_by || "Usuário",
      autorEmail: row.autor_email || row.autorEmail || "",
      status: row.status || "Novo",
      createdAt: row.created_at ? formatDateTime(row.created_at) : row.createdAt || todayLabel?.() || "Hoje",
      sortAt: row.created_at || row.sortAt || new Date().toISOString(),
    };
  }

  async function loadFeedbacks() {
    const currentEmail = getCurrentUserEmailSafe();
    const localItems = getLocalFeedbacks().map(mapFeedbackRow);

    if (!postgresClient) {
      return isArielUser()
        ? localItems.sort((a, b) => String(b.sortAt).localeCompare(String(a.sortAt)))
        : localItems.filter((item) => !currentEmail || normalizeAccessName(item.autorEmail) === normalizeAccessName(currentEmail));
    }

    try {
      let query = postgresClient.from(FEEDBACK_TABLE).select("*").order("created_at", { ascending: false });
      if (!isArielUser() && currentEmail) query = query.eq("autor_email", currentEmail);
      const { data: rows, error } = await query;
      if (error) throw error;
      return (rows || []).map(mapFeedbackRow);
    } catch (error) {
      console.warn("Feedbacks carregados do armazenamento local. Verifique se a tabela hub_feedbacks existe no PostgreSQL.", error);
      return isArielUser()
        ? localItems.sort((a, b) => String(b.sortAt).localeCompare(String(a.sortAt)))
        : localItems.filter((item) => !currentEmail || normalizeAccessName(item.autorEmail) === normalizeAccessName(currentEmail));
    }
  }

  async function saveFeedback(payload) {
    const localItem = mapFeedbackRow({
      ...payload,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    });

    if (postgresClient) {
      try {
        const { error } = await postgresClient.from(FEEDBACK_TABLE).insert({
          tipo: payload.tipo,
          mensagem: payload.mensagem,
          autor_nome: payload.autorNome,
          autor_email: payload.autorEmail || null,
          status: "Novo",
          created_by: payload.autorNome,
        });
        if (error) throw error;
        return { savedOnPostgreSQL: true };
      } catch (error) {
        console.warn("Não foi possível salvar feedback no PostgreSQL; salvando localmente.", error);
      }
    }

    const items = [localItem, ...getLocalFeedbacks().map(mapFeedbackRow)];
    saveLocalFeedbacks(items);
    return { savedOnPostgreSQL: false };
  }

  function removeLocalFeedbackById(feedbackId) {
    const normalizedId = String(feedbackId || "");
    const nextItems = getLocalFeedbacks()
      .map(mapFeedbackRow)
      .filter((item) => String(item.id) !== normalizedId);
    saveLocalFeedbacks(nextItems);
  }

  async function deleteFeedback(feedbackId) {
    const normalizedId = String(feedbackId || "");
    if (!normalizedId) return { deletedOnPostgreSQL: false };

    if (postgresClient) {
      try {
        let query = postgresClient.from(FEEDBACK_TABLE).delete().eq("id", normalizedId);
        const currentEmail = getCurrentUserEmailSafe();
        if (!isArielUser() && currentEmail) query = query.eq("autor_email", currentEmail);
        const { error } = await query;
        if (error) throw error;
        removeLocalFeedbackById(normalizedId);
        return { deletedOnPostgreSQL: true };
      } catch (error) {
        console.warn("Não foi possível excluir feedback no PostgreSQL; tentando remover somente do armazenamento local.", error);
      }
    }

    removeLocalFeedbackById(normalizedId);
    return { deletedOnPostgreSQL: false };
  }

  function renderFeedbackItems(target, items, options = {}) {
    if (!target) return;
    if (!items.length) {
      target.innerHTML = `<div class="hub-feedback-empty">Nenhum envio registrado ainda.</div>`;
      return;
    }

    target.innerHTML = items.map((item) => `
      <article class="item-card hub-feedback-card${options.admin ? " is-admin" : ""}">
        <div class="item-topline">
          <p class="item-title">${escapeHtml(item.tipo)}</p>
          <span class="tag">${escapeHtml(item.status || "Novo")}</span>
        </div>
        <p>${escapeHtml(item.mensagem)}</p>
        <p class="item-meta">${escapeHtml(item.createdAt || "Hoje")} | Enviado por ${escapeHtml(item.autorNome || "Usuário")}${item.autorEmail ? ` | ${escapeHtml(item.autorEmail)}` : ""}</p>
        ${options.canDelete ? `
          <div class="hub-feedback-actions">
            <button class="danger-button hub-feedback-delete-button" type="button" data-feedback-delete-id="${escapeHtml(item.id)}">Excluir envio</button>
          </div>
        ` : ""}
      </article>
    `).join("");
  }

  function bindFeedbackDeleteButtons() {
    document.querySelectorAll("[data-feedback-delete-id]").forEach((button) => {
      if (button.dataset.feedbackDeleteReady === "true") return;
      button.dataset.feedbackDeleteReady = "true";
      button.addEventListener("click", async () => {
        const feedbackId = button.dataset.feedbackDeleteId;
        if (!feedbackId) return;

        const confirmed = window.confirm("Deseja excluir este envio? Esta ação não poderá ser desfeita.");
        if (!confirmed) return;

        const originalText = button.textContent || "Excluir envio";
        button.disabled = true;
        button.textContent = "Excluindo...";

        const result = await deleteFeedback(feedbackId);

        showModal?.(
          "Envio excluído",
          result.deletedOnPostgreSQL
            ? "Seu envio foi excluído com sucesso."
            : "O envio foi removido localmente. Se ele ainda aparecer em outro dispositivo, confirme a permissão DELETE no PostgreSQL.",
          result.deletedOnPostgreSQL ? "success" : "info"
        );

        button.disabled = false;
        button.textContent = originalText;
        renderFeedbackPanel();
      });
    });
  }

  async function renderFeedbackPanel() {
    ensureFeedbackSettingsUi();
    updateFeedbackVisibility();

    const items = await loadFeedbacks();
    const filter = document.getElementById("hub-feedback-filter")?.value || "todos";
    const filtered = filter === "todos" ? items : items.filter((item) => item.tipo === filter);

    if (isArielUser()) {

      renderFeedbackItems(document.getElementById("hub-feedback-admin-list"), filtered, { admin: true });
    } else {
      renderFeedbackItems(document.getElementById("hub-feedback-user-list"), items, { canDelete: true });
      bindFeedbackDeleteButtons();
    }
  }

  function updateFeedbackVisibility() {
    const ariel = isArielUser();
    const adminArea = document.getElementById("hub-feedback-admin-area");
    const form = document.getElementById("hub-feedback-form");
    const userArea = document.getElementById("hub-feedback-user-area");
    const description = document.getElementById("hub-feedback-panel-description");

    if (adminArea) adminArea.hidden = !ariel;
    if (form) form.hidden = ariel;
    if (userArea) userArea.hidden = ariel;
    if (description) {
      description.textContent = ariel
        ? "Área exclusiva para visualizar feedbacks, reclamações e sugestões enviados pelos usuários."
        : "Use este espaço para enviar melhorias, reclamações ou sugestões sobre o HUB e processos internos.";
    }

    document.querySelectorAll(`[data-settings-target="${FEEDBACK_PANEL_ID}"] small`).forEach((small) => {
      small.textContent = ariel
        ? "Visualizar feedbacks, reclamações e sugestões"
        : "Enviar feedback, reclamação ou sugestão";
    });
  }

  function bindFeedbackForm() {
    const form = document.getElementById("hub-feedback-form");
    if (!form || form.dataset.feedbackReady === "true") return;
    form.dataset.feedbackReady = "true";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isArielUser()) {
        showModal?.("Acesso somente leitura", "O usuário Ariel apenas visualiza os feedbacks enviados pelos demais usuários.", "info");
        return;
      }
      const tipo = document.getElementById("hub-feedback-type")?.value || "Feedback";
      const mensagem = document.getElementById("hub-feedback-message")?.value.trim() || "";
      if (!mensagem) {
        showModal?.("Mensagem obrigatória", "Preencha o campo de mensagem antes de enviar.", "warning");
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton?.textContent || "Enviar";
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Enviando...";
      }

      const result = await saveFeedback({
        tipo,
        mensagem,
        autorNome: getCurrentUserNameSafe(),
        autorEmail: getCurrentUserEmailSafe(),
      });

      form.reset();
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }

      showModal?.(
        "Envio registrado",
        result.savedOnPostgreSQL
          ? "Seu feedback foi enviado com sucesso."
          : "Seu feedback foi salvo localmente. Para o Ariel visualizar envios de todos os usuários, confirme se a tabela hub_feedbacks foi criada no PostgreSQL.",
        result.savedOnPostgreSQL ? "success" : "info"
      );
      renderFeedbackPanel();
    });
  }

  try {
    const originalShowSettingsPanel = showSettingsPanel;
    showSettingsPanel = function patchedShowSettingsPanel(panelId) {
      ensureFeedbackSettingsUi();
      const result = originalShowSettingsPanel?.(panelId);
      if (panelId === FEEDBACK_PANEL_ID) renderFeedbackPanel();
      return result;
    };
  } catch (_) {}

  try {
    const originalRenderAccountSettings = renderAccountSettings;
    renderAccountSettings = function patchedRenderAccountSettings() {
      const result = originalRenderAccountSettings?.();
      ensureFeedbackSettingsUi();
      updateFeedbackVisibility();
      return result;
    };
  } catch (_) {}

  function initializeArielFeedbackModule() {
    ensureFeedbackSettingsUi();
    applyArielTeamAccess();
    if (document.querySelector(`[data-settings-panel="${FEEDBACK_PANEL_ID}"]`)?.classList.contains("active")) {
      renderFeedbackPanel();
    }
  }

  document.addEventListener("DOMContentLoaded", initializeArielFeedbackModule);
  if (document.readyState === "interactive" || document.readyState === "complete") {
    initializeArielFeedbackModule();
  }

  window.addEventListener("storage", (event) => {
    if (event.key === FEEDBACK_LOCAL_KEY) renderFeedbackPanel();
  });
})();
