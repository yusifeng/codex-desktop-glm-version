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
const host = {
  navigateCurrentPageHistory: (...args) => calls.push(["history", ...args]),
  getCurrentPageCommandContext: () => null,
  getCurrentWindowState: () => null,
  getPageState: () => null,
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
  n: { Yc: (value) => value, Zc: (value, delta) => value + delta, Xc: (value) => value / 100 },
  crypto: { randomUUID: () => "uuid" },
  hX: () => null, mU: () => "panel", pU: () => null, hU: () => "right", QU: () => "url",
  RZe: () => "command", ZZe: async () => undefined, zZe: () => null, sq: () => undefined,
  cq: () => undefined, lq: () => undefined, uq: () => undefined, fq: () => undefined,
  sW: () => undefined, HZe: async () => null, OZe: () => false, XZe: async () => undefined,
  GXe: () => false, iK: () => false, pX: () => ({}), DU: () => undefined, oX: (value) => value,
  PHe: async () => undefined, GU: async () => undefined,
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
equal(await controller.captureScreenshotToClipboard("owner", "conversation", "tab"), undefined);
equal(controller.resetZoom("owner", "conversation", "tab"), undefined);
equal(controller.stepZoom("owner", "conversation", 1, "tab"), undefined);
equal(controller.setZoomPercent("owner", "conversation", 100, "tab"), undefined);

console.log(`main browser page command controller tests passed (${assertions} assertions)`);
