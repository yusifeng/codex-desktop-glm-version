import assert from "node:assert/strict";
const { createThreadSettingsUpdateRegistry } = await import("../src/main/main-app/conversation/thread-settings-update-registry.ts");

const registry = createThreadSettingsUpdateRegistry();
const order = [];
let release;
const first = registry.run("thread-1", async () => {
  order.push("first-start");
  await new Promise((resolve) => { release = resolve; });
  order.push("first-end");
  return "first";
});
const second = registry.run("thread-1", async () => {
  order.push("second");
  return "second";
});
assert.deepEqual(order, ["first-start"]);
release();
assert.equal(await first, "first");
assert.equal(await second, "second");
assert.deepEqual(order, ["first-start", "first-end", "second"]);
await registry.wait("thread-1");
const failed = registry.run("thread-1", async () => { throw new Error("expected"); });
await assert.rejects(failed, /expected/);
const recovered = await registry.run("thread-1", async () => "recovered");
assert.equal(recovered, "recovered");
registry.clear();
console.log("8 thread-settings-update-registry assertions passed");
