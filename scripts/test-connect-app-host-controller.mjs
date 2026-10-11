import assert from "node:assert/strict";
const { createConnectAppHostController } = await import("../src/main/preload/connect-app-host-controller.ts");

const listeners = new Set();
const sent = [];
const source = {};
const port = {};
const deps = {
  addMessageListener(listener) { listeners.add(listener); },
  removeMessageListener(listener) { listeners.delete(listener); },
  postMessage(channel, message, transfer) { sent.push({ channel, message, transfer }); },
  channel: "connect-app-host",
  windowSource: source,
};
const controller = createConnectAppHostController(deps);
assert.equal(listeners.size, 1);
const listener = [...listeners][0];
listener({ source: {}, data: { type: "connect-app-host", port } });
listener({ source, data: { type: "other", port } });
assert.equal(sent.length, 0);
listener({ source, data: { type: "connect-app-host", port } });
assert.deepEqual(sent, [{ channel: "connect-app-host", message: undefined, transfer: [port] }]);
controller.dispose();
assert.equal(listeners.size, 0);
listener({ source, data: { type: "connect-app-host", port } });
assert.equal(sent.length, 1);
controller.dispose();
console.log("6 connect-app-host-controller assertions passed");
