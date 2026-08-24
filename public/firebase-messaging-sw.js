importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBwZcWRl2hYaHqSXZudWDXX82x0KdZWVQU",
  authDomain: "servicesuitecloudpwa.firebaseapp.com",
  projectId: "servicesuitecloudpwa",
  messagingSenderId: "486863334363",
  appId: "1:486863334363:web:efdc1af79d8690f8bc15fe",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const { title, ...options } = payload.notification;
  self.registration.showNotification(title, options);
});
