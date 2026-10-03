import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationPermissionController } = require("../app/.vite/build/browser-page-preload/annotation-permission-controller.js");

let granted = true;
let nextId = 0;
const messages = [];
let rejectInvoke = null;
const controller = createAnnotationPermissionController({
  isPermissionGranted: () => granted,
  createRequestId: () => `request-${++nextId}`,
  invokeHost: (message) => {
    messages.push(message);
    return rejectInvoke == null ? Promise.resolve() : new Promise((_resolve, reject) => { rejectInvoke = reject; });
  },
});

assert.equal(controller.requestPermission(), true);
assert.equal(messages.length, 0);

granted = false;
const first = controller.requestPermission();
assert.equal(first instanceof Promise, true);
assert.equal(controller.requestPermission(), first);
assert.deepEqual(messages, [{
  type: "browser-sidebar-runtime-request-annotation-permission",
  requestId: "request-1",
}]);
assert.equal(controller.handleResult("other", true), false);
assert.equal(controller.handleResult("request-1", true), true);
assert.equal(await first, true);

const second = controller.requestPermission();
controller.reset();
assert.equal(await second, false);
assert.equal(controller.handleResult("request-2", true), false);

rejectInvoke = () => {};
const third = controller.requestPermission();
assert.deepEqual(messages.at(-1), {
  type: "browser-sidebar-runtime-request-annotation-permission",
  requestId: "request-3",
});
rejectInvoke(new Error("invoke failed"));
assert.equal(await third, false);

const fourth = controller.requestPermission();
assert.notEqual(fourth, third);
controller.handleResult("request-4", false);
assert.equal(await fourth, false);

console.log("14 annotation permission controller assertions passed");
