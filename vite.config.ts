/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * GitHub Pages serves a project site from `/<repo>/`. The prefix is opt-in because `npm run preview`
 * and the Playwright suite drive the built output at the site root.
 */
const base = process.env.GITHUB_PAGES === 'true' ? '/improv-detour/' : '/';

const dir = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  base,
  resolve: {
    alias: {
      '@game': dir('./src/game'),
      '@app': dir('./src/app'),
      '@content': dir('./src/content'),
      '@theme': dir('./src/theme'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registered from src/app/platform/registerUpdates.ts so the app can check for new versions on return.
      injectRegister: false,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Detour',
        short_name: 'Detour',
        description: 'A family improv game you play out loud, wherever you are.',
        theme_color: '#15130f',
        background_color: '#15130f',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        maximumFileSizeToCacheInBytes: 3_000_000,
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 900 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
