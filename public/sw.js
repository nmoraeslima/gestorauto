// Service Worker for handling notifications
self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    event.waitUntil(clients.claim());
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Handle push events (for future use with Firebase)
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};
    const title = data.title || 'GestorAuto';
    const options = {
        body: data.body || '',
        icon: '/logo.png',
        badge: '/logo.png',
        data: data.data || {},
    };

    event.waitUntil(self.registration.showNotification(title, options));
});
