import assert from "node:assert/strict";
import { scoreAnnotationAnchorCandidate } from "../app/.vite/build/browser-page-preload/annotation-anchor-candidate-score.js";
const deps = { getName: (v) => v.name, getNearbyText: (v) => v.nearby, getTitle: (v) => v.title, getElementPath: (v) => v.path, getRect: (v) => v.point, getAnchorPoint: (v) => v.point };
assert.equal(scoreAnnotationAnchorCandidate({ name: `n`, nearbyText: `x`, title: `t`, elementPath: `p`, point: { x: 1, y: 2 } }, { name: `n`, nearby: `x`, title: `t`, path: `p`, point: { x: 1, y: 2 } }, deps), 1775);
assert.equal(scoreAnnotationAnchorCandidate({ name: `n`, nearbyText: null, title: `t`, elementPath: `p`, point: { x: 1, y: 2 } }, { name: `z`, nearby: null, title: `q`, path: `x`, point: { x: 4, y: 6 } }, deps), -7);
assert.equal(scoreAnnotationAnchorCandidate({ name: `n`, nearbyText: null, title: `t`, elementPath: `p` }, { name: `n` }, { ...deps, getRect: () => null, getAnchorPoint: () => null }), 1000);
console.log("test-preload-annotation-anchor-candidate-score: 3 assertions passed");
