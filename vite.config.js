import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      workbox: {
        // Tu regla para el peso máximo de archivos
        maximumFileSizeToCacheInBytes: 4000000,

        // 👇 NUEVAS REGLAS PARA FORZAR ACTUALIZACIÓN 👇
        cleanupOutdatedCaches: true, // Borra la caché de versiones viejas en el celular
        skipWaiting: true,           // Obliga al nuevo Service Worker a activarse de inmediato
        clientsClaim: true           // Obliga a las pestañas abiertas a usar la versión nueva
        // 👆 👆 👆
      },

      manifest: {
        short_name: "Agente",
        name: "Agente Solutions",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#FF6600",
        icons: [
          {
            src: "/Logo_192.png",
            type: "image/png",
            sizes: "192x192"
          },
          {
            src: "/Logo_512.png",
            type: "image/png",
            sizes: "512x512"
          }
        ]
      }
    })
  ],
})