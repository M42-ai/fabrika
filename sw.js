// Döner Fabrika service worker.
// Amaç: telefona "uygulama" olarak kurulabilsin, internet yokken son sürüm açılsın,
// GitHub'a yeni sürüm gönderilince kendiliğinden güncellensin.
// Kural: sayfa dosyaları önce ağdan istenir (güncelleme hemen gelsin), ağ yoksa önbellekten verilir.
// Veri (Supabase) ve CDN kütüphaneleri bu dosyaya girmez; onları tarayıcı ve supabase-js yönetir.
const CACHE = 'fabrika-v1';
const PAGES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PAGES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // Supabase, CDN, fontlar: dokunma
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});
