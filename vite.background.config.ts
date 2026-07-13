import { defineConfig } from "vite";

// Builds the background service worker as a single ES module file.
// MV3 service workers declared with "type": "module" in the manifest
// can use ES module syntax directly.
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: "src/background/index.ts",
      formats: ["es"],
      fileName: () => "background.js",
    },
  },
});
