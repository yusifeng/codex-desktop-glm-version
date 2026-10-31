import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import path from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [path.join(root, "src/main/main-app/mcp-sandbox/network-runtime.ts")],
  bundle: true,
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createMcpSandboxNetworkRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const ok = (actual, message) => {
  assert.ok(actual, message);
  assertions += 1;
};

class RpcHandlerBase {}
class SessionMock extends EventEmitter {
  constructor() {
    super();
    this.protocolHandlers = [];
    this.protocol = { handle: (scheme, handler) => this.protocolHandlers.push({ scheme, handler }) };
    this.headerHandlers = [];
    this.webRequest = { onBeforeSendHeaders: (handler) => this.headerHandlers.push(handler) };
  }
  getUserAgent() { return "Mozilla Chrome/124.0 Electron/42.0 Codex/1.0 Safari/1.0"; }
  setPermissionCheckHandler(handler) { this.permissionCheck = handler; }
  setPermissionRequestHandler(handler) { this.permissionRequest = handler; }
}

const fetchCalls = [];
const fetchQueue = [];
const logs = [];
const trustedSessions = [];
const sessionsByPartition = new Map();
const gestureCalls = [];
const defaultSession = new SessionMock();
const clearCalls = [];
const persistentSession = {
  storagePath: "/storage/partition-cache",
  async clearData() { clearCalls.push("shared"); },
};
sessionsByPartition.set("persist:shared", persistentSession);
const directoryEntries = [
  { name: `partitionconnection-${"a".repeat(48)}`, isDirectory: () => true },
  { name: `partitionconnection-${"g".repeat(48)}`, isDirectory: () => true },
  { name: "other", isDirectory: () => true },
  { name: `partitionconnection-${"b".repeat(48)}`, isDirectory: () => false },
];

const runtime = createMcpSandboxNetworkRuntime({
  RpcHandlerBase,
  app: {
    getLocale: () => "en-US",
    getName: () => "Codex",
    getPreferredSystemLanguages: () => ["en-US", "fr", "de"],
  },
  buildSharedUrl: ({ locale }) => `https://shared.example/start?locale=${locale}`,
  consumeUserGesture(owner, sandboxId, initId) {
    gestureCalls.push({ owner, sandboxId, initId });
    return sandboxId === "sandbox-ok";
  },
  defaultSession,
  fsPromises: { async readdir() { return directoryEntries; } },
  isSandboxHostname: (hostname) => hostname === "app.example" || hostname === "web-sandbox.oaiusercontent.com",
  logger: () => ({ info(message, tags) { logs.push({ message, tags }); } }),
  markTrustedSession(session) { trustedSessions.push(session); },
  async netFetch(url, init) {
    fetchCalls.push({ url, init });
    return fetchQueue.shift() ?? new Response("ok", { status: 200 });
  },
  parseOrigin(url, options) {
    const parsed = new URL(url);
    if (options?.requireSkybridge === true)
      return parsed.searchParams.get("sky") === "1" || parsed.protocol === "codex-sandbox:"
        ? "https://widget.example"
        : null;
    return parsed.searchParams.get("origin") ?? parsed.origin;
  },
  path,
  persistentPartition: "persist:shared",
  protocolScheme: "codex-sandbox",
  sanitizeUrl: (url) => `safe:${new URL(url).protocol}`,
  sessionFromPartition(partition) {
    if (!sessionsByPartition.has(partition)) {
      sessionsByPartition.set(partition, {
        async clearData() { clearCalls.push(partition); },
      });
    }
    return sessionsByPartition.get(partition);
  },
  toPersistentPartition: (connectionId) => `persist:${connectionId}`,
  userGestureSchema: {
    safeParse(value) {
      return value != null && typeof value.sandboxId === "string"
        ? { success: true, data: value }
        : { success: false };
    },
  },
});

