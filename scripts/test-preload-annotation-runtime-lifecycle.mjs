import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "annotation-runtime-lifecycle-"));
const controllerBundle = path.join(temporaryDirectory, "controller-lifecycle.cjs");
const runtimeBundle = path.join(temporaryDirectory, "runtime-lifecycle.cjs");
const layerBundle = path.join(temporaryDirectory, "interaction-layer.cjs");
await Promise.all([
  ["annotation-controller-lifecycle.ts", controllerBundle],
  ["annotation-runtime-effect-lifecycle.ts", runtimeBundle],
  ["annotation-interaction-layer-component.ts", layerBundle],
].map(([entry, outfile]) => esbuild.build({
  entryPoints: [path.join(root, "src/main/browser-page-preload", entry)], outfile,
  bundle: true, format: "cjs", platform: "node", target: "esnext", logLevel: "silent",
})));
const require = createRequire(import.meta.url);
const controllerLifecycle = require(controllerBundle);
const runtimeLifecycle = require(runtimeBundle);
const { createAnnotationInteractionLayerComponent } = require(layerBundle);

const hookOrder = [];
const cleanups = [];
const useEffect = (callback) => { hookOrder.push("effect"); cleanups.push(callback()); };
const useLayoutEffect = (callback) => { hookOrder.push("layout"); cleanups.push(callback()); };
const useEffectEvent = (callback) => { hookOrder.push("event"); return callback; };
const disposed = [];
controllerLifecycle.useAnnotationControllerDisposalLifecycle(useEffect, [1, 2, 3].map((id) => ({
  dispose: () => disposed.push(id),
})));
cleanups.splice(0).filter((cleanup) => typeof cleanup === "function").forEach((cleanup) => cleanup());
assert.deepEqual(disposed, [1, 2, 3]);

const highlightUpdates = [];
controllerLifecycle.useAnnotationHighlightControllerLifecycle({
  useLayoutEffect, useEffect, resolvedAnchor: "anchor",
  textHighlightController: { update: (value) => highlightUpdates.push(value), dispose() {} },
  suspensionNotifier: { dispose() {} }, designModifierNotifier: { dispose() {} },
  selectionModifierNotifier: { dispose() {} },
});
assert.deepEqual(highlightUpdates, ["anchor"]);
cleanups.splice(0).filter((cleanup) => typeof cleanup === "function").forEach((cleanup) => cleanup());
assert.deepEqual(highlightUpdates, ["anchor", null]);

const hostMessages = [];
let screenshotDisposals = 0;
controllerLifecycle.useAnnotationScreenshotReadyLifecycle({
  useEffectEvent, useEffect, bridge: { sendMessageToHost: (message) => hostMessages.push(message) },
  annotationId: "annotation", hasPreview: true, annotationViewportRect: "rect", markerViewportPoint: "point",
  skipScreenshotCapture: true,
  screenshotReadyController: {
    update(id, hasPreview, publish) { assert.equal(id, "annotation"); assert.equal(hasPreview, true); publish("comment"); },
    dispose() { screenshotDisposals += 1; },
  },
});
assert.deepEqual(hostMessages[0], {
  type: "browser-sidebar-runtime-comment-screenshot-ready", commentId: "comment",
  annotationViewportRect: "rect", markerViewportPoint: "point", skipScreenshotCapture: true,
});
cleanups.splice(0).filter((cleanup) => typeof cleanup === "function").forEach((cleanup) => cleanup());
assert.equal(screenshotDisposals, 2);

const cache = new Map([
  ["keep", { isConnected: true }], ["stale", { isConnected: true }], ["detached", { isConnected: false }],
]);
const reconciled = [];
runtimeLifecycle.useAnnotationReconciliationLifecycle({
  useEffect, useLayoutEffect, rootHost: "root", getElementCache: () => cache,
  comments: [{ id: "keep" }], activeDesignChange: null, editor: null, previewCommentId: "stale",
  pageComments: [{ id: "keep" }], closePreview: (id) => reconciled.push(["close", id]),
  reconcileComments: (comments) => reconciled.push(["reconcile", comments]), interactionMode: "browse",
  resetInteraction: (id) => reconciled.push(["reset", id]), isSuspended: false, pointerRef: { current: null },
  nativeTextSelection: false, installNativeSelection: () => {}, selectedCommentId: "keep",
  openComment: (comment) => reconciled.push(["open", comment.id]),
});
assert.deepEqual([...cache.keys()], ["keep"]);
assert.deepEqual(reconciled.map((entry) => entry[0]), ["close", "reconcile", "reset", "open"]);

let trackingInstalled = false;
runtimeLifecycle.useAnnotationGlobalInputLifecycle({
  useEffectEvent, useEffect, suspensionNotifier: { update: () => true }, interactionMode: "comment",
  isSuspended: false, suspensionRef: { current: false }, spaceKeyRef: { current: false },
  normalizeKeyboardModifier: () => null, isEditableElement: () => false, preservesTyping: () => false,
  createGlobalInputTracking: () => ({ install() { trackingInstalled = true; return () => {}; } }),
  observeFrames() {}, toViewportPoint() {}, pointerRef: { current: null }, document: { hasFocus: () => true },
});
assert.equal(trackingInstalled, true);

let hoverInstalled = 0;
let hoverDisposed = 0;
runtimeLifecycle.useAnnotationHoverRefreshLifecycle({
  useEffect, interactionMode: "comment", isSuspended: false, editor: null, canUseSiteAnnotationApi: true,
  rootHost: "root", showMetadata: true,
  createHoverRefreshController: () => ({ install() { hoverInstalled += 1; return () => {}; }, dispose() { hoverDisposed += 1; } }),
});
assert.equal(hoverInstalled, 1);
cleanups.splice(0).filter((cleanup) => typeof cleanup === "function").forEach((cleanup) => cleanup());
assert.equal(hoverDisposed, 1);

let animationFrameCallback = null;
let cancelledFrame = null;
let popoverCleanup = 0;
let revealCount = 0;
let layerCleanup;
const element = {};
const Layer = createAnnotationInteractionLayerComponent({
  useRef: () => ({ current: element }), useState: () => [false, () => {}],
  useLayoutEffect: (callback) => { layerCleanup = callback(); },
  jsx: (type, props) => ({ type, props }),
  windowLike: { requestAnimationFrame(callback) { animationFrameCallback = callback; return 42; }, cancelAnimationFrame(id) { cancelledFrame = id; } },
  showPopover: () => { revealCount += 1; return revealCount > 1; },
  cleanupPopover: () => { popoverCleanup += 1; },
});
const renderedLayer = Layer({ children: "content", style: { inset: 0 } });
assert.equal(renderedLayer.props.popover, "manual");
assert.equal(typeof animationFrameCallback, "function");
animationFrameCallback();
assert.equal(revealCount, 2);
layerCleanup();
assert.equal(cancelledFrame, 42);
assert.equal(popoverCleanup, 1);

assert.deepEqual(hookOrder.slice(0, 3), ["effect", "effect", "effect"]);
await fs.rm(temporaryDirectory, { recursive: true, force: true });
console.log("20 preload annotation runtime-lifecycle assertions passed");
