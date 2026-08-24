// =========================================
// Firebase Messaging Setup
// =========================================

// Load Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyBwZcWRl2hYaHqSXZudWDXX82x0KdZWVQU",
  authDomain: "servicesuitecloudpwa.firebaseapp.com",
  projectId: "servicesuitecloudpwa",
  messagingSenderId: "486863334363",
  appId: "1:486863334363:web:efdc1af79d8690f8bc15fe",
});

// Retrieve Firebase Messaging instance
const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Background message received:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/service-suite-cloud-192.png',
    badge: '/service-suite-cloud-192.png',
    vibrate: [100, 50, 100],
    tag: 'pwa-notification',
    renotify: true,
    requireInteraction: true, // Keeps notification until user interacts
    data: payload.data || {},

    // 🔔 For sound, this doesn't directly work in browsers,
    // but we can simulate attention with vibration and interaction
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('app-cache').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/service-suite-cloud-192.png',
        '/service-suite-cloud-512.png'
      ]);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  // Currently no cache cleanup needed
});

// Fetch event (cache-first strategy)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
