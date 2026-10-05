import assert from "node:assert/strict";
import { projectAnnotationNearbyText } from "../app/.vite/build/browser-page-preload/annotation-nearby-text-policy.js";
const context = { label: `section text` };
const deps = { read: (value) => value.label ?? null, find: () => context, is: (value) => value === context };
assert.equal(projectAnnotationNearbyText({ label: `direct` }, deps.read, deps.find, deps.is), `direct`);
assert.equal(projectAnnotationNearbyText({}, deps.read, deps.find, deps.is), `section text`);
assert.equal(projectAnnotationNearbyText({}, deps.read, () => null, deps.is), null);
console.log("test-preload-annotation-nearby-text-policy: 3 assertions passed");
