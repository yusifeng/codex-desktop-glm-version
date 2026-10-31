import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/browser-use/site-data.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const fn = (name) => ast.body.find((node) => node.type === "FunctionDeclaration" && node.id?.name === name);
const slice = (name) => { const node = fn(name); assert.ok(node); assertions += 1; return transpiled.code.slice(node.start, node.end); };

const partition = Function(
  "BROWSER_USE_PERSIST_PARTITION_PREFIX",
  `${slice("browserUsePartitionNameForHost")}; return browserUsePartitionNameForHost;`,
)("persist:codex-browser-");
equal(partition("chat gpt/example"), "persist:codex-browser-chat%20gpt%2Fexample");

const preferred = [];
const applyPreferredLanguages = Function(
  "app", `${slice("applyPreferredLanguages")}; return applyPreferredLanguages;`,
)({ getPreferredSystemLanguages: () => ["en-US", "fr"], getLocale: () => "en-US" });
applyPreferredLanguages({ setPreferredLanguages: (languages) => preferred.push(languages) }, "fr");
equal(preferred, [["fr", "en-US"]]);

const removed = [];
let flushed = 0;
const clearSiwcCookies = Function(
  "SIWC_COOKIE_NAMES", "SIWC_COOKIE_PREFIX",
  `${slice("clearSiwcCookies")}; return clearSiwcCookies;`,
)(new Set(["sites_preview_token"]), "chatgpt_sites_siwc_login_");
await clearSiwcCookies({ cookies: {
  get: async () => [
    { name: "sites_preview_token", domain: ".example.com", path: "/auth" },
    { name: "chatgpt_sites_siwc_login_123", domain: "example.org" },
    { name: "unrelated", domain: "example.net" },
  ],
  remove: async (...args) => removed.push(args),
  flushStore: async () => { flushed += 1; },
} });
equal(removed, [
  ["https://example.com/auth", "sites_preview_token"],
  ["https://example.org/", "chatgpt_sites_siwc_login_123"],
]);
equal(flushed, 1);

const cleared = [];
const clearBrowserData = Function(
  "SITE_DATA_TYPES", `${slice("clearBrowserData")}; return clearBrowserData;`,
)(["fileSystems", "indexedDB", "localStorage", "webSQL", "serviceWorkers"]);
await clearBrowserData({ clearData: async (options) => cleared.push(options) }, ["cookies", "siteData", "cache"]);
await clearBrowserData({ clearData: async (options) => cleared.push(options) }, ["siteData"], { start: 1 });
equal(cleared[0], { dataTypes: ["cookies", "fileSystems", "indexedDB", "localStorage", "webSQL", "serviceWorkers", "cache"] });
equal(cleared[1], { dataTypes: ["siteData"], timeRange: { start: 1 } });

const ledgerNode = ast.body.find((node) => node.type === "VariableDeclaration" &&
  node.declarations.some((entry) => entry.id?.name === "inAppBrowserChromeUrlsAllowed"));
assert.ok(ledgerNode); assertions += 1;
const ledger = Function(
  `${transpiled.code.slice(ledgerNode.start, ledgerNode.end)}\n${slice("setInAppBrowserChromeUrlsAllowed")}\n${slice("isInAppBrowserChromeUrlsAllowed")}; return { setInAppBrowserChromeUrlsAllowed, isInAppBrowserChromeUrlsAllowed };`,
)();
equal(ledger.isInAppBrowserChromeUrlsAllowed(), false);
ledger.setInAppBrowserChromeUrlsAllowed(true);
equal(ledger.isInAppBrowserChromeUrlsAllowed(), true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser-use/site-data.js")'), true);
equal(main.includes("function Jc("), false);
equal(main.includes("function Yc("), false);
equal(main.includes("async function Xc("), false);
equal(main.includes("async function Zc("), false);
equal(main.includes("var el ="), false);
equal(main.includes("!(nl() && Uae(t))"), true);
equal(main.includes("session.fromPartition(Jc(`app`)"), true);
console.log(`${assertions} main browser-use site data owner assertions passed`);
