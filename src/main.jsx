import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SessionProvider } from './context/SessionContext';
import { enforceRealm } from './lib/realm';

// BEFORE anything reads storage. SessionContext loads the cached session during
// its own initialisation, so a guard that ran inside an effect would already
// have handed a stranger's session to the app. See src/lib/realm.js.
enforceRealm();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SessionProvider>
      <App />
    </SessionProvider>
  </React.StrictMode>
);

// ── NO SERVICE WORKER IS REGISTERED HERE, DELIBERATELY ──────────────────────
//
// This used to register '/service-worker.js' by hand: a second worker at scope
// '/' beside the '/sw.js' that vite-plugin-pwa emits and '/registerSW.js'
// registers. The hand-written one cached '/' and '/index.html' into a never-
// versioned 'app-cache' and answered cache-first, so the first build a browser
// saw was frozen there and no later deploy could reach it.
//
// That matters more on portal.servicesuitecloud.com than anywhere: the origin
// already has the Micro Eazy app's workbox worker installed on customer
// devices, and only a worker at '/sw.js' that activates immediately replaces
// it. public/service-worker.js is now a tombstone that unregisters itself on
// any browser still holding the old one. Firebase messaging registers its own
// worker under its own scope — see notificationPermission.js.

// ── ONE RELOAD WHEN A NEW BUILD TAKES OVER ───────────────────────────────────
// The worker precaches the app, so the first open after a deploy still runs
// the OLD bundle from Cache Storage while the new worker installs; it activates
// and claims this page (skipWaiting + clientsClaim), but the code on screen is
// already loaded. That is how a customer kept seeing "Invalid ID data detected"
// after the fix was live. When control passes from one worker to another — an
// update, not a first install — reload once so the new build is what runs.
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}