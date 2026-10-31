import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const source = fs.readFileSync(new URL("../src/main/main-app/browser-sidebar/browser-history-service.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const { createBrowserHistoryServiceClass } = await import(`data:text/javascript;base64,${Buffer.from(transpiled.code).toString("base64")}`);
let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const flush = () => new Promise((resolve) => setImmediate(resolve));

class RpcHandlerBase {}
const faviconLoads = [];
let browserWindow = { getBounds: () => ({ width: 800 }) };
const BrowserHistoryService = createBrowserHistoryServiceClass({
  RpcHandlerBase,
  clearBrowserData: async (...args) => ["cleared", ...args],
  fromWebContents: () => browserWindow,
  displayScaleFactor: () => 2,
  loadFaviconData: async (_service, options) => {
    faviconLoads.push(options);
    return `data:${options.destinationURL}`;
  },
});

const searchCalls = [];
const historyEntries = [
  { lastVisitTime: 4, url: "https://one.test/a" },
  { lastVisitTime: null, url: "https://invalid.test" },
  { lastVisitTime: 3, url: "https://one.test/b" },
  { lastVisitTime: 2, url: "file:///tmp/file" },
];
const image = { isEmpty: () => false, toDataURL: (options) => `image:${options.scaleFactor}` };
const session = {
  faviconService: { getFavicon: async () => image },
  searchHistory: async (query) => {
    searchCalls.push(query);
    if (query.text === "paged") {
      const rows = [
        { url: "https://invalid.test" },
        { lastVisitTime: 9, url: "https://a.test", title: "A" },
        { lastVisitTime: 8, url: "https://dup.test" },
        { lastVisitTime: 7, url: "https://dup.test", visitTime: 6 },
        { lastVisitTime: 5, url: "https://c.test" },
      ];
      return rows.slice(0, query.maxResults);
    }
    if (query.text === "all") return historyEntries;
    return historyEntries;
  },
  cookies: { get: async () => [{ domain: ".one.test" }, { domain: "one.test" }, { domain: ".two.test" }, {}] },
  getCacheSize: async () => 64,
  getDownloadHistory: async () => [
    { startTime: 6_400, state: "completed" },
    { startTime: 6_399, state: "cancelled" },
    { startTime: 9_999, state: "progressing" },
    { startTime: 7_000, state: "interrupted" },
  ],
  getBrowsingDataSettings: () => ({ preserve: true }),
  removeBrowsingHistoryEntries: async (input) => ["removed", input],
};
const originListeners = new Map();
const origin = {
  destroyed: false,
  isDestroyed() { return this.destroyed; },
  once(name, callback) { originListeners.set(name, callback); },
  off(name, callback) { if (originListeners.get(name) === callback) originListeners.delete(name); },
};
const service = BrowserHistoryService.create(origin, () => session);
equal(await service.clearBrowsingData({ dataTypes: ["history"], timeRange: "lastHour" }), ["cleared", session, ["history"], "lastHour"]);
equal(await service.getBrowsingDataSettings(), { preserve: true });
equal(await service.removeEntries(["entry"]), ["removed", ["entry"]]);

const realNow = Date.now;
Date.now = () => 10_000_000;
const summary = await service.getBrowsingDataSummary("lastHour");
Date.now = realNow;
equal(searchCalls[0], { deduplicateByDay: true, matchingAlgorithm: "alwaysPrefix", maxResults: 0, startTime: 6_400_000, text: "" });
equal(summary, {
  cache: { sizeBytes: 64 },
  downloads: { count: 2 },
  history: { firstSite: "one.test", siteCount: 2 },
  siteData: { siteCount: 2 },
});

faviconLoads.length = 0;
searchCalls.length = 0;
const paged = await service.searchHistory({ text: "paged", offset: 1, maxResults: 2 });
equal(searchCalls.map(({ maxResults }) => maxResults), [3, 5], "invalid rows must cause a larger follow-up query");
equal(paged, [
  { lastVisitTime: 8, url: "https://dup.test", faviconDataURL: "data:https://dup.test", title: "", visitTime: 8 },
  { lastVisitTime: 7, url: "https://dup.test", visitTime: 6, faviconDataURL: "data:https://dup.test", title: "" },
]);
equal(faviconLoads.length, 1, "duplicate URLs share one favicon request");
equal(faviconLoads[0].scaleFactor, 2);
equal(await service.getFavicon("https://one.test", 32), "image:2");
browserWindow = null;
equal(await service.getFavicon("https://one.test", 32), "image:1");
session.faviconService.getFavicon = async () => ({ isEmpty: () => true });
equal(await service.getFavicon("https://one.test", 32), null);
browserWindow = { getBounds: () => ({}) };

const absent = BrowserHistoryService.create(origin, () => null);
await assert.rejects(() => absent.clearBrowsingData({}), /In-app browser is unavailable/); assertions += 1;
let unavailablePublication = "unset";
let unavailableResultDisposals = 0;
equal(absent.subscribeTopSites((value) => {
  unavailablePublication = value;
  return { [Symbol.dispose]: () => { unavailableResultDisposals += 1; } };
}), undefined);
equal(unavailablePublication, null);
equal(unavailableResultDisposals, 1, "unavailable callback result must be released");

const topSiteListeners = new Map();
const topSites = {
  on(name, callback) { topSiteListeners.set(name, callback); },
  off(name, callback) { if (topSiteListeners.get(name) === callback) topSiteListeners.delete(name); },
  get: async () => [{ url: "https://initial.test", title: "Initial" }],
};
session.topSites = topSites;
session.faviconService.getFavicon = async () => image;
const publications = [];
let broken;
let callbackDisposals = 0;
let publicationResultDisposals = 0;
const remoteCallback = (value) => {
  publications.push(value);
  return { [Symbol.dispose]: () => { publicationResultDisposals += 1; } };
};
remoteCallback.onRpcBroken = (callback) => { broken = callback; };
remoteCallback[Symbol.dispose] = () => { callbackDisposals += 1; };
const callback = () => {};
callback.dup = () => remoteCallback;
const subscription = service.subscribeTopSites(callback);
await flush();
equal(publications[0], [{ url: "https://initial.test", title: "Initial", faviconDataURL: null }]);
equal(publications.at(-1), [{ url: "https://initial.test", title: "Initial", faviconDataURL: "data:https://initial.test" }]);
equal(topSiteListeners.has("changed"), true);
topSiteListeners.get("changed")([{ url: "https://changed.test" }]);
await flush();
equal(publications.at(-1), [{ url: "https://changed.test", faviconDataURL: "data:https://changed.test" }]);
equal(publicationResultDisposals, publications.length, "every remote callback result must be released");
subscription[Symbol.dispose]();
subscription[Symbol.dispose]();
equal(topSiteListeners.has("changed"), false);
equal(originListeners.has("destroyed"), false);
equal(callbackDisposals, 1, "subscription cleanup must be idempotent");
broken();
equal(callbackDisposals, 1);

let resolveInitial;
const raceListeners = new Map();
const raceTopSites = {
  on(name, callback) { raceListeners.set(name, callback); },
  off(name, callback) { if (raceListeners.get(name) === callback) raceListeners.delete(name); },
  get: () => new Promise((resolve) => { resolveInitial = resolve; }),
};
const raceSession = { ...session, topSites: raceTopSites };
const racePublications = [];
const raceRemote = (value) => racePublications.push(value);
raceRemote.onRpcBroken = () => {};
raceRemote[Symbol.dispose] = () => {};
const raceCallback = () => {};
raceCallback.dup = () => raceRemote;
const raceService = BrowserHistoryService.create(origin, () => raceSession);
raceService.subscribeTopSites(raceCallback);
raceListeners.get("changed")([{ url: "https://new.test" }]);
resolveInitial([{ url: "https://stale.test" }]);
await flush();
equal(racePublications.some((entries) => entries?.[0]?.url === "https://stale.test"), false, "late initial result must not replace a change event");
equal(racePublications.at(-1), [{ url: "https://new.test", faviconDataURL: "data:https://new.test" }]);

const destroyedOrigin = { isDestroyed: () => true };
let destroyedPublication = "unset";
equal(BrowserHistoryService.create(destroyedOrigin, () => session).subscribeTopSites((value) => { destroyedPublication = value; }), undefined);
equal(destroyedPublication, null);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(main.includes("BrowserHistoryService = createBrowserHistoryServiceClass({"), true);
for (const symbol of ["Jke", "Yke", "Xke", "Zke", "JD"]) equal(new RegExp(`\\b${symbol}\\b`).test(main), false, `${symbol} must be removed`);
equal(windowContext.includes("browsingHistory: BrowserHistoryService.create("), true);

console.log(`${assertions} main browser history service assertions passed`);
