import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { isKey } from "../shared/config";
import type { Profile } from "../shared/config";
import type { Controller, Device, Intent } from "./controller";
export const PORT = 29381;
export type Credentials = { origin: string; token: string };
const originRE = /^chrome-extension:\/\/[a-p]{32}$/;
function equal(a: string, b: string) { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }
export function createBridge(o: { controller: Controller; profiles: Profile[]; devices: () => Device[]; credentials?: Credentials; saveCredentials: (c: Credentials) => Promise<void>; savePaused: (p: boolean) => Promise<void>; port?: number; credentialsChanged?: () => void; pausedChanged?: () => void }) {
  const port = o.port ?? PORT;
  let credentials = o.credentials;
  let pairing: { code: string; expires: number } | undefined;
  let attempts = 0, windowStart = Date.now(), lastSequence = -1, lastSeen = 0;
  const instance = randomBytes(16).toString("hex");
  let eventQueue = Promise.resolve();
  const status = () => ({ version: 1, instance, paused: o.controller.isPaused, profiles: o.profiles.map(p => ({ key: p.key, label: p.label, deviceType: p.deviceType })), devices: o.devices(), results: o.controller.results });
  function reply(res: ServerResponse, code: number, body: unknown) { res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }); res.end(JSON.stringify(body)); }
  async function body(req: IncomingMessage) {
    let size = 0; const chunks: Buffer[] = [];
    for await (const chunk of req) { size += chunk.length; if (size > 8192) throw new Error("too-large"); chunks.push(chunk); }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  }
  const server = createServer((req, res) => { void handle(req, res).catch(() => { if (!res.headersSent) reply(res, 400, { error: "invalid-request" }); else res.end(); }); });
  async function handle(req: IncomingMessage, res: ServerResponse) {
    const origin = req.headers.origin ?? "";
    if (req.headers.host !== `127.0.0.1:${port}` || req.socket.remoteAddress !== "127.0.0.1" || !originRE.test(origin)) return reply(res, 403, { error: "origin-denied" });
    const pairRoute = req.url === "/v1/pair";
    if (!(credentials?.origin === origin || (pairRoute && pairing && pairing.expires > Date.now()))) return reply(res, 403, { error: "origin-denied" });
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "POST"); res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
      // Chromium local-network preflight, where supported. Still origin-checked above.
      res.setHeader("Access-Control-Allow-Private-Network", "true"); res.writeHead(204); return res.end();
    }
    if (req.method !== "POST") return reply(res, 405, { error: "method-denied" });
    if (req.headers["content-type"] !== "application/json") return reply(res, 415, { error: "json-required" });
    if (pairRoute) {
      if (Date.now() - windowStart > 60000) { attempts = 0; windowStart = Date.now(); }
      if (++attempts > 5) return reply(res, 429, { error: "pair-rate-limit" });
      const b = await body(req);
      if (!pairing || pairing.expires < Date.now() || typeof b?.code !== "string" || !equal(b.code, pairing.code)) return reply(res, 401, { error: "pair-denied" });
      const next = { origin, token: randomBytes(32).toString("hex") };
      await o.saveCredentials(next); credentials = next; o.credentialsChanged?.(); pairing = undefined; lastSequence = -1;
      await o.controller.expire(); return reply(res, 200, { token: next.token });
    }
    if (!credentials || !equal(req.headers.authorization ?? "", `Bearer ${credentials.token}`)) return reply(res, 401, { error: "unauthorized" });
    const b = await body(req);
    if (req.url === "/v1/status") return reply(res, 200, status());
    if (req.url === "/v1/pause") {
      if (typeof b?.paused !== "boolean") return reply(res, 400, { error: "invalid-pause" });
      await o.savePaused(b.paused); await o.controller.setPaused(b.paused); o.pausedChanged?.(); return reply(res, 200, status());
    }
    if (req.url !== "/v1/event") return reply(res, 404, { error: "not-found" });
    if (!b || b.instance !== instance) return reply(res, 409, { error: "instance-changed" });
    const allowed = ["instance", "sequence", "focused", "target", "keep", "paused", "deviceIds"];
    if (Object.keys(b).some(k => !allowed.includes(k)) || !Number.isSafeInteger(b.sequence) || b.sequence < 0 || typeof b.focused !== "boolean" || typeof b.keep !== "boolean" || typeof b.paused !== "boolean" || !(b.target === null || isKey(b.target)) || !Array.isArray(b.deviceIds) || b.deviceIds.length > 32 || !b.deviceIds.every((x: unknown) => typeof x === "string" && x.length > 0 && x.length <= 128)) return reply(res, 400, { error: "invalid-event" });
    // Serialize acceptance as well as commands; late requests cannot override newer focus.
    const run = eventQueue.then(async () => {
      if (b.sequence <= lastSequence) { reply(res, 409, { error: "stale-event" }); return; }
      lastSequence = b.sequence; lastSeen = Date.now();
      await o.controller.update(b as Intent); reply(res, 200, status());
    });
    eventQueue = run.catch(() => {}); await run;
  }
  server.requestTimeout = 5000; server.headersTimeout = 5000; server.keepAliveTimeout = 1000; server.maxHeadersCount = 24;
  const watchdog = setInterval(() => { if (lastSeen && Date.now() - lastSeen > 90000) { lastSeen = 0; void o.controller.expire(); } }, 5000);
  watchdog.unref();
  return {
    server, status,
    credentials: () => credentials,
    beginPairing() { pairing = { code: randomBytes(24).toString("hex"), expires: Date.now() + 120000 }; attempts = 0; windowStart = Date.now(); return pairing; },
    async listen() { await new Promise<void>((resolve, reject) => { const failed = (error: Error) => { server.removeListener("listening", ready); reject(error); }; const ready = () => { server.removeListener("error", failed); resolve(); }; server.once("error", failed); server.once("listening", ready); server.listen(port, "127.0.0.1"); }); },
    async close() { clearInterval(watchdog); await o.controller.expire(); await new Promise<void>(resolve => { server.close(() => resolve()); server.closeAllConnections(); }); }
  };
}
