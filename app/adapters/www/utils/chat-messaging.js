function getChatMessageFilterText(item = {}) {
  const attachment = item.arquivo && typeof item.arquivo === "object" ? item.arquivo : null;
  return normalizeSettingsText([
    item.autor,
    getChatMessageText(item.mensagem),
    item.createdAt,
    attachment?.name,
    attachment?.type,
    attachment?.mimeType,
  ].filter(Boolean).join(" "));
}

function syncChatMessageFilterVisibility() {
  const wrap = document.getElementById("chat-message-filter-wrap");
  const input = document.getElementById("chat-message-filter");
  const shouldShow = Boolean(chatMessageFilterVisible && activeChatChannel);
  if (wrap) wrap.hidden = !shouldShow;
  if (input) {
    input.disabled = !activeChatChannel;
    if (!shouldShow && input.value) input.value = "";
  }
}

function clearChatMessageFilter() {
  chatMessageFilterQuery = "";
  chatMessageFilterVisible = false;
  syncChatMessageFilterVisibility();
}

function focusChatMessageFilter() {
  activateView("comunicacao");
  if (!activeChatChannel) {
    renderChat();
    return;
  }
  chatMessageFilterVisible = true;
  syncChatMessageFilterVisibility();
  const filterInput = document.getElementById("chat-message-filter");
  if (filterInput) {
    filterInput.focus();
    filterInput.select();
  }
}

function resetChatComposerState() {
  const chatForm = document.getElementById("chat-form");
  const messageInput = chatForm?.querySelector('textarea[name="mensagem"]');
  if (messageInput) messageInput.value = "";
  clearChatSelectedFile();
}

function closeActiveChat() {
  if (!activeChatChannel) return false;
  activeChatChannel = "";
  clearChatMessageFilter();
  resetChatComposerState();
  closeChatAttachMenu();
  closeChatEmojiMenu();
  renderChatChannels();
  renderChat();
  return true;
}

function wrapChatSelection(prefix, suffix = prefix) {
  const input = document.querySelector('#chat-form textarea[name="mensagem"]');
  if (!input || input.disabled) return false;
  const value = input.value || "";
  const start = Number.isInteger(input.selectionStart) ? input.selectionStart : value.length;
  const end = Number.isInteger(input.selectionEnd) ? input.selectionEnd : start;
  const selected = value.slice(start, end);
  input.value = `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`;
  const cursorStart = start + prefix.length;
  const cursorEnd = cursorStart + selected.length;
  input.focus();
  input.setSelectionRange(cursorStart, cursorEnd || cursorStart);
  return true;
}

function applyChatEditingShortcut(key) {
  const normalizedKey = String(key || "").toLowerCase();
  if (normalizedKey === "b") return wrapChatSelection("**");
  if (normalizedKey === "i") return wrapChatSelection("_");
  if (normalizedKey === "u") return wrapChatSelection("<u>", "</u>");
  return false;
}

function linkifyChatText(html = "") {
  return html.replace(/(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi, (match) => {
    let url = match;
    let trail = "";
    const trailMatch = url.match(/[.,!?;:)\]"'”’]+$/);
    if (trailMatch) {
      trail = trailMatch[0];
      url = url.slice(0, -trail.length);
    }
    if (!url) return match;
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow" class="chat-link">${url}</a>${trail}`;
  });
}

function renderFormattedChatText(message = "") {
  let html = escapeHtml(message);
  html = linkifyChatText(html);
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");
  html = html.replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, "<u>$1</u>");
  return html.replace(/\n/g, "<br>");
}

function handleSettingsKeyboardShortcut(event) {
  if (event.defaultPrevented || event.isComposing) return;
  const target = event.target;
  const isTyping = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
  if (event.key === "Escape") {
    closeChatAttachMenu();
    closeChatEmojiMenu();
    closeUserMenuDropdown();
    if (document.getElementById("comunicacao")?.classList.contains("active") && closeActiveChat()) {
      event.preventDefault();
    }
    return;
  }
  if (!currentUserSettings.keyboardShortcuts) return;
  if (!event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.key.toLowerCase() === "k") {
    event.preventDefault();
    focusChatMessageFilter();
    return;
  }
  if (["b", "i", "u"].includes(event.key.toLowerCase()) && target?.matches?.('#chat-form textarea[name="mensagem"]')) {
    event.preventDefault();
    applyChatEditingShortcut(event.key);
    return;
  }
  if (/^[0-9]$/.test(event.key) && !isTyping) {
    const visibleNavButtons = [...document.querySelectorAll(".nav-item[data-view]")].filter((button) => !button.hidden);
    const shortcutIndex = event.key === "0" ? 9 : Number(event.key) - 1;
    const button = visibleNavButtons[shortcutIndex];
    if (button) {
      event.preventDefault();
      activateView(button.dataset.view);
      closeMobileMenu();
    }
  }
}

function renderChatChannels() {
  const target = document.getElementById("chat-channel-list");
  if (!target) return;

  const channels = getChatChannels();
  if (activeChatChannel && (!channels.some((channel) => channel.id === activeChatChannel) || !canAccessChatChannel(activeChatChannel))) {
    activeChatChannel = "";
  }

  if (!channels.length) {
    target.innerHTML = '<p class="empty-state">Nenhum canal interno disponivel.</p>';
    return;
  }

  target.innerHTML = channels
    .map((channel) => {
      const unreadCount = getUnreadRhMessages().filter(item => normalizeChatChannel(item.canal) === channel.id).length;
      const badge = unreadCount > 0 ? `<span class="chat-badge">${unreadCount}</span>` : "";

      let avatarHtml = "";
      if (channel.isGroup) {
        avatarHtml = `<div class="chat-avatar-fallback"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>`;
      } else if (channel.targetUser) {
        avatarHtml = getAuthorAvatar(channel.targetUser, channel.avatarPath);
      }

      return `
        <button class="channel-item ${channel.isGroup ? "is-group" : ""} ${channel.id === activeChatChannel ? "active" : ""}" data-chat-channel="${escapeHtml(channel.id)}" type="button">
          <div class="inline-flex-sm channel-item-body">
            ${avatarHtml}
            <span class="clip-text">${escapeHtml(channel.label)}</span>
          </div>
          ${badge}
        </button>
      `;
    })
    .join("");
}

function recordRenderError(section, error) {
  const detail = {
    section,
    message: error?.message || String(error),
    stack: error?.stack || "",
    at: new Date().toISOString(),
  };
  window.__hubRenderErrors = Array.isArray(window.__hubRenderErrors) ? window.__hubRenderErrors : [];
  window.__hubRenderErrors.push(detail);
  console.error(`Erro ao renderizar ${section}:`, error);
  document.body?.setAttribute("data-hub-render-error", section);
}

function safeRenderSection(section, renderFn) {
  try {
    return renderFn();
  } catch (error) {
    recordRenderError(section, error);
    return null;
  }
}

function renderMalotesSection() {
  renderAll();
}

function renderAll() {
  safeRenderSection("local-chat-state", applyLocalChatState);
  safeRenderSection("current-user", renderCurrentUser);
  safeRenderSection("role-access", applyRoleAccess);
  safeRenderSection("account-settings", renderAccountSettings);
  safeRenderSection("dashboard", renderDashboard);
  safeRenderSection("public-vagas", renderPublicVagas);

  safeRenderSection("denuncias", renderDenunciasSection);
  safeRenderSection("feedbacks", renderFeedbacksSection);

  safeRenderSection("chat-channels", renderChatChannels);
  safeRenderSection("chat", renderChat);

  HubModules.list.forEach((mod) => safeRenderSection(mod.view, mod.render));
  safeRenderSection("documentos-contratados", renderDocumentosContratados);

  safeRenderSection("chamados", renderChamadosSection);

  safeRenderSection("vagas", renderVagasSection);

  safeRenderSection("equipe", renderTeamUsers);
  safeRenderSection("data-counts", publishHubDataCounts);

  if (shouldRepairCoreCollections()) {
    window.setTimeout(() => {
      repairCoreCollectionsFromBootstrap();
    }, 0);
  }
}

