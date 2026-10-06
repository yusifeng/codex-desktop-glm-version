import assert from "node:assert/strict";
import { hasAnnotationInputSelection } from "../app/.vite/build/browser-page-preload/annotation-input-selection-policy.js";
const deps = { isTextInput: () => true };
assert.equal(hasAnnotationInputSelection({ selectionStart: 1, selectionEnd: 3 }, deps), true);
assert.equal(hasAnnotationInputSelection({ selectionStart: 3, selectionEnd: 3 }, deps), false);
assert.equal(hasAnnotationInputSelection(null, deps), false);
console.log(`test-preload-annotation-input-selection-policy: 3 assertions passed`);
