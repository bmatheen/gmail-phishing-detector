import { defineConfig } from "vite";

// Builds the content script as a single self-contained IIFE file
// (Chrome content scripts loaded via manifest "js" arrays are classic
// scripts, not ES modules, so no code-splitting is allowed here).
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: "src/content/index.ts",
      formats: ["iife"],
      name: "PhishingGuardContent",
      fileName: () => "content.js",
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
});
