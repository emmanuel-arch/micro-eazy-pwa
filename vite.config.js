import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // ── 'autoUpdate', NOT 'auto' ────────────────────────────────────────
      // The plugin accepts 'prompt' or 'autoUpdate'. 'auto' is neither, so it
      // silently took the 'prompt' path: a new worker installs into WAITING and
      // stays there until every tab closes, and this app has no prompt UI to
      // activate it. On portal.servicesuitecloud.com that would leave the Micro
      // Eazy app's worker serving ITS precached shell to every device that ever
      // opened it — the deploy would be live and nobody holding a phone would
      // see it.
      registerType: 'autoUpdate',
      manifest: {
        short_name: "Micromart Wallet",
        name: "Micromart Wallet",
        description: "Micromart Loan Management Wallet",
        icons: [
          {
            src: '/service-suite-cloud-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/service-suite-cloud-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Install, activate at once, take over open pages, and delete the
        // previous build's precache — the combination that lets this worker
        // displace the one already registered on the origin.
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        // The tombstone and FCM's worker must always come from the network; a
        // precached copy of either is a stale worker script.
        globIgnores: ['**/service-worker.js', '**/firebase-messaging-sw.js'],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 10000,
  },
});
