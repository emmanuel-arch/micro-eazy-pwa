import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SessionProvider } from './context/SessionContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SessionProvider>
      <App />
    </SessionProvider>
  </React.StrictMode>
);

// ── NO SERVICE WORKER IS REGISTERED HERE, DELIBERATELY ──────────────────────
//
// This file used to register '/service-worker.js' by hand. That was the second
// service worker on this origin: vite-plugin-pwa already emits '/sw.js' and
// injects '/registerSW.js' into index.html to register it. Two workers at scope
// '/' both claim the same navigations, control flips between reloads, and the
// app is served by whichever one won that particular load.
//
// The hand-written one was the worse of the two. It cached '/' and
// '/index.html' into a cache named 'app-cache', never versioned that name,
// never cleaned it up on activate, and answered every fetch cache-first with no
// revalidation. Once a browser had loaded the app even once, its copy of
// index.html — and therefore the hashed bundle that copy names — was frozen
// permanently. No deploy could dislodge it.
//
// public/service-worker.js still EXISTS, and must: it is now a tombstone that
// unregisters itself and deletes that cache on every browser that still has it.
// Deleting the file instead would leave those browsers requesting a path that
// the SPA rewrite answers with index.html, which fails the script MIME check and
// leaves the old worker installed forever. See public/service-worker.js.
//
// Registration of the real worker is vite-plugin-pwa's job. Do not add one here.