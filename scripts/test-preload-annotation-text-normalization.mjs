import assert from "node:assert/strict";
import { normalizeAnnotationText } from "../app/.vite/build/browser-page-preload/annotation-text-normalization.js";
assert.equal(normalizeAnnotationText(`  hello\n  world  `), `hello world`);
assert.equal(normalizeAnnotationText(`  `), null);
assert.equal(normalizeAnnotationText(`abcdef`, 3), `abc`);
console.log(`test-preload-annotation-text-normalization: 3 assertions passed`);
