import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Use VITE_API_WORKER_URL=http://localhost:5173/api-worker when wrangler dev runs on 8787
      // so the browser talks to Vite and Vite forwards to the Worker (helps CORS / mixed ports).
      "/api-worker": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
        rewrite: (path) => {
          const stripped = path.replace(/^\/api-worker/, "");
          return stripped === "" ? "/" : stripped;
        },
      },
    },
  },
  build: {
    // Compounds chunk is ~2.1 MB until lazy-load; 1600 still warns — cap above that for clean CI logs.
    chunkSizeWarningLimit: 2200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const x = id.replace(/\\/g, "/");
          // Phase B: catalogMeta.js (GOALS, CAT_COLORS, getCategoryCssVars, CATALOG_COUNT) stays in the
          // entry bundle. catalog.js + compounds/ load only on Library visit or first Atfeh message, etc.
          // Match catalog.js exactly so catalogMeta.js is not pulled into "compounds" (substring trap).
          if (x.includes("src/data/compounds") || /src\/data\/catalog\.js$/.test(x)) return "compounds";
          if (x.includes("node_modules/@supabase")) return "vendor-supabase";
          if (
            x.includes("node_modules/react/") ||
            x.includes("node_modules/react-dom/") ||
            x.includes("node_modules/scheduler/") ||
            x.includes("node_modules/use-sync-external-store/")
          ) {
            return "vendor-react";
          }
          if (x.includes("node_modules")) return "vendor-misc";
        },
      },
    },
  },
});
