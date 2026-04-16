import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy API calls through Vite so cookies (SameSite=Strict) work in local dev.
      // In production the frontend hits the backend directly (VITE_API_BASE is absolute).
      "/api/v1": {
        target: "http://31.97.188.38:5000",
        changeOrigin: true,
      },
    },
  },
});
