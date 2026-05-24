import path from "node:path";
import { fileURLToPath } from "node:url";

export const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const viteConfig = {
  root: clientRoot,
  configFile: false,
  base: "./",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  optimizeDeps: {
    noDiscovery: true,
    include: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(clientRoot, "src"),
      "framer-motion": path.resolve(clientRoot, "node_modules/framer-motion/dist/cjs/index.js"),
    },
  },
};
