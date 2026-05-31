import http from "node:http";

import { loadKiwiLemmatizer } from "./kiwi.mjs";

const PORT = Number(process.env.PORT ?? 8080);
const MAX_BODY_BYTES = 100_000;

function readJsonBody(req) {
  return new Promise((resolvePromise, reject) => {
    let raw = "";
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolvePromise(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json" });
  res.end(payload);
}

// Kiwi는 한 번만 띄워(warm) 이후 요청은 즉시 처리한다.
const lemmatizer = await loadKiwiLemmatizer();
console.log(`[korean-analyzer] kiwi ${lemmatizer.version()} ready`);

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { status: "ok", kiwi: lemmatizer.version() });
    return;
  }

  if (req.method === "POST" && req.url === "/lemmatize") {
    try {
      const body = await readJsonBody(req);
      if (typeof body.text !== "string") {
        sendJson(res, 400, { error: "text must be a string" });
        return;
      }
      sendJson(res, 200, { lemmas: lemmatizer.lemmatize(body.text) });
    } catch (error) {
      sendJson(res, 400, { error: error instanceof Error ? error.message : "bad request" });
    }
    return;
  }

  sendJson(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`[korean-analyzer] listening on :${PORT} (POST /lemmatize, GET /health)`);
});
