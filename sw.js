// Sri Sai Speciality Dental Care - Service Worker v5
var CACHE_NAME = 'srisai-dental-v5';
var OFFLINE_URL = '/offline.html';

var PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// ── Install ──────────────────────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ── Activate ─────────────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── Fetch ─────────────────────────────────────────────────
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).catch(function() {
        return caches.match(OFFLINE_URL);
      });
    })
  );
});

// ── Push Notifications ────────────────────────────────────
self.addEventListener('push', function(event) {
  var data = {};
  if (event.data) {
    try { data = event.data.json(); } catch(e) { data = { title: event.data.text() }; }
  }
  var title = (data.notification && data.notification.title) || data.title || 'Sri Sai Dental';
  var body  = (data.notification && data.notification.body)  || data.body  || 'You have a new notification';
  event.waitUntil(
    self.registration.showNotification(title, {
      body:    body,
      icon:    '/icons/icon-192.png',
      badge:   '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      data:    { url: data.url || '/' }
    })
  );
});

// ── Notification Click ────────────────────────────────────
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url === url && 'focus' in list[i]) return list[i].focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── Background Sync ───────────────────────────────────────
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-appointments') {
    console.log('Background sync triggered');
  }
});

// ── Periodic Sync ─────────────────────────────────────────
self.addEventListener('periodicsync', function(event) {
  if (event.tag === 'sync-appointments') {
    console.log('Periodic sync triggered');
  }
});

// ── Firebase Background Messages ──────────────────────────
try {
  importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js');

  firebase.initializeApp({
    apiKey: "AIzaSyChfwBA7SWzkMzA0vFFf9uG-Gq0L4YB_a8",
    authDomain: "sri-sai-speciality-denta-5f6ac.firebaseapp.com",
    projectId: "sri-sai-speciality-denta-5f6ac",
    storageBucket: "sri-sai-speciality-denta-5f6ac.firebasestorage.app",
    messagingSenderId: "1031994512049",
    appId: "1:1031994512049:web:969ce6e58636213f6e4890"
  });

  var messaging = firebase.messaging();
  messaging.onBackgroundMessage(function(payload) {
    var title = (payload.notification && payload.notification.title) || 'Sri Sai Dental';
    var body  = (payload.notification && payload.notification.body)  || '';
    self.registration.showNotification(title, {
      body:  body,
      icon:  '/icons/icon-192.png',
      badge: '/icons/icon-192.png'
    });
  });
} catch(e) {
  console.warn('Firebase SW init failed:', e);
}