function getAuthorAvatar(authorName, knownAvatarPath = "") {
  const normalizedAuthor = normalizeLoginName(authorName);
  const user = (data.usuarios || []).find((u) => normalizeLoginName(u.nome) === normalizedAuthor)
    || ([normalizeLoginName(getCurrentUserName()), normalizeLoginName(currentUserProfile?.nome)].includes(normalizedAuthor)
      ? currentUserProfile
      : null);
  const avatarPath = knownAvatarPath || user?.foto_perfil || "";
  if (avatarPath && isHttpUrl(avatarPath)) {
    return `<img src="${escapeHtml(avatarPath)}" alt="${escapeHtml(authorName)}" class="chat-avatar" />`;
  }
  if (avatarPath) {
    const signedUrl = privateAvatarUrlCache.get(avatarPath);
    if (signedUrl) {
      return `<img src="${escapeHtml(signedUrl)}" alt="${escapeHtml(authorName)}" class="chat-avatar" />`;
    }

    requestPrivateAvatarUrl(avatarPath);
    const initial = String(authorName || "?").charAt(0).toUpperCase();
    return `<div class="chat-avatar-fallback" data-private-avatar-path="${escapeHtml(avatarPath)}" data-private-avatar-alt="${escapeHtml(authorName)}">${initial}</div>`;
  }
  const initial = String(authorName || "?").charAt(0).toUpperCase();
  return `<div class="chat-avatar-fallback">${initial}</div>`;
}

function renderNotificationChatThread(messages = [], options = {}) {
  const normalizedMessages = Array.isArray(messages) ? [...messages] : [];
  normalizedMessages.sort((a, b) => {
    const aTime = typeof getDashboardRecordSortValue === "function" ? getDashboardRecordSortValue(a) : new Date(a?.createdAt || 0).getTime();
    const bTime = typeof getDashboardRecordSortValue === "function" ? getDashboardRecordSortValue(b) : new Date(b?.createdAt || 0).getTime();
    return aTime - bTime;
  });

  if (!normalizedMessages.length) {
    return `<p class="empty-state">Nenhuma mensagem disponível para exibição.</p>`;
  }

  const currentUser = typeof getCurrentUserName === "function" ? getCurrentUserName() : "";
  let previousDate = "";

  const html = normalizedMessages.map((item) => {
    const messageDate = typeof getChatMessageDate === "function" ? getChatMessageDate(item.createdAt) : "";
    const messageTime = typeof getChatMessageTimeLabel === "function" ? getChatMessageTimeLabel(item.createdAt) : (item.createdAt || "");
    const separator = messageDate && messageDate !== previousDate
      ? `<div class="chat-date-separator">${escapeHtml(messageDate)}</div>`
      : "";
    previousDate = messageDate || previousDate;

    const authorName = item.autor || "Equipe";
    const initial = escapeHtml(String(authorName).trim().charAt(0).toUpperCase() || "?");
    const avatar = `<div class="chat-avatar-fallback">${initial}</div>`;
    const visibleMessage = typeof getChatMessageText === "function" ? getChatMessageText(item.mensagem) : item.mensagem;
    const formattedMessage = visibleMessage
      ? (typeof renderFormattedChatText === "function" ? renderFormattedChatText(visibleMessage) : escapeHtml(visibleMessage))
      : "";
    const attachment = item.arquivo && typeof renderChatAttachment === "function" ? renderChatAttachment(item.arquivo) : "";

    return `${separator}
      <article class="chat-message ${authorName === currentUser ? "own" : ""}">
        <div class="chat-message-header">
          ${avatar}
          <div class="chat-author">
            <span>${escapeHtml(authorName)}</span>
            <time>${escapeHtml(messageTime)}</time>
          </div>
        </div>
        ${formattedMessage ? `<p>${formattedMessage}</p>` : ""}
        ${attachment}
      </article>`;
  }).join("");

  return `<div class="tracker-chat-thread${options.compact ? " compact" : ""}">${html}</div>`;
}

