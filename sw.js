/* Generated as sw.js by build_pwa_release.py. Change CACHE_VERSION on manual releases. */
'use strict';
const CACHE_VERSION = '5d9be43b296960ef';
const PRECACHE = ["./", "about.html", "assets/ekclean-women-owned-preview.webp", "assets/ekclean-women-owned-public.pdf", "assets/fonts/font-d859571147368d97.woff2", "assets/fonts/font-eb97f61a404b97d5.woff2", "assets/fonts/font-fd11386d021e1c2c.woff2", "assets/illustrations/image-1.webp", "assets/illustrations/image-2.webp", "assets/illustrations/image-3.webp", "assets/illustrations/image-4.webp", "assets/illustrations/image-5.webp", "icons/apple-touch-icon.png", "icons/favicon-32.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "index.html", "logo.svg", "manifest.json", "offline.html", "pwa.css", "pwa.js", "styles/fonts.css", "styles/mobile-compact.css", "styles/tailwind.css"];
const SCOPE_URL = new URL(self.registration.scope);
const CACHE_PREFIX = 'ekclean-pwa-' + encodeURIComponent(SCOPE_URL.pathname) + '-';
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
const precacheURLs = new Set(PRECACHE.map(path => new URL(path, SCOPE_URL).href));
const pagePaths = new Set(['./', 'index.html', 'about.html', 'offline.html'].map(path => new URL(path, SCOPE_URL).pathname));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll([...precacheURLs])));
  // Updates wait for explicit user approval; never interrupt an unfinished quote.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function navigate(request) {
  const cache = await caches.open(CACHE_NAME);
  const url = new URL(request.url);
  try {
    const response = await fetch(request);
    if (response.ok && pagePaths.has(url.pathname)) {
      const key = new URL(url.pathname, url.origin).href;
      await cache.put(key, response.clone());
    }
    return response;
  } catch (_) {
    const exact = await cache.match(request, { ignoreSearch: true });
    if (exact) return exact;
    if (pagePaths.has(url.pathname)) {
      const page = url.pathname.endsWith('about.html') ? 'about.html' : 'index.html';
      const saved = await cache.match(new URL(page, SCOPE_URL).href);
      if (saved) return saved;
    }
    return (await cache.match(new URL('offline.html', SCOPE_URL).href)) || new Response('오프라인입니다. 연결 후 다시 방문해 주세요.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

async function asset(request) {
  const cache = await caches.open(CACHE_NAME);
  const saved = await cache.match(request, { ignoreSearch: true });
  if (saved) return saved;
  try {
    const response = await fetch(request);
    // Never cache error responses, opaque cross-origin data, or partial PDF responses.
    if (response.ok && response.status === 200 && response.type === 'basic') await cache.put(request, response.clone());
    return response;
  } catch (_) {
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== SCOPE_URL.origin || !url.pathname.startsWith(SCOPE_URL.pathname) || url.pathname.includes('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(navigate(request));
  } else if (precacheURLs.has(url.href) || ['style', 'script', 'image', 'font'].includes(request.destination) || url.pathname.endsWith('.pdf')) {
    event.respondWith(asset(request));
  }
});
