import assert from "node:assert/strict";
import { projectAnnotationTextOffset } from "../app/.vite/build/browser-page-preload/annotation-text-offset-projection.js";
const nodes = [{ textContent: `abc` }, { textContent: `de` }];
let index = 0;
const deps = { createTextWalker: () => ({}), nextNode: () => nodes[index++] ?? null };
assert.deepEqual(projectAnnotationTextOffset({}, 4, deps), { node: nodes[1], offset: 1 });
assert.equal(projectAnnotationTextOffset({}, -1, deps), null);
assert.equal(projectAnnotationTextOffset({}, 9, { ...deps, nextNode: () => null }), null);
console.log(`test-preload-annotation-text-offset-projection: 3 assertions passed`);
