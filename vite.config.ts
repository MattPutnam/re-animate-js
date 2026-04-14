import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// When building for GitHub Pages, the site is served from
// https://<user>.github.io/re-animate-js/, so assets need that path prefix.
// Set GITHUB_PAGES=true (the deploy workflow does this) to enable.
const base = process.env.GITHUB_PAGES === "true" ? "/re-animate-js/" : "/";

export default defineConfig({
  root: "playground",
  base,
  plugins: [react()],
  resolve: {
    alias: {
      "re-animate-js": path.resolve(__dirname, "./lib/index.ts"),
    },
  },
  server: {
    open: true,
  },
});
