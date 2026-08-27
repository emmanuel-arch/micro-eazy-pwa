import { messaging } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";

export async function requestPermission() {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.warn("Notification permission not granted.");
      return;
    }

    // ── Register FCM's OWN worker, explicitly ────────────────────────────
    // This used to be `await navigator.serviceWorker.ready`, which hands back
    // whichever worker happens to control the page. That resolved to the old
    // hand-registered /service-worker.js, which had the Firebase background
    // handler inside it. That worker is now a tombstone (see
    // public/service-worker.js) and the controller is workbox's /sw.js, which
    // knows nothing about FCM — so `ready` would return a registration that
    // silently drops every background message.
    //
    // /firebase-messaging-sw.js is a standalone worker that already carries the
    // onBackgroundMessage handler. Naming it here is what keeps notifications
    // working now that the two concerns are in two files.
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      { scope: '/firebase-cloud-messaging-push-scope' },
    );

    const fcmToken = await getToken(messaging, {
      vapidKey: "BONJZPScFJPYT1OTjyh0HyVip0i6c576xmcJOe4ffsJ5FXEJ425asUBc34z6zZ6gCzFTXOLrwSXN6jNJJEqLH3U", // from Firebase Console (Settings > Cloud Messaging)
      serviceWorkerRegistration: registration,
    });

    if (fcmToken) {
        console.log("✅ FCM Token:", fcmToken);
        const session = localStorage.getItem("session");
        const sessionData = JSON.parse(session);
        const userId = sessionData ? sessionData.userId : null;
        // 🔐 TODO: Send token to your backend API and associate it with the user
        const response = await fetch('https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/registerFCM', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Optional: Add an Authorization header if your API is secured
                // 'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                EntityId: userId,
                PhoneNumber: fcmToken,
            }),
        });

        if (!response.ok) {
            console.error('Failed to send FCM token to backend');
        }
    } else {
      console.warn("⚠️ Failed to get FCM token.");
    }

  } catch (error) {
    console.error("❌ Error getting permission or FCM token:", error);
  }
}

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });