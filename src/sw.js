const CACHE_VERSION = 'v1.0.1';
const CACHE_NAME = `gestorauto-${CACHE_VERSION}`;

// Assets to always cache immediately
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/version.json',
    '/logo.png'
];

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing version:', CACHE_VERSION);
    // DO NOT call skipWaiting() here - it causes infinite reload loops
    // skipWaiting will be called only when user explicitly triggers update via SKIP_WAITING message

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating version:', CACHE_VERSION);
    event.waitUntil(
        Promise.all([
            clients.claim(),
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName.startsWith('gestorauto-') && cacheName !== CACHE_NAME) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

// Helper to determining if request is for API or Database
const isApiRequest = (url) => {
    return url.includes('supabase.co') || url.includes('/api/');
};

// Helper for version check - ALWAYS Network only, never cache
const isVersionCheck = (url) => {
    return url.includes('version.json');
};

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = request.url;

    // 1. Version check: Network Only (bypass cache completely)
    if (isVersionCheck(url)) {
        event.respondWith(
            fetch(request).catch(() => {
                // If offline, try to find in cache as fallback just to not break, 
                // but we really want network
                return caches.match(request);
            })
        );
        return;
    }

    // 2. API/Data requests: Network Only (or handle by Supabase client)
    // We generally let the browser/app handle these, but if we want offline support for data,
    // we would cache them. For now, Network First for safety.
    if (isApiRequest(url)) {
        return; // Let browser handle it (default network)
    }

    // 3. Static Assets / App Shell: Network First, falling back to Cache
    // preventing the "stale-while-revalidate" issue where user sees old version
    event.respondWith(
        fetch(request)
            .then((response) => {
                // Return valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Cache the fresh response
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseToCache);
                });

                return response;
            })
            .catch(() => {
                // If network fails, try cache
                return caches.match(request).then((response) => {
                    if (response) {
                        return response;
                    }
                    // If both fail and it's a navigation request, show offline page (if we had one)
                    // or just return index.html for SPA routing
                    if (request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

// Handle messages
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[Service Worker] SKIP_WAITING message received');
        self.skipWaiting().then(() => {
            // After skipWaiting, the activate event will fire and call clients.claim()
            console.log('[Service Worker] skipWaiting completed');
        });
    }
});

// Notification click handler (from previous implementation, preserved)
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
