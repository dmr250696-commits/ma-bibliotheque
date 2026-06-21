import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// IMPORTANT : remplace 'ma-bibliotheque' par le nom EXACT de ton repo GitHub
// si tu déploies sur https://<ton-pseudo>.github.io/<nom-repo>/
const REPO_NAME = 'ma-bibliotheque'

export default defineConfig({
  base: `/${REPO_NAME}/`,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Ma Bibliothèque',
        short_name: 'Bibliothèque',
        description: 'Catalogue personnel de livres : lus, prêtés, souhaités, dédicacés',
        theme_color: '#3C2A1E',
        background_color: '#F2E9D8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: `/${REPO_NAME}/`,
        scope: `/${REPO_NAME}/`,
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
})
