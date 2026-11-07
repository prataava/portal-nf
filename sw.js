/* Portal NF — service worker: simpan kulit aplikasi (shell) agar portal
   terbuka sekejap dan tetap bisa dibuka saat jaringan lambat.
   Isi SIP NF di dalam bingkai TIDAK pernah disentuh/disimpan. */
var NAMA_CACHE = "portal-nf-v1";
var BERKAS_KULIT = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./icon-180.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(NAMA_CACHE).then(function (c) { return c.addAll(BERKAS_KULIT); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (daftar) {
      return Promise.all(daftar.map(function (k) {
        if (k !== NAMA_CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  // Hanya layani berkas milik portal sendiri; semua permintaan lain
  // (termasuk seluruh situs NF di dalam bingkai) berjalan seperti biasa.
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (tersimpan) {
      var jaringan = fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var salinan = res.clone();
          caches.open(NAMA_CACHE).then(function (c) { c.put(e.request, salinan); });
        }
        return res;
      }).catch(function () { return tersimpan; });
      return tersimpan || jaringan;
    })
  );
});
