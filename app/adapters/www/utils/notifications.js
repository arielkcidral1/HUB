function loadReadRhMessageIds() {
  return loadAccountScopedIdSet(READ_RH_MESSAGES_KEY);
}

function saveReadRhMessageIds() {
  saveAccountScopedIdSet(READ_RH_MESSAGES_KEY, readRhMessageIds);
}

function loadReadNotificationIds() {
  return loadAccountScopedIdSet(READ_NOTIFICATIONS_KEY);
}

function saveReadNotificationIds() {
  saveAccountScopedIdSet(READ_NOTIFICATIONS_KEY, readNotificationIds);
}

function loadShownNotificationKeys() {
  return loadAccountScopedIdSet(SHOWN_NOTIFICATIONS_KEY);
}

function saveShownNotificationKeys() {
  saveAccountScopedIdSet(SHOWN_NOTIFICATIONS_KEY, shownNotificationKeys, 600);
}

function loadDismissedNotificationIds() {
  return loadAccountScopedIdSet(DISMISSED_NOTIFICATIONS_KEY);
}

function saveDismissedNotificationIds() {
  saveAccountScopedIdSet(DISMISSED_NOTIFICATIONS_KEY, dismissedNotificationIds);
}

function isNotificationDismissed(dismissKey) {
  return Boolean(dismissKey) && dismissedNotificationIds.has(String(dismissKey));
}

function reloadReadStateForCurrentUser() {
  readNotificationIds = loadReadNotificationIds();
  readRhMessageIds = loadReadRhMessageIds();
  shownNotificationKeys = loadShownNotificationKeys();
  dismissedNotificationIds = loadDismissedNotificationIds();
}

function getNotificationAccountKey() {
  return getNotificationAccountAliases()[0] || "local";
}

function getNotificationAccountAliases() {
  return [
    currentAuthUser?.id ||
      "",
    currentUserProfile?.id || "",
    normalizeLoginName(currentAuthUser?.email || ""),
    normalizeLoginName(currentUserProfile?.email || ""),
    normalizeLoginName(currentUserProfile?.cpf || ""),
    normalizeLoginName(getCurrentUserName() || ""),
  ]
    .map((value) => String(value || "").trim())
    .filter((value) => value && value !== "usuario" && value !== "local")
    .filter((value, index, list) => list.indexOf(value) === index);
}

function getAccountScopedStorageKey(baseKey) {
  return `${baseKey}:${getNotificationAccountKey()}`;
}

function getAccountScopedStorageKeys(baseKey) {
  const aliases = getNotificationAccountAliases();
  return [baseKey, ...aliases.map((alias) => `${baseKey}:${alias}`), getAccountScopedStorageKey(baseKey)]
    .filter(Boolean)
    .filter((key, index, list) => list.indexOf(key) === index);
}

function loadAccountScopedIdSet(baseKey) {
  const merged = new Set();
  getAccountScopedStorageKeys(baseKey).forEach((key) => {
    storageService.getLocalItem(key, []).forEach((id) => {
      if (id !== undefined && id !== null && String(id).trim()) merged.add(String(id));
    });
  });
  return merged;
}

function saveAccountScopedIdSet(baseKey, ids, limit = 0) {
  const values = [...ids].filter((id) => id !== undefined && id !== null && String(id).trim()).map(String);
  const safeValues = limit > 0 ? values.slice(-limit) : values;
  getAccountScopedStorageKeys(baseKey).forEach((key) => storageService.setLocalItem(key, safeValues));
}

function mergeReadReceiptRows(rows = []) {
  rows.forEach((row = {}) => {
    const itemType = row.item_type || row.itemType || "";
    const itemId = row.item_id || row.itemId || "";
    const notificationId = row.notification_id || row.notificationId || (itemType === "notification" ? itemId : "");
    const messageId = row.message_id || row.messageId || (itemType === "message" ? itemId : "");
    if (itemType === "dismissed") {
      if (itemId) dismissedNotificationIds.add(String(itemId));
      return;
    }
    if (notificationId) readNotificationIds.add(String(notificationId));
    if (messageId) readRhMessageIds.add(String(messageId));
  });
  saveReadNotificationIds();
  saveReadRhMessageIds();
  saveDismissedNotificationIds();
}

async function loadReadReceiptsFromPostgreSQL() {
  if (!postgresClient || !TABLES.readReceipts) return;

  const userKeys = getReadReceiptUserIds();
  if (!userKeys.length) return;
  try {
    const { data: rows, error } = await postgresClient
      .from(TABLES.readReceipts)
      .select("*")
      .in("user_id", userKeys)
      .limit(2000);
    if (error) throw error;
    mergeReadReceiptRows(rows || []);
  } catch (error) {
    if (!isMissingColumn(error, "user_id")) {
      console.warn("Nao foi possivel carregar notificacoes lidas do PostgreSQL:", error);
    }
  }
}

function getReadReceiptUserIds() {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return [currentUserProfile?.id, currentAuthUser?.id]
    .map((value) => String(value || "").trim())
    .filter((value) => uuidPattern.test(value))
    .filter((value, index, list) => list.indexOf(value) === index);
}

