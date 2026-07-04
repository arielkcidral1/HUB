self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = new URL(data.url || 'index.html?open=acompanhamento', self.location.origin);
  if (data.notificationId) targetUrl.searchParams.set('markNotification', data.notificationId);
  if (Array.isArray(data.messageIds) && data.messageIds.length) {
    targetUrl.searchParams.set('markMessages', data.messageIds.join(','));
  }

  const messagePayload = {
    type: 'HUB_OPEN_NOTIFICATIONS',
    notificationId: data.notificationId || '',
    messageIds: Array.isArray(data.messageIds) ? data.messageIds : [],
  };

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        try {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === self.location.origin) {
            client.postMessage(messagePayload);
            return client.focus();
          }
        } catch (_) {}
      }
      return self.clients.openWindow(targetUrl.href);
    })
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type !== 'HUB_SHOW_NOTIFICATION') return;

  const title = data.title || 'HUB RH';
  const messageIds = Array.isArray(data.messageIds) ? data.messageIds : [];
  const notificationId = data.notificationId || '';
  const targetUrl = new URL(data.url || 'index.html?open=acompanhamento', self.location.origin);
  if (notificationId) targetUrl.searchParams.set('markNotification', notificationId);
  if (messageIds.length) targetUrl.searchParams.set('markMessages', messageIds.join(','));

  const options = {
    body: data.body || 'Você tem uma nova notificação.',
    icon: data.icon || 'assets/logo.svg',
    badge: data.badge || 'assets/logo.svg',
    tag: data.tag || 'hub-rh-notificacao',
    renotify: true,
    requireInteraction: true,
    data: {
      url: targetUrl.href,
      type: data.notificationType || 'geral',
      notificationId,
      messageIds,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
