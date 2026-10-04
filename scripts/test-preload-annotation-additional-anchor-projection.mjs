import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationAdditionalAnchors } = require("../app/.vite/build/browser-page-preload/annotation-additional-anchor-projection.js");

assert.equal(projectAnnotationAdditionalAnchors(undefined, { width: 1 }, () => null), undefined);
assert.equal(projectAnnotationAdditionalAnchors([], { width: 1 }, () => null), undefined);
const viewport = { width: 800, height: 600 };
const source = [{ id: "a" }, { id: "b" }];
let calls = 0;
const result = projectAnnotationAdditionalAnchors(source, viewport, (selection, size) => {
  calls += 1;
  return { ...selection, viewport: size };
});
assert.equal(calls, 2);
assert.deepEqual(result, [{ id: "a", viewport }, { id: "b", viewport }]);
assert.deepEqual(projectAnnotationAdditionalAnchors(source, viewport, undefined), source);
console.log("test-preload-annotation-additional-anchor-projection: 5 assertions passed");
