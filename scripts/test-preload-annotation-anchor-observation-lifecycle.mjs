import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationAnchorObservationLifecycle } = require("../app/.vite/build/browser-page-preload/annotation-anchor-observation-lifecycle.js");

const events = [];
const viewport = {
  addEventListener: (type) => events.push(`add:${type}`),
  removeEventListener: (type) => events.push(`remove:${type}`),
};
let frameDisposed = 0;
let textDisposed = 0;
let refreshes = 0;
const lifecycle = createAnnotationAnchorObservationLifecycle({
  visualViewport: viewport,
  observeFrames: (install) => {
    events.push("frames:add");
    const cleanup = install({}, {});
    return () => { events.push("frames:remove"); cleanup(); frameDisposed += 1; };
  },
  observeTextAnchors: (anchors, onChange) => {
    events.push(`text:add:${anchors.length}`);
    onChange();
    return () => { events.push("text:remove"); textDisposed += 1; };
  },
  anchors: [{ id: "anchor" }],
  installFrameResources: () => () => events.push("frame-resources:remove"),
  onViewportResize: () => events.push("resize"),
  onViewportScroll: () => events.push("scroll"),
  onTextAnchorChange: () => { refreshes += 1; },
  installRootResources: () => {
    events.push("root:add");
    return () => events.push("root:remove");
  },
});
lifecycle.install();
assert.equal(refreshes, 2);
assert.deepEqual(events.slice(0, 5), ["add:resize", "add:scroll", "root:add", "frames:add", "text:add:1"]);
lifecycle.dispose();
lifecycle.dispose();
assert.equal(frameDisposed, 1);
assert.equal(textDisposed, 1);
assert.ok(events.includes("frame-resources:remove"));
assert.ok(events.includes("root:remove"));
assert.equal(refreshes, 2);
console.log("10 preload annotation anchor-observation-lifecycle assertions passed");
