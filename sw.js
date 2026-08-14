const CACHE_NAME = "jedwal-cache-v2";

const urlsToCache = [
  "/",
  "/index.html",

  "/css/styles.css",
  "/css/select2.min.css",

  "/js/jquery.min.js",
  "/js/select2.min.js",
  "/js/html2canvas.min.js",
  "/js/papaparse.min.js",
  "/js/script.js",

  "/manifest.json",

  "/img/jedwal000.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {

      for (const url of urlsToCache) {
        try {
          await cache.add(url);
          console.log("Cached:", url);
        } catch (error) {
          console.warn("Failed to cache:", url, error);
        }
      }

      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {

  // تجاهل الطلبات غير GET
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {

      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {

          // تخزين الملفات الناجحة فقط
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseClone = networkResponse.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }

          return networkResponse;
        })
        .catch(() => {

          // إذا فشل الإنترنت ولم يكن الملف موجودًا في الكاش
          return new Response(
            "المورد غير متوفر حاليًا",
            {
              status: 503,
              statusText: "Service Unavailable",
              headers: {
                "Content-Type": "text/plain; charset=utf-8"
              }
            }
          );

        });
    })
  );
});
