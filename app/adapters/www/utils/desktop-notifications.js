function isBrowserNotificationSupported() {
  return "Notification" in window;
}

async function registerHubNotificationServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  if (hubNotificationServiceWorkerRegistration) return hubNotificationServiceWorkerRegistration;

  try {
    hubNotificationServiceWorkerRegistration = await navigator.serviceWorker.register(HUB_NOTIFICATION_SERVICE_WORKER_PATH, {
      scope: "./",
    });
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event?.data?.type === "HUB_OPEN_NOTIFICATIONS") {
        const payload = event.data || {};
        markNotificationsRead(payload.notificationId ? [payload.notificationId] : [], payload.messageIds || []);
        openNotificationTrackerFromPopout();
      }
    });
    return hubNotificationServiceWorkerRegistration;
  } catch (error) {
    console.warn("Service Worker de notificações não pode ser registrado:", error);
    return null;
  }
}

async function requestDesktopNotificationPermission({ showSuccess = true } = {}) {
  localStorage.setItem(getNotificationPermissionDismissedKey(), "true");
  if (!isBrowserNotificationSupported()) {
    showModal("Notificações indisponíveis", "Este navegador não suporta notificações do sistema.", "error");
    currentUserSettings.desktopNotifications = false;
    saveUserSettings(currentUserSettings);
    syncUserSettingsControls();
    return "unsupported";
  }

  currentUserSettings.desktopNotifications = true;
  saveUserSettings(currentUserSettings);
  syncUserSettingsControls();
  await registerHubNotificationServiceWorker();

  if (Notification.permission === "granted") {
    removeDesktopNotificationPermissionPrompt();
    return "granted";
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      removeDesktopNotificationPermissionPrompt();
      if (showSuccess) {
        await showBrowserDesktopNotification("Notificações ativadas", "Agora o HUB pode avisar mesmo quando você estiver em outra aba.", {
          type: "geral",
          icon: "\u{1F514}",
          tag: "hub-rh-notificacoes-ativadas",
          requireInteraction: true,
        });
        showUserNotificationPopout("Notificações ativadas", "Avisos externos do HUB foram liberados neste navegador.", {
          type: "geral",
          icon: "\u{1F514}",
          duration: 7000,
          hint: "Você também receberá o aviso nativo do navegador",
        });
      }
      return "granted";
    }

    currentUserSettings.desktopNotifications = false;
    saveUserSettings(currentUserSettings);
    syncUserSettingsControls();
    showDesktopNotificationPermissionPrompt(true);
    return permission;
  } catch (error) {
    console.warn("Permissão de notificações não pode ser solicitada:", error);
    showDesktopNotificationPermissionPrompt(true);
    return "error";
  }
}

let hubNotificationPermissionInteractionBound = false;

function getNotificationPermissionDismissedKey() {
  const identity = normalizeLoginName(
    currentUserProfile?.email ||
    currentAuthUser?.email ||
    storageService.getLocalItem(`${SESSION_KEY}-email`) ||
    getCurrentUserName()
  ) || "anon";
  return `hub-notification-permission-dismissed-${identity}`;
}

function removeDesktopNotificationPermissionPrompt() {
  document.getElementById(HUB_NOTIFICATION_PERMISSION_PROMPT_ID)?.remove();
}

function showDesktopNotificationPermissionPrompt(isBlocked = false) {
  if (!isAuthenticated() || !isBrowserNotificationSupported()) return;
  if (Notification.permission === "granted") {
    localStorage.setItem(getNotificationPermissionDismissedKey(), "true");
    removeDesktopNotificationPermissionPrompt();
    return;
  }
  if (!isBlocked && localStorage.getItem(getNotificationPermissionDismissedKey()) === "true") return;

  let prompt = document.getElementById(HUB_NOTIFICATION_PERMISSION_PROMPT_ID);
  if (!prompt) {
    prompt = document.createElement("div");
    prompt.id = HUB_NOTIFICATION_PERMISSION_PROMPT_ID;
    prompt.className = "hub-notification-permission-prompt";
    prompt.setAttribute("role", "status");
    prompt.innerHTML = `
      <div class="hub-notification-permission-icon">??</div>
      <div class="hub-notification-permission-text">
        <strong>Ative as notificações do HUB</strong>
        <p data-permission-message></p>
      </div>
      <button class="secondary-button" type="button" data-permission-dismiss>Depois</button>
      <button class="secondary-button" type="button" data-permission-test>Testar aviso</button>
      <button class="primary-button" type="button" data-permission-enable>Permitir notificações</button>
    `;
    document.body.appendChild(prompt);
    prompt.querySelector("[data-permission-enable]")?.addEventListener("click", () => requestDesktopNotificationPermission());
    prompt.querySelector("[data-permission-test]")?.addEventListener("click", async () => {
      const permission = Notification.permission === "granted"
        ? "granted"
        : await requestDesktopNotificationPermission({ showSuccess: false });

      if (permission !== "granted") {
        showUserNotificationPopout("Permissão pendente", "O navegador ainda não liberou as notificações externas do HUB.", {
          type: "geral",
          icon: "\u{26A0}\u{FE0F}",
          duration: 9000,
          hint: "Libere no cadeado do navegador: Notificações > Permitir",
        });
        return;
      }

      const shown = await showBrowserDesktopNotification("Teste de notificação HUB", "Este é o aviso visual que aparecerá fora da aba do HUB.", {
        type: "geral",
        icon: "\u{1F514}",
        tag: `hub-rh-teste-${Date.now()}`,
        requireInteraction: true,
      });
      showUserNotificationPopout(shown ? "Teste enviado" : "Teste bloqueado", shown
        ? "A notificação nativa do navegador foi disparada. Verifique o canto da tela ou a central de notificações."
        : "O navegador bloqueou o aviso externo. Confira as permissões do site.", {
        type: "geral",
        icon: shown ? "\u{2705}" : "\u{1F6AB}",
        duration: 10000,
        hint: shown ? "Se estiver em outra aba, o aviso aparecerá fora do HUB" : "Cadeado do navegador > Notificações > Permitir",
      });
    });
    prompt.querySelector("[data-permission-dismiss]")?.addEventListener("click", () => {
      localStorage.setItem(getNotificationPermissionDismissedKey(), "true");
      prompt.remove();
    });
  }

  const message = prompt.querySelector("[data-permission-message]");
  if (message) {
    message.textContent = isBlocked || Notification.permission === "denied"
      ? "O navegador bloqueou a permissão. Libere notificações do site nas configurações do navegador para receber avisos fora do HUB."
      : "Clique em Permitir para receber popout do navegador mesmo quando estiver em outra aba, como ChatGPT, e com som mais forte.";
  }
}

function armDesktopNotificationPermissionRequest() {
  if (!isAuthenticated() || !isBrowserNotificationSupported()) return;
  if (Notification.permission === "granted") {
    localStorage.setItem(getNotificationPermissionDismissedKey(), "true");
    removeDesktopNotificationPermissionPrompt();
    registerHubNotificationServiceWorker();
    return;
  }
  if (localStorage.getItem(getNotificationPermissionDismissedKey()) === "true") return;

  currentUserSettings.desktopNotifications = true;
  saveUserSettings(currentUserSettings);
  showDesktopNotificationPermissionPrompt(Notification.permission === "denied");

  if (hubNotificationPermissionInteractionBound || Notification.permission === "denied") return;
  hubNotificationPermissionInteractionBound = true;

  const askOnce = () => {
    if (!isAuthenticated() || Notification.permission !== "default") return;
    requestDesktopNotificationPermission();
  };

  document.addEventListener("click", askOnce, { once: true, capture: true });
  document.addEventListener("keydown", askOnce, { once: true, capture: true });
  document.addEventListener("touchstart", askOnce, { once: true, capture: true });
}

