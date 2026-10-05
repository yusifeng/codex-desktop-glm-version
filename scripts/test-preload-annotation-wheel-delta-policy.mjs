import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationWheelDelta } = require("../app/.vite/build/browser-page-preload/annotation-wheel-delta-policy.js");
const deps = { lineMode: 1, pageMode: 2, lineScale: 10 };
assert.deepEqual(projectAnnotationWheelDelta({ deltaMode: 1, deltaX: 1, deltaY: 2 }, { innerWidth: 100, innerHeight: 200 }, deps), { x: 10, y: 20 });
assert.deepEqual(projectAnnotationWheelDelta({ deltaMode: 2, deltaX: 1, deltaY: 2 }, { innerWidth: 100, innerHeight: 200 }, deps), { x: 100, y: 400 });
console.log("test-preload-annotation-wheel-delta-policy: 2 assertions passed");
