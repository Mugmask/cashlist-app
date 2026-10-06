import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const BACKGROUND = '#0e1014' // --color-bg

// Without these the app runs in local mode (no account, no sync). Fine for previews, never
// for production: a production deploy that lacks them fails instead
const REQUIRED_IN_PRODUCTION = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
if (process.env.VERCEL_ENV === 'production') {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key])
  if (missing.length > 0) throw new Error(`Missing env for production: ${missing.join(', ')}`)
}

// https://vite.dev/config/
export default defineConfig({
  // dist/.vite/manifest.json: which chunks the app loads at startup (scripts/size.mjs)
  build: { manifest: true },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      // Icons, favicon and iOS splash screens are generated from public/logo.svg
      // (pwa-assets.config.ts) and injected into the manifest and index.html
      pwaAssets: { config: true },
      manifest: {
        id: '/',
        name: 'Cashlist',
        short_name: 'Cashlist',
        description: 'Controlá tus gastos, tus fijos del mes y la lista del súper.',
        lang: 'es-AR',
        dir: 'ltr',
        categories: ['finance', 'productivity', 'shopping'],
        theme_color: BACKGROUND,
        background_color: BACKGROUND,
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        // Long-press on the home screen icon
        shortcuts: [
          {
            name: 'Cargar gasto',
            short_name: 'Gasto',
            url: '/?action=add-expense',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Lista de compras',
            short_name: 'Compras',
            url: '/shopping',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Gastos fijos',
            short_name: 'Fijos',
            url: '/fixed',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
        // Shown by Android's install dialog ("richer install UI")
        screenshots: [
          {
            src: 'screenshots/home.png',
            sizes: '780x1688',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Tu mes de un vistazo: variables, fijos y en qué se va la plata',
          },
          {
            src: 'screenshots/fixed.png',
            sizes: '780x1688',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Tus gastos fijos del mes, para no olvidarte ninguno',
          },
          {
            src: 'screenshots/shopping.png',
            sizes: '780x1688',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'La lista del súper se arma sola con lo que se te acabó',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
        globIgnores: [
          // Font subsets Spanish never needs: "latin" has all of it (á, ñ, ü, ¿, ¡). The browser
          // only fetches the others (unicode-range) if a character of theirs ever shows
          '**/*-{latin-ext,cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2',
          // Only used by iOS at launch and by the install dialog: not worth precaching
          '**/apple-splash-*.png',
          '**/screenshots/*.png',
        ],
      },
    }),
  ],
})