function playNotificationTone(audioContext, destination, frequency, startAt, duration, peakVolume, waveType = "square") {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = waveType;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peakVolume), startAt + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.04);
}

function playUserNotificationSound() {
  if (!currentUserSettings.notificationSound) return;
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(1.85, audioContext.currentTime);
    masterGain.connect(audioContext.destination);

    const now = audioContext.currentTime;
    playNotificationTone(audioContext, masterGain, 880, now, 0.30, 0.88, "square");
    playNotificationTone(audioContext, masterGain, 1320, now + 0.25, 0.34, 0.95, "square");
    playNotificationTone(audioContext, masterGain, 1046, now + 0.55, 0.32, 0.86, "sawtooth");
    playNotificationTone(audioContext, masterGain, 1568, now + 0.82, 0.36, 0.92, "square");

    window.setTimeout(() => {
      try { audioContext.close?.(); } catch (_) {}
    }, 1700);
  } catch {

  }
}

function ensureUserNotificationPopoutContainer() {
  let container = document.getElementById(HUB_NOTIFICATION_POPOUT_CONTAINER_ID);
  if (container) return container;

  container = document.createElement("div");
  container.id = HUB_NOTIFICATION_POPOUT_CONTAINER_ID;
  container.className = "hub-notification-popout-container";
  container.setAttribute("aria-live", "polite");
  container.setAttribute("aria-atomic", "false");
  document.body.appendChild(container);
  return container;
}

function removeUserNotificationPopout(popout) {
  if (!popout || popout.dataset.closing === "true") return;
  popout.dataset.closing = "true";
  popout.classList.add("is-leaving");
  window.setTimeout(() => popout.remove(), 180);
}

function removeReadNotificationPopouts(notificationIds = [], messageIds = []) {
  const notificationSet = new Set((Array.isArray(notificationIds) ? notificationIds : [notificationIds]).filter(Boolean).map(String));
  const messageSet = new Set((Array.isArray(messageIds) ? messageIds : [messageIds]).filter(Boolean).map(String));
  if (!notificationSet.size && !messageSet.size) return;

  document.querySelectorAll(".hub-notification-popout").forEach((popout) => {
    const popoutNotificationIds = String(popout.dataset.notificationIds || "").split(",").filter(Boolean);
    const popoutMessageIds = String(popout.dataset.messageIds || "").split(",").filter(Boolean);
    const matchesNotification = popoutNotificationIds.some((id) => notificationSet.has(id));
    const matchesMessage = popoutMessageIds.some((id) => messageSet.has(id));
    if (matchesNotification || matchesMessage) removeUserNotificationPopout(popout);
  });
}

function showUserNotificationPopout(title, message, options = {}) {
  try {
    const container = ensureUserNotificationPopoutContainer();
    const popout = document.createElement("article");
    popout.className = `hub-notification-popout ${options.type || "mensagem"}`;
    popout.tabIndex = 0;
    popout.setAttribute("role", "button");
    popout.setAttribute("aria-label", `${title}. ${message}`);
    popout.dataset.notificationIds = (options.notificationIds || []).filter(Boolean).map(String).join(",");
    popout.dataset.messageIds = (options.messageIds || []).filter(Boolean).map(String).join(",");

    const icon = document.createElement("div");
    icon.className = "hub-notification-popout-icon";
    icon.textContent = options.icon || "\u{1F514}";

    const content = document.createElement("div");
    content.className = "hub-notification-popout-content";

    const heading = document.createElement("strong");
    heading.textContent = title || "Nova notificação";

    const body = document.createElement("p");
    body.textContent = message || "Você possui uma nova atualização no HUB.";

    const hint = document.createElement("span");
    hint.textContent = options.hint || "Clique para abrir o acompanhamento";

    content.append(heading, body, hint);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "hub-notification-popout-close";
    closeButton.setAttribute("aria-label", "Fechar notificação");
    closeButton.textContent = "×";

    popout.append(icon, content, closeButton);
    container.prepend(popout);

    const timer = window.setTimeout(() => removeUserNotificationPopout(popout), options.duration || 12000);

    closeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      window.clearTimeout(timer);
      removeUserNotificationPopout(popout);
    });

    const openCallback = () => {
      window.clearTimeout(timer);
      if (typeof options.onClick === "function") options.onClick();
      removeUserNotificationPopout(popout);
    };

    popout.addEventListener("click", openCallback);
    popout.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openCallback();
      }
    });

    const popouts = [...container.querySelectorAll(".hub-notification-popout")];
    popouts.slice(4).forEach(removeUserNotificationPopout);
  } catch (error) {
    console.warn("Não foi possível exibir o popout de notificação:", error);
  }
}

