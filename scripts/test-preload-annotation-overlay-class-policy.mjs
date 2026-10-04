import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getAnnotationElementOverlayClassName } = require("../app/.vite/build/browser-page-preload/annotation-overlay-class-policy.js");

const calls = [];
const dependencies = {
  isAnchorOnCurrentPage(anchor) {
    calls.push(["page", anchor]);
    return anchor?.page === "current";
  },
  isRectLargeEnough(rect, width, height) {
    calls.push(["large", rect, width, height]);
    return rect?.large === true;
  },
};

assert.equal(
  getAnnotationElementOverlayClassName({ page: "current" }, { large: true }, 800, 600, dependencies),
  "hover-box google-docs-annotation-box google-docs-element-box",
);
assert.equal(getAnnotationElementOverlayClassName({ page: "other" }, { large: true }, 800, 600, dependencies), "hover-box");
assert.equal(getAnnotationElementOverlayClassName({ page: "current" }, { large: false }, 800, 600, dependencies), "hover-box");
assert.deepEqual(calls, [
  ["page", { page: "current" }],
  ["large", { large: true }, 800, 600],
  ["page", { page: "other" }],
  ["page", { page: "current" }],
  ["large", { large: false }, 800, 600],
]);
console.log("annotation overlay class policy assertions: 4 passed");
