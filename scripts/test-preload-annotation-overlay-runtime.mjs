import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationOverlayRuntime } = require("../app/.vite/build/browser-page-preload/annotation-overlay-runtime.js");

class FakeNode {}
class FakeElement extends FakeNode {
  constructor({ children = [], style = {}, rect = null, root = false } = {}) {
    super();
    this.children = children;
    this.style = style;
    this.rect = rect;
    this.root = root;
  }
}
class FakeHtmlElement extends FakeElement {}
class FakeDivElement extends FakeHtmlElement {}

const observerInstances = [];
class FakeMutationObserver {
  constructor(callback) {
    this.callback = callback;
    this.disconnectCount = 0;
    observerInstances.push(this);
  }

  observe(target, options) {
    this.observed = { target, options };
  }

  disconnect() {
    this.disconnectCount += 1;
  }
}

const calls = [];
const appended = [];
const documentLike = {
  existing: null,
  documentElement: {
    appendChild(element) {
      appended.push(element);
    },
  },
  getElementById() {
    return this.existing;
  },
  createElement(tagName) {
    calls.push(["create-element", tagName]);
    return new FakeDivElement();
  },
};
const windowLike = { location: { href: "https://example.test/current" } };
const computedStyles = new WeakMap();
const deps = {
  documentLike,
  windowLike,
  htmlDivElementConstructor: FakeDivElement,
  htmlElementConstructor: FakeHtmlElement,
  nodeConstructor: FakeNode,
  mutationObserverConstructor: FakeMutationObserver,
  mutationObserverOptions: { attributes: true, childList: true, subtree: true },
  rootId: "annotation-overlay",
  maximumZIndex: 2147483647,
  isRootElement: (element) => element.root === true,
  snapshotElement: (element) => {
    calls.push(["snapshot", element]);
    return { snapshotOf: element };
  },
  resolveElementAtPoint: (...args) => {
    calls.push(["element-at-point", ...args]);
    return { resolved: args };
  },
  samePageUrl: (left, right) => left === right,
  resolveAnchorElement: (...args) => {
    calls.push(["resolve-anchor", ...args]);
    return deps.resolvedAnchorElement;
  },
  refreshElementAnchor: (...args) => {
    calls.push(["refresh-anchor", ...args]);
    return { refreshed: true, source: args[1] };
  },
  getOwnerWindow: () => ({
    getComputedStyle: (element) => computedStyles.get(element),
  }),
  isElement: (value) => value instanceof FakeElement,
  getVisibleRect: (element) => element.rect,
  anchorToViewportRect: (anchor) => anchor.rect.hidden ? null : { ...anchor.rect, viewport: true },
  scaleViewportPoint: (point, scale) => {
    calls.push(["scale-point", point, scale]);
    return { x: point.x * scale.viewportScale, y: point.y * scale.zoomFactor };
  },
  getEditorSelections: (anchor) => anchor.selections,
  anchorsEqual: (left, right) => left.key === right.key,
};

const runtime = createAnnotationOverlayRuntime(deps);

const existingRoot = new FakeDivElement();
documentLike.existing = existingRoot;
assert.equal(runtime.ensureOverlayRoot(), existingRoot);
assert.equal(appended.length, 0);

documentLike.existing = new FakeHtmlElement();
const createdRoot = runtime.ensureOverlayRoot();
assert.equal(createdRoot.id, "annotation-overlay");
assert.deepEqual(createdRoot.style, {
  position: "fixed",
  inset: "0",
  pointerEvents: "none",
  zIndex: "2147483647",
});
assert.equal(appended.at(-1), createdRoot);
assert.deepEqual(calls.find(([name]) => name === "create-element"), ["create-element", "div"]);

const ordinaryElement = new FakeElement();
const overlayElement = new FakeElement({ root: true });
assert.equal(runtime.snapshotHoverElement(null), null);
assert.equal(runtime.snapshotHoverElement(overlayElement), null);
assert.deepEqual(runtime.snapshotHoverElement(overlayElement, true), { snapshotOf: overlayElement });
assert.deepEqual(runtime.snapshotHoverElement(ordinaryElement), { snapshotOf: ordinaryElement });