function openDashboardActivity(index) {
  const item = visibleDashboardActivityItems[Number(index)];
  if (!item) return;

  markNotificationsRead(item.notificationId ? [item.notificationId] : [], item.messageIds || []);

  const hasChatMessages = Array.isArray(item.chatMessages) && item.chatMessages.length;

  if (hasChatMessages && window.notificationTracker && typeof window.notificationTracker.openModal === "function") {
    const tracker = window.notificationTracker;
    tracker.openModal();

    const trackerNotification = (tracker.notifications || []).find((notification) => (
      String(notification.id) === "mensagens-rh"
      || String(notification.id) === String(item.notificationId || "")
      || notification.type === "mensagem"
    ));

    const fallbackNotification = {
      id: "mensagens-rh",
      type: "mensagem",
      title: item.title || "Mensagens do RH",
      description: item.text || "Mensagens no acompanhamento",
      details: item.details || "",
      time: item.date || item.createdAt || "Recentemente",
      dateTime: typeof tracker.getTimeValue === "function"
        ? tracker.getTimeValue(item.dateTime || item.date || item.createdAt || Date.now())
        : Date.now(),
      unread: Boolean(item.unread),
      status: item.unread ? "unread" : "pending",
      view: "comunicacao",
      icon: "\u{1F4AC}",
      badgeText: item.unread ? "Não lido" : "",
      messageIds: Array.isArray(item.messageIds) ? item.messageIds.map(String) : [],
      chatMessages: item.chatMessages,
    };

    const notificationToOpen = trackerNotification || fallbackNotification;
    const readNotification = typeof tracker.markNotificationRead === "function"
      ? tracker.markNotificationRead(notificationToOpen)
      : notificationToOpen;

    if (typeof tracker.showDetailView === "function") {
      tracker.showDetailView(readNotification || notificationToOpen);
    }

    renderDashboard();
    return;
  }

  const existing = document.getElementById("custom-modal");
  if (existing) existing.remove();

  let detailContent = "";

  if (hasChatMessages) {
    detailContent = `
      <div class="tracker-notification-detail mensagem dashboard-message-detail-fallback">
        <div class="tracker-detail-card">
          <div class="tracker-detail-topline">
            <div class="tracker-detail-icon">??</div>
            <div>
              <span class="tracker-notification-type">Mensagem RH</span>
              <h3>${escapeHtml(item.title || "Mensagens do RH")}</h3>
              ${item.text ? `<p>${escapeHtml(item.text)}</p>` : ""}
            </div>
          </div>
          <div class="tracker-detail-body">${renderNotificationChatThread(item.chatMessages)}</div>
        </div>
      </div>`;
  } else {
    const details = String(item.details || item.text || "Sem detalhes disponíveis.")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const detailMarkup = [];
    for (let detailIndex = 0; detailIndex < details.length; detailIndex += 1) {
      const detail = details[detailIndex];
      if (/^Itens (do malote|solicitados):$/i.test(detail)) {
        const itemLines = [];
        while (details[detailIndex + 1] && !/^(Observações|Status|Data):/i.test(details[detailIndex + 1])) {
          detailIndex += 1;
          itemLines.push(details[detailIndex]);
        }
        detailMarkup.push(`<li class="dashboard-detail-section"><strong>${escapeHtml(detail)}</strong><ul>${itemLines.map((itemLine) => `<li>${escapeHtml(itemLine)}</li>`).join("")}</ul></li>`);
        continue;
      }
      detailMarkup.push(`<li>${escapeHtml(detail)}</li>`);
    }
    detailContent = `<ul class="dashboard-detail-list">${detailMarkup.join("")}</ul>`;
  }

  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header info">${escapeHtml(item.title)}</div>
      <div class="modal-body">${detailContent}</div>
      <div class="modal-footer"><button class="primary-button" data-action="close-modal">Entendi</button></div>
    </div>
  `;
  overlay.querySelector('[data-action="close-modal"]')?.addEventListener("click", () => {
    overlay.remove();
    renderDashboard();
    window.notificationTracker?.loadNotifications?.();
  });
  document.body.appendChild(overlay);
}

document.getElementById("dashboard-notifications-next")?.addEventListener("click", () => {
  dashboardNotificationOffset += 3;
  renderDashboard();
});

document.getElementById("dashboard-notifications-prev")?.addEventListener("click", () => {
  dashboardNotificationOffset = Math.max(0, dashboardNotificationOffset - 3);
  renderDashboard();
});

function renderChat(options = {}) {
  const { skipPostRender = false } = options;
  const target = document.getElementById("chat-feed");
  if (!target) return;
  const currentUser = getCurrentUserName();
  const activeChannel = getActiveChatChannel();

  const title = document.getElementById("chat-title");
  const subtitle = document.getElementById("chat-subtitle");
  const messageInput = document.querySelector('#chat-form textarea[name="mensagem"]');
  const sendButton = document.querySelector("#chat-form .send-button");
  const fileButton = document.getElementById("chat-attach-menu-button");
  const fileInput = document.getElementById("chat-file");
  const emojiButton = document.getElementById("chat-emoji-button");
  const recordButton = document.getElementById("record-audio-button");
  const pollButton = document.getElementById("create-poll-button");
  const filterInput = document.getElementById("chat-message-filter");
  const pollMenuOption = document.querySelector('[data-attach-type="poll"]');
  const chatForm = document.getElementById("chat-form");
  if (!activeChannel) {
    clearChatMessageFilter();
    if (title) title.textContent = "Comunicação interna";
    if (subtitle) subtitle.textContent = "Selecione um canal para abrir a conversa";
    if (messageInput) {
      messageInput.placeholder = "Escolha um chat ao lado para enviar mensagens";
      messageInput.disabled = true;
    }
    if (sendButton) sendButton.disabled = true;
    if (fileInput) fileInput.disabled = true;
    if (emojiButton) emojiButton.disabled = true;
    if (recordButton) recordButton.disabled = true;
    if (filterInput) filterInput.disabled = true;
    if (pollButton) {
      pollButton.hidden = true;
      pollButton.disabled = true;
    }
    if (pollMenuOption) pollMenuOption.hidden = true;
    if (fileButton) {
      fileButton.disabled = true;
      fileButton.classList.add("disabled");
    }
    if (chatForm) chatForm.hidden = true;
    closeChatAttachMenu();
    closeChatEmojiMenu();
    target.innerHTML = `
      <div class="chat-empty-state chat-empty-state-lg">
        <img src="assets/logo.svg" alt="HUB" />
        <strong>HUB</strong>
      </div>
    `;
    return;
  }

  if (title) title.textContent = activeChannel.label;
  if (subtitle) subtitle.textContent = activeChannel.subtitle;
  if (chatForm) chatForm.hidden = false;
  if (messageInput) {
    messageInput.placeholder = isGeneralChatChannel(activeChannel.id) ? `Escreva em ${activeChannel.label}` : `Mensagem para ${activeChannel.label}`;
    messageInput.disabled = false;
  }
  if (sendButton) sendButton.disabled = false;
  if (fileInput) fileInput.disabled = false;
  if (emojiButton) emojiButton.disabled = false;
  if (recordButton) recordButton.disabled = false;
  if (filterInput) filterInput.disabled = false;
  syncChatMessageFilterVisibility();
  if (pollButton) {
    const canCreatePoll = isGeneralChatChannel(activeChannel.id);
    pollButton.hidden = true;
    pollButton.disabled = !canCreatePoll;
    if (pollMenuOption) pollMenuOption.hidden = !canCreatePoll;
  }
  if (fileButton) {
    fileButton.disabled = false;
    fileButton.classList.remove("disabled");
  }

  const normalizedFilter = normalizeSettingsText(chatMessageFilterQuery);
  const messages = mergeLocalChatMessages(data.comunicados || [], data.comunicados || []).filter((item) => {
    const channel = normalizeChatChannel(item.canal);
    if (channel !== activeChatChannel) return false;
    if (!canAccessChatChannel(channel)) return false;
    return !normalizedFilter || getChatMessageFilterText(item).includes(normalizedFilter);
  }).sort(compareChatMessagesOldestFirst);

  if (!messages.length) {
    target.innerHTML = normalizedFilter
      ? '<p class="empty-state">Nenhuma mensagem encontrada para este filtro.</p>'
      : '<p class="empty-state">Nenhuma mensagem neste chat ainda.</p>';
    return;
  }

  let previousDate = "";
  const chatHtml = messages.map((item) => {
    const attachment = renderChatAttachment(item.arquivo);
    const envelope = parseChatMessageEnvelope(item.mensagem);
    const poll = parseChatPollMessage(item.mensagem);
    const messageBody = poll
      ? renderChatPoll(item, poll)
      : envelope.text
        ? `<p>${renderFormattedChatText(envelope.text)}</p>`
        : "";
    const messageDate = getChatMessageDate(item.createdAt);
    const messageTime = getChatMessageTimeLabel(item.createdAt);
    const editedLabel = envelope.edited ? '<span class="chat-edited-label">Editada</span>' : "";

    const separator = messageDate && messageDate !== previousDate
      ? `<div class="chat-date-separator">${escapeHtml(messageDate)}</div>`
      : "";

    previousDate = messageDate || previousDate;

    return `${separator}
      <article class="chat-message ${item.autor === currentUser ? "own" : ""}" data-chat-message-id="${escapeHtml(item.id)}">
        <div class="chat-message-header">
          ${getAuthorAvatar(item.autor)}
          <div class="chat-author">
            <span>${escapeHtml(item.autor)}</span>
            <time>${escapeHtml(messageTime)}</time>${editedLabel}
          </div>
        </div>
        ${messageBody}
        ${attachment}
      </article>
    `;
  }).join("");

  target.innerHTML = chatHtml;

  scrollChatFeedToBottom();
  if (skipPostRender) return;

  hydrateChatMediaPreviews();

  checkAndMarkChatAsRead();
}

function scrollChatFeedToBottom() {
  const target = document.getElementById("chat-feed");
  if (!target) return;
  target.scrollTop = target.scrollHeight;
}

function renderChatAttachment(attachment) {
  if (!attachment) return "";

  const bucket = escapeHtml(getHubPostgreSQLConfig().chatFilesBucket || "hub-chat-files");
  const path = escapeHtml(attachment.url || "");
  const name = escapeHtml(attachment.name || "Arquivo");
  const size = escapeHtml(formatFileSize(attachment.size));
  const chip = `<button class="attachment-chip" type="button" data-private-storage-bucket="${bucket}" data-private-storage-path="${path}">Arquivo: ${name} ${size}</button>`;

  if (!attachment.url) return chip;

  if (isChatImageFile(attachment)) {
    const cacheKey = `${bucket}:${path}`;
    const src = chatMediaSignedUrlCache.has(cacheKey) ? chatMediaSignedUrlCache.get(cacheKey) : TRANSPARENT_IMAGE_PLACEHOLDER;
    return `
      <div class="chat-attachment chat-image-attachment">
        <img
          class="chat-image-preview"
          src="${src}"
          loading="lazy"
          data-action="open-chat-image"
          data-chat-image-bucket="${bucket}"
          data-chat-image-path="${path}"
          data-chat-image-name="${name}"
          alt="${name}"
          data-chat-image-preview
        />
      </div>
    `;
  }

  if (isChatAudioFile(attachment)) {
    return `
      <div class="chat-attachment chat-audio-attachment">
        <audio class="chat-audio-preview" controls preload="metadata" data-chat-audio-preview data-chat-audio-bucket="${bucket}" data-chat-audio-path="${path}"></audio>
        ${chip}
      </div>
    `;
  }

  return chip;
}

function createChatPollOptionField(index, required = false) {
  const canRemove = index > 2;
  return `
    <div class="chat-poll-option-editor" data-chat-poll-option>
      <label>Opção ${index}
        <input name="opcao" type="text" maxlength="80" placeholder="${required ? (index === 1 ? "Primeira opção" : "Segunda opção") : "Opcional"}" ${required ? "required" : ""} />
      </label>
      ${canRemove ? `<button class="secondary-link chat-poll-remove-option" type="button" data-action="remove-chat-poll-option" aria-label="Excluir opção ${index}">Excluir</button>` : ""}
    </div>
  `;
}

function refreshChatPollOptionFields(formElement) {
  const list = formElement?.querySelector("#chat-poll-options");
  if (!list) return;
  list.querySelectorAll("[data-chat-poll-option]").forEach((field, index) => {
    const optionNumber = index + 1;
    const label = field.querySelector("label");
    const input = field.querySelector('input[name="opcao"]');
    const removeButton = field.querySelector('[data-action="remove-chat-poll-option"]');
    if (label) label.firstChild.textContent = `Opção ${optionNumber}`;
    if (input) {
      input.required = optionNumber <= 2;
      if (optionNumber === 1) input.placeholder = "Primeira opção";
      else if (optionNumber === 2) input.placeholder = "Segunda opção";
      else input.placeholder = "Opcional";
    }
    if (removeButton) {
      removeButton.hidden = optionNumber <= 2;
      removeButton.setAttribute("aria-label", `Excluir opção ${optionNumber}`);
    }
  });
}

function addChatPollOptionField(formElement) {
  const list = formElement?.querySelector("#chat-poll-options");
  if (!list) return;
  const currentTotal = list.querySelectorAll('input[name="opcao"]').length;
  if (currentTotal >= 8) {
    showModal("Limite de opções", "A enquete pode ter no máximo 8 opções.", "info");
    return;
  }
  list.insertAdjacentHTML("beforeend", createChatPollOptionField(currentTotal + 1));
  refreshChatPollOptionFields(formElement);
  list.querySelector('[data-chat-poll-option]:last-child input')?.focus();
}

function removeChatPollOptionField(button) {
  const formElement = button?.closest("#chat-poll-form");
  const list = formElement?.querySelector("#chat-poll-options");
  const fields = list?.querySelectorAll("[data-chat-poll-option]") || [];
  if (fields.length <= 2) {
    showModal("Mínimo de opções", "A enquete precisa ter pelo menos 2 opções.", "info");
    return;
  }
  button.closest("[data-chat-poll-option]")?.remove();
  refreshChatPollOptionFields(formElement);
}

function showChatPollModal() {
  const activeChannel = getActiveChatChannel();
  if (!activeChannel || !isGeneralChatChannel(activeChannel.id)) {
    showModal("Enquete indisponivel", "As enquetes podem ser criadas somente nos chats de grupo.", "error");
    return;
  }

  document.getElementById("custom-modal")?.remove();
  const overlay = document.createElement("div");
  overlay.id = "custom-modal";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header info">Criar enquete</div>
      <form class="modal-body chat-poll-form" id="chat-poll-form">
        <label>Pergunta
          <input name="pergunta" type="text" maxlength="180" placeholder="Ex: Qual melhor dia para reunião?" required />
        </label>
        <div class="chat-poll-options-editor" id="chat-poll-options">
          ${createChatPollOptionField(1, true)}
          ${createChatPollOptionField(2, true)}
        </div>
        <button class="secondary-link chat-poll-add-option" type="button" data-action="add-chat-poll-option">Adicionar opção</button>
      </form>
      <div class="modal-footer">
        <button class="secondary-link" type="button" data-action="close-modal">Cancelar</button>
        <button class="primary-button" type="submit" form="chat-poll-form">Criar enquete</button>
      </div>
    </div>
  `;

  overlay.querySelector('[data-action="close-modal"]')?.addEventListener("click", () => overlay.remove());
  overlay.querySelector("#chat-poll-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const created = await criarEnqueteChat(event.currentTarget);
    if (created) overlay.remove();
  });
  overlay.querySelector('[data-action="add-chat-poll-option"]')?.addEventListener("click", () => {
    addChatPollOptionField(overlay.querySelector("#chat-poll-form"));
  });
  overlay.querySelector("#chat-poll-options")?.addEventListener("click", (event) => {
    const removeButton = event.target.closest('[data-action="remove-chat-poll-option"]');
    if (removeButton) removeChatPollOptionField(removeButton);
  });

  document.body.appendChild(overlay);
  overlay.querySelector('input[name="pergunta"]')?.focus();
}

