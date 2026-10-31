import assert from "node:assert/strict";
import fs from "node:fs";
import { createThreadMetadataServiceClass } from "../src/main/main-app/threads/thread-metadata-service.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const rejects = async (promise, message) => {
  await assert.rejects(promise, { message });
  assertions += 1;
};

const metadataKey = "sidebar-metadata";
const logs = [];
const validated = [];
class RpcHandlerBase {}
const ThreadMetadataService = createThreadMetadataServiceClass({
  RpcHandlerBase,
  createLogger: (tag) => ({ error: (message, details) => logs.push({ tag, message, details }) }),
  metadataKey,
  validateUpdate(update) {
    validated.push(update);
    if (update.invalid) throw new Error("invalid update");
  },
  applyUpdate(current, update) {
    if (update.noop) return current;
    return { ...current, [update.threadId]: { emoji: update.emoji } };
  },
});

function createHarness(initial = { one: { emoji: "1️⃣" } }) {
  let value = initial;
  const setCalls = [];
  const flushOutcomes = [];
  let flushCalls = 0;
  let changedCalls = 0;
  const globalState = {
    getStored: (key) => key === metadataKey ? value : undefined,
    set(key, next) { setCalls.push([key, next]); value = next; },
    flushOrThrow() {
      flushCalls += 1;
      return flushOutcomes.length === 0 ? Promise.resolve() : flushOutcomes.shift()();
    },
  };
  const service = new ThreadMetadataService(globalState, () => { changedCalls += 1; });
  return {
    flushOutcomes,
    get changedCalls() { return changedCalls; },
    get flushCalls() { return flushCalls; },
    service,
    setCalls,
    get value() { return value; },
  };
}

{
  const harness = createHarness();
  equal(harness.service instanceof RpcHandlerBase, true);
  const result = await harness.service.get("one");
  equal(result, { emoji: "1️⃣" });
  result.emoji = "changed";
  equal(harness.value.one.emoji, "1️⃣");
  equal(await harness.service.get("missing"), null);
  await harness.service.update({ threadId: "one", noop: true });
  equal(harness.setCalls, []);
  equal(harness.flushCalls, 0);
  equal(harness.changedCalls, 0);
}

{
  const harness = createHarness();
  const update = { threadId: "two", emoji: "2️⃣" };
  await harness.service.update(update);
  equal(validated.at(-1), update);
  equal(harness.value, { one: { emoji: "1️⃣" }, two: { emoji: "2️⃣" } });
  equal(harness.flushCalls, 1);
  equal(harness.changedCalls, 1);
}

{
  const initial = { one: { emoji: "1️⃣" } };
  const harness = createHarness(initial);
  harness.flushOutcomes.push(
    () => Promise.reject(new Error("primary flush failed")),
    () => Promise.resolve(),
  );
  await rejects(
    harness.service.update({ threadId: "two", emoji: "2️⃣" }),
    "primary flush failed",
  );
  equal(harness.value, initial);
  equal(harness.setCalls.at(-1), [metadataKey, initial]);
  equal(harness.flushCalls, 2);
  equal(harness.changedCalls, 1);
  await harness.service.update({ threadId: "three", emoji: "3️⃣" });
  equal(harness.value.three, { emoji: "3️⃣" });
  equal(harness.changedCalls, 2);
}

{
  const harness = createHarness();
  harness.flushOutcomes.push(
    () => Promise.reject(new Error("primary failed")),
    () => Promise.reject(new Error("rollback failed")),
  );
  await rejects(harness.service.update({ threadId: "two", emoji: "2️⃣" }), "primary failed");
  equal(logs.at(-1).tag, "ThreadMetadataService");
  equal(logs.at(-1).message, "Failed to persist thread metadata rollback");
  equal(logs.at(-1).details.sensitive.rollbackError.message, "rollback failed");
}

{
  const harness = createHarness();
  let resolveFirst;
  harness.flushOutcomes.push(() => new Promise((resolve) => { resolveFirst = resolve; }));
  const first = harness.service.update({ threadId: "two", emoji: "2️⃣" });
  const second = harness.service.update({ threadId: "three", emoji: "3️⃣" });
  await new Promise(setImmediate);
  equal(harness.setCalls.length, 1);
  resolveFirst();
  await Promise.all([first, second]);
  equal(harness.setCalls.length, 2);
  equal(harness.value, {
    one: { emoji: "1️⃣" },
    two: { emoji: "2️⃣" },
    three: { emoji: "3️⃣" },
  });
}

{
  const harness = createHarness();
  await rejects(harness.service.update({ invalid: true }), "invalid update");
  equal(harness.setCalls, []);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("kot = createThreadMetadataServiceClass({"), true);
equal(main.includes("kot,"), true);
equal(main.includes("kot = class"), false);
equal(main.includes("function Aot("), false);
equal(main.includes("function jot("), false);
equal(main.includes("Oot = RegExp"), false);

console.log(`${assertions} main thread-metadata service assertions passed`);
