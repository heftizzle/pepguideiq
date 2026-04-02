import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const n = id.replace(/\\/g, "/");
          if (n.includes("/node_modules/react/") || n.includes("/node_modules/react-dom/")) {
            return "vendor-react";
          }
          if (n.includes("/node_modules/@supabase/")) {
            return "supabase";
          }
          if (n.includes("/src/data/catalog")) {
            return "catalog";
          }
        },
      },
    },
  },
});
