const CACHE = 'weightlog-v1';
const FILES = ['/log/', '/log/index.html', '/log/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

let notifTimer = null;

self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE') scheduleDaily(e.data.time);
});

function scheduleDaily(timeStr) {
  if (notifTimer) clearTimeout(notifTimer);
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  notifTimer = setTimeout(() => fireNotif(timeStr), next - now);
}

function fireNotif(timeStr) {
  self.registration.showNotification('⚖️ Time to log your day!', {
    body: 'Tap to enter your weight and activities.',
    icon: '/log/icon.svg',
    tag: 'daily-log',
    renotify: true,
    actions: [{ action: 'open', title: 'Log now' }],
  });
  scheduleDaily(timeStr);
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      if (list.length) return list[0].focus();
      return clients.openWindow('/log/');
    })
  );
});
