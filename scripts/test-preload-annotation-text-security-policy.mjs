import assert from "node:assert/strict";
import { isAnnotationTextSecurityEnabled } from "../app/.vite/build/browser-page-preload/annotation-text-security-policy.js";
const deps = { getTextSecurity: (element) => element.value };
assert.equal(isAnnotationTextSecurityEnabled({ value: `disc` }, deps), true);
assert.equal(isAnnotationTextSecurityEnabled({ value: `none` }, deps), false);
assert.equal(isAnnotationTextSecurityEnabled({ value: `` }, deps), false);
console.log(`test-preload-annotation-text-security-policy: 3 assertions passed`);