function syncReadReceiptsToPostgreSQL(notificationIds = [], messageIds = [], dismissedIds = []) {
  if (!postgresClient || !TABLES.readReceipts) return;
  const userKeys = getReadReceiptUserIds();
  if (!userKeys.length) return;
  const now = new Date().toISOString();
  const rows = userKeys.flatMap((userKey) => [
    ...notificationIds.map((id) => ({ user_id: userKey, item_type: "notification", item_id: String(id), read_at: now })),
    ...messageIds.map((id) => ({ user_id: userKey, item_type: "message", item_id: String(id), read_at: now })),
    ...dismissedIds.map((id) => ({ user_id: userKey, item_type: "dismissed", item_id: String(id), read_at: now })),
  ]).filter((row) => row.item_id);
  if (!rows.length) return;
  postgresClient
    .from(TABLES.readReceipts)
    .insert(rows)
    .ignoreConflicts()
    .then(({ error }) => {
      if (error && !isMissingColumn(error, "user_id")) {
        console.warn("Nao foi possivel sincronizar notificacoes lidas:", error);
      }
    });
}

function syncCurrentReadStateToPostgreSQL() {
  const migrationKey = getAccountScopedStorageKey("hub-read-receipts-migrated-v1");
  if (storageService.getLocalItem(migrationKey, false)) return;
  syncReadReceiptsToPostgreSQL([...readNotificationIds], [...readRhMessageIds]);
  storageService.setLocalItem(migrationKey, true);
}

function markNotificationsRead(notificationIds = [], messageIds = []) {
  const normalizedNotificationIds = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
  const normalizedMessageIds = Array.isArray(messageIds) ? messageIds : [messageIds];
  const cleanNotificationIds = normalizedNotificationIds
    .filter((id) => id !== undefined && id !== null && String(id).trim())
    .map(String);
  const cleanMessageIds = normalizedMessageIds
    .filter((id) => id !== undefined && id !== null && String(id).trim())
    .map(String);
  cleanNotificationIds.forEach((id) => {
    const messageMatch = id.match(/^mensagem-rh-(.+)$/);
    if (messageMatch?.[1] && !cleanMessageIds.includes(messageMatch[1])) {
      cleanMessageIds.push(messageMatch[1]);
    }
  });
  if (cleanNotificationIds.includes("mensagens-rh") && !cleanMessageIds.length) {
    getAccessibleRhMessages().forEach((item) => {
      const id = item?.id !== undefined && item?.id !== null ? String(item.id) : "";
      if (id && !cleanMessageIds.includes(id)) cleanMessageIds.push(id);
    });
  }
  let changed = false;

  cleanNotificationIds.forEach((id) => {
      if (!readNotificationIds.has(id)) {
        readNotificationIds.add(id);
        changed = true;
      }
    });

  cleanMessageIds.forEach((id) => {
      if (!readRhMessageIds.has(id)) {
        readRhMessageIds.add(id);
        changed = true;
      }
    });

  let shownChanged = false;
  cleanNotificationIds.forEach((id) => {
    if (shownNotificationKeys.has(id)) return;
    shownNotificationKeys.add(id);
    shownChanged = true;
  });
  cleanMessageIds.forEach((id) => {
    const shownKey = `mensagem-rh-${id}`;
    if (shownNotificationKeys.has(shownKey)) return;
    shownNotificationKeys.add(shownKey);
    shownChanged = true;
  });

  removeReadNotificationPopouts(cleanNotificationIds, cleanMessageIds);

  if (!changed && !shownChanged) return false;

  saveReadNotificationIds();
  saveReadRhMessageIds();
  if (shownChanged) saveShownNotificationKeys();
  syncReadReceiptsToPostgreSQL(cleanNotificationIds, cleanMessageIds);

  try { lastUnreadNotificationCount = getUnreadRhMessages().length; } catch (_) {}
  try { renderDashboard?.(); } catch (_) {}
  try { renderChatChannels?.(); } catch (_) {}

  return true;
}

function dismissNotifications(dismissKeys = []) {
  const cleanKeys = (Array.isArray(dismissKeys) ? dismissKeys : [dismissKeys])
    .filter((key) => key !== undefined && key !== null && String(key).trim())
    .map(String)
    .filter((key, index, list) => list.indexOf(key) === index);
  if (!cleanKeys.length) return false;

  let changed = false;
  cleanKeys.forEach((key) => {
    if (dismissedNotificationIds.has(key)) return;
    dismissedNotificationIds.add(key);
    changed = true;
  });
  if (!changed) return false;

  saveDismissedNotificationIds();
  syncReadReceiptsToPostgreSQL([], [], cleanKeys);

  try { renderDashboard?.(); } catch (_) {}
  return true;
}

function getAccessibleRhMessages() {
  const currentUser = getCurrentUserName();
  return (data.comunicados || []).filter(
    (item) => canAccessChatChannel(normalizeChatChannel(item.canal)) && item.autor !== currentUser
  );
}

function getUnreadRhMessages() {
  return getAccessibleRhMessages().filter((item) => !readRhMessageIds.has(String(item.id)));
}

function markRhMessagesRead() {
  const currentChannel = activeChatChannel;
  const unread = getUnreadRhMessages().filter((item) => normalizeChatChannel(item.canal) === currentChannel);
  if (!unread.length) return;
  const unreadIds = unread.map((item) => String(item.id)).filter(Boolean);
  markNotificationsRead(["mensagens-rh"], unreadIds);
}

function checkAndMarkChatAsRead() {
  const communicationView = document.getElementById("comunicacao");
  if (!communicationView?.classList.contains("active") || !canAccessChatChannel(activeChatChannel)) return;

  const currentChannel = activeChatChannel;
  const unread = getUnreadRhMessages().filter((item) => normalizeChatChannel(item.canal) === currentChannel);
  if (!unread.length) return;

  markRhMessagesRead();
  renderDashboard();
  renderChatChannels();
}
