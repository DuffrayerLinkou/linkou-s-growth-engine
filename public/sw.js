const CACHE_VERSION = 'v2';
const ASSETS_CACHE = `linkou-assets-${CACHE_VERSION}`;
const PAGES_CACHE = `linkou-pages-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Pre-cache on install — align with start_url
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGES_CACHE).then((cache) => cache.addAll([OFFLINE_URL, '/auth']))
  );
  self.skipWaiting();
});

// Cleanup ALL old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== ASSETS_CACHE && k !== PAGES_CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Domains to never cache (tracking & APIs)
const BYPASS_DOMAINS = [
  'supabase.co',
  'supabase.in',
  'google-analytics.com',
  'googletagmanager.com',
  'googleads.g.doubleclick.net',
  'googlesyndication.com',
  'facebook.net',
  'facebook.com',
  'connect.facebook.net',
  'analytics.tiktok.com',
  'tiktok.com',
  'hotjar.com',
  'linkedin.com',
  'snap.licdn.com',
];

function shouldBypass(url) {
  return BYPASS_DOMAINS.some((d) => url.hostname.includes(d));
}

function isAsset(url) {
  return /\.(js|css|woff2?|ttf|otf|png|jpe?g|gif|webp|svg|ico|mp4|webm)(\?.*)?$/i.test(url.pathname);
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Stale-while-revalidate for assets
async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSETS_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200 && response.type !== 'opaque') {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

// Network-first for navigation
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(PAGES_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match(OFFLINE_URL);
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and bypass domains
  if (event.request.method !== 'GET') return;
  if (shouldBypass(url)) return;
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return;

  if (isNavigationRequest(event.request)) {
    event.respondWith(networkFirst(event.request));
  } else if (isAsset(url)) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
  // All other requests (API etc.) go to network naturally
});
