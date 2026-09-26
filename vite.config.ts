import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  build: {
    // Las librerías cambian poco: en su propio archivo, el navegador las reutiliza
    // de la caché entre despliegues en lugar de volver a bajarlas.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@supabase") || id.includes("postgrest") || id.includes("realtime-js") || id.includes("gotrue")) return "supabase";
          return "react";
        }
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "robots.txt"],
      manifest: {
        name: "Campus+ · Actividades académicas",
        short_name: "Campus+",
        description: "Seguimiento de actividades académicas para estudiantes, profesores y tutores.",
        lang: "es-MX",
        dir: "ltr",
        start_url: "/",
        scope: "/",
        display: "standalone",
        display_override: ["standalone", "minimal-ui", "browser"],
        orientation: "any",
        background_color: "#ffffff",
        theme_color: "#00492C",
        categories: ["education", "productivity"],
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ],
        // Accesos directos del menú contextual del icono instalado.
        shortcuts: [
          { name: "Mis actividades", short_name: "Actividades", url: "/estudiante/actividades" },
          { name: "Registrar actividad", short_name: "Nueva", url: "/profesor/actividades/nueva" },
          { name: "Tutorados", short_name: "Tutorados", url: "/tutor/tutorados" }
        ]
      },
      workbox: {
        navigateFallback: "/index.html",
        // La tipografía es local, así que entra en la precarga junto con el resto.
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"]
      }
    })
  ]
});
