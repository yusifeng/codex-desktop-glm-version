import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
globalThis.__originWindow = { id: 1, isDestroyed: () => false };
const output = await build({
  entryPoints: [new URL("../src/main/main-app/browser-sidebar/iab-tab-candidate-store.ts", import.meta.url).pathname],
  bundle: true, format: "esm", platform: "node", target: "node22", write: false,
  plugins: [{ name: "candidate-store-stubs", setup(api) {
    api.onResolve({ filter: /^electron$/ }, ({ path }) => ({ path, namespace: "electron" }));
    api.onLoad({ filter: /.*/, namespace: "electron" }, () => ({ contents: `export const BrowserWindow = { fromWebContents: () => globalThis.__originWindow };`, loader: "js" }));
    api.onResolve({ filter: /^@chunk\/shared$/ }, ({ path }) => ({ path, namespace: "shared" }));
    api.onLoad({ filter: /.*/, namespace: "shared" }, () => ({ contents: `
      export const qc = (snapshot, query) => snapshot.title.toLowerCase().includes(query.toLowerCase()) || snapshot.url.includes(query);
      export const Jc = (value) => value ?? null;
      export const Uc = { safeParse: (value) => ({ success: value.snapshot.url.startsWith("http"), data: value }) };
      export const Vc = { browser: "browser" };
      export const lu = { NEW_TAB_PAGE: "new-tab-page" };
    `, loader: "js" }));
  } }],
});
const { IabTabCandidateStore } = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);

const thread = (browserTabId, title, recency, extra = {}) => ({
  browserTabId,
  conversationId: "conversation",
  lastTabActivityTime: recency,
  snapshot: { faviconUrl: null, tabType: "page", title, url: `https://${title.toLowerCase()}.example`, ...extra.snapshot },
  ...extra,
});
const primary = { threads: new Map([["a", thread("a", "Alpha", 10)], ["b", thread("b", "Beta", 20)]]) };
const child = { tabSourceWindow: primary, threads: new Map([["c", thread("c", "Alpha Child", 30)]]) };
const unrelated = { threads: new Map([["d", thread("d", "Alpha Other", 100)]]) };
const windows = new Map([[1, primary], [2, child], [3, unrelated]]);
const store = new IabTabCandidateStore(windows);

equal(store.search({}, null, "Alpha"), { candidates: [] });
const result = store.search({}, "conversation", "Alpha");
equal(result.candidates.length, 2);
equal(result.candidates.map((candidate) => candidate.tabId), ["c", "a"], "recency order spans source-window children only");
equal(result.candidates[0].source, "iab");
equal(result.candidates[0].pluginId, "browser");
equal(store.search({}, "conversation", "", 1).candidates.length, 1);
equal(store.search({}, "conversation", "", 1000).candidates.length, 3, "limit is capped without excluding eligible window-family tabs");

primary.threads.set("closed", thread("closed", "Closed", 50, { pendingTeardown: { reason: "closed" } }));
primary.threads.set("blank", thread("blank", "Blank", 60, { snapshot: { tabType: "new-tab-page", title: "Blank", url: "" } }));
equal(store.search({}, "conversation", "Closed").candidates.length, 0);
equal(store.search({}, "conversation", "Blank").candidates.length, 0);

let invalidations = 0;
const unsubscribe = store.subscribeInvalidations(() => { invalidations += 1; });
store.trackSnapshotUpdate(primary.threads.get("a"), () => { primary.threads.get("a").snapshot.title = "Alpha Updated"; });
equal(invalidations, 1);
store.trackSnapshotUpdate(primary.threads.get("a"), () => {});
equal(invalidations, 1);
unsubscribe();
store.notifyInvalidated();
equal(invalidations, 1);
globalThis.__originWindow = { id: 1, isDestroyed: () => true };
equal(store.search({}, "conversation", "").candidates.length, 0);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/iab-tab-candidate-store.js")'), true);
for (const oldOwner of ["var qGe = class", "function JGe(", "function YGe(", "function XGe("]) equal(main.includes(oldOwner), false, `${oldOwner} is removed`);

console.log(`${assertions} main IAB tab candidate store assertions passed`);
