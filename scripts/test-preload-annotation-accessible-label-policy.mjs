import assert from "node:assert/strict";
import { projectAnnotationAccessibleLabel } from "../app/.vite/build/browser-page-preload/annotation-accessible-label-policy.js";
const element = { tagName: `BUTTON` };
assert.equal(projectAnnotationAccessibleLabel(element, () => `Save`, () => `text`), `Save`);
assert.equal(projectAnnotationAccessibleLabel(element, () => null, () => `text`), `text`);
assert.equal(projectAnnotationAccessibleLabel(element, () => null, () => null), `button`);
console.log("test-preload-annotation-accessible-label-policy: 3 assertions passed");
