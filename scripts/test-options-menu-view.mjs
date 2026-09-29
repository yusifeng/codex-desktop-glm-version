import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = { initialized: 0 };
const hooks = [];
let hookIndex = 0;
const React = {
  __clear() { hooks.length = 0; hookIndex = 0; },
  __reset() { hookIndex = 0; },
  useState(initial) {
    const index = hookIndex++;
    if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial;
    return [hooks[index], (next) => { hooks[index] = typeof next === "function" ? next(hooks[index]) : next; }];
  },
};
const jsx = {
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
globalThis.__optionsMenuView = { React, jsx, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "browser-clear-browsing-data-dialog-view": "export {};",
  profile: "export {};",
  "app-shared": [
    "const r=globalThis.__optionsMenuView;",
    "export const $3=()=>{r.state.initialized+=1};",
    "export const I3=()=>r.jsx;",
    "export const e6=()=>r.React;",
    "export const n4=()=>({formatMessage:message=>message.defaultMessage});",
  ].join("\n"),
};
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/options-menu-view/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "options-menu-view-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
    },
  }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
const expectedExports = ["A", "C", "D", "E", "F", "I", "L", "M", "N", "O", "P", "S", "T", "_", "a", "b", "c", "d", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "r", "s", "t", "u", "v", "w", "x", "y"];
assert.deepEqual(Object.keys(module).sort(), expectedExports.sort());
assert.equal(state.initialized, 1);

function render(component, props, { clear = false } = {}) { if (clear) React.__clear(); else React.__reset(); return component(props); }
function walk(value, result = []) {
  if (value == null || typeof value !== "object") return result;
  if (Array.isArray(value)) { for (const item of value) walk(item, result); return result; }
  result.push(value);
  walk(value.props?.children, result);
  return result;
}
function textContent(value) {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textContent).join(" " );
  return textContent(value.props?.children);
}
function button(view, label) { return walk(view).find((node) => node.type === "button" && (node.props?.["aria-label"] === label || textContent(node).includes(label))); }

assert.equal(module.O(100, 1.25), 125);
assert.deepEqual(module.k({ command: { type: "reset-zoom" }, currentRenderedZoomPercent: 150, viewportScale: 1 }), { command: { type: "reset-zoom" }, renderedZoomPercent: 100 });
assert.deepEqual(module.k({ command: { delta: 1, type: "step-zoom" }, currentRenderedZoomPercent: 100, viewportScale: 2 }), { command: { type: "set-zoom-percent", zoomPercent: 63 }, renderedZoomPercent: 126 });
assert.equal(module.v({ annotations: "pending-available", webMcp: "available" }, false), "pending-available");
assert.deepEqual(module.c({ browserTabId: "tab-1", conversationId: "conversation-1" }), ["browser-extension-actions", "conversation-1", "tab-1"]);
const query = module.l({ getExtensionActions: async () => ({ status: "available" }) }, { browserTabId: "tab-1" }, true);
assert.equal(query.enabled, true);
assert.equal(query.retry, false);

const calls = [];
const optionsProps = {
  clearBrowsingData: { kind: "submenu", onClear: (kind) => calls.push("clear:" + kind) },
  currentZoomPercent: 125,
  isDeviceToolbarEnabled: true,
  isDeviceToolbarVisible: true,
  isFloatingComposerMenuItemVisible: true,
  isFloatingComposerVisible: false,
  isPrintMenuItemVisible: true,
  isScreenshotCaptureEnabled: true,
  onCaptureScreenshot: () => calls.push("screenshot"),
  onImportBrowserProfile: () => calls.push("import"),
  onOpenBrowserSettings: () => calls.push("settings"),
  onOpenChange: (open) => calls.push("open:" + open),
  onOpenContactInfo: () => calls.push("contact"),
  onOpenDownloads: () => calls.push("downloads"),
  onOpenExtensions: () => calls.push("extensions"),
  onOpenFindInPage: () => calls.push("find"),
  onOpenHistory: () => calls.push("history"),
  onOpenPasswordManager: () => calls.push("passwords"),
  onPrint: () => calls.push("print"),
  onResetZoom: () => calls.push("reset"),
  onToggleDeviceToolbar: () => calls.push("device"),
  onToggleFloatingComposer: () => calls.push("composer"),
  onZoomIn: () => calls.push("zoom-in"),
  onZoomOut: () => calls.push("zoom-out"),
  showExtensionsOverflow: true,
};
let view = render(module.t, optionsProps, { clear: true });
assert.equal(walk(view).some((node) => node.props?.role === "menu"), false);
button(view, "Browser options").props.onClick();
assert.equal(calls.at(-1), "open:true");
view = render(module.t, optionsProps);
assert.equal(textContent(view).includes("Find in page"), true);
assert.equal(textContent(view).includes("Import cookies and passwords…"), true);
assert.equal(textContent(view).includes("Delete download history"), true);
assert.equal(button(view, "Show floating composer").props["aria-checked"], false);
assert.equal(button(view, "Hide device toolbar").props["aria-checked"], true);
button(view, "Find in page").props.onClick();
assert.deepEqual(calls.slice(-2), ["find", "open:false"]);

