import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The frontend calls the backend services via relative paths (e.g.
// /listings/v1/properties, /auth/v1/login). In dev, Vite proxies each prefix to
// its API container, which sidesteps CORS and mirrors the nginx /api
// reverse-proxy used in prod.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Scope each proxy to the service's /v1 API paths only. Anchoring to
      // `/v1` keeps SPA routes that share a prefix (e.g. the "/listings" page)
      // from being hijacked by the proxy on a full-page load — those fall
      // through to Vite's SPA index instead.
      "^/listings/v1": {
        target: "http://localhost:5100",
        changeOrigin: true,
      },
      // search-service (OpenSearch) handles keyword search only; plain browsing of the
      // grid stays on /listings/v1 above. See api/properties.ts for the routing rule.
      "^/search/v1": {
        target: "http://localhost:5600",
        changeOrigin: true,
      },
      "^/auth/v1": {
        target: "http://localhost:5300",
        changeOrigin: true,
      },
      "^/deals/v1": {
        target: "http://localhost:5200",
        changeOrigin: true,
      },
      "^/documents/v1": {
        target: "http://localhost:5400",
        changeOrigin: true,
      },
      "^/ai/v1": {
        target: "http://localhost:5700",
        changeOrigin: true,
      },
    },
  },
});
