import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // Playwright writes traces, screenshots and reports into docs/qa/evidence
      // while a run is in progress. The dev server watches the whole project
      // root, so each of those files fired an HMR page reload -- which reloads
      // the page mid-test and, over a full run, churned the watcher hard enough
      // to OOM the dev server. None of it is application source.
      ignored: ["**/docs/qa/evidence/**", "**/playwright-reports/**", "**/test-results/**"],
    },
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
