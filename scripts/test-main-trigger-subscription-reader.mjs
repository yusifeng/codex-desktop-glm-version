import assert from "node:assert/strict";
import fs from "node:fs";
import { createTriggerSubscriptionReaderClass } from "../src/main/main-app/triggers/trigger-subscription-reader.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const deferred = () => {
  let resolve;
  const promise = new Promise((onResolve) => { resolve = onResolve; });
  return { promise, resolve };
};

const stringFields = [
  "thread_id",
  "subscription_id",
  "connector_id",
  "connector_name",
  "event_name",
  "display_label",
];
const runtime = {
  Of: () => ({ kind: "string" }),
  hf: (schema) => ({ kind: "array", schema }),
  wf(shape) {
    if (!("subscriptions" in shape)) return { kind: "subscription", shape };
    return {
      parse(value) {
        if (
          value == null ||
          !Array.isArray(value.subscriptions) ||
          value.subscriptions.some((subscription) =>
            stringFields.some((field) => typeof subscription[field] !== "string"))
        ) {
          throw Error("invalid subscriptions response");
        }
        return value;
      },
    };
  },
};
const chunkArray = (values, size) => {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) chunks.push(values.slice(index, index + size));
  return chunks;
};
const TriggerSubscriptionReader = createTriggerSubscriptionReaderClass({
  runtime,
  RpcHandlerBase: class {},
  chunkArray,
});
const subscription = (threadId, suffix = threadId) => ({
  thread_id: threadId,
  subscription_id: `subscription-${suffix}`,
  connector_id: `connector-${suffix}`,
  connector_name: `Connector ${suffix}`,
  event_name: `event-${suffix}`,
  display_label: `Event ${suffix}`,
});

{
  const calls = [];
  const principal = { accountId: "account", userId: "user" };
  const reader = new TriggerSubscriptionReader(
    async () => principal,
    async (url, options) => {
      calls.push([url, options]);
      return { subscriptions: options.body.thread_ids.map((threadId) => subscription(threadId)) };
    },
  );
  equal(
    await reader.readMany({ accountId: "account", threadIds: ["one", "two", "one"] }),
    { one: [subscription("one")], two: [subscription("two")] },
  );
  equal(calls.length, 1);
  equal(calls[0][0], "/ps/event-subscriptions/batch");
  equal(calls[0][1].method, "POST");
  equal(calls[0][1].body, { thread_ids: ["one", "two"] });
  equal(calls[0][1].signal.aborted, false);
}

{
  const batches = [];
  const ids = Array.from({ length: 205 }, (_, index) => `thread-${index}`);
  const reader = new TriggerSubscriptionReader(
    async () => ({ accountId: "account", userId: "user" }),
    async (_url, options) => {
      batches.push(options.body.thread_ids);
      return {
        subscriptions: options.body.thread_ids.flatMap((threadId) =>
          Number(threadId.split("-")[1]) % 2 === 0 ? [subscription(threadId)] : []),
      };
    },
  );
  const result = await reader.readMany({ accountId: "account", threadIds: ids });
  equal(batches.map((batch) => batch.length), [100, 100, 5]);
  equal(Object.keys(result).length, 205);
  equal(result["thread-0"], [subscription("thread-0")]);
  equal(result["thread-1"], []);
}

{
  let fetches = 0;
  const reader = new TriggerSubscriptionReader(
    async () => ({ accountId: "other", userId: "user" }),
    async () => { fetches += 1; return { subscriptions: [] }; },
  );
  await assert.rejects(
    reader.readMany({ accountId: "account", threadIds: ["one"] }),
    /no longer active/,
  );
  assertions += 1;
  equal(fetches, 0);
}

{
  let principalCall = 0;
  const reader = new TriggerSubscriptionReader(
    async () => principalCall++ === 0
      ? { accountId: "account", userId: "user-a" }
      : { accountId: "account", userId: "user-b" },
    async () => ({ subscriptions: [] }),
  );
  await assert.rejects(
    reader.readMany({ accountId: "account", threadIds: ["one"] }),
    /changed during the request/,
  );
  assertions += 1;
}

{
  const reader = new TriggerSubscriptionReader(
    async () => ({ accountId: "account", userId: "user" }),
    async () => ({ subscriptions: [{ thread_id: "one" }] }),
  );
  await assert.rejects(
    reader.readMany({ accountId: "account", threadIds: ["one"] }),
    /invalid subscriptions response/,
  );
  assertions += 1;
}

{
  const principalRequest = deferred();
  const reader = new TriggerSubscriptionReader(
    () => principalRequest.promise,
    async () => ({ subscriptions: [] }),
  );
  const pending = reader.readMany({ accountId: "account", threadIds: ["one"] });
  reader.cancelPendingReads();
  principalRequest.resolve({ accountId: "account", userId: "user" });
  await assert.rejects(pending, (error) => error.name === "AbortError");
  assertions += 1;
}

{
  const response = deferred();
  const reader = new TriggerSubscriptionReader(
    async () => ({ accountId: "account", userId: "user" }),
    () => response.promise,
  );
  const pending = reader.readMany({ accountId: "account", threadIds: ["one"] });
  await Promise.resolve();
  reader.cancelPendingReads();
  response.resolve({ subscriptions: [] });
  await assert.rejects(pending, (error) => error.name === "AbortError");
  assertions += 1;
  equal(
    await reader.readMany({ accountId: "account", threadIds: [] }),
    {},
  );
}

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("Rnt = createTriggerSubscriptionReaderClass({"), true);
equal(main.includes("new Rnt("), true);
equal(main.includes("Rnt = class"), false);
equal(main.includes("Int = n.wf"), false);
equal(main.includes("Lnt = 100"), false);

console.log(`${assertions} main trigger subscription reader assertions passed`);
