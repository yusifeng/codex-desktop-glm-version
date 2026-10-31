import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/browser-sidebar/browser-page-command-controller.ts")],
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const { createBrowserPageCommandControllerClass } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const calls = [];
let currentContext = null;
const host = {
  navigateCurrentPageHistory: (...args) => calls.push(["history", ...args]),
  getCurrentPageCommandContext: () => currentContext,
  getCurrentWindowState: () => null,
  getPageState: () => currentContext?.page ?? null,
  getThreadState: () => null,
  getReloadTargetForWindow: () => null,
  getVisiblePageForWebContents: () => null,
  ensureThreadStateForCommand: () => null,
  ensureThreadCommandContext: () => null,
  getBrowserSession: () => null,
  windows: new Map(),
  browserPageHostLifecycle: { findPageStateForWebContentsId: () => null, attachedWebviewHosts: new Map() },
};
const deps = {
  a: { bn: (value) => value },
  l: { clipboard: { writeText: (value) => calls.push(["copy", value]) }, BrowserWindow: { fromWebContents: () => null } },
  n: { Yc: (value) => value, Zc: (value, delta) => value + delta, Xc: (value) => value / 100, lu: { NEW_TAB_PAGE: "new-tab" } },
  crypto: { randomUUID: () => "uuid" },
  hX: () => null, mU: () => "panel", pU: () => null, hU: () => "right", QU: () => "url",
  ZZe: async () => undefined, sq: () => undefined,
  cq: () => undefined, lq: () => undefined, uq: () => undefined, fq: () => undefined,
  sW: () => undefined, OZe: () => false, XZe: async () => undefined,
  GXe: () => false, iK: () => false, pX: () => ({}), DU: () => undefined, oX: (value) => value,
  PHe: async () => undefined, GU: async () => undefined,
  rW: (value) => value, WX: () => true, GX: () => "adoption-lease",
};
const Controller = createBrowserPageCommandControllerClass(deps);
const controller = new Controller(host);

controller.goBack("owner", "conversation", "tab");
controller.goForward("owner", "conversation", "tab");
equal(calls, [
  ["history", "owner", "conversation", "back", "tab"],
  ["history", "owner", "conversation", "forward", "tab"],
]);
equal(controller.getActiveVisiblePageForWindow({ isDestroyed: () => true }), null);
equal(controller.getVisiblePageForWebContents({}, {}), null);
equal(controller.canReloadActiveVisiblePage({}, null), false);
equal(controller.getCurrentPageWebContents("owner", "conversation", "tab"), undefined);
equal(controller.getWebMcpInspectorData("owner", "conversation", "tab"), null);
equal(controller.getExtensionActionMenuTarget("owner", "conversation", "tab"), { webContents: undefined, allowHiddenBlankTab: false });
const hiddenWebContents = { isDestroyed: () => false };
const hiddenThread = { conversationId: "conversation", browserTabId: "tab", hostGeneration: 3, presented: true, visible: true, snapshot: { tabType: "new-tab", url: "" } };
const hiddenWindow = { rendererInstanceId: "renderer", activeConversationId: "conversation", activeBrowserTabId: "tab" };
currentContext = { page: { view: { webContents: hiddenWebContents } }, threadState: hiddenThread, windowState: hiddenWindow };
host.getCurrentWindowState = () => hiddenWindow;
host.browserPageHostLifecycle.attachedWebviewHosts.set(hiddenWebContents, { route: { conversationId: "conversation", browserTabId: "tab" }, hostGeneration: 3, rendererInstanceId: "renderer" });
equal(controller.getExtensionActionMenuTarget("owner", "conversation", "tab"), { webContents: hiddenWebContents, allowHiddenBlankTab: true });
currentContext = null;
host.getCurrentWindowState = () => null;
equal(await controller.captureScreenshotToClipboard("owner", "conversation", "tab"), undefined);
equal(controller.resetZoom("owner", "conversation", "tab"), undefined);
equal(controller.stepZoom("owner", "conversation", 1, "tab"), undefined);
equal(controller.setZoomPercent("owner", "conversation", 100, "tab"), undefined);

