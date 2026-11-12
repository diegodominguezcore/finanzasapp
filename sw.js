// ---------------------------------------------------------------------------
// sw.js — Service worker: un script que el navegador ejecuta aparte de la
// página y que puede responder las peticiones de red. Lo usamos para guardar
// una copia de los archivos de la app y que funcione sin internet.
//
// IMPORTANTE al publicar cambios:
//   1. Si agregas un archivo nuevo, añádelo a ASSETS.
//   2. Sube el número de CACHE_VERSION. Sin eso, los teléfonos que ya
//      instalaron la app seguirán viendo la versión anterior.
// ---------------------------------------------------------------------------

const CACHE_VERSION = 'finanzas-v2';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/app.js',
  './js/config.js',
  './js/store.js',
  './js/storage.js',
  './js/selectors.js',
  './js/models/transaction.js',
  './js/models/goal.js',
  './js/utils/money.js',
  './js/utils/dates.js',
  './js/ui/dom.js',
  './js/ui/summary.js',
  './js/ui/transactionList.js',
  './js/ui/transactionForm.js',
  './js/ui/backup.js',
  './js/ui/charts.js',
  './js/ui/dashboard.js',
  './js/ui/goals.js',
  './js/ui/goalForm.js',
  './js/ui/toast.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Al instalarse: descargar y guardar todos los archivos.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Al activarse: borrar las copias de versiones anteriores.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((name) => name !== CACHE_VERSION).map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

// En cada petición: responder con la copia guardada; si no existe, ir a la red.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then((cached) => cached || fetch(event.request))
  );
});
