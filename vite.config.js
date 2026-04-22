import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        short_name: "Agente",
        name: "Agente Solutions",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#FF6600",
        icons: [
          {
            src: "/Logo_192.png", // Asegúrate de tener esta imagen en tu carpeta public
            type: "image/png",
            sizes: "192x192"
          },
          {
            src: "/Logo_512.png", // Asegúrate de tener esta imagen en tu carpeta public
            type: "image/png",
            sizes: "512x512"
          }
        ]
      }
    })
  ],
})