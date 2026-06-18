import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The frontend calls the listings-service via relative paths (e.g.
// /listings/v1/properties). In dev, Vite proxies those to the API container,
// which sidesteps CORS and mirrors the nginx /api reverse-proxy used in prod.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/listings": {
        target: "http://localhost:5100",
        changeOrigin: true,
      },
    },
  },
});
