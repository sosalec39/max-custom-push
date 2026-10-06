// Приёмник пушей MAX для MAX Custom.
// Сервер MAX присылает Web Push так же, как для web.max.ru: JSON с готовыми title и body,
// mc — id чата, eventCount — число непрочитанных. Здесь уведомление только показывается,
// а по нажатию открывается чат в приложении MAX Custom.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch {
    try { d = { body: e.data.text() }; } catch { /* пустой пуш */ }
  }
  const chatId = typeof d.mc === 'string' && /^-?\d+$/.test(d.mc) ? d.mc : null;
  const icon = typeof d.icon === 'string' && d.icon.startsWith('https://') ? d.icon : 'icon-192.png';
  const jobs = [
    self.registration.showNotification(d.title || 'MAX', {
      body: d.body || '',
      icon,
      badge: 'icon-192.png',
      data: { chatId, type: d.type || '' },
      ...(d.tag ? { tag: d.tag } : {}),
    }),
  ];
  if ('setAppBadge' in self.navigator && Number.isFinite(d.eventCount)) {
    jobs.push(self.navigator.setAppBadge(Math.max(0, d.eventCount)).catch(() => {}));
  }
  e.waitUntil(Promise.allSettled(jobs));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const chatId = e.notification.data?.chatId;
  const url = new URL(chatId ? './?chat=' + encodeURIComponent(chatId) : './?open=1', self.registration.scope).href;
  e.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of windows) {
      try {
        await w.focus();
        await w.navigate(url);
        return;
      } catch { /* пробуем следующее окно */ }
    }
    await self.clients.openWindow(url);
  })());
});