async function criarEnqueteChat(formElement) {
  const activeChannel = getActiveChatChannel();
  if (!activeChannel || !isGeneralChatChannel(activeChannel.id) || !canAccessChatChannel(activeChannel.id)) {
    showModal("Acao nao permitida", "Voce so pode criar enquetes nos grupos que participa.", "error");
    return false;
  }

  const form = new FormData(formElement);
  const question = String(form.get("pergunta") || "").trim();
  const options = form.getAll("opcao").map((value) => String(value || "").trim()).filter(Boolean);
  const uniqueOptions = [...new Set(options.map((option) => option.toLocaleLowerCase("pt-BR")))];

  if (!question) {
    showModal("Pergunta obrigatoria", "Informe a pergunta da enquete.", "error");
    return false;
  }
  if (options.length < 2 || uniqueOptions.length < 2) {
    showModal("Opcoes obrigatorias", "Informe pelo menos duas opcoes diferentes para a enquete.", "error");
    return false;
  }

  return addItem("comunicados", {
    autor: getCurrentUserName(),
    canal: activeChannel.id,
    mensagem: serializeChatPoll({ question, options, votes: {}, createdBy: getCurrentUserName() }),
    arquivo: null,
  });
}

async function votarEnqueteChat(messageId, optionIndex) {
  const message = (data.comunicados || []).find((item) => String(item.id) === String(messageId));
  const poll = parseChatPollMessage(message?.mensagem);
  const activeChannel = normalizeChatChannel(message?.canal);
  const selectedIndex = Number(optionIndex);

  if (!message || !poll || !Number.isInteger(selectedIndex) || !poll.options[selectedIndex]) return;
  if (!isGeneralChatChannel(activeChannel) || !canAccessChatChannel(activeChannel)) {
    showModal("Acao nao permitida", "Voce nao possui acesso a esta enquete.", "error");
    return;
  }

  const voter = normalizeLoginName(getCurrentUserName());
  poll.votes = poll.votes && typeof poll.votes === "object" && !Array.isArray(poll.votes) ? poll.votes : {};
  poll.votes[voter] = selectedIndex;
  const nextMessage = serializeChatPoll(poll);
  const previousMessage = message.mensagem;

  message.mensagem = nextMessage;
  renderChat();

  const success = await updateItem("comunicados", message.id, {
    autor: message.autor,
    canal: activeChannel,
    mensagem: nextMessage,
    arquivo: message.arquivo || null,
    createdBy: message.createdBy || message.autor,
  });

  if (!success) {
    message.mensagem = previousMessage;
    renderChat();
  }
}

