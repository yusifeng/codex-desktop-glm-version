import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import * as acorn from "acorn";
import { transform } from "esbuild";
import { createDownloadStoreClass } from "../src/main/main-app/downloads/download-store.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/downloads/download-store.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, {
  loader: "ts",
  format: "esm",
  target: "es2022",
});
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
let classNode = null;
const visit = (node) => {
  if (node == null || typeof node !== "object") return;
  if (node.type === "ClassExpression" && node.id?.name === "DownloadStore") classNode = node;
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(visit);
    else visit(value);
  }
};
visit(ast);
assert.ok(classNode, "DownloadStore should survive TypeScript transformation");
assertions += 1;
equal(classNode.body.body.length, 49);

const existingPaths = new Set();
const openedPaths = [];
const shownPaths = [];
const timers = new Map();
let nextTimer = 1;
class FakeWebContentsView {
  constructor() {
    this.webContents = new EventEmitter();
    this.webContents.id = 91;
    this.webContents.destroyed = false;
    this.webContents.isDestroyed = () => this.webContents.destroyed;
    this.webContents.close = () => {
      this.webContents.destroyed = true;
    };
    this.webContents.downloadURL = (url) => {
      this.webContents.downloadedUrl = url;
    };
  }
}
const DownloadStore = createDownloadStoreClass({
  electron: {
    app: { getPath: () => "/downloads" },
    shell: {
      openPath: async (target) => {
        openedPaths.push(target);
        return "";
      },
      showItemInFolder: (target) => shownPaths.push(target),
    },
    WebContentsView: FakeWebContentsView,
  },
  errorMessage: (error) => String(error),
  fs: { existsSync: (target) => existingPaths.has(target) },
  path,
  sanitizeUrl: (url) => (url.startsWith("https://") ? url : null),
  setTimer(callback, delay) {
    const id = nextTimer++;
    timers.set(id, { callback, delay });
    return id;
  },
  clearTimer(id) {
    timers.delete(id);
  },
  scheduleMicrotask: (callback) => callback(),
});

const makeItem = ({ id = "download-1", filename = "report.txt", url = "https://example.test/report.txt" } = {}) => {
  const item = new EventEmitter();
  item.paused = false;
  item.savePath = "";
  item.getGUID = () => id;
  item.getFilename = () => filename;
  item.getReceivedBytes = () => 10;
  item.getTotalBytes = () => 100;
  item.getSavePath = () => item.savePath;
  item.getURL = () => url;
  item.getURLChain = () => [url];
  item.isPaused = () => item.paused;
  item.canResume = () => true;
  item.pause = () => {
    item.paused = true;
  };
  item.resume = () => {
    item.paused = false;
  };
  item.cancel = () => {
    item.canceled = true;
  };
  item.setSavePath = (target) => {
    item.savePath = target;
  };
  item.setSaveDialogOptions = (options) => {
    item.dialogOptions = options;
  };
  return item;
};

const store = new DownloadStore({ getDownloadDirectory: () => "/downloads" });
existingPaths.add("/downloads/report.txt");
equal(store.reserveSavePath("../report.txt"), "/downloads/report (1).txt");
equal(store.reserveSavePath("report.txt"), "/downloads/report (2).txt");

const lifecycle = [];
let changeCount = 0;
let activeChangeCount = 0;
store.setLifecycleEventListener((event) => lifecycle.push(event));
store.setChangeListener(() => {
  changeCount += 1;
});
store.setActiveDownloadChangeListener(() => {
  activeChangeCount += 1;
});
const item = makeItem();
const live = store.start({
  browserTabId: "tab-1",
  conversationId: "thread-1",
  isUserInitiated: false,
  item,
  url: item.getURL(),
});
equal(item.savePath, "/downloads/report (3).txt");
equal(store.getRestartBlockers(), ["download.active"]);
equal(store.hasActiveDownloadForRoute({ browserTabId: "tab-1", conversationId: "thread-1" }), true);
equal(lifecycle.map(({ previousStatus, sequence, status }) => ({ previousStatus, sequence, status })), [
  { previousStatus: null, sequence: 1, status: "started" },
]);
item.savePath = "/downloads/renamed.txt";
store.finish(live, item, "complete");
equal(store.getRestartBlockers(), []);
equal([...store.unacknowledgedDownloadIds], ["download-1"]);
equal(lifecycle.at(-1).status, "complete");
equal(activeChangeCount, 2);
equal(changeCount >= 2, true);
store.acknowledge({ ids: ["download-1"] });
equal([...store.unacknowledgedDownloadIds], []);

const nativeSession = new EventEmitter();
nativeSession.getDownloadHistory = async () => [
  {
    endTime: 20,
    filename: "done.txt",
    guid: "native-1",
    receivedBytes: 4,
    savePath: "/downloads/done.txt",
    startTime: 10,
    state: "completed",
    totalBytes: 4,
    url: "https://example.test/done.txt",
  },
  { guid: "hidden", state: "dangerous" },
];
nativeSession.on = nativeSession.on.bind(nativeSession);
nativeSession.removeListener = nativeSession.removeListener.bind(nativeSession);
store.registerSession({
  browserSession: nativeSession,
  browserSessionRegistry: { consumeAllowedBrowserUseDownload: () => null },
  findPageStateForWebContentsId: () => null,
});
const snapshot = await store.getSnapshot();
equal(snapshot.downloads.length, 1);
equal(snapshot.downloads[0].status, "complete");
equal(snapshot.downloads[0].startedAtMs, 10_000);
await store.open({ id: "native-1" });
equal(openedPaths, ["/downloads/done.txt"]);
await store.showInFolder({ id: "native-1" });
equal(shownPaths, ["/downloads/done.txt"]);

const blockedItem = makeItem({ id: "blocked" });
let prevented = false;
nativeSession.emit(
  "will-download",
  { preventDefault: () => { prevented = true; } },
  blockedItem,
  { id: 404 },
);
equal(prevented, true);
equal(blockedItem.canceled, true);

const linkedItem = makeItem({ id: "linked", url: "https://example.test/file#fragment" });
const linkedPromise = store.downloadUrl({
  conversationId: "thread-2",
  url: "https://example.test/file#fragment",
});
equal(timers.size, 1);
equal([...timers.values()][0].delay, 60_000);
equal(store.linkDownloads.pending.get(91).view.webContents.downloadedUrl, "https://example.test/file");
linkedItem.getURLChain = () => ["https://example.test/file"];
equal(store.linkDownloads.consume(linkedItem, { id: 91 }).conversationId, "thread-2");
equal(await linkedPromise, true);
equal(timers.size, 0);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("var LGe = createDownloadStoreClass({"), true);
equal(main.includes("new LGe(s)"), true);
equal(main.includes("var FGe = class"), false);
equal(main.includes("function IGe("), false);

console.log(`${assertions} main download store owner assertions passed`);
