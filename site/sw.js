// D'oh! Hunt Planner – offline support.
// App + data: network first, cached copy when offline. Map tiles: every tile you have viewed is kept (up to ~4000).
const APP = 'dh-app-v2', TILES = 'dh-tiles-v2', MAX_TILES = 4000;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(['./', './index.html', './manifest.json'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== APP && k !== TILES).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
let puts = 0;
async function trim(c) {
  if (++puts % 50) return;
  const ks = await c.keys();
  if (ks.length > MAX_TILES) await Promise.all(ks.slice(0, ks.length - MAX_TILES + 300).map(k => c.delete(k)));
}
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (/(^|\.)tile\.openstreetmap\.(org|fr)$/.test(u.hostname)) {
    e.respondWith(caches.open(TILES).then(async c => {
      const hit = await c.match(r);
      if (hit) return hit;
      try {
        const res = await fetch(r);
        if (res.ok || res.type === 'opaque') { c.put(r, res.clone()); trim(c); }
        return res;
      } catch (err) { return new Response('', { status: 504 }); }
    }));
    return;
  }
  if (u.hostname === 'cdnjs.cloudflare.com' || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(APP).then(async c => {
      const hit = await c.match(r);
      if (hit) return hit;
      const res = await fetch(r);
      if (res.ok || res.type === 'opaque') c.put(r, res.clone());
      return res;
    }));
    return;
  }
  const sameOrData = u.origin === self.location.origin || u.hostname === 'raw.githubusercontent.com';
  if (sameOrData || u.hostname === 'api.open-meteo.com') {
    const ignoreSearch = sameOrData;
    e.respondWith(fetch(r).then(res => {
      if (res.ok) { const cl = res.clone(); caches.open(APP).then(c => c.put(ignoreSearch ? u.origin + u.pathname : r, cl)); }
      return res;
    }).catch(async () => {
      const c = await caches.open(APP);
      const hit = await c.match(ignoreSearch ? u.origin + u.pathname : r, { ignoreSearch });
      if (hit) return hit;
      if (r.mode === 'navigate') return (await c.match('./index.html')) || Response.error();
      return Response.error();
    }));
  }
});
