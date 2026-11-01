import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

globalThis.__openedUrls = [];
globalThis.__browserPane = true;
const output = await build({
  entryPoints: [new URL("../src/main/main-app/browser/link-opening.ts", import.meta.url).pathname],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  plugins: [{
    name: "link-opening-stubs",
    setup(api) {
      api.onResolve({ filter: /^electron$/ }, ({ path }) => ({ path, namespace: "electron-stub" }));
      api.onLoad({ filter: /.*/, namespace: "electron-stub" }, () => ({
        contents: `
          export const shell = { openExternal: async (url) => { globalThis.__openedUrls.push(url); } };
          export const net = { fetch: async () => ({ json: async () => ({ ok: true, team_id: "TTEAM" }) }) };
        `,
        loader: "js",
      }));
      api.onResolve({ filter: /^@chunk\/shared$/ }, ({ path }) => ({ path, namespace: "shared-stub" }));
      api.onLoad({ filter: /.*/, namespace: "shared-stub" }, () => ({
        contents: `
          const schema = () => ({ regex() { return this; }, safeParse(value) { return { success: value?.ok === true, data: value }; } });
          export const wf = () => schema(); export const Of = () => schema(); export const bf = () => schema();
          export const Ia = {
            openLinkInTargetPreference: { key: "open-target" },
            openLocalUrlInTargetPreference: { key: "local-target", default: "external-browser" },
            externalBrowserLinkShortcut: { key: "external-shortcut", default: "Meta+Shift" },
          };
          export const ef = "external-browser"; export const Zo = (error) => error;
          export const bl = (path) => path.startsWith("/"); export const xl = () => false;
          export const Tl = (path) => path; export const El = (path) => path;
        `,
        loader: "js",
      }));
      api.onResolve({ filter: /^@chunk\/logger$/ }, ({ path }) => ({ path, namespace: "logger-stub" }));
      api.onLoad({ filter: /.*/, namespace: "logger-stub" }, () => ({
        contents: `export const memoizedTaggedLogger = () => () => ({ error() {}, warning() {} });`,
        loader: "js",
      }));
      api.onResolve({ filter: /^\.\.\/misc\/availability$/ }, ({ path }) => ({ path, namespace: "availability-stub" }));
      api.onLoad({ filter: /.*/, namespace: "availability-stub" }, () => ({
        contents: `export const getDesktopFeatureAvailability = () => ({ browserPane: globalThis.__browserPane, defaultLinkOpenTargetPreference: "external-browser" });`,
        loader: "js",
      }));
    },
  }],
});
const runtime = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);

equal(runtime.isHttpUrl("https://example.com"), true);
equal(runtime.isHttpUrl("mailto:test@example.com"), false);
equal(runtime.isHtmlFileName("index.HTML"), true);
equal(runtime.isHtmlFileName("notes.md"), false);
equal(runtime.localHttpPort("http://localhost:4312/path"), 4312);
equal(runtime.localHttpPort("https://demo.localhost/path"), 443);
equal(runtime.localHttpPort("https://example.com/path"), null);
equal(runtime.isLocalUrl("http://localhost:3000"), true);
equal(runtime.isLocalUrl("https://example.com"), false);
equal(runtime.isSupportedExternalUrl("mailto:test@example.com"), true);
equal(runtime.isSecureOrLocalHttpUrl("http://example.com"), false);
equal(runtime.normalizeUrlOrBlank("about:blank"), "");
equal(runtime.threadBrowserTabStorageKey("a/b"), "thread-browser-tabs-v1:a%2Fb");
equal(runtime.browserRoutePartition("owner", "thread"), "persist:codex-browser-app-route:owner%00thread");
equal(runtime.threadBrowserTabKey("thread"), "thread");
equal(runtime.BROWSER_ROUTE_PARTITION_PREFIX, "persist:codex-browser-app-route:");
equal(runtime.PAGE_RESTORE_ATTRIBUTE, "data-browser-sidebar-page-restore");
equal(runtime.shouldOpenLinkInAppBrowser({
  browserPaneEnabled: true,
  link: { type: "file", path: "/tmp/index.html" },
}), true);
equal(runtime.resolveOpenLinkPreference(undefined), "external-browser");
equal(runtime.resolveOpenLinkPreference({ get: () => "in-app-browser" }), "in-app-browser");
equal(runtime.resolveLinkOpenTarget({ browserPaneEnabled: true, openTarget: "in-app-browser", url: "https://example.com" }), "in-app-browser");

const inlineMessages = [];
const criticalMessages = [];
const windowManager = {
  sendInlineMessageForView: (_target, message) => inlineMessages.push(message),
  sendMessageToWebContents: (_target, message, options) => criticalMessages.push([message, options]),
};
equal(await runtime.openLinkInPreferredTarget({
  request: { url: "https://example.com/page", openTarget: "in-app-browser", disposition: "new-background-tab" },
  targetWebContents: { id: 7 },
  windowManager,
}), true);
equal(inlineMessages[0].type, "toggle-browser-panel");
equal(inlineMessages[0].active, false);

equal(await runtime.openLinkInPreferredTarget({
  request: { url: "codex://threads/abc" },
  windowManager,
  queueCodexDeepLinkUrl: () => true,
}), true);
equal(globalThis.__openedUrls.length, 0);

equal(await runtime.openLinkInPreferredTarget({
  request: { url: "https://chatgpt.com/c/test", openTarget: "external-browser" },
  windowManager,
}), true);
equal(new URL(globalThis.__openedUrls.at(-1)).searchParams.get("no_universal_links"), "1");

equal(await runtime.openLinkInPreferredTarget({
  request: { url: "https://app.slack.com/client/TTEAM/CCHANNEL" },
  windowManager,
}), true);
equal(globalThis.__openedUrls.at(-1), "slack://channel?team=TTEAM&id=CCHANNEL");

equal(await runtime.openLinkInPreferredTarget({
  request: { url: "javascript:alert(1)", openTarget: "external-browser" },
  windowManager,
}), false);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser/link-opening.js")'), true);
equal(main.includes("function MH("), false);
equal(main.includes("async function IH("), false);
equal(main.includes("function mBe("), false);
equal(main.includes("function bBe("), false);
equal(main.includes("browserRoutePartitionPrefix: BROWSER_ROUTE_PARTITION_PREFIX"), true);
equal(main.includes("makePartitionKey: browserRoutePartition"), true);
equal(main.includes("canOpenExternalUrl: isSupportedExternalUrl"), true);
equal(main.includes("normalizeUrl: normalizeUrlOrBlank"), true);
equal(main.includes("getLocalhostPort: localHttpPort"), true);
equal(main.includes("rt: threadBrowserTabStorageKey"), true);
equal(main.includes("isHtml: isHtmlFileName"), true);
equal(main.includes("shouldOpenInBrowserPane: shouldOpenLinkInAppBrowser"), true);
for (const name of ["ze", "Be", "Ve", "He", "Ue", "We", "Ge", "Ke", "qe", "Je", "Ye", "Xe", "Ze"])
  equal(main.includes(`function ${name}(`), false);
equal(main.includes("var Qe = `persist:codex-browser-app-route:`"), false);
equal(main.includes("function nt("), false);
equal(main.includes("function rt("), false);
equal(main.includes("function it("), false);

console.log(`${assertions} main link-opening runtime assertions passed`);
