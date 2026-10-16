const STATIC_CACHE = "connect-hub-static-v3";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
    const privateCaches = new Set(["apis", "others", "cross-origin", "next-data", "start-url"]);
    event.waitUntil(Promise.all([
        caches.keys().then((names) => Promise.all(names.filter((name) =>
            privateCaches.has(name) || (name.startsWith("connect-hub-static-") && name !== STATIC_CACHE)
        ).map((name) => caches.delete(name)))),
        self.clients.claim(),
    ]));
});
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    // Only immutable public bundles are cached. APIs and authenticated pages use the network.
    if (event.request.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith("/_next/static/")) return;
    event.respondWith(caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok) {
            await cache.put(event.request, response.clone());
            const keys = await cache.keys();
            if (keys.length > 64) await cache.delete(keys[0]);
        }
        return response;
    }));
});