function openNotificationTrackerFromPopout() {
  if (openNotificationTrackerSafely()) return;
  window.location.href = "index.html?open=acompanhamento";
}

function openNotificationTrackerSafely() {
  try {
    if (!window.notificationTracker && document.getElementById("tracker-modal")) {
      window.notificationTracker = new NotificationTracker();
    }
    if (window.notificationTracker && typeof window.notificationTracker.openModal === "function") {
      window.notificationTracker.openModal();
      return true;
    }
  } catch (error) {
    console.warn("Nao foi possivel iniciar o acompanhamento automaticamente:", error);
  }

  const modal = document.getElementById("tracker-modal");
  if (!modal) return false;
  modal.removeAttribute("hidden");
  document.body.style.overflow = "hidden";
  document.getElementById("tracker-search")?.focus();
  return true;
}

async function showBrowserDesktopNotification(title, body, options = {}) {
  if (!isBrowserNotificationSupported()) return false;

  if (Notification.permission !== "granted") {
    showDesktopNotificationPermissionPrompt(Notification.permission === "denied");
    return false;
  }

  const targetUrl = new URL("index.html?open=acompanhamento", window.location.origin);
  if (options.notificationId) targetUrl.searchParams.set("markNotification", options.notificationId);
  const messageIds = Array.isArray(options.messageIds) ? options.messageIds.map(String).filter(Boolean) : [];
  if (messageIds.length) targetUrl.searchParams.set("markMessages", messageIds.join(","));

  const notificationOptions = {
    body: body || "Você tem uma nova notificação no HUB.",
    icon: "assets/logo.svg",
    badge: "assets/logo.svg",
    tag: options.tag || `hub-rh-notificacao-${Date.now()}`,
    renotify: true,
    requireInteraction: Boolean(options.requireInteraction ?? true),
    silent: false,
    timestamp: Date.now(),
    vibrate: [220, 90, 220, 90, 280],
    data: {
      url: targetUrl.href,
      type: options.type || "geral",
      notificationId: options.notificationId || "",
      messageIds,
    },
  };

  const showViaServiceWorker = async () => {
    try {
      const registration = await registerHubNotificationServiceWorker();
      const readyPromise = navigator.serviceWorker?.ready?.catch?.(() => registration) || Promise.resolve(registration);
      const readyRegistration = await Promise.race([
        readyPromise,
        new Promise((resolve) => window.setTimeout(() => resolve(registration), 1600)),
      ]);
      if (readyRegistration?.showNotification) {
        await readyRegistration.showNotification(title || "HUB RH", notificationOptions);
        return true;
      }
    } catch (swError) {
      console.warn("Notificação via Service Worker bloqueada:", swError);
    }
    return false;
  };

  const showDirect = () => {
    try {
      const notification = new Notification(title || "HUB RH", notificationOptions);
      notification.onclick = () => {
        try { markNotificationsRead(options.notificationId ? [options.notificationId] : [], messageIds); } catch (_) {}
        window.focus?.();
        openNotificationTrackerFromPopout();
        notification.close?.();
      };
      return true;
    } catch (directError) {
      console.warn("Notificação direta do navegador bloqueada:", directError);
      return false;
    }
  };

  if (document.visibilityState === "hidden" || !document.hasFocus?.()) {
    if (await showViaServiceWorker()) return true;
    if (showDirect()) return true;
  } else {
    if (showDirect()) return true;
    if (await showViaServiceWorker()) return true;
  }

  return false;
}