const pointDocument = { name: "point-document" };
assert.equal(runtime.resolveHoverElementAtPoint(null, false, pointDocument), null);
const resolvedPoint = runtime.resolveHoverElementAtPoint({ x: 12, y: 34 }, true, pointDocument);
assert.deepEqual(resolvedPoint, { resolved: [12, 34, pointDocument, true] });
assert.deepEqual(calls.at(-1), ["element-at-point", 12, 34, pointDocument, true]);

const baseAnnotation = {
  id: "annotation-1",
  anchor: { kind: "element", pageUrl: windowLike.location.href, selector: "#target" },
  viewportSize: { width: 800, height: 600 },
  markerViewportPoint: { x: 10, y: 20 },
  untouched: true,
};
const annotationCache = new Map();
deps.resolvedAnchorElement = ordinaryElement;
const refreshed = runtime.refreshDesignAnnotation(baseAnnotation, annotationCache);
assert.equal(refreshed.untouched, true);
assert.deepEqual(refreshed.anchor, { refreshed: true, source: baseAnnotation.anchor });
assert.equal(annotationCache.get(baseAnnotation.id), ordinaryElement);
assert.deepEqual(calls.find(([name]) => name === "refresh-anchor"), [
  "refresh-anchor",
  ordinaryElement,
  baseAnnotation.anchor,
  baseAnnotation.viewportSize,
  baseAnnotation.markerViewportPoint,
]);

const resolveCallsBeforeRejections = calls.filter(([name]) => name === "resolve-anchor").length;
assert.equal(runtime.refreshDesignAnnotation({ ...baseAnnotation, anchor: { ...baseAnnotation.anchor, pageUrl: "https://elsewhere.test" } }, annotationCache), null);
assert.equal(runtime.refreshDesignAnnotation({ ...baseAnnotation, anchor: { ...baseAnnotation.anchor, kind: "region" } }, annotationCache), null);
assert.equal(calls.filter(([name]) => name === "resolve-anchor").length, resolveCallsBeforeRejections);
deps.resolvedAnchorElement = null;
assert.equal(runtime.refreshDesignAnnotation(baseAnnotation, annotationCache), null);
assert.equal(runtime.isAnnotationForCurrentPage(baseAnnotation), true);
assert.equal(runtime.isAnnotationForCurrentPage({ ...baseAnnotation, anchor: { ...baseAnnotation.anchor, pageUrl: "https://elsewhere.test" } }), false);

const visibleA = new FakeElement({ rect: { x: 10.4, y: 20.6, width: 30.2, height: 40.7 } });
const visibleB = new FakeElement({ rect: { x: 50.5, y: 60.4, width: 70.8, height: 80.1 } });
const absolute = new FakeElement({ rect: { x: 1, y: 2, width: 3, height: 4 } });
const invisible = new FakeElement({ rect: null });
const nonElement = new FakeNode();
const flexTarget = new FakeElement({ children: [visibleA, nonElement, absolute, invisible, visibleB] });
computedStyles.set(flexTarget, { display: "flex" });
computedStyles.set(visibleA, { position: "static", borderRadius: "" });
computedStyles.set(visibleB, { position: "relative", borderRadius: "6px" });
computedStyles.set(absolute, { position: "absolute", borderRadius: "2px" });
computedStyles.set(invisible, { position: "static", borderRadius: "1px" });
const flexCache = new Map([[baseAnnotation.id, flexTarget]]);
assert.deepEqual(runtime.collectFlexGapOverlays("padding", null, baseAnnotation, flexCache), []);
assert.deepEqual(runtime.collectFlexGapOverlays("gap", null, null, flexCache), []);
assert.deepEqual(runtime.collectFlexGapOverlays("row-gap", null, baseAnnotation, flexCache), [
  {
    borderRadius: "0px",
    key: "0-10-21-30-41",
    rect: visibleA.rect,
  },
  {
    borderRadius: "6px",
    key: "4-51-60-71-80",
    rect: visibleB.rect,
  },
]);

const gridTarget = new FakeElement({ children: [visibleA, visibleB] });
computedStyles.set(gridTarget, { display: "grid" });
assert.deepEqual(runtime.collectFlexGapOverlays("column-gap", { anchor: { type: "element", element: gridTarget } }, baseAnnotation, flexCache), []);
const oneChildTarget = new FakeElement({ children: [visibleA] });
computedStyles.set(oneChildTarget, { display: "inline-flex" });
assert.deepEqual(runtime.collectFlexGapOverlays("gap", { anchor: { type: "element", element: oneChildTarget } }, baseAnnotation, flexCache), []);

