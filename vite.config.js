// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'auto',
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
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 10000, // Increase to 1000 kB (1 MB) or higher
  },
});