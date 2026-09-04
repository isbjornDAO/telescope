/* Telescope service worker.
 *
 * Deliberately conservative: it caches the app shell and static assets so a
 * cold launch from the home screen paints instantly and an offline launch shows
 * a real page instead of the browser's error. It never caches HTML documents or
 * API responses — a social timeline that serves yesterday's posts from a cache
 * is worse than one that admits it is offline.
 */
const VERSION = "v1";
const SHELL = `telescope-shell-${VERSION}`;
const ASSETS = `telescope-assets-${VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL && key !== ASSETS)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never serve a stale API response; the feed must always be live.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network first, falling back to the offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached ?? Response.error())
      )
    );
    return;
  }

  // Immutable build output and images: cache first, they are content-hashed.
  const cacheable =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(png|jpg|jpeg|svg|webp|woff2?)$/.test(url.pathname);

  if (!cacheable) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.status === 200) {
          const copy = response.clone();
          caches.open(ASSETS).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
