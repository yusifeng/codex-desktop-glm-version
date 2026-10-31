import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modulePath = path.join(root, "src/main/main-app/browser-use/iab-api.ts");
const bundle = await esbuild.build({ bundle: true, entryPoints: [modulePath], format: "esm", logLevel: "silent", platform: "node", target: "node22", write: false });
const {
  ADD_BROWSER_USE_DOWNLOAD_CHANGE_LISTENER,
  CONSUME_ALLOWED_BROWSER_USE_DOWNLOAD,
  NOTIFY_BROWSER_USE_DOWNLOAD_CHANGE,
  browserTabIdFromRouteTabKey,
  captureBeyondViewportSize,
  createIabBrowserUseApiClass,
  isAttachableChildTarget,
  navigationUrlFromCommand,
  primaryTargetId,
  reconcileSerializedTabTitle,
  reconcileLiveTabUrl,
  reconcilePendingTabUrl,
  reconcileTabTitle,
  routeTabKey,
  serializePrimaryTarget,
  withTimeout,
} = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);
let assertions = 0;
const equal = (actual, expected) => { assert.equal(actual, expected); assertions += 1; };
const deepEqual = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };

const log = { info() {}, warning() {} };
const dependencies = {
  LY: () => log,
  Tr: () => ({ inAppBrowserUseHistory: false }),
  n: { Ru: (value) => value, Uu: (value) => value },
  l: { app: { getVersion: () => "1.0.0" } },
  a: { bn: (value) => value },
  _: { randomUUID: () => "uuid" },
};
const IabBrowserUseApi = createIabBrowserUseApiClass(dependencies);
const browserUseActiveStates = [];
const host = {
  routeKey: "route-1",
  setBrowserUseActive(active) { browserUseActiveStates.push(active); },
};
const api = new IabBrowserUseApi(() => host, () => () => {}, {
  appSessionId: "app-1",
  buildFlavor: "test",
  cursorArrivalTimeoutMs: 0,
  ensureSessionRoute: ({ conversationId }) => conversationId === "conversation-1",
});

equal(api.ping(), "pong");
deepEqual(api.getBrowserUseSession({ session_id: "conversation-1" }), { conversationId: "conversation-1" });
assert.throws(() => api.getBrowserUseSession({}), /Missing required browser session_id/); assertions += 1;
deepEqual(api.requireBrowserUseSession({ session_id: "conversation-1" }), { conversationId: "conversation-1" });
assert.throws(() => api.requireBrowserUseSession({ session_id: "other" }), /No ChatGPT browser route/); assertions += 1;
deepEqual(api.getMetadata({ conversationId: "conversation-1" }), {
  codexAppBuildFlavor: "test",
  codexAppSessionId: "app-1",
  codexSessionId: "conversation-1",
});
equal(api.getRequiredBrowserHost({ conversationId: "conversation-1" }), host);
equal(api.rememberBrowserHost(host), host);

const cdpEvents = [];
const detachEvents = [];
const pageEvents = [];
const downloadEvents = [];
const removeCdp = api.addCdpEventListener((event) => cdpEvents.push(event));
const removeDetach = api.addCdpDetachListener((event) => detachEvents.push(event));
const removePage = api.addPageEventListener((event) => pageEvents.push(event));
const removeDownload = api[ADD_BROWSER_USE_DOWNLOAD_CHANGE_LISTENER]((event) => downloadEvents.push(event));
api.emitCdpEvent({ method: "Page.loadEventFired" });
api[NOTIFY_BROWSER_USE_DOWNLOAD_CHANGE]({ path: "/tmp/file" });
deepEqual(cdpEvents, [{ method: "Page.loadEventFired" }]);
deepEqual(downloadEvents, [{ path: "/tmp/file" }]);
removeCdp(); removeDetach(); removePage(); removeDownload();
equal(api.cdpEventListeners.size, 0);
equal(api.cdpDetachListeners.size, 0);
equal(api.pageEventListeners.size, 0);
equal(api.downloadChangeListeners.size, 0);

api.allowedDownloadGrantsByWebContentsId.set(7, { grantedAtMs: Date.now(), sessionId: "conversation-1", url: "https://example.test/file" });
equal(api[CONSUME_ALLOWED_BROWSER_USE_DOWNLOAD]({ url: "https://other.test", webContentsId: 7 }), null);
deepEqual(api[CONSUME_ALLOWED_BROWSER_USE_DOWNLOAD]({ url: "https://example.test/file", webContentsId: 7 }), { sessionId: "conversation-1", url: "https://example.test/file" });
equal(api[CONSUME_ALLOWED_BROWSER_USE_DOWNLOAD]({ url: "https://example.test/file", webContentsId: 7 }), null);

