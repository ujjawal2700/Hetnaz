const CACHE_VERSION = 'v2';
const STATIC_CACHE = `dil_mate-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dil_mate-dynamic-${CACHE_VERSION}`;
const API_CACHE = `dil_mate-api-${CACHE_VERSION}`;

// Critical assets to precache (app shell)
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
];

// API endpoints to cache for offline/fast access
const CACHEABLE_API_PATTERNS = [
    '/api/users/me',
    '/api/settings',
    '/api/chats',
];

// Install Event - Precache critical assets
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => {
                        return name.startsWith('dil_mate-') &&
                            !name.includes(CACHE_VERSION);
                    })
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Smart caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip WebSocket connections
    if (url.protocol === 'ws:' || url.protocol === 'wss:') return;

    // Skip cross-origin requests except for specific CDNs
    if (url.origin !== self.location.origin) {
        // Cache Cloudinary images
        if (url.hostname.includes('cloudinary')) {
            event.respondWith(cacheFirst(request, DYNAMIC_CACHE, 86400000)); // 1 day
            return;
        }
        return;
    }

    // API requests - Network First with cache fallback
    if (url.pathname.startsWith('/api')) {
        event.respondWith(networkFirstWithCache(request, API_CACHE));
        return;
    }

    // Static assets (JS, CSS, images) - Cache First
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }

    // HTML pages - Network First (for navigation)
    event.respondWith(networkFirstWithCache(request, STATIC_CACHE));
});

// Check if request is for a static asset
function isStaticAsset(pathname) {
    return /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)(\?.*)?$/.test(pathname);
}

// Cache First Strategy - For static assets
async function cacheFirst(request, cacheName, maxAge = null) {
    const cached = await caches.match(request);
    if (cached) {
        // Check if cache is still valid (for items with maxAge)
        if (maxAge) {
            const cachedDate = cached.headers.get('sw-cached-date');
            if (cachedDate && (Date.now() - parseInt(cachedDate)) < maxAge) {
                return cached;
            }
        } else {
            return cached;
        }
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            // Clone and add cache timestamp
            const responseToCache = response.clone();
            cache.put(request, responseToCache);
        }
        return response;
    } catch (error) {
        // Return cached version on network failure
        if (cached) return cached;
        throw error;
    }
}

// Network First Strategy - For dynamic content
async function networkFirstWithCache(request, cacheName) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            console.log('📦 Serving from cache:', request.url);
            return cached;
        }
        throw error;
    }
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }

    // Precache specific routes when requested
    if (event.data.type === 'PRECACHE') {
        const urls = event.data.urls;
        caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.addAll(urls).catch(() => { });
        });
    }
});
