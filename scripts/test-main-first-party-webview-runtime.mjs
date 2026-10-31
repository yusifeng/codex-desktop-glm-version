import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
globalThis.__partitionSessions = new Map();
const output = await build({
  entryPoints: [new URL("../src/main/main-app/browser-sidebar/first-party-webview.ts", import.meta.url).pathname],
  bundle: true, format: "esm", platform: "node", target: "node22", write: false,
  plugins: [{ name: "first-party-stubs", setup(api) {
    api.onResolve({ filter: /^electron$/ }, ({ path }) => ({ path, namespace: "electron" }));
    api.onLoad({ filter: /.*/, namespace: "electron" }, () => ({ contents: `export const session = { fromPartition: (partition) => { if (!globalThis.__partitionSessions.has(partition)) globalThis.__partitionSessions.set(partition, { partition }); return globalThis.__partitionSessions.get(partition); } };`, loader: "js" }));
    api.onResolve({ filter: /^@chunk\/shared$/ }, ({ path }) => ({ path, namespace: "shared" }));
    api.onLoad({ filter: /.*/, namespace: "shared" }, () => ({ contents: `
      const schema = () => ({ optional() { return this; }, nullable() { return this; }, safeParse(value) { return { success: true, data: value }; } });
      export const wf = () => schema(); export const Of = () => schema(); export const gf = () => schema(); export const Ef = () => schema();
      export const vi = (token) => JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    `, loader: "js" }));
    api.onResolve({ filter: /^@chunk\/logger$/ }, ({ path }) => ({ path, namespace: "logger" }));
    api.onLoad({ filter: /.*/, namespace: "logger" }, () => ({ contents: `export const memoizedTaggedLogger = () => () => ({ warning() {} });`, loader: "js" }));
  } }],
});
const runtime = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);

equal(runtime.chatgptOrigin(), "https://chatgpt.com");
equal(runtime.isFirstPartyAuthenticatedPartition({ partition: "codex-first-party-plugin-authenticated-chatgpt-abc" }), true);
equal(runtime.isFirstPartyAuthenticatedPartition({ partition: "persist:other" }), false);

const cookieCalls = [];
const fetchCalls = [];
const session = {
  cookies: {
    remove: async (url, name) => cookieCalls.push(["remove", url, name]),
    set: async (details) => cookieCalls.push(["set", details.name, details.value]),
  },
  fetch: async (url) => {
    fetchCalls.push(url);
    return { ok: true, json: async () => ({ account: { planType: "plus" } }) };
  },
};
const loads = [];
const webContents = {
  isDestroyed: () => false,
  getURL: () => "about:blank",
  loadURL: async (url, options) => loads.push([url, options]),
  executeJavaScript: async () => true,
};
const claims = { exp: Math.floor(Date.now() / 1000) + 3600, accountId: "personal", isFedramp: false };
const token = `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;
await runtime.authenticateChatGptWebview({
  accountId: "personal",
  getAuthToken: async () => token,
  session,
  targetUrl: "https://chatgpt.com/codex",
  webContents,
});
equal(cookieCalls.filter(([kind]) => kind === "remove").length, 4);
equal(cookieCalls.some((call) => call[0] === "set" && call[1] === "_account" && call[2] === "personal"), true);
equal(loads[0][0], "https://chatgpt.com/api/auth/session");
equal(loads[1][0], "https://chatgpt.com/api/auth/link-session");
equal(loads.at(-1)[0], "https://chatgpt.com/codex");
equal(await runtime.pollSessionPlanType(session), "plus");
equal(fetchCalls.at(-1).includes("refresh_account=true"), true);
await assert.rejects(() => runtime.authenticateChatGptWebview({ accountId: null, getAuthToken: async () => token, session, targetUrl: "https://evil.example", webContents }), /must be ChatGPT/);
assertions += 1;

const listeners = new Map();
const owner = {
  on: (name, listener) => listeners.set(name, listener),
  removeListener: (name) => listeners.delete(name),
};
const dispose = runtime.createFirstPartyWebviewAttachHook({ getAuthToken: async () => token, owner });
equal([...listeners.keys()].sort(), ["destroyed", "did-attach-webview", "will-attach-webview"]);
const details = {};
const preferences = { preload: "/unsafe" };
const params = { partition: "codex-first-party-plugin-authenticated-chatgpt-test", disablewebsecurity: "yes", webpreferences: "yes", src: "about:blank" };
listeners.get("will-attach-webview")(details, preferences, params);
equal(preferences.sandbox, true);
equal(preferences.contextIsolation, true);
equal(preferences.webSecurity, true);
equal("preload" in preferences, false);
equal(params.allowpopups, "");
equal(runtime.isFirstPartyAuthenticatedSession({ session: details.session }), true, "session registry is shared outside the attach hook");
dispose();
equal(listeners.size, 0);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/first-party-webview.js")'), true);
for (const oldOwner of ["async function xW(", "async function CW(", "function lUe(", "function uUe("]) equal(main.includes(oldOwner), false, `${oldOwner} is removed`);

console.log(`${assertions} main first-party webview runtime assertions passed`);
