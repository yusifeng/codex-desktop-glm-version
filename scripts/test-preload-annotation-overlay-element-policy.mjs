import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isPageAnnotationOverlayElement } = require("../app/.vite/build/browser-page-preload/annotation-overlay-element-policy.js");
const policy = {};
assert.equal(isPageAnnotationOverlayElement("element", { rootId: "root", isOverlay: (element, rootId, receivedPolicy) => element === "element" && rootId === "root" && receivedPolicy === policy, policy }), true);
assert.equal(isPageAnnotationOverlayElement("other", { rootId: "root", isOverlay: () => false, policy }), false);

console.log("2 preload annotation overlay-element assertions passed");