function hydrateChatMediaPreviews() {
  document.querySelectorAll("[data-chat-image-preview], [data-chat-audio-preview]").forEach((media) => {
    const path = media.dataset.chatImagePath || media.dataset.chatAudioPath || media.dataset.privateStoragePath || "";
    const bucket = media.dataset.chatImageBucket || media.dataset.chatAudioBucket || media.dataset.privateStorageBucket || getHubPostgreSQLConfig().chatFilesBucket || "hub-chat-files";
    if (!path || media.dataset.previewLoaded === "true") return;

    const cacheKey = `${bucket}:${path}`;
    if (chatMediaSignedUrlCache.has(cacheKey)) {
      media.addEventListener("load", scrollChatFeedToBottom, { once: true });
      media.addEventListener("loadedmetadata", scrollChatFeedToBottom, { once: true });
      media.src = chatMediaSignedUrlCache.get(cacheKey);
      media.dataset.previewLoaded = "true";
      requestChatFeedBottomScroll();
      return;
    }

    createPrivateStorageUrl(bucket, path)
      .then((signedUrl) => {
        chatMediaSignedUrlCache.set(cacheKey, signedUrl);
        media.addEventListener("load", scrollChatFeedToBottom, { once: true });
        media.addEventListener("loadedmetadata", scrollChatFeedToBottom, { once: true });
        media.src = signedUrl;
        media.dataset.previewLoaded = "true";
        requestChatFeedBottomScroll();
      })
      .catch((error) => {
        console.warn("Nao foi possivel carregar previa do anexo:", error);
        media.removeAttribute("src");
        delete media.dataset.previewLoaded;
      });
  });
}

function requestChatFeedBottomScroll() {
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(scrollChatFeedToBottom);
    return;
  }
  window.setTimeout(scrollChatFeedToBottom, 0);
}
