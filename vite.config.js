import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// The Connected Suite deployment that answers /api/portal/* and /api/mpesa/*.
// In production this is never used by the browser — vercel.json proxies /api at
// the edge so the borrower's SameSite=Lax session cookie stays same-origin. This
// value only exists so `vite dev` can do the same thing locally.
const DEFAULT_SUITE = 'https://lms.servicesuitecloud.com';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const suite = env.VITE_SUITE_ORIGIN || DEFAULT_SUITE;

  return {
    plugins: [
      react(),
      VitePWA({
        // ── 'autoUpdate', NOT 'auto' ──────────────────────────────────────
        // vite-plugin-pwa accepts exactly two values here: 'prompt' and
        // 'autoUpdate'. 'auto' is neither. It does not throw — it simply is not
        // 'autoUpdate', so the plugin takes the 'prompt' path, in which a new
        // service worker installs into the WAITING state and stays there until
        // every tab of the app is closed and reopened, or until the app calls
        // the updateSW() callback to activate it. This app has no update prompt
        // UI and never calls it. So a deploy reached the user's device, sat
        // there installed, and did nothing.
        //
        // 'autoUpdate' activates the new worker as soon as it installs, which is
        // the behaviour a borrower-facing app wants: you do not want somebody
        // repaying a loan against a build from three deploys ago.
        registerType: 'autoUpdate',
        // ── THE APP'S IDENTITY ────────────────────────────────────────────
        // This used to say "Micromart" and point at the ServiceSuite Cloud
        // icons, so the installed app announced itself as somebody else's
        // product with a generic mark. It also lost outright to a second,
        // hand-written public/manifest.json that index.html linked explicitly —
        // two manifests, and the wrong one won. That file is gone; this is now
        // the only manifest, and VitePWA injects the link itself.
        manifest: {
          name: 'Micro Eazy',
          short_name: 'Micro Eazy',
          description: 'Quick loans. Better living. Apply, track and repay from your phone.',
          // ── WHY THREE ICONS AND NOT ONE ──────────────────────────────────
          // "any" is TRANSPARENT — it is what sits in the Windows Start menu
          // and the macOS dock, and a transparent mark is the difference
          // between an app and a white sticker on the desktop. "maskable" is
          // filled, because Android and Chrome crop it to the launcher's own
          // shape and a transparent one crops to a transparent blob.
          // Regenerate all of them with `npm run brand:icons`.
          icons: [
            { src: '/brand/micro-eazy/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/brand/micro-eazy/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/brand/micro-eazy/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          // The title bar in standalone mode. Brand navy, matching --eco-accent,
          // so the window chrome belongs to the app rather than to the browser.
          theme_color: '#012863',
          // The SPLASH, not the icon — it shows for the half second before the
          // app paints. White because the app's own ground is light; a navy
          // splash would flash dark and then blink white.
          background_color: '#ffffff',
          display: 'standalone',
          // "?src=pwa" is the only thing that distinguishes an installed launch
          // from a browser visit once the app is running.
          start_url: '/?src=pwa',
          scope: '/',
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          // ── THE THREE THAT MAKE A DEPLOY ACTUALLY LAND ───────────────────
          // clientsClaim + skipWaiting are what 'autoUpdate' is for: install
          // the new worker, activate it immediately, and take over the pages
          // that are already open rather than waiting for a cold start.
          //
          // cleanupOutdatedCaches deletes precaches from previous builds. With-
          // out it every deploy leaves its whole precache behind on the device
          // and Cache Storage grows without bound — which on a phone eventually
          // gets the whole origin evicted at once, mid-session.
          clientsClaim: true,
          skipWaiting: true,
          cleanupOutdatedCaches: true,
          // The legacy Micromart worker is now a tombstone that unregisters
          // itself (public/service-worker.js). Precaching it would let workbox
          // serve a stale COPY of the tombstone, so it is excluded here and
          // always fetched from the network.
          globIgnores: ['**/service-worker.js', '**/firebase-messaging-sw.js'],
          // ── THE ONE THAT WOULD HAVE BITTEN IN PRODUCTION ──────────────────
          // navigateFallback serves the SPA shell for navigations that miss the
          // cache. Without this denylist the service worker would answer
          // /api/portal/* with index.html the moment the app went offline — or
          // worse, intermittently while online — and every API call would fail
          // by parsing an HTML document as JSON. The API is not a navigation and
          // must always reach the network.
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api\//],
        },
      }),
    ],
    server: {
      // Mirrors the vercel.json rewrite so local development authenticates the
      // same way production does, rather than working differently and hiding
      // cookie bugs until deploy.
      proxy: {
        '/api': {
          target: suite,
          changeOrigin: true,
          secure: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 10000,
    },
  };
});
