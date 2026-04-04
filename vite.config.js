import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.ico'],
      manifest: {
        id: 'spark-lms-v1',
        name: 'Spark Trainings LMS',
        short_name: 'Spark LMS',
        description: 'Elite Professional Training Platform',
        start_url: '/admin',
        scope: '/admin',
        display: 'standalone',
        theme_color: '#0d9c06',
        background_color: '#ffffff',
        orientation: 'portrait',
        icons: [
          {
            src: '/favicon.ico',
            sizes: '192x192',
            type: 'image/ico'
          },
          {
            src: '/favicon.ico',
            sizes: '512x512',
            type: 'image/ico'
          },
          {
            src: '/favicon.ico',
            sizes: '512x512',
            type: 'image/ico',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
});
