/* ============================================================
   SABBIR HOSSAIN RAFAT — Service Worker v3.0
   Cache-first for shell assets, network-first for API calls.
   Offline support with graceful fallback.
   ============================================================ */

'use strict';

const CACHE_VERSION    = 'sabbir-portfolio-v3';
const SHELL_CACHE      = `${CACHE_VERSION}-shell`;
const DYNAMIC_CACHE    = `${CACHE_VERSION}-dynamic`;
const MAX_DYNAMIC_ITEMS = 30;

// ── Assets to cache immediately on install ──
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/offline.html',
];

// ── External assets to cache on first visit ──
const CACHEABLE_ORIGINS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// ── Never cache these patterns ──
const NEVER_CACHE = [
  '/api/',
  'api.github.com',
  'chrome-extension://',
];

/* ════════════════ INSTALL ════════════════ */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v3.0…');
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      // Cache shell assets, skip any that fail
      const results = await Promise.allSettled(
        SHELL_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn(`[SW] Failed to cache ${url}:`, err))
        )
      );
      const cached = results.filter(r => r.status === 'fulfilled').length;
      console.log(`[SW] Shell cached: ${cached}/${SHELL_ASSETS.length} assets`);
    }).then(() => self.skipWaiting())
  );
});

/* ════════════════ ACTIVATE ════════════════ */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v3.0…');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== SHELL_CACHE && key !== DYNAMIC_CACHE)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

/* ════════════════ FETCH ════════════════ */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip never-cache patterns
  if (NEVER_CACHE.some(p => request.url.includes(p))) return;

  // Skip chrome extensions and non-http(s) schemes
  if (!request.url.startsWith('http')) return;

  // API calls — network only, no cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnly(request));
    return;
  }

  // GitHub API — network only with timeout fallback
  if (url.hostname === 'api.github.com') {
    event.respondWith(networkOnlyWithTimeout(request, 5000));
    return;
  }

  // Font files — cache first, long TTL
  if (
    CACHEABLE_ORIGINS.some(origin => url.hostname.includes(origin)) ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Navigation requests — network first, fallback to cache, then offline page
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Static shell assets — cache first
  if (isShellAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // Everything else — stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

/* ════════════════ STRATEGIES ════════════════ */

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      if (cacheName === DYNAMIC_CACHE) await trimDynamicCache();
    }
    return response;
  } catch {
    return new Response('Resource unavailable offline.', { status: 503 });
  }
}

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(JSON.stringify({ error: 'Network unavailable.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function networkOnlyWithTimeout(request, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    return response;
  } catch {
    clearTimeout(timer);
    return new Response(JSON.stringify({ error: 'GitHub API unavailable.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match('/offline.html');
    if (offline) return offline;
    return new Response(
      `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline — Sabbir Rafat</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#080c18;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100dvh;text-align:center;padding:24px}
      .wrap{max-width:480px}.emoji{font-size:4rem;margin-bottom:16px}.title{font-family:'Space Grotesk',sans-serif;font-size:1.8rem;font-weight:700;margin-bottom:12px;background:linear-gradient(135deg,#667eea,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
      p{color:#94a3b8;line-height:1.7;margin-bottom:24px}button{padding:12px 24px;border-radius:10px;background:linear-gradient(135deg,#667eea,#22d3ee);color:#fff;border:none;font-size:.9rem;font-weight:600;cursor:pointer}
      </style></head><body><div class="wrap"><div class="emoji">📡</div><h1 class="title">You're Offline</h1>
      <p>Sabbir's portfolio requires an internet connection for some features. Please check your connection and try again.</p>
      <button onclick="window.location.reload()">Try Again</button></div></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(async response => {
    if (response.ok) {
      cache.put(request, response.clone());
      await trimDynamicCache();
    }
    return response;
  }).catch(() => null);

  return cached || await fetchPromise || new Response('Resource unavailable.', { status: 503 });
}

/* ════════════════ HELPERS ════════════════ */

function isShellAsset(pathname) {
  return (
    pathname === '/' ||
    pathname.endsWith('.html') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.json') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/assets/')
  );
}

async function trimDynamicCache() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const keys = await cache.keys();
  if (keys.length > MAX_DYNAMIC_ITEMS) {
    const toDelete = keys.slice(0, keys.length - MAX_DYNAMIC_ITEMS);
    await Promise.all(toDelete.map(k => cache.delete(k)));
  }
}

/* ════════════════ BACKGROUND SYNC ════════════════ */
self.addEventListener('sync', (event) => {
  if (event.tag === 'contact-form-sync') {
    event.waitUntil(syncPendingForms());
  }
});

async function syncPendingForms() {
  // Retry any queued contact form submissions stored in IndexedDB
  // Implementation requires IndexedDB setup on the client side
  console.log('[SW] Background sync: contact-form-sync');
}

/* ════════════════ PUSH NOTIFICATIONS ════════════════ */
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Sabbir Rafat Portfolio', {
      body: data.body || 'New update available.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      tag: 'portfolio-notification',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

/* ════════════════ MESSAGE HANDLER ════════════════ */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_VERSION });
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => event.ports[0]?.postMessage({ cleared: true }));
  }
});

console.log(`[SW] Sabbir Portfolio Service Worker ${CACHE_VERSION} loaded.`);