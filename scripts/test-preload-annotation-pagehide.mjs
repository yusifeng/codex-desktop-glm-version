import assert from "node:assert/strict";
import { handleAnnotationPagehide } from "../app/.vite/build/browser-page-preload/annotation-pagehide.js";

const calls = [];
const deps = Object.fromEntries([
  ["clearPreview", () => calls.push("preview")],
  ["resetPermission", () => calls.push("permission")],
  ["disposeFeatures", () => calls.push("features")],
  ["removeDOMContentLoaded", () => calls.push("dom")],
  ["removeHostMessageListener", () => calls.push("host")],
  ["disposeRuntimeMount", () => calls.push("mount")],
  ["markDestroyed", () => calls.push("destroyed")],
]);

assert.equal(handleAnnotationPagehide({ isTrusted: false, persisted: false }, deps), false);
assert.deepEqual(calls, ["preview"]);
calls.length = 0;
assert.equal(handleAnnotationPagehide({ isTrusted: true, persisted: true }, deps), false);
assert.deepEqual(calls, ["preview", "permission"]);
calls.length = 0;
assert.equal(handleAnnotationPagehide({ isTrusted: true, persisted: false }, deps), true);
assert.deepEqual(calls, ["preview", "permission", "destroyed", "features", "dom", "host", "mount"]);
calls.length = 0;
assert.equal(handleAnnotationPagehide(null, deps), false);
assert.deepEqual(calls, ["preview"]);

console.log(`test-preload-annotation-pagehide: 8 assertions passed`);
