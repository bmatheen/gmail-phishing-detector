import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Builds the popup as a standard Vite/React app (ES modules, hashed assets).
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: "popup.html",
      },
    },
  },
});
