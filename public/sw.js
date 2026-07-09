const CACHE = 'sikkha-v1'
const ASSETS = ['/', '/offline']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('/api/')) {
    event.respondWith(networkFirst(event.request))
  } else {
    event.respondWith(cacheFirst(event.request))
  }
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  return cached || fetch(request).then((res) => {
    const clone = res.clone()
    caches.open(CACHE).then((cache) => cache.put(request, clone))
    return res
  })
}

async function networkFirst(request) {
  try {
    const res = await fetch(request)
    const clone = res.clone()
    caches.open(CACHE).then((cache) => cache.put(request, clone))
    return res
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response(JSON.stringify({ error: 'আপনি অফলাইনে আছেন' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