const owner = { id: 8 };
const commandWebContents = { isDestroyed: () => false };
const commandPage = { view: { webContents: commandWebContents } };
const commandThread = { browserTabId: "tab", mountGeneration: 2, pendingTeardown: null };
const commandWindow = { owner };
currentContext = { page: commandPage, threadState: commandThread, windowState: commandWindow };
equal(
  controller.runPageCommand(owner, {
    conversationId: "conversation",
    browserTabId: "tab",
    command: { type: "go-back" },
  }),
  "accepted",
);
equal(calls.at(-1), ["history", owner, "conversation", "back", "tab"]);
equal(
  controller.runPageCommand({ id: 9 }, {
    conversationId: "conversation",
    browserTabId: "tab",
    command: { type: "go-back" },
  }),
  "wrong-window",
);
const navigations = [];
controller.navigate = (...args) => navigations.push(args);
equal(
  await controller.runPageCommand(owner, {
    conversationId: "conversation",
    browserTabId: "tab",
    command: { type: "navigate", url: "example.test", hostId: "host", source: "manual", initiator: "toolbar" },
  }, async () => "https://example.test/"),
  "accepted",
);
equal(navigations, [[owner, "conversation", "https://example.test/", "manual", "toolbar", "tab"]]);
const originalContext = currentContext;
equal(
  await controller.runPageCommand(owner, {
    conversationId: "conversation",
    browserTabId: "tab",
    command: { type: "navigate", url: "stale.test" },
  }, async () => {
    currentContext = { ...originalContext, page: { view: { webContents: commandWebContents } } };
    return "https://stale.test/";
  }),
  "page-unavailable",
);

const pageInfoCalls = [];
const pageInfoWebContents = {
  isDestroyed: () => false,
  showPageInfoDialog: (options) => { pageInfoCalls.push(options); return "shown"; },
};
currentContext = { ...originalContext, page: { view: { webContents: pageInfoWebContents } } };
deps.l.BrowserWindow.fromWebContents = () => ({
  isDestroyed: () => false,
  getContentBounds: () => ({ x: 100, y: 200 }),
});
equal(controller.openSiteInfo(owner, "conversation", "tab", { x: 1.2, y: 2.6, width: 10.4, height: 20.5 }, "https://example.test"), "shown");
equal(pageInfoCalls[0], {
  anchorBounds: { x: 101, y: 203, width: 10, height: 21 },
  siteUrl: "https://example.test",
});

let captures = 0;
let cropBounds;
let resizeOptions;
const image = {
  isEmpty: () => false,
  getScaleFactors: () => [1, 2.5, Number.NaN],
  getSize: () => ({ width: 1200, height: 800 }),
  crop: (bounds) => {
    cropBounds = bounds;
    return {
      getSize: () => ({ width: bounds.width, height: bounds.height }),
      resize: (options) => {
        resizeOptions = options;
        return { toDataURL: ({ scaleFactor }) => `thumbnail:${scaleFactor}` };
      },
    };
  },
};
const thumbnailWebContents = {
  isDestroyed: () => false,
  getURL: () => "https://example.test/page",
  capturePage: async () => { captures += 1; return image; },
};
const thumbnailPage = { isSuspended: false, navigationVersion: 4, view: { webContents: thumbnailWebContents } };
const thumbnailThread = {
  page: thumbnailPage,
  hostGeneration: 6,
  pendingTeardown: null,
  pendingWindowTransfer: false,
  presented: true,
  lastPresentedSequence: 3,
};
const thumbnailWindow = { owner, rendererInstanceId: "renderer" };
currentContext = { page: thumbnailPage, threadState: thumbnailThread, windowState: thumbnailWindow };
equal(await controller.captureTabThumbnail(owner, "conversation", "tab"), "thumbnail:2");
equal(await controller.captureTabThumbnail(owner, "conversation", "tab"), "thumbnail:2");
equal(captures, 1);
equal(cropBounds, { x: 0, y: 0, width: 1200, height: 632 });
equal(resizeOptions, { width: 304, height: 160, quality: "good" });

const mainSource = await import("node:fs").then(({ readFileSync }) =>
  readFileSync(path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"), "utf8"),
);
for (const oldOwner of ["function RZe(", "function zZe(", "function BZe(", "function HZe(", "function UZe(", "function WZe("]) {
  equal(mainSource.includes(oldOwner), false);
}

console.log(`main browser page command controller tests passed (${assertions} assertions)`);
