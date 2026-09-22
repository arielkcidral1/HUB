function rememberDeletedChatMessage(id) {
  if (!id) return;
  locallyDeletedChatMessageIds.add(String(id));
  localChatEchoMessages.delete(String(id));
  data.comunicados = (data.comunicados || []).filter((item) => String(item.id) !== String(id));
}

function forgetDeletedChatMessage(id) {
  if (!id) return;
  locallyDeletedChatMessageIds.delete(String(id));
  applyLocalChatState();
}

function applyLocalChatState() {
  data.comunicados = mergeLocalChatMessages(data.comunicados || [], data.comunicados || []);
  return data.comunicados;
}

function markChatMessageAsLocalEcho(message) {
  if (!message?.id) return message;
  const localMessage = { ...message, _localEcho: true };
  localChatEchoMessages.set(String(localMessage.id), localMessage);
  applyLocalChatState();
  return localMessage;
}

function forgetLocalChatEchoMessage(id) {
  if (!id) return;
  localChatEchoMessages.delete(String(id));
  applyLocalChatState();
}

function getChatMessageDedupKey(item = {}) {
  const attachment = item.arquivo || {};
  const createdTime = new Date(item.sortAt || item.createdAt || 0).getTime();
  const timeBucket = Number.isFinite(createdTime) && createdTime > 0 ? Math.floor(createdTime / 15000) : "";
  return [
    normalizeChatChannel(item.canal || ""),
    normalizeLoginName(item.autor || ""),
    String(item.mensagem || "").trim(),
    attachment.name || "",
    attachment.size || 0,
    timeBucket,
  ].join("|");
}

function dedupeChatMessages(messages = []) {
  const byId = new Set();
  const byLogicalKey = new Set();
  const result = [];

  (messages || [])
    .filter(Boolean)
    .sort((a, b) => getDashboardRecordSortValue(b) - getDashboardRecordSortValue(a))
    .forEach((item) => {
      const id = String(item.id || "");
      if (id && byId.has(id)) return;
      const logicalKey = getChatMessageDedupKey(item);
      if (logicalKey && byLogicalKey.has(logicalKey)) return;
      if (id) byId.add(id);
      if (logicalKey) byLogicalKey.add(logicalKey);
      result.push(item);
    });

  return result;
}

function mergeLocalChatMessages(freshMessages = [], currentMessages = data.comunicados || []) {
  const visibleFreshMessages = (freshMessages || []).filter((item) => !locallyDeletedChatMessageIds.has(String(item.id)));
  const freshIds = new Set(visibleFreshMessages.map((item) => String(item.id)));
  visibleFreshMessages.forEach((item) => {
    if (item?.id && !item._pending && !item._localEcho) localChatEchoMessages.delete(String(item.id));
  });

  const currentLocalMessages = (currentMessages || []).filter((item) => {
    const id = String(item?.id || "");
    if (!id || freshIds.has(id) || locallyDeletedChatMessageIds.has(id)) return false;
    return item._pending || item._localEcho;
  });
  const registeredLocalMessages = [...localChatEchoMessages.values()].filter((item) => {
    const id = String(item?.id || "");
    return id && !freshIds.has(id) && !locallyDeletedChatMessageIds.has(id);
  });
  const localById = new Map([...currentLocalMessages, ...registeredLocalMessages].map((item) => [String(item.id), item]));

  return dedupeChatMessages([...localById.values(), ...visibleFreshMessages]);
}

function beginChatMutation() {
  chatMutationInFlight += 1;
  chatMutationVersion += 1;
  return chatMutationVersion;
}

function shouldDeferChatRefresh(loadMutationVersion) {
  return chatMutationInFlight > 0 || loadMutationVersion !== chatMutationVersion;
}

function runQueuedChatRefreshAfterMutation() {
  if (!chatRefreshQueuedAfterMutation || chatMutationInFlight > 0) return;
  if (refreshInProgress) {
    window.setTimeout(runQueuedChatRefreshAfterMutation, 100);
    return;
  }

  chatRefreshQueuedAfterMutation = false;
  refreshFromPostgreSQL();
}