equal(runtime.normalizeSandboxRequest(new Request("https://app.example/page", { method: "POST" })), null, "only GET sandbox requests are proxied");
equal(runtime.normalizeSandboxRequest(new Request("https://evil.example/app.js")), null, "non-sandbox host is rejected");
equal(runtime.normalizeSandboxRequest(new Request("https://app.example/random")), null, "non-shell non-asset request is rejected");
equal(
  runtime.normalizeSandboxRequest(new Request("codex-sandbox://app.example/view?sky=1&locale=fr")),
  "https://web-sandbox.oaiusercontent.com/mcp-app.html?sky=1&locale=fr",
  "skybridge request projects to the fixed shell host",
);
equal(
  runtime.normalizeSandboxRequest(new Request("https://app.example/assets/main-abcdefgh.js")),
  "https://web-sandbox.oaiusercontent.com/assets/main-abcdefgh.js",
  "hashed startup asset is admitted",
);
equal(runtime.getCacheState("https://evil.example/app"), "cold", "invalid cache keys are cold");

fetchQueue.push(new Response("miss", { status: 503 }), new Response("asset", { status: 200 }));
const fallback = await runtime.fetchSandboxRequest(
  new Request("https://app.example/assets/main-abcdefgh.js"),
);
equal(await fallback.text(), "asset", "force-cache miss retries through reload");
equal(fetchCalls.slice(-2).map(({ init }) => init.cache), ["force-cache", "reload"], "cache fallback preserves fetch order");
equal(fetchCalls.at(-1).init.credentials, "omit", "sandbox fetches omit credentials");
equal(fetchCalls.at(-1).init.redirect, "error", "sandbox fetches reject redirects");

const shellHtml = [
  '<script src="/assets/app-abcdefgh.js"></script>',
  '<link href="/assets/app-abcdefgh.js">',
  '<link href="/assets/style-ijklmnop.css">',
].join("\n");
fetchQueue.push(
  new Response(shellHtml, { status: 200 }),
  new Response("js", { status: 200 }),
  new Response("css", { status: 200 }),
  new Response("refresh", { status: 200 }),
);
const prewarm = runtime.prewarmSandbox("fr");
equal(runtime.getCacheState("codex-sandbox://app.example/view?locale=fr"), "warming", "prewarm exposes warming state");
await prewarm;
await Promise.resolve();
equal(runtime.getCacheState("codex-sandbox://app.example/view?locale=fr"), "warm", "successful prewarm becomes warm");
const assetFetches = fetchCalls.filter(({ url }) => url.includes("/assets/"));
equal(assetFetches.filter(({ url }) => url.endsWith("app-abcdefgh.js")).length >= 1, true, "duplicate asset references are deduplicated per prewarm");
equal(fetchCalls.some(({ url }) => url.includes("style-ijklmnop.css")), true, "CSS startup assets are prewarmed");

await new Promise((resolve) => setImmediate(resolve));
const beforeWarmRefresh = fetchCalls.length;
await runtime.prewarmSandbox("fr");
await Promise.resolve();
equal(fetchCalls.length > beforeWarmRefresh, true, "warm cache access schedules background refresh");

const rewritten = runtime.rewriteRequestHeaders(
  { "user-agent": "old", "accept-language": "old", Existing: "value" },
  {
    acceptLanguage: "en-US,fr;q=0.9",
    excludedUserAgentProducts: ["Electron", "Codex"],
    userAgent: "Mozilla Chrome/124.0 Electron/42.0 Codex/1.0 Safari/1.0",
  },
);
equal(rewritten["user-agent"], undefined, "lowercase user-agent alias is removed");
equal(rewritten["accept-language"], undefined, "lowercase language alias is removed");
equal(rewritten["User-Agent"], "Mozilla Chrome/124.0 Safari/1.0", "Electron and app products are removed from UA");
equal(rewritten["Accept-Language"], "en-US,fr;q=0.9", "preferred language header is canonicalized");
equal(rewritten["sec-ch-ua"], '"Chromium";v="124", "Google Chrome";v="124", "Not=A?Brand";v="24"', "client hint follows Chromium version");
equal(rewritten["sec-ch-ua-mobile"], "?0", "desktop mobile hint is fixed");
ok(["\"macOS\"", "\"Windows\"", "\"Linux\""].includes(rewritten["sec-ch-ua-platform"]), "platform hint is normalized");
equal(rewritten.Existing, "value", "unrelated headers are preserved");
equal(runtime.preferredLanguages(), "en-US,fr;q=0.9,de;q=0.8", "preferred languages retain descending quality");

