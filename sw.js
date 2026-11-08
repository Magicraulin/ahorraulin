/* Hace que la app se abra rápido y funcione aunque falle la cobertura.
   Si cambias algún archivo, sube el número de versión para que se actualice. */
const VERSION = "ahorraulin-v8";
const ARCHIVOS = ["./", "index.html", "app.js", "datos.js", "config.js", "excel.js", "manifest.webmanifest",
                  "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;                                  // Supabase e IA van siempre a internet
  const propio = url.origin === location.origin;
  const estatico = /cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/.test(url.host);
  if (!propio && !estatico) return;
  if (propio){
    // Primero internet (para tener siempre la última versión); si no hay, lo guardado.
    e.respondWith(fetch(req, { cache: "no-cache" }).then(r => { const copia = r.clone(); caches.open(VERSION).then(c => c.put(req, copia)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
  } else {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const copia = res.clone(); caches.open(VERSION).then(c => c.put(req, copia)); return res; })));
  }
});
