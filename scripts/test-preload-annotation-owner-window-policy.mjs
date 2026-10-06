import assert from "node:assert/strict";
import { getAnnotationOwnerWindow } from "../app/.vite/build/browser-page-preload/annotation-owner-window-policy.js";
const fallback = {};
const owner = {};
assert.equal(getAnnotationOwnerWindow({ ownerDocument: { defaultView: owner } }, fallback), owner);
assert.equal(getAnnotationOwnerWindow({}, fallback), fallback);
console.log(`test-preload-annotation-owner-window-policy: 2 assertions passed`);
