import assert from "node:assert/strict";
const { createViewMessageRouterController } = await import("../src/main/preload/view-message-router-controller.ts");
const calls = [];
const controller = createViewMessageRouterController({
  isChunkedHostMessage: (message) => message?.chunked === true,
  setSharedObjectValue: (key, value) => calls.push([`shared`, key, value]),
  disposePipLayout: (state) => calls.push([`pip`, state.activeThreadID]),
  dispatchMessage: (message) => calls.push([`dispatch`, message.type]),
});
assert.equal(controller.route({ type: `shared-object-updated`, key: `theme`, value: `dark` }), true);
assert.equal(controller.route({ type: `remote-hosted-pip-content-layout-state-changed`, state: { activeThreadID: `t1`, orderedPresentationIDs: [] } }), true);
assert.equal(controller.route({ type: `chunk`, chunked: true }), true);
assert.deepEqual(calls, [[`shared`, `theme`, `dark`], [`dispatch`, `shared-object-updated`], [`pip`, `t1`], [`dispatch`, `remote-hosted-pip-content-layout-state-changed`], [`dispatch`, `chunk`]]);
controller.dispose();
assert.equal(controller.route({ type: `ignored` }), false);
console.log("8 preload view-message-router-controller assertions passed");
