// 新しい物が登録されたときの通知と、アイコンのバッジ
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(data.title || '買ってほしい物リスト', {
        body: data.body || '',
        icon: '/aboutus-wishlist/icon.svg',
      });
      if ('setAppBadge' in self.navigator && typeof data.badge === 'number') {
        if (data.badge > 0) await self.navigator.setAppBadge(data.badge);
        else await self.navigator.clearAppBadge();
      }
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/aboutus-wishlist/'));
});
