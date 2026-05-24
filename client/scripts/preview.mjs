import { preview } from "vite";
import { viteConfig } from "./vite-shared.mjs";

const server = await preview({
  ...viteConfig,
  preview: {
    host: "::",
    port: 4173,
  },
});

server.printUrls();