function queueChatRefreshAfterMutation() {
  chatRefreshQueuedAfterMutation = true;
  window.setTimeout(runQueuedChatRefreshAfterMutation, 0);
}

function endChatMutation() {
  chatMutationInFlight = Math.max(0, chatMutationInFlight - 1);
  runQueuedChatRefreshAfterMutation();
}

function isMatchingPendingChatMessage(pending, saved) {
  if (!pending?._pending || !saved) return false;
  if (pending._clientMutationId && saved._clientMutationId && pending._clientMutationId === saved._clientMutationId) return true;
  if (normalizeChatChannel(pending.canal) !== normalizeChatChannel(saved.canal)) return false;
  if (pending.autor !== saved.autor) return false;
  if ((pending.mensagem || "") !== (saved.mensagem || "")) return false;
  if ((pending.arquivo?.name || "") !== (saved.arquivo?.name || "")) return false;
  if ((pending.arquivo?.size || 0) !== (saved.arquivo?.size || 0)) return false;
  return true;
}

function applyChatMessageUpsert(message, options = {}) {
  if (!message?.id || !canAccessChatChannel(message.canal)) return false;
  if (options.forceRestore) forgetDeletedChatMessage(message.id);
  if (locallyDeletedChatMessageIds.has(String(message.id))) return false;

  const nextMessage = options.localEcho ? markChatMessageAsLocalEcho(message) : message;
  const current = data.comunicados || [];
  const clientMutationId = nextMessage._clientMutationId || "";
  const index = current.findIndex((item) =>
    String(item.id) === String(nextMessage.id) ||
    (clientMutationId && item._clientMutationId === clientMutationId) ||
    isMatchingPendingChatMessage(item, nextMessage)
  );

  if (index >= 0) {
    data.comunicados = current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...nextMessage } : item));
  } else {
    data.comunicados = [nextMessage, ...current];
  }

  applyLocalChatState();
  return true;
}

function renderInstantChatUpdate() {
  saveLocalDataDebounced();
  renderDashboard();
  renderChatChannels();
  renderChat({ skipPostRender: true });
}

function flushPendingChatBroadcasts() {
  if (!realtimeChannel || !realtimeBroadcastReady) return;
  while (pendingChatBroadcasts.length) {
    const { event, payload } = pendingChatBroadcasts.shift();
    sendChatRealtimeBroadcast(event, payload);
  }
}

function sendChatRealtimeBroadcastNow(event, payload = {}) {
  if (!realtimeChannel || !realtimeBroadcastReady) return false;
  try {
    const result = realtimeChannel.send({
      type: "broadcast",
      event,
      payload: {
        ...payload,
        senderClientId: chatClientId,
      },
    });
    if (result?.catch) result.catch((error) => console.warn("Broadcast do chat recusado:", error));
    return true;
  } catch (error) {
    console.warn("Nao foi possivel enviar broadcast do chat:", error);
    return false;
  }
}

function sendChatRealtimeBroadcast(event, payload = {}) {
  if (sendChatRealtimeBroadcastNow(event, payload)) return;
  pendingChatBroadcasts.push({ event, payload });
  if (!realtimeChannel && postgresClient) setupRealtime();
}

function handleChatRealtimeBroadcast(payload = {}) {
  if (!payload || payload.senderClientId === chatClientId) return;

  if (payload.action === "upsert" && payload.message) {
    if (applyChatMessageUpsert(payload.message, { localEcho: Boolean(payload.localEcho), forceRestore: Boolean(payload.forceRestore) })) {
      renderInstantChatUpdate();
    }
    return;
  }

  if (payload.action === "delete" && payload.id) {
    rememberDeletedChatMessage(payload.id);
    renderInstantChatUpdate();
  }
}