const cacheHostA = {};
const cacheHostB = {};
const hostACache = runtime.getElementCache(cacheHostA);
hostACache.set("id", ordinaryElement);
assert.equal(runtime.getElementCache(cacheHostA), hostACache);
assert.equal(runtime.getElementCache(cacheHostA).get("id"), ordinaryElement);
assert.notEqual(runtime.getElementCache(cacheHostB), hostACache);

const contained = new FakeNode();
const outside = new FakeNode();
const observerRoot = { contains: (node) => node === contained };
const observedDocument = { documentElement: { name: "document-element" } };
let mutationCount = 0;
const stopObserving = runtime.observeMutationsOutsideOverlay(observedDocument, observerRoot, () => {
  mutationCount += 1;
});
const observer = observerInstances.at(-1);
assert.deepEqual(observer.observed, {
  target: observedDocument.documentElement,
  options: deps.mutationObserverOptions,
});
observer.callback([{ target: contained }, { target: contained }]);
assert.equal(mutationCount, 0);
observer.callback([{ target: contained }, { target: outside }]);
assert.equal(mutationCount, 1);
observer.callback([{ target: {} }]);
assert.equal(mutationCount, 2);
stopObserving();
assert.equal(observer.disconnectCount, 1);

assert.deepEqual(runtime.resolveTextSelectionRects({
  selectionRects: [
    { x: 1, y: 2, width: 3, height: 4 },
    { x: 5, y: 6, width: 7, height: 8, hidden: true },
  ],
  pageUrl: windowLike.location.href,
}), [
  { x: 1, y: 2, width: 3, height: 4, viewport: true },
]);

const tooltip = new FakeHtmlElement();
tooltip.style = { left: "20px", top: "15px" };
tooltip.getBoundingClientRect = () => ({ x: 21, y: 16, width: 120, height: 24, right: 141 });
const tooltipRoot = {
  shadowRoot: {
    querySelector: (selector) => selector === ".element-metadata-tooltip" ? tooltip : null,
  },
};
const scale = { viewportScale: 2, zoomFactor: 3 };
assert.deepEqual(runtime.resolveMetadataTooltipRect(tooltipRoot, { x: 10, y: 5 }, scale), {
  x: 21,
  y: 16,
  width: 120,
  height: 24,
});
assert.deepEqual(calls.at(-1), ["scale-point", { x: 10, y: 5 }, scale]);
tooltip.style.left = "19px";
assert.deepEqual(runtime.resolveMetadataTooltipRect(tooltipRoot, { x: 10, y: 5 }, scale), { x: 20, y: 15 });
assert.deepEqual(runtime.resolveMetadataTooltipRect({ shadowRoot: null }, { x: 2, y: 4 }, scale), { x: 4, y: 12 });

const regionA = { kind: "region", key: "a" };
const regionB = { kind: "region", key: "b" };
const regionC = { kind: "region", key: "c" };
const regionAnnotation = { id: "region-1", anchor: regionA, additionalAnchors: [regionB] };
const editor = {
  anchor: {
    type: "region",
    selections: {
      primary: { anchor: regionC },
      additional: [{ anchor: regionB }],
    },
  },
  target: { mode: "create" },
};
assert.equal(runtime.shouldSuppressRegionOverlay(regionAnnotation, null, { id: "region-1" }), true);
assert.equal(runtime.shouldSuppressRegionOverlay(regionAnnotation, null, null), false);
assert.equal(runtime.shouldSuppressRegionOverlay(regionAnnotation, { ...editor, anchor: { type: "text" } }, null), false);
assert.equal(runtime.shouldSuppressRegionOverlay(regionAnnotation, { ...editor, target: { mode: "edit" } }, null), false);
assert.equal(runtime.shouldSuppressRegionOverlay(regionAnnotation, editor, null), true);
assert.equal(runtime.shouldSuppressRegionOverlay({ id: "region-2", anchor: { kind: "element", key: "b" } }, editor, null), false);
assert.equal(runtime.shouldSuppressRegionOverlay({ id: "region-3", anchor: regionA }, {
  ...editor,
  anchor: {
    ...editor.anchor,
    selections: { primary: { anchor: regionC }, additional: [] },
  },
}, null), false);

console.log("48 annotation overlay runtime assertions passed");