let hubOriginalDocumentTitle = document.title;
let hubNotificationTitleTimer = null;

function flashHubDocumentTitle(title = "Nova notificação") {
  try {
    hubOriginalDocumentTitle = hubOriginalDocumentTitle || document.title;
    if (hubNotificationTitleTimer) window.clearInterval(hubNotificationTitleTimer);
    let visible = false;
    let ticks = 0;
    hubNotificationTitleTimer = window.setInterval(() => {
      ticks += 1;
      visible = !visible;
      document.title = visible ? `?? ${title}` : hubOriginalDocumentTitle;
      if (ticks >= 20 || document.visibilityState === "visible") {
        window.clearInterval(hubNotificationTitleTimer);
        hubNotificationTitleTimer = null;
        document.title = hubOriginalDocumentTitle;
      }
    }, 900);
  } catch (_) {}
}

function updateHubAppBadge(count = 0) {
  try {
    if (navigator.setAppBadge && count > 0) {
      navigator.setAppBadge(count);
    } else if (navigator.clearAppBadge && count <= 0) {
      navigator.clearAppBadge();
    }
  } catch (_) {}
}

function showHubCrossPageNotification(title, message, options = {}) {
  if (!options.skipSound) playUserNotificationSound();
  updateHubAppBadge(1);
  if (document.visibilityState === "hidden" || !document.hasFocus?.()) {
    flashHubDocumentTitle(title || "Nova notificação");
  }

  const openAndMark = () => {
    markNotificationsRead(options.notificationId ? [options.notificationId] : [], options.messageIds || []);
    openNotificationTrackerFromPopout();
  };

  showUserNotificationPopout(title, message, {
    type: options.type,
    icon: options.icon,
    notificationIds: options.notificationId ? [options.notificationId] : [],
    messageIds: options.messageIds || [],
    duration: options.duration || 15000,
    hint: options.hint || "Clique para marcar como lida e abrir o acompanhamento",
    onClick: openAndMark,
  });
  if (!options.skipDesktop) {
    showBrowserDesktopNotification(title, message, {
      type: options.type,
      tag: options.tag,
      requireInteraction: options.requireInteraction,
      notificationId: options.notificationId,
      messageIds: options.messageIds || [],
    });
  }
}

function getRealtimeNotificationText(collection, item = {}) {
  if (collection === "comunicados") {
    const author = item.autor || "Comunicação";
    const text = getChatMessageText(item.mensagem) || "Nova mensagem recebida.";
    return {
      title: `Comunicação - ${author}`,
      message: text.length > 110 ? `${text.slice(0, 107)}...` : text,
      icon: "\u{1F4AC}",
      type: "mensagem",
      tag: `hub-rh-comunicacao-${item.id || Date.now()}`,
    };
  }

  if (collection === "denuncias") {
    return {
      title: "Nova denúncia recebida",
      message: item.descricao || "Uma nova denúncia foi registrada no HUB.",
      icon: "\u{1F4E2}",
      type: "denuncia",
      tag: `hub-rh-denuncia-${item.id || Date.now()}`,
    };
  }

  if (collection === "chamados") {
    return {
      title: "Novo chamado de EPI",
      message: [item.solicitante, item.unidade, item.status].filter(Boolean).join(" - ") || "Um novo chamado foi registrado.",
      icon: "\u{1F527}",
      type: "chamado",
      tag: `hub-rh-chamado-${item.id || Date.now()}`,
    };
  }

  if (collection === "documentosContratados") {
    const quantidade = (item.documentos || []).length;
    return {
      title: "Documentos de contratado recebidos",
      message: [item.nome, item.empresa, quantidade ? `${quantidade} arquivo(s)` : ""].filter(Boolean).join(" - ")
        || "Um contratado enviou documentos pelo formulario publico.",
      icon: "\u{1F4C4}",
      type: "documento",
      tag: `hub-rh-documentos-contratados-${item.id || Date.now()}`,
    };
  }

  if (collection === "candidaturas") {
    const vaga = (data.vagas || []).find((vagaItem) => String(vagaItem.id) === String(item.vaga_id));
    return {
      title: "Curriculo recebido",
      message: [item.nome, vaga?.cargo].filter(Boolean).join(" - ") || "Um curriculo foi enviado para uma vaga.",
      icon: "\u{1F4BC}",
      type: "vaga",
      tag: `hub-rh-candidatura-${item.id || Date.now()}`,
    };
  }
  return null;
}