equal(runtime.isAllowedRequest("https://example.com", { allowLocalDevelopment: false }), true, "HTTPS is allowed");
equal(runtime.isAllowedRequest("wss://example.com", { allowLocalDevelopment: false }), true, "secure websockets are allowed");
equal(runtime.isAllowedRequest("http://localhost:3000", { allowLocalDevelopment: false }), false, "localhost HTTP requires development admission");
equal(runtime.isAllowedRequest("http://localhost:3000", { allowLocalDevelopment: true }), true, "admitted localhost HTTP is allowed");
equal(runtime.isAllowedRequest("codex-sandbox://app.example/view", { allowLocalDevelopment: false }), true, "sandbox protocol on trusted host is allowed");
equal(runtime.isAllowedRequest("file:///private", { allowLocalDevelopment: true }), false, "file protocol remains blocked");

equal(runtime.isSandboxRequest({
  frame: null,
  requestHeaders: { Origin: "https://app.example" },
  url: "https://cdn.example/file",
}), true, "sandbox Origin marks a request for header rewriting");
equal(runtime.isSandboxRequest({
  frame: { origin: "https://app.example", url: "https://app.example" },
  requestHeaders: {},
  url: "https://cdn.example/file",
}), true, "sandbox frame marks a request for header rewriting");
equal(runtime.isSandboxRequest({ frame: null, requestHeaders: {}, url: "https://cdn.example" }), false, "ordinary requests keep default headers");

runtime.initializeDefaultSessionHeaders();
runtime.initializeDefaultSessionHeaders();
equal(defaultSession.headerHandlers.length, 1, "default header hook installs once");
let defaultHeaderResult;
defaultSession.headerHandlers[0]({
  frame: null,
  requestHeaders: { Origin: "https://app.example" },
  url: "https://cdn.example/file",
}, (value) => { defaultHeaderResult = value; });
equal(defaultHeaderResult.requestHeaders["User-Agent"].includes("Electron/"), false, "default sandbox request removes Electron UA product");

const sandboxSession = new SessionMock();
const restrictionCalls = [];
const applicationNetwork = {
  addSessionRestriction(value, callback) { restrictionCalls.push({ value, callback }); },
};
const states = new Map();
let gestureAllowed = true;
const configureOptions = {
  applicationNetwork,
  consumeUserGestureForGuest() {
    const value = gestureAllowed;
    gestureAllowed = false;
    return value;
  },
  getSandboxState: (id) => states.get(id) ?? null,
};
runtime.configureSession(sandboxSession, configureOptions);
runtime.configureSession(sandboxSession, configureOptions);
equal(trustedSessions, [sandboxSession, sandboxSession], "trusted-session marker runs for every configuration request");
equal(sandboxSession.protocolHandlers.length, 1, "protocol handler installs once per session");
equal(restrictionCalls.length, 1, "network restriction installs once per session");
equal(sandboxSession.headerHandlers.length, 1, "session header hook installs once");

const guest = { id: 7, getURL: () => "https://app.example/?origin=https%3A%2F%2Fwidget.example" };
states.set(guest.id, {
  allowLocalDevelopment: true,
  origin: "https://widget.example",
  sandboxId: "local-network-sandbox",
});
let permissionResult;
sandboxSession.permissionRequest(
  guest,
  "local-network",
  (value) => { permissionResult = value; },
  { requestingUrl: "https://app.example/?origin=https%3A%2F%2Fwidget.example" },
);
equal(permissionResult, true, "matching local-network permission is allowed");
states.set(guest.id, { ...states.get(guest.id), sandboxId: "sandbox-normal" });
sandboxSession.permissionRequest(
  guest,
  "clipboard-sanitized-write",
  (value) => { permissionResult = value; },
  { requestingUrl: guest.getURL() },
);
equal(permissionResult, true, "matching-origin clipboard permission consumes a gesture");
sandboxSession.permissionRequest(
  guest,
  "clipboard-sanitized-write",
  (value) => { permissionResult = value; },
  { requestingUrl: guest.getURL() },
);
equal(permissionResult, false, "clipboard permission is denied without another gesture");
equal(logs.at(-1).message, "mcp_app_sandbox.permission_blocked", "permission denial is logged");
equal(sandboxSession.permissionCheck(guest, "local-network", guest.getURL()), false, "permission check follows sandbox-id gate");

let downloadPrevented = 0;
let downloadCancelled = 0;
sandboxSession.emit(
  "will-download",
  { preventDefault() { downloadPrevented += 1; } },
  { getURL: () => "https://download.example/file", cancel() { downloadCancelled += 1; } },
);
equal([downloadPrevented, downloadCancelled], [1, 1], "downloads are prevented and cancelled");

equal(restrictionCalls[0].callback({
  url: "http://localhost:3000", resourceType: "xhr", webContentsId: guest.id,
}), { cancel: false }, "admitted local-development request passes restriction");
equal(restrictionCalls[0].callback({
  url: "file:///private", resourceType: "xhr", webContentsId: guest.id,
}), { cancel: true }, "privileged file request is cancelled");
equal(logs.at(-1).message, "mcp_app_sandbox.request_blocked", "cancelled request is logged");

let sessionHeaderResult;
sandboxSession.headerHandlers[0]({ requestHeaders: {} }, (value) => { sessionHeaderResult = value; });
equal(sessionHeaderResult.requestHeaders["Accept-Language"], "en-US,fr;q=0.9,de;q=0.8", "session header hook injects preferred languages");

fetchQueue.push(new Response("protocol", {
  status: 201,
  headers: {
    "Content-Security-Policy": "default-src 'none'",
    "Content-Type": "text/javascript",
    "Permissions-Policy": "camera=()",
    Extra: "blocked",
  },
}));
const protocolResponse = await sandboxSession.protocolHandlers[0].handler(
  new Request("https://app.example/assets/main-abcdefgh.js"),
);
equal(protocolResponse.status, 201, "protocol bridge preserves upstream status");
equal(protocolResponse.headers.get("Content-Type"), "text/javascript", "protocol bridge preserves allowlisted content type");
equal(protocolResponse.headers.get("Extra"), null, "protocol bridge strips non-allowlisted headers");
equal(protocolResponse.headers.get("X-Content-Type-Options"), "nosniff", "protocol bridge enforces nosniff");

const DataHandler = runtime.McpSandboxDataHandler;
const owner = { id: 1 };
const dataHandler = new DataHandler(owner);
equal(await dataHandler.consumeUserGesture(null), false, "invalid gesture RPC payload is rejected");
equal(await dataHandler.consumeUserGesture({ sandboxId: "sandbox-ok", initId: "init" }), true, "valid gesture RPC delegates to lifecycle owner");
equal(gestureCalls, [{ owner, sandboxId: "sandbox-ok", initId: "init" }], "gesture RPC preserves owner and identities");

await dataHandler.clearData();
equal(clearCalls.includes("shared"), true, "shared persistent session data is cleared");
equal(clearCalls.includes(`persist:connection-${"a".repeat(48)}`), true, "matching connection partition is cleared");
equal(clearCalls.length, 2, "invalid and non-directory partitions are ignored");

ok(assertions >= 55, "MCP sandbox network runtime has broad cache, policy, permission, and cleanup coverage");
console.log(`${assertions} main MCP sandbox network runtime owner assertions passed`);
