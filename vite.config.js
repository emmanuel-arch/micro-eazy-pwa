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
        registerType: 'auto',
        manifest: {
          short_name: 'Micromart',
          name: 'Micromart — powered by Micro Eazy',
          description: 'Apply, track and repay your loan from your phone.',
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
          // "?src=pwa" is the only thing that distinguishes an installed launch
          // from a browser visit once the app is running.
          start_url: '/?src=pwa',
          scope: '/',
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
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
