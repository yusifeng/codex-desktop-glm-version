import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { createAnnotationPermissionController } = createRequire(import.meta.url)(
  "../app/.vite/build/browser-page-preload/annotation-permission-controller.js",
);

let nextId = 0;
const invoked = [];
let invokeReject = false;
const controller = createAnnotationPermissionController({
  isPermissionGranted: () => false,
  createRequestId: () => `request-${++nextId}`,
  invokeHost: (message) => {
    invoked.push(message);
    return invokeReject
      ? Promise.reject(new Error("host unavailable"))
      : new Promise(() => {});
  },
});

const first = controller.requestPermission();
assert.equal(typeof first.then, "function");
assert.deepEqual(invoked, [{ type: "browser-sidebar-runtime-request-annotation-permission", requestId: "request-1" }]);
assert.equal(controller.requestPermission(), first);
assert.equal(invoked.length, 1);
assert.equal(controller.handleResult("wrong-id", true), false);

assert.equal(controller.handleResult("request-1", true), true);
assert.equal(await first, true);
assert.equal(controller.handleResult("request-1", false), false);

const second = controller.requestPermission();
assert.equal(controller.handleResult("request-2", false), true);
assert.equal(await second, false);

const third = controller.requestPermission();
controller.reset();
assert.equal(await third, false);
assert.equal(controller.handleResult("request-3", true), false);

invokeReject = true;
const failed = controller.requestPermission();
assert.equal(await failed, false);
assert.equal(controller.handleResult("request-4", true), false);

console.log("preload annotation permission controller assertions passed (14 assertions)");
