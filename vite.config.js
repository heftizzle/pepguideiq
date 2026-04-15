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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
  },
});
