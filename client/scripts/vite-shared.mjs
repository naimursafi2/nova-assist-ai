import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

export const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

function resolveFromClient(packageName) {
  return require.resolve(packageName, { paths: [clientRoot] });
}

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
      "framer-motion": resolveFromClient("framer-motion"),
    },
  },
};