function shouldNotifyRealtimeItem(collection, item = {}, action = "INSERT") {
  if (!isAuthenticated()) return false;
  if (!item || action === "DELETE") return false;
  if (!["INSERT", "UPDATE"].includes(action)) return false;
  if (["usuarios", "vagas", "atestados"].includes(collection)) return false;
  if (HubModules.byCollection(collection)?.silent) return false;

  if (!canAccessView(getViewForCollection(collection))) return false;

  const signature = [collection, action, item.id || "", item.updatedAt || item.updated_at || item.createdAt || item.created_at || ""].join("|");
  if (signature && signature === lastRealtimeNotificationSignature) return false;

  const currentName = normalizeLoginName(getCurrentUserName());
  const author = normalizeLoginName(item.autor || item.createdBy || item.updatedBy || item.solicitante || "");
  const pageIsVisible = document.visibilityState === "visible" && document.hasFocus?.();
  if (collection === "comunicados" && author && author === currentName && pageIsVisible) return false;

  if (collection === "chamados" && author && author === currentName) return false;

  lastRealtimeNotificationSignature = signature;
  return true;
}

function getNotificationPollingKey(collection, item = {}) {
  if (!collection || !item) return "";
  const identity = item.id || item.notificationId || item.codigoSolicitacao || item.createdAt || item.created_at || "";
  if (!identity) return "";
  const version = item.updatedAt || item.updated_at || item.sortAt || item.createdAt || item.created_at || "";
  return `${collection}|${identity}|${version}`;
}

function wasNotificationAlreadyShown(key) {
  if (!key) return false;
  if (shownNotificationKeys.has(key)) return true;
  shownNotificationKeys.add(key);
  saveShownNotificationKeys();
  return false;
}

function markCurrentNotificationsAsShown() {
  const keys = getNotificationPollingCandidates().map((entry) => entry.key).filter(Boolean);
  const unreadMessageKeys = getUnreadRhMessages()
    .map((item) => item.id)
    .filter(Boolean)
    .map((id) => `mensagem-rh-${id}`);
  let changed = false;
  [...keys, ...unreadMessageKeys].forEach((key) => {
    if (shownNotificationKeys.has(key)) return;
    shownNotificationKeys.add(key);
    changed = true;
  });
  if (changed) saveShownNotificationKeys();
  lastUnreadNotificationCount = getUnreadRhMessages().length;
  initialNotificationSnapshotReady = true;
}

function getNotificationPollingCandidates() {
  const sourceData = typeof data === "object" && data ? data : {};
  const candidates = [];
  const allowedCollections = ["comunicados", "denuncias", "chamados", "candidaturas", "documentosContratados"];

  allowedCollections.forEach((collection) => {
    const rows = Array.isArray(sourceData[collection]) ? sourceData[collection] : [];
    rows.forEach((item) => {
      if (!item) return;
      if (collection === "comunicados" && !canAccessChatChannel(item.canal)) return;
      const key = getNotificationPollingKey(collection, item);
      if (!key) return;
      candidates.push({ collection, item, key, time: getDashboardRecordSortValue(item) || Date.now() });
    });
  });

  return candidates.sort((a, b) => a.time - b.time);
}

