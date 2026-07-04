self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = new URL('index.html?open=acompanhamento', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        try {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === self.location.origin) {
            client.postMessage({ type: 'HUB_OPEN_NOTIFICATIONS' });
            return client.focus();
          }
        } catch (_) {}
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type !== 'HUB_SHOW_NOTIFICATION') return;

  const title = data.title || 'HUB RH';
  const options = {
    body: data.body || 'Você tem uma nova notificação.',
    icon: data.icon || 'assets/logo.svg',
    badge: data.badge || 'assets/logo.svg',
    tag: data.tag || 'hub-rh-notificacao',
    renotify: true,
    requireInteraction: true,
    data: {
      url: 'index.html?open=acompanhamento',
      type: data.notificationType || 'geral',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
