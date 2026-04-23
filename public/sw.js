// Service Worker v3 — minimalista, apenas Push Notifications.
// Cache de assets/páginas foi REMOVIDO porque estava servindo builds antigas.
// O navegador + headers de hosting já gerenciam cache de assets corretamente.

// Install: ativa imediatamente, sem pré-cache.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: limpa TODOS os caches antigos (linkou-assets-*, linkou-pages-*)
// para liberar usuários que estavam presos em versões antigas.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Sem listener de 'fetch': o SW não intercepta nenhuma requisição.
// Todo cache passa a ser controlado pelos headers HTTP do hosting.

// ==========================================
// PUSH NOTIFICATION HANDLERS
// ==========================================

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Linkou',
      body: event.data.text(),
      icon: '/icons/icon-192x192.png',
    };
  }

  const options = {
    body: data.body || data.message || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: data.actions || [],
    tag: data.tag || 'linkou-notification',
    renotify: data.renotify || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Linkou', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open a new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close (optional analytics)
self.addEventListener('notificationclose', (event) => {
  // Could send analytics here if needed
  console.log('Notification closed:', event.notification.tag);
});
