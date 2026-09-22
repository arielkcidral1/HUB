async function refreshFromPostgreSQL() {
  if (!postgresClient || refreshInProgress) return;

  refreshInProgress = true;
  try {
    await loadFromPostgreSQL({ setupLive: false });
    notifyNewItemsFromPolling();
  } finally {
    refreshInProgress = false;
  }
}

let lastAutoRefreshAt = 0;

function setupAutoRefresh() {
  if (refreshTimer) return;

  // O realtime (setupRealtime) e o canal principal de atualizacao; este poll
  // e so uma rede de seguranca de reconciliacao, por isso o intervalo e mais
  // longo e pausa quando a aba esta em segundo plano. O throttle evita que
  // trocar de aba repetidamente dispare varios refreshes em sequencia.
  refreshTimer = window.setInterval(() => {
    if (document.visibilityState !== "visible") return;
    if (Date.now() - lastAutoRefreshAt < AUTO_REFRESH_MIN_GAP_MS) return;
    lastAutoRefreshAt = Date.now();
    refreshFromPostgreSQL();
  }, 60000);
}

function setupRealtime() {
  if (!postgresClient || realtimeChannel) return;

  realtimeChannel = postgresClient.channel("hub-realtime-updates", {
    config: { broadcast: { self: false } },
  });

  realtimeChannel.on("broadcast", { event: "chat" }, ({ payload }) => {
    handleChatRealtimeBroadcast(payload);
  });

  Object.entries(TABLES).forEach(([collection, table]) => {
    realtimeChannel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload) => {
        const row = payload.eventType === "DELETE" ? payload.old : payload.new;
        if (!row) return;
        if (collection === "comunicados" && !canAccessChatChannel(row.canal)) return;

        const mappedRealtimeItem = mapRows(collection, [row])[0] || row;
        if (collection === "readReceipts") {
          if (!getNotificationAccountAliases().includes(String(mappedRealtimeItem.userKey || ""))) return;
          mergeReadReceiptRows([mappedRealtimeItem]);
          try { renderDashboard?.(); } catch (_) {}
          try { renderChatChannels?.(); } catch (_) {}
          try { window.notificationTracker?.loadNotifications?.(); } catch (_) {}
          return;
        }
        notifyRealtimeItem(collection, mappedRealtimeItem, payload.eventType);
        mergeRealtimeRow(collection, row, payload.eventType);
        renderRealtimeUpdate(collection);
      }
    );
  });

  realtimeChannel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      realtimeBroadcastReady = true;
      console.info("HUB realtime conectado");
      setSyncStatus("Tempo real online", true);
      flushPendingChatBroadcasts();
    } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
      realtimeBroadcastReady = false;
      console.warn("HUB realtime desconectado:", status);
      setSyncStatus("Reconectando...", false);

      try { realtimeChannel.unsubscribe(); } catch (_) {}
      realtimeChannel = null;
      setTimeout(() => {
        if (!realtimeChannel && postgresClient) {
          console.info("HUB realtime tentando reconectar...");
          setupRealtime();
          refreshFromPostgreSQL();
        }
      }, 3000);
    }
  });
}

