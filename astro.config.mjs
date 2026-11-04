import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://nimbo-pay.vercel.app",
  trailingSlash: "ignore",
  // Three.js (the 3D marks) is its own chunk, loaded after the page: about 560 kB, 140 kB gzipped
  vite: { build: { chunkSizeWarningLimit: 700 } },
});
