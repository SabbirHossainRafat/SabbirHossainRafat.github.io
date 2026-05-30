/* ============================================================
   SABBIR HOSSAIN RAFAT — Service Worker v3.1
   Cache-first for static assets.
   Network-first (never cached) for all API calls.
   Offline fallback to offline.html for navigation.
   ============================================================ */
'use strict';

const CACHE_VER     = 'sabbir-v3.1';
const SHELL_CACHE   = `${CACHE_VER}-shell`;
const DYNAMIC_CACHE = `${CACHE_VER}-dynamic`;
const MAX_DYNAMIC   = 35;

/* Static shell assets to pre-cache on install */
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

/* Patterns that must NEVER be cached — always network */
const NEVER_CACHE_PATTERNS = [
  '/api/',
  '/contact',
  '/chat',
  '/exec',
  '/whoami',
  '/hostname',
  '/system-info',
  '/stats',
  '/analytics',
  '/form-token',
  '/health',
  '/version/',
  'api.github.com',
  'generativelanguage.googleapis.com',
  'chrome-extension://',
];

/* Origins whose responses we will cache (e.g. Google Fonts) */
const CACHEABLE_ORIGINS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

/* ════════════════ INSTALL ════════════════ */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache =>
        Promise.allSettled(
          SHELL_ASSETS.map(url =>
            cache.add(url).catch(err => console.warn('[SW] Failed to pre-cache:', url, err))
          )
        )
      )
      .then(() => {
        console.log('[SW] Shell cached — skipping waiting');
        return self.skipWaiting();
      })
  );
});

/* ════════════════ ACTIVATE ════════════════ */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => k !== SHELL_CACHE && k !== DYNAMIC_CACHE)
            .map(k => {
              console.log('[SW] Deleting old cache:', k);
              return caches.delete(k);
            })
        )
      )
      .then(() => {
        console.log('[SW] Activated v3.1 — claiming clients');
        return self.clients.claim();
      })
  );
});

/* ════════════════ FETCH ════════════════ */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET requests entirely */
  if (request.method !== 'GET') return;

  /* Skip non-http(s) schemes */
  if (!request.url.startsWith('http')) return;

  /* API calls — network only, NEVER cached */
  if (shouldNeverCache(request.url)) {
    event.respondWith(networkOnly(request));
    return;
  }

  /* Navigation requests — network first, offline.html fallback */
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }

  /* Shell assets — cache first */
  if (isShellAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  /* Fonts and other cacheable third-party — cache first */
  if (CACHEABLE_ORIGINS.some(o => url.hostname.includes(o))) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  /* Everything else — stale-while-revalidate */
  event.respondWith(staleWhileRevalidate(request));
});

/* ════════════════ STRATEGIES ════════════════ */

async function networkOnly(request) {
  try {
    return await fetchWithTimeout(request, 10000);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Network unavailable.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function navigationStrategy(request) {
  try {
    const response = await fetchWithTimeout(request, 8000);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    /* Try cache first */
    const cached = await caches.match(request);
    if (cached) return cached;
    /* Fall back to offline page */
    const offline = await caches.match('/offline.html');
    if (offline) return offline;
    return offlineFallback();
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetchWithTimeout(request, 8000);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      if (cacheName === DYNAMIC_CACHE) trimCache(cacheName, MAX_DYNAMIC);
    }
    return response;
  } catch {
    return new Response('Resource unavailable offline.', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache   = await caches.open(DYNAMIC_CACHE);
  const cached  = await cache.match(request);

  const fetchPromise = fetchWithTimeout(request, 6000)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
        trimCache(DYNAMIC_CACHE, MAX_DYNAMIC);
      }
      return response;
    })
    .catch(() => null);

  return cached || (await fetchPromise) || new Response('Unavailable.', { status: 503 });
}

/* ════════════════ HELPERS ════════════════ */

function fetchWithTimeout(request, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('SW fetch timeout')), ms);
    fetch(request)
      .then(r => { clearTimeout(timer); resolve(r); })
      .catch(e => { clearTimeout(timer); reject(e); });
  });
}

function shouldNeverCache(url) {
  return NEVER_CACHE_PATTERNS.some(p => url.includes(p));
}

function isShellAsset(pathname) {
  return (
    pathname === '/' ||
    pathname.endsWith('.html') ||
    pathname.endsWith('.css')  ||
    pathname.endsWith('.js')   ||
    pathname.endsWith('.json') ||
    pathname.endsWith('.svg')  ||
    pathname.startsWith('/icons/')  ||
    pathname.startsWith('/assets/')
  );
}

async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys  = await cache.keys();
  if (keys.length > max) {
    await Promise.all(keys.slice(0, keys.length - max).map(k => cache.delete(k)));
  }
}

function offlineFallback() {
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Offline — Sabbir Rafat</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#080c18;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100dvh;text-align:center;padding:24px}
    h1{font-size:1.8rem;font-weight:700;margin-bottom:12px;background:linear-gradient(135deg,#667eea,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    p{color:#94a3b8;margin-bottom:24px;line-height:1.7}button{padding:12px 24px;border-radius:10px;background:linear-gradient(135deg,#667eea,#22d3ee);color:#fff;border:none;font-size:.9rem;font-weight:600;cursor:pointer}
    </style></head><body><div><div style="font-size:3rem;margin-bottom:16px">📡</div><h1>You're Offline</h1>
    <p>Sabbir's portfolio requires an internet connection.<br>Please check your connection and try again.</p>
    <button onclick="location.reload()">Try Again</button></div></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

/* ════════════════ BACKGROUND SYNC ════════════════ */
self.addEventListener('sync', event => {
  if (event.tag === 'contact-form-sync') {
    event.waitUntil(Promise.resolve());
  }
});

/* ════════════════ PUSH ════════════════ */
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Sabbir Rafat', {
      body:  data.body  || '',
      icon:  '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag:   'portfolio',
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

/* ════════════════ MESSAGES ════════════════ */
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_VER });
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => event.ports[0]?.postMessage({ cleared: true }));
  }
});

console.log(`[SW] ${CACHE_VER} loaded`);