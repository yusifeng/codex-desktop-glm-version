import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const output = await build({ entryPoints: [new URL("../src/main/main-app/browser-sidebar/sites-bootstrap-token.ts", import.meta.url).pathname], bundle: true, format: "esm", platform: "node", target: "node22", write: false });
const { createSitesBootstrapTokenRuntime } = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);

let enabled = true;
let now = 10_000;
let requestHandler = async () => ({ ok: true, json: async () => ({ status: "issued", id_token: "token", expires_in: 300 }) });
const requests = [];
const timers = new Map();
let nextTimerId = 1;
const cleared = [];
const runtime = createSitesBootstrapTokenRuntime({
  getFeatureFlags: () => ({ autoAuthForSites: enabled }),
  desktopApiOptions: { desktopOriginator: "desktop", devApiBaseUrl: "dev", prodApiBaseUrl: "prod" },
  sessionResponseSchema: { safeParse(value) { return value?.status === "issued" && value.id_token && value.expires_in > 0 ? { success: true, data: value } : { success: false }; } },
  authedFetch: async (options) => { requests.push(options); options.beforeSend(); return requestHandler(options); },
}, {
  now: () => now,
  setTimer(callback, delay) { const timer = { id: nextTimerId++, callback, delay, unrefCount: 0, unref() { this.unrefCount += 1; } }; timers.set(timer.id, timer); return timer; },
  clearTimer(timer) { if (timer != null) { cleared.push(timer.id); timers.delete(timer.id); } },
});

equal(runtime.isEligibleSiteUrl("https://demo.chatgpt.site/path"), true);
equal(runtime.isEligibleSiteUrl("https://demo.appgardenapps.dev/path"), true);
equal(runtime.isEligibleSiteUrl("https://chatgpt.site/path"), false);
equal(runtime.isEligibleSiteUrl("http://demo.chatgpt.site/path"), false);
equal(runtime.isEligibleSiteUrl("https://user@demo.chatgpt.site/path"), false);
equal(runtime.isEligibleSiteUrl("https://demo.chatgpt.site:8443/path"), false);
equal(runtime.isEligibleSiteUrl("not a url"), false);

const provider = runtime.createTokenProvider({ id: "client" });
equal(await provider("https://demo.chatgpt.site/path"), { idToken: "token", expiresAt: 130_000 });
equal(requests.length, 1);
equal(requests[0].action, "sign in to a Site");
equal(requests[0].path, "/codex/sites/session_bootstrap");
equal(requests[0].desktopApiOptions.prodApiBaseUrl, "prod");
equal(requests[0].request.method, "POST");
equal(requests[0].request.headers, { "Content-Type": "application/json" });
equal(JSON.parse(requests[0].request.body), { target_url: "https://demo.chatgpt.site/path" });
equal(cleared.length, 1);

now = 20_000;
requestHandler = async () => ({ ok: true, json: async () => ({ status: "issued", id_token: "short", expires_in: 30 }) });
equal(await provider("https://demo.appgardenapps.dev/path"), { idToken: "short", expiresAt: 50_000 });
requestHandler = async () => ({ ok: false, json: async () => ({}) });
equal(await provider("https://demo.chatgpt.site/path"), null);
requestHandler = async () => ({ ok: true, json: async () => ({ status: "bad" }) });
equal(await provider("https://demo.chatgpt.site/path"), null);
requestHandler = async () => { throw Error("offline"); };
equal(await provider("https://demo.chatgpt.site/path"), null);

enabled = false;
equal(await provider("https://demo.chatgpt.site/path"), null);
equal(requests.length, 5);
enabled = true;
const aborted = new AbortController();
aborted.abort();
equal(await provider("https://demo.chatgpt.site/path", aborted.signal), null);
equal(requests.length, 5);

let observedSignal;
requestHandler = async (options) => { observedSignal = options.request.signal; return new Promise(() => {}); };
const timedOut = provider("https://demo.chatgpt.site/path");
const timeout = [...timers.values()][0];
equal(timeout.delay, 3_000);
equal(timeout.unrefCount, 1);
timeout.callback();
equal(await timedOut, null);
equal(observedSignal.aborted, true);

enabled = true;
requestHandler = async () => ({ ok: true, json: async () => ({ status: "issued", id_token: "late", expires_in: 1 }) });
const originalFetch = requests.length;
const flippingRuntime = createSitesBootstrapTokenRuntime({
  getFeatureFlags: () => ({ autoAuthForSites: enabled }),
  desktopApiOptions: {},
  sessionResponseSchema: { safeParse: () => ({ success: false }) },
  authedFetch: async (options) => { enabled = false; options.beforeSend(); return requestHandler(options); },
});
equal(await flippingRuntime.createTokenProvider({})("https://demo.chatgpt.site"), null);
equal(requests.length, originalFetch);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/sites-bootstrap-token.js")'), true);
equal(main.includes("function rZe("), false);
equal(main.includes("async function iZe("), false);
equal(main.includes("createTokenProvider: rZe"), true);
equal(main.includes("rZe(this.getAppServerConnection(this.hostId))"), false);
const handler = fs.readFileSync(new URL("../src/main/main-app/window/electron-message-handler.ts", import.meta.url), "utf8");
equal(handler.includes("rZe(this.getAppServerConnection(this.hostId))"), true);
console.log(`${assertions} main Sites bootstrap token assertions passed`);
