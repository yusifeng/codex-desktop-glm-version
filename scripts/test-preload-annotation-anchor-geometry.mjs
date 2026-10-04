import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationAnchorGeometry } = require("../app/.vite/build/browser-page-preload/annotation-anchor-geometry.js");

const rootWindow = { innerWidth: 1000, innerHeight: 800, scrollX: 0, scrollY: 20, document: {} };
rootWindow.document.body = {};
rootWindow.document.documentElement = {};
const deps = {
  getDefaultWindow: () => rootWindow,
  getDefaultDocument: () => rootWindow.document,
  resolveFrameWindow: () => null,
  resolveFrameElement: () => null,
  getScrollOffset: () => ({ x: 0, y: 0 }),
  getFrameWindow: () => null,
  getParentElement: () => null,
  getComputedStyle: () => ({ position: "static" }),
  isClippingOverflow: (value) => value === "hidden",
  isElement: (value) => value != null && value.nodeType === 1,
  getElementRect: (element) => element.rect,
  getElementOffsetWidth: (element) => element.offsetWidth ?? element.rect.width,
  getElementOffsetHeight: (element) => element.offsetHeight ?? element.rect.height,
  getElementClientLeft: () => 0,
  getElementClientTop: () => 0,
  getElementClientWidth: (element) => element.rect.width,
  getElementClientHeight: (element) => element.rect.height,
  getFrameElement: () => null,
  getInnerWidth: (windowLike) => windowLike.innerWidth,
  getInnerHeight: (windowLike) => windowLike.innerHeight,
  getDocumentBody: (documentLike) => documentLike.body,
  getDocumentElement: (documentLike) => documentLike.documentElement,
  getAnchorRect: (anchor) => anchor.rect,
  getAnchorMarkerSize: () => null,
  getViewportState: () => ({ width: 1000, height: 800, scrollY: 20 }),
  getViewportOffset: () => ({ x: 0, y: 0 }),
  getFrameOffset: () => ({ x: 0, y: 0 }),
  getWindowScrollY: (windowLike) => windowLike.scrollY,
  clamp: (value, min, max) => Math.min(Math.max(value, min), max),
  getMarkerInset: () => 16,
  getViewportOverride: (value, viewport) => ({ ...value, ...viewport }),
  getScaleRect: (rect, scale) => ({ x: rect.x * scale, y: rect.y * scale, width: rect.width * scale, height: rect.height * scale }),
  getFramePath: (anchor) => anchor.framePath ?? [],
  getDocumentContext: () => ({ kind: "document-context" }),
  getPageUrl: () => "https://example.test/page",
  getCurrentDocumentTitle: () => "Example",
  getScrollContainers: () => [],
};

const geometry = createAnnotationAnchorGeometry(deps);
const marker = geometry.resolveMarkerPoint({ kind: "element", framePath: [], point: { xPercent: 50, y: 100 }, isFixed: false, rect: { x: 0, y: 80, width: 100, height: 40 } });
assert.deepEqual(marker, { x: 500, y: 80 });
assert.deepEqual(geometry.buildBoxStyle({ x: 10, y: 20, width: 30, height: 40 }, 2, "4px"), { borderRadius: "4px", left: 20, top: 40, width: 60, height: 80 });
const element = { nodeType: 1, rect: { x: 10, y: 20, width: 100, height: 50 }, offsetWidth: 100, offsetHeight: 50, isConnected: true, ownerDocument: rootWindow.document };
assert.deepEqual(geometry.resolveAnchorClipRect({ kind: "element", framePath: [], selector: "#target", rect: { x: 10, y: 20, width: 100, height: 50 }, scrollContainers: [] }, element.rect, element), element.rect);
console.log("test-preload-annotation-anchor-geometry: 3 assertions passed");