function rememberCurrentNotificationKeysForPolling() {
  hubPollingNotificationKeys = new Set(getNotificationPollingCandidates().map((entry) => entry.key));
  hubPollingNotificationsReady = true;
}

function notifyNewItemsFromPolling() {
  if (!isAuthenticated()) return;
  const candidates = getNotificationPollingCandidates();
  if (!hubPollingNotificationsReady) {
    hubPollingNotificationKeys = new Set(candidates.map((entry) => entry.key));
    hubPollingNotificationsReady = true;
    return;
  }

  candidates.forEach(({ collection, item, key }) => {
    if (hubPollingNotificationKeys.has(key)) return;
    hubPollingNotificationKeys.add(key);
    notifyRealtimeItem(collection, item, "INSERT");
  });
}

function notifyRealtimeItem(collection, item = {}, action = "INSERT") {
  const pollingKey = getNotificationPollingKey(collection, item);
  if (wasNotificationAlreadyShown(pollingKey || `${collection}|${action}|${item.id || ""}`)) return;
  if (!shouldNotifyRealtimeItem(collection, item, action)) return;
  const notification = getRealtimeNotificationText(collection, item);
  if (!notification) return;

  const actionLabel = action === "UPDATE" ? "Atualização" : "Nova notificação";
  showHubCrossPageNotification(notification.title, notification.message || actionLabel, {
    type: notification.type,
    icon: notification.icon,
    tag: notification.tag,
    requireInteraction: true,
    notificationId: `${notification.type || collection}-${item.id || Date.now()}`,
    messageIds: collection === "comunicados" && item.id ? [item.id] : [],
  });

  if (pollingKey) hubPollingNotificationKeys.add(pollingKey);
}

function startAuthenticatedNotificationsOnAnyPage() {
  if (!isAuthenticated() || !postgresClient) return;
  registerHubNotificationServiceWorker();
  armDesktopNotificationPermissionRequest();
  setupRealtime();
  setupAutoRefresh();
}

function notifyUnreadRhMessages(count) {
  if (!initialNotificationSnapshotReady) {
    markCurrentNotificationsAsShown();
    lastUnreadNotificationCount = count;
    return;
  }

  const unreadIds = getUnreadRhMessages().map((item) => item.id).filter(Boolean).map(String);
  const newUnreadIds = unreadIds.filter((id) => !shownNotificationKeys.has(`mensagem-rh-${id}`));
  if (!newUnreadIds.length) {
    lastUnreadNotificationCount = count;
    return;
  }

  const newMessageCount = newUnreadIds.length;
  const messageText = `${newMessageCount} nova(s) mensagem(ns) nao lida(s).`;

  newUnreadIds.forEach((id) => wasNotificationAlreadyShown(`mensagem-rh-${id}`));
  playUserNotificationSound();
  if (currentUserSettings.desktopNotifications && isBrowserNotificationSupported() && Notification.permission === "granted") {
    const notification = new Notification("Comunicação", {
      body: messageText,
      icon: "assets/logo.svg",
      badge: "assets/logo.svg",
      tag: "hub-rh-comunicacao",
      requireInteraction: true,
    });
    notification.onclick = () => {
      try { markNotificationsRead([`mensagem-rh-${newUnreadIds[0] || Date.now()}`], newUnreadIds); } catch (_) {}
      window.focus?.();
      openNotificationTrackerFromPopout();
      notification.close?.();
    };
  }

  showHubCrossPageNotification("Comunicação", messageText, {
    type: "mensagem",
    icon: "\u{1F4AC}",
    tag: "hub-rh-comunicacao",
    requireInteraction: true,
    notificationId: `mensagem-rh-${newUnreadIds[0] || Date.now()}`,
    messageIds: newUnreadIds,
    skipSound: true,
    skipDesktop: true,
  });

  lastUnreadNotificationCount = count;
}
