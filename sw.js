/* 丝路新声 —— Service Worker：只缓存应用外壳，跳过动态接口与音频（stale-while-revalidate） */
const CACHE = 'silk-road-voice-v6';
const BASE = new URL('./', self.location.href).pathname;
const PRECACHE = [BASE, `${BASE}manifest.webmanifest`];

/** 动态/后端资源一律交给网络，不缓存（避免旧前端、旧音频被缓存） */
function shouldCache(url) {
  const p = new URL(url).pathname;
  return !p.includes('/api/') && !p.includes('/audio/') && !p.includes('/uploads/');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!shouldCache(url)) return; // /api /audio /uploads → 走网络

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetched;
    }),
  );
});
