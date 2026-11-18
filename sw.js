// Keeps the app available offline. It always asks the server for the newest copy first
// (skipping the phone's 10 minute page cache), and falls back to the saved copy offline.
const CACHE = 'logger-v3';
const FILES = ['./', 'macro-log.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(new Request(f, {cache: 'reload'})).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 3500);
      // no-cache: revalidate with the server every time (a cheap 304 when nothing changed)
      const res = await fetch(r.url, {cache: 'no-cache', credentials: 'same-origin', signal: ctl.signal}); clearTimeout(t);
      if (res && res.ok) cache.put(r, res.clone());
      return res;
    } catch (err) {
      return (await cache.match(r, {ignoreSearch: true})) || (r.mode === 'navigate' ? await cache.match('macro-log.html') : Response.error());
    }
  })());
});
