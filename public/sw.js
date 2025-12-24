const CACHE_VERSION = "v2";
const SHELL_CACHE = `hotel-fit-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `hotel-fit-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `hotel-fit-runtime-${CACHE_VERSION}`;
const MEDIA_CACHE = `hotel-fit-media-${CACHE_VERSION}`;

const OFFLINE_URL = "/offline";
const CORE_ROUTES = [
  "/",
  "/builder",
  "/display-tv",
  "/display-timer",
  "/hrm-tv",
  "/hrm-live",
  "/hrm-management",
  "/mobile",
  "/body-scan",
  "/tdee",
  "/pos",
  "/crm",
  "/analytics",
  "/qr-codes",
  "/setup",
  "/setup/displays",
  "/setup/brand",
  "/venues",
  "/tablet",
  "/demo-player",
  "/tv/workout",
  "/tv/workout/start",
  "/tv-preview",
  "/workout-preview",
  "/station-tv",
  "/kitchen/orders",
  "/push",
  "/test",
  "/test-supabase"
];

const APP_SHELL = [...CORE_ROUTES, "/manifest.webmanifest", "/hex-pattern.svg", OFFLINE_URL];
const STATIC_ASSET_PATTERNS = [/^\/_next\/static\//, /\.css$/i, /\.js$/i, /\.woff2?$/i];
const MEDIA_PATTERNS = [/^\/videos\//, /\.(?:mp4|mov|webm)$/i];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      await Promise.all(
        APP_SHELL.map(async (asset) => {
          try {
            await cache.add(asset);
          } catch (error) {
            console.warn(`SW: failed to precache ${asset}`, error);
          }
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      const validCaches = [SHELL_CACHE, STATIC_CACHE, RUNTIME_CACHE, MEDIA_CACHE];
      return Promise.all(
        keys
          .filter((key) => !validCaches.includes(key))
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const sameOrigin = requestUrl.origin === self.location.origin;

  if (event.request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(event.request));
    return;
  }

  if (!sameOrigin) {
    return;
  }

  if (STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(requestUrl.pathname))) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  if (MEDIA_PATTERNS.some((pattern) => pattern.test(requestUrl.pathname))) {
    event.respondWith(cacheFirst(event.request, MEDIA_CACHE));
    return;
  }

  if (requestUrl.pathname.startsWith("/api")) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event));
});

async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    const offlineResponse = await caches.match(OFFLINE_URL);
    if (offlineResponse) {
      return offlineResponse;
    }
    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain" }
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    throw error;
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    return caches.match(request);
  }
}

async function staleWhileRevalidate(event) {
  const { request } = event;
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cachedResponse);

  event.waitUntil(fetchPromise);
  return cachedResponse || fetchPromise;
}