const tab = { cdpTabId: 3 };
api.rememberDebuggerTargetSession(tab, "target-1", "session-1");
equal(api.debuggerSessionIdForTarget(tab, "target-1"), "session-1");
api.forgetDebuggerTargetSession("session-1");
equal(api.debuggerSessionIdForTarget(tab, "target-1"), null);
api.rememberDebuggerTargetSession(tab, "target-2", "session-2");
api.forgetDebuggerTargetSessionsForTab(tab);
equal(api.debuggerTargetIdsBySessionId.has("session-2"), false);

await api.waitForCursorArrival(11);
equal(api.cursorArrivalWaitersByMoveSequence.size, 0);
api.recordBrowserUseTurn({ conversationId: "conversation-1" }, { turn_id: "turn-1" });
equal(api.usedTurnIdsByConversationId.get("conversation-1"), "turn-1");
api.clearRecordedBrowserUseTurn({ conversationId: "conversation-1" }, { turn_id: "turn-1" });
equal(api.usedTurnIdsByConversationId.has("conversation-1"), false);

const source = fs.readFileSync(modulePath, "utf8");
const classSource = source.slice(source.indexOf("return class IabBrowserUseApi"));
const methodNames = [...classSource.matchAll(/^    (?:async )?(?:\[([A-Za-z_$][\w$]*)\]|([A-Za-z_$][\w$]*))\(/gm)].map((match) => match[1] ?? match[2]);
equal(methodNames.length, 109);
equal(new Set(methodNames).size, 109);
for (const name of ["createTabForBrowserUse", "executeCdpForBrowserUse", "turnEnded", "disposeRoute", "registerDebuggerListener", "executeCdpCommandWithCaptureSurface", "pruneExpiredAllowedDownloadGrants"]) {
  equal(methodNames.includes(name), true);
}
const stateContainers = [...source.matchAll(/^    ([A-Za-z_$][\w$]*) = new (?:Map|Set)\(/gm)].map((match) => match[1]);
equal(stateContainers.length, 21);

const targetTab = { cdpTabId: 7, title: "Example", url: "https://example.test" };
equal(primaryTargetId(targetTab), "browser-use-iab-tab:7");
deepEqual(serializePrimaryTarget(targetTab), {
  attached: true, canAccessOpener: false, id: "browser-use-iab-tab:7", tabId: 7,
  targetId: "browser-use-iab-tab:7", title: "Example", type: "page", url: "https://example.test",
});
equal(isAttachableChildTarget({ id: "frame", type: "iframe" }), true);
equal(isAttachableChildTarget({ id: "worker", type: "other" }), false);
equal(navigationUrlFromCommand({ method: "Page.navigate", commandParams: { url: "https://example.test" } }), "https://example.test");
equal(navigationUrlFromCommand({ method: "Page.reload", commandParams: {} }), null);
deepEqual(captureBeyondViewportSize({ method: "Page.captureScreenshot", commandParams: { captureBeyondViewport: true, clip: { width: 10.2, height: 20.1 } } }), { width: 11, height: 21 });
equal(captureBeyondViewportSize({ method: "Page.captureScreenshot", commandParams: { captureBeyondViewport: true, clip: { width: 0, height: 2 } } }), null);
const keyed = routeTabKey("window:conversation", "tab-1");
equal(keyed, "window:conversation\0tab-1");
equal(browserTabIdFromRouteTabKey("window:conversation", keyed, (value) => `brand:${value}`), "brand:tab-1");
equal(reconcilePendingTabUrl("about:blank", "https://pending.test", "persistent"), "https://pending.test");
equal(reconcilePendingTabUrl("about:blank", "https://pending.test", "temporary"), "about:blank");
equal(reconcileLiveTabUrl("https://kept.test", "about:blank", null, "persistent"), "https://kept.test");
equal(reconcileTabTitle("", { title: "Loaded", url: "https://example.test", lifetime: "persistent" }), "Loaded");
equal(reconcileSerializedTabTitle("about:blank", "about:blank", "https://committed.test", "https://pending.test"), "https://committed.test");
equal(await withTimeout(Promise.resolve("done"), 100, "timeout"), "done");

const mainSource = fs.readFileSync(path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"), "utf8");
equal(mainSource.includes('require("./main-app/browser-use/iab-api.js")'), true);
equal(mainSource.includes("DYe = createIabBrowserUseApiClass({"), true);
equal(mainSource.includes("DYe = class"), false);
equal((mainSource.match(/BrowserUseApi: DYe/g) ?? []).length, 1);
for (const oldOwner of ["function OYe(", "function GY(", "function PYe(", "function XY(", "function BYe(", "function rX("]) {
  equal(mainSource.includes(oldOwner), false);
}

api.dispose();
equal(api.tabsById.size, 0);
equal(api.tabRuntimesById.size, 0);
deepEqual(browserUseActiveStates, [false]);

console.log(`${assertions} main IAB API lifecycle assertions passed`);