view = render(module.t, { ...optionsProps, open: true, pageActionsDisabled: true });
assert.equal(button(view, "Find in page").props.disabled, true);
assert.equal(button(view, "Print").props.disabled, true);
assert.equal(button(view, "Zoom in").props.disabled, true);
assert.equal(button(view, "Capture screenshot").props.disabled, true);
assert.equal(button(view, "Downloads").props.disabled, false);
view = render(module.t, { ...optionsProps, currentZoomPercent: 100, open: true });
assert.equal(button(view, "Reset").props.disabled, true);
button(view, "Clear cookies").props.onClick();
assert.equal(calls.at(-1), "clear:cookies");
view = render(module.t, { ...optionsProps, clearBrowsingData: { isClearing: true, kind: "submenu", onClear() {} }, open: true });
assert.equal(button(view, "Clear cache").props.disabled, true);
view = render(module.t, { ...optionsProps, clearBrowsingData: { isOpening: true, kind: "dialog", onOpen() {} }, open: true });
assert.equal(button(view, "Clear browsing data").props.disabled, true);
assert.equal(textContent(button(view, "Clear browsing data")).includes("Loading…"), true);

const extensionsCalls = [];
const extensionsProps = {
  actionsData: { actions: [{ enabled: true, id: "one", title: "Run One" }, { enabled: false, id: "two" }], status: "available" },
  onManageExtensions: () => extensionsCalls.push("manage"),
  onOpenChange: (open) => extensionsCalls.push("open:" + open),
  onPin: (extension, pinned) => extensionsCalls.push("pin:" + extension.id + ":" + pinned),
  onRefreshActions: () => extensionsCalls.push("refresh"),
  onTriggerAction: (action) => extensionsCalls.push("trigger:" + action.id),
  onVisitWebStore: () => extensionsCalls.push("store"),
  profile: { extensions: [{ id: "one", name: "One" }, { id: "two", name: "Two" }], toolbar: { forcePinnedExtensionIds: ["two"], pinnedExtensionIds: ["one", "two"], ready: true } },
  ready: true,
};
assert.equal(render(module.a, { ...extensionsProps, profile: null }, { clear: true }), null);
view = render(module.a, extensionsProps, { clear: true });
button(view, "Extensions").props.onClick();
assert.deepEqual(extensionsCalls.slice(-2), ["open:true", "refresh"]);
view = render(module.a, extensionsProps);
assert.equal(textContent(view).includes("Extensions (2)"), true);
assert.equal(button(view, "Run One").props.disabled, false);
assert.equal(button(view, "Two").props.disabled, true);
assert.equal(button(view, "Pinned by your organization").props.disabled, true);
button(view, "Run One").props.onClick();
assert.equal(extensionsCalls.at(-1), "trigger:one");
button(view, "Unpin One").props.onClick();
assert.equal(extensionsCalls.at(-1), "pin:one:false");
button(view, "Manage extensions").props.onClick();
assert.deepEqual(extensionsCalls.slice(-2), ["open:false", "manage"]);
view = render(module.a, { ...extensionsProps, actionsIsError: true, open: true, ready: false }, { clear: true });
assert.equal(textContent(view).includes("Unable to load extensions"), true);
assert.equal(textContent(view).includes("Loading extensions…"), true);
view = render(module.a, { ...extensionsProps, actionsData: null, open: true, profile: { extensions: [], toolbar: { forcePinnedExtensionIds: [], pinnedExtensionIds: [], ready: true } } }, { clear: true });
assert.equal(textContent(view).includes("No extensions installed"), true);

let visibilityClicks = 0;
view = render(module.r, { onClick: () => { visibilityClicks += 1; }, visible: true }, { clear: true });
assert.equal(button(view, "Hide from toolbar").props.disabled, false);
button(view, "Hide from toolbar").props.onClick();
assert.equal(visibilityClicks, 1);
view = render(module.r, { onClick() {}, saving: true, visible: false }, { clear: true });
assert.equal(button(view, "Pin to toolbar").props.disabled, true);

const notifications = [];
const invalidations = [];
let helperResult = await module.p({ intl: {}, notifyError: (message, id) => notifications.push([message, id]), service: { triggerExtensionAction: async () => "popup-failed" } }, {}, "One");
assert.equal(helperResult, "popup-failed");
assert.equal(notifications.at(-1)[1], "state.triggerBrowserExtensionAction");
helperResult = await module.d({ intl: {}, notifyError: (message, id) => notifications.push([message, id]), queryClient: { invalidateQueries: (options) => invalidations.push(options) }, service: { setExtensionPinned: async () => "updated" } }, { browserTabId: "tab-1" }, "One");
assert.equal(helperResult, "updated");
assert.deepEqual(invalidations.at(-1).queryKey, ["browser-extension-actions", undefined, "tab-1"]);
helperResult = await module.f({ intl: {}, notifyError: (message, id) => notifications.push([message, id]), queryClient: { invalidateQueries: (options) => invalidations.push(options) }, service: { showExtensionActionContextMenu: async () => "menu-failed" } }, {}, "One");
assert.equal(helperResult, "menu-failed");
assert.equal(notifications.at(-1)[1], "thread.browser.extensions.menuError");

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " options menu view assertions passed");
