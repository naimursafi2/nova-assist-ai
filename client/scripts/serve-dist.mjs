import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const port = Number(process.env.PORT || 8090);
const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"],
]);

const server = http.createServer((request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url || "/", `http://localhost:${port}`).pathname);
  const requested = path.resolve(root, `.${urlPath}`);
  const safePath = requested.startsWith(root) && fs.existsSync(requested) && fs.statSync(requested).isFile()
    ? requested
    : path.join(root, "index.html");

  response.setHeader("Content-Type", types.get(path.extname(safePath)) || "application/octet-stream");
  fs.createReadStream(safePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Static preview running at http://127.0.0.1:${port}`);
});
