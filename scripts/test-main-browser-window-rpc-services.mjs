import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const source = fs.readFileSync(new URL("../src/main/main-app/window/browser-window-rpc-services.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const runtime = await import(`data:text/javascript;base64,${Buffer.from(transpiled.code).toString("base64")}`);
let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
class RpcHandlerBase {}

const warnings = [];
const profiles = [{ source: "chrome", profilePath: "/profile", hasExtensions: true }];
const importer = {
  getSignals: async () => ({ found: true }),
  list: async () => profiles,
  import: async (request) => ({ imported: request.source }),
};
let requirements = {};
let session = { browserProfileImporter: importer };
const BrowserProfileImportService = runtime.createBrowserProfileImportServiceClass({
  RpcHandlerBase,
  platform: "darwin",
  logger: { warning: (message) => warnings.push(message) },
  parseSignals: (value) => ({ parsed: value }),
  parseImportRequest: (value) => value,
  parseProfileList: (value) => value,
  parseImportResult: (value) => ({ parsed: value }),
});
const profileService = BrowserProfileImportService.create(
  async () => ({ requirements }),
  () => session,
);
equal(await profileService.getImportSignals(), { parsed: { found: true } });
equal(await profileService.listImportableBrowserProfiles(), profiles);
await assert.rejects(() => profileService.importBrowserProfile({ source: "chrome", profilePath: "/profile", importExtensions: true }), /requires confirmation/); assertions += 1;
await assert.rejects(() => profileService.importBrowserProfile({ source: "chrome", profilePath: "/profile" }), /Select cookies/); assertions += 1;
equal(await profileService.importBrowserProfile({ source: "chrome", profilePath: "/profile", importHistory: true }), { parsed: { imported: "chrome" } });
requirements = { inAppBrowser: { allowExternalBrowserSettingsImport: false } };
equal(await profileService.listImportableBrowserProfiles(), []);
await assert.rejects(() => profileService.importBrowserProfile({}), /disabled by managed policy/); assertions += 1;
session = null;
requirements = {};
equal(await profileService.getImportSignals(), null);

const DetachedBrowserTabsService = runtime.createDetachedBrowserTabsServiceClass(RpcHandlerBase);
let detachedContext = null;
const detachedManager = { findForSource: (_origin, predicate) => detachedContext != null && predicate(detachedContext) ? detachedContext : null };
const detached = new DetachedBrowserTabsService(detachedManager, "origin", () => "https://current.test");
equal(detached.isBrowserTabDetachedFromSource("c", "t"), false);
detachedContext = {
  content: { kind: "browser", data: { conversationId: "c", browserTabId: "t" } },
  request: { content: { kind: "browser", data: { conversationId: "c", browserTabId: "t" } } },
  sourceThreadId: "source",
  tabId: "tab",
  window: { webContents: "web" },
  revealSource: async () => true,
  isActive: () => true,
};
equal(detached.isBrowserTabDetachedFromSource("c", "t"), true);
equal(await detached.focusSourceForBrowserComment("c", "t"), true);
equal(detached.isCurrentBrowserSiteUrl("source", "tab", "https://current.test"), true);
equal(detached.isCurrentBrowserSiteUrl("source", "tab", "https://wrong.test"), false);

const dialogs = [];
let browserWindow = null;
const DownloadsService = runtime.createDownloadsServiceClass({
  RpcHandlerBase,
  fromWebContents: () => browserWindow,
  async showOpenDialog(...args) { dialogs.push(args); return { canceled: false, filePaths: ["/downloads"] }; },
});
const storeCalls = [];
const store = new Proxy({}, { get: (_target, method) => (...args) => { storeCalls.push([method, ...args]); return method; } });
let viewDisposed = 0;
const callback = { dup: () => "duplicated-callback" };
const downloads = new DownloadsService(store, { isDestroyed: () => false }, (...args) => { storeCalls.push(["register", ...args]); return () => { viewDisposed += 1; }; });
equal(await downloads.chooseDownloadDirectory(), "/downloads");
equal(dialogs[0].length, 1);
browserWindow = "window";
equal(await downloads.chooseDownloadDirectory(), "/downloads");
equal(dialogs[1][0], "window");
equal(await downloads.cancel("download"), "cancel");
equal(downloads.searchHistory("query"), "searchHistory");
const subscription = downloads.subscribe(callback);
equal(storeCalls.at(-1), ["register", downloads.origin, "duplicated-callback"]);
subscription.unsubscribe(); subscription.unsubscribe();
equal(viewDisposed, 1, "downloads subscription must be idempotent");
const destroyedDownloads = new DownloadsService(store, { isDestroyed: () => true }, () => () => {});
equal(await destroyedDownloads.downloadUrl("url"), false);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
for (const token of ["BrowserProfileImportService = createBrowserProfileImportServiceClass({", "DetachedBrowserTabsService = createDetachedBrowserTabsServiceClass", "DownloadsService = createDownloadsServiceClass({"]) equal(main.includes(token), true);
for (const token of ["var qke = class", "var nAe = class", "var iAe = class", "aAe = class"]) equal(main.includes(token), false);
equal(windowContext.includes("BrowserProfileImportService.create("), true);
equal(windowContext.includes("new DetachedBrowserTabsService("), true);
equal(windowContext.includes("new DownloadsService("), true);

console.log(`${assertions} main browser window RPC service assertions passed`);
