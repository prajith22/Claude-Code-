// Dopiq service worker — provides an offline navigation fallback
// so the app shell still loads when iPhone Safari is offline after
// install. Network-first for navigation requests; the latest
// successful response is cached and reused on failure. Static
// assets are left to Next.js / browser caching, which already
// handles them well.
//
// Cache version: bump this string on every deploy whose HTML
// references new JS chunk hashes. The activate handler nukes any
// cache whose name isn't the current CACHE constant, so existing
// users on the previous SW drop their stale HTML on next launch
// and re-fetch the new shell from the network. Without this bump
// a user who was offline mid-deploy could get served cached HTML
// that points at chunk URLs the CDN no longer has, hydration
// fails, and the page goes white after the layout chrome
// briefly flashes.

const CACHE = "dopiq-shell-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (req.mode !== "navigate") return;

  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
        return res;
      } catch {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        const home = await cache.match("/home");
        if (home) return home;
        return Response.error();
      }
    })(),
  );
});
