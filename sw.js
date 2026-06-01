/* sw.js — network-first service worker for HomeCrew.
   Always fetches the latest version when online (so deploys show up on launch),
   and falls back to a cached copy when offline. */

const CACHE = "homecrew-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./tweaks-panel.jsx",
  "./data.jsx",
  "./icons.jsx",
  "./board.jsx",
  "./manage.jsx",
  "./screens.jsx",
  "./app.jsx",
];

self.addEventListener("install", (e) => {
  self.skipWaiting(); // take over as soon as the new version is ready
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Let cross-origin requests (React/Babel CDN) use the browser's own cache.
  if (new URL(req.url).origin !== location.origin) return;

  // Network-first: try the network, cache a fresh copy, fall back to cache offline.
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
  );
});
