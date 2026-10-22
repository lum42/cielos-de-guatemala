// Cielos de Guatemala — offline support.
// The whole app shell is cached on install, so the site opens with no signal in the field.
// Weather requests go straight to the network; the app keeps the last forecast on the device.
const VERSION = "v20261022045838";
const CACHE = "cg-" + VERSION;
const SHELL = [
  "./", "index.html", "app.css", "app.js", "manifest.webmanifest", "photos-public.json",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png",
  "fonts/cormorant-garamond-latin-600-normal.woff2","fonts/inter-latin-400-normal.woff2","fonts/inter-latin-600-normal.woff2","fonts/press-start-2p-latin-400-normal.woff2","fonts/vt323-latin-400-normal.woff2"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("cg-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(caches.match("index.html").then((r) => r || fetch(req)));
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok && res.type === "basic") { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});
