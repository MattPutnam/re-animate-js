import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "playground",
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
