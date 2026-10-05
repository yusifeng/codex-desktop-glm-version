import assert from "node:assert/strict";
import { normalizeAnnotationColor, parseAnnotationColor } from "../app/.vite/build/browser-page-preload/annotation-color-policy.js";
assert.equal(normalizeAnnotationColor(" #abc "), "#AABBCC");
assert.equal(normalizeAnnotationColor("rgba(255, 0, 128, 0.5)"), "#FF008080");
assert.equal(normalizeAnnotationColor("rgb(10% 20% 30%)"), "#0A141E");
assert.equal(normalizeAnnotationColor("not-a-color"), "not-a-color");
assert.deepEqual(parseAnnotationColor("#1234"), { red: 17, green: 34, blue: 51, alpha: 68 });
console.log("test-preload-annotation-color-policy: 5 assertions passed");
