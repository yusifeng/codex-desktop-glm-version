import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/remote-artifact/artifact-subscription-manager.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { ArtifactSubscriptionManager } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const ok = (value) => {
  assert.ok(value);
  assertions += 1;
};
const flush = async () => {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
};

function createEndpoint(name, implementation = () => undefined) {
  const calls = [];
  const broken = [];
  const endpoint = (...args) => {
    calls.push(["call", ...args]);
    return implementation(...args);
  };
  endpoint.calls = calls;
  endpoint.disposed = 0;
  endpoint.dup = () => {
    calls.push(["dup"]);
    return endpoint;
  };
  endpoint.onRpcBroken = (listener) => broken.push(listener);
  endpoint.break = () => broken.forEach((listener) => listener());
  endpoint[Symbol.dispose] = () => {
    endpoint.disposed += 1;
    calls.push(["dispose", name]);
  };
  return endpoint;
}

function createHarness(overrides = {}) {
  const calls = [];
  const wrappers = [];
  const ids = ["subscription-1", "subscription-2"];
  let active = true;
  const client = {
    connectionEpoch: 7,
    async call(method, payload) {
      calls.push(["host", method, payload]);
      if (method === "subscriptions.open") {
        return {
          subscriptionId: payload.subscriptionId,
          document: { artifactRef: payload.artifactRef },
        };
      }
      if (method === "documents.appendUpdate") return { applied: true, stateVersion: 3 };
      if (method === "assets.read") {
        return { sha256: payload.sha256, dataBase64: Buffer.from("asset").toString("base64") };
      }
      return {};
    },
  };
  let manager;
  const dependencies = {
    async connect() { calls.push(["connect"]); return client; },
    createId() { return ids.shift(); },
    createSubscription(operations) {
      const wrapper = { ...operations };
      wrappers.push(wrapper);
      return wrapper;
    },
    disposeValue(value) {
      calls.push(["disposeValue", value]);
      value?.[Symbol.dispose]?.();
    },
    getActiveClient() { return active ? client : undefined; },
    isClientActive(candidate) { return active && candidate === client; },
    isErrorCode(error, code) { return error?.code === code; },
    logFailure(event, error) { calls.push(["log", event, error?.message]); },
    parseAppendResult(value) { return { applied: value.applied, stateVersion: value.stateVersion }; },
    parseAssetResult(value, sha256) {
      if (value.sha256 !== sha256) throw Error("wrong asset");
      return Uint8Array.from(Buffer.from(value.dataBase64, "base64"));
    },
    parseEvent(value) {
      if (value.invalid) throw Error("invalid event");
      return { parsed: value };
    },
    parseFlushSubscriptionId(value) {
      if (typeof value?.subscriptionId !== "string") throw Error("invalid flush");
      return value.subscriptionId;
    },
    parseOpenResult(value, artifactRef, subscriptionId) {
      if (value.subscriptionId !== subscriptionId) throw Error("wrong subscription");
      return { artifactRef, document: value.document };
    },
    serializeBytes(bytes) { return Buffer.from(bytes).toString("base64"); },
    ...overrides,
  };
  manager = new ArtifactSubscriptionManager(dependencies);
  return {
    calls,
    client,
    dependencies,
    manager,
    setActive(value) { active = value; },
    wrappers,
  };
}

const request = { artifactRef: "artifact-1", threadId: "thread-1" };

{
  const harness = createHarness();
  const updateResults = [];
  const updateResult = { [Symbol.dispose]() { updateResults.push("disposed"); } };
  const onUpdate = createEndpoint("update", () => updateResult);
  const flushResults = [];
  const flushResult = Promise.resolve();
  flushResult[Symbol.dispose] = () => flushResults.push("disposed");
  const onFlush = createEndpoint("flush", () => flushResult);
  const opened = await harness.manager.open(request, onUpdate, onFlush);
  equal(onUpdate.calls[0], ["dup"]);
  equal(onFlush.calls[0], ["dup"]);
  equal(harness.calls[0], ["connect"]);
  equal(harness.calls.find(([name, method]) => name === "host" && method === "subscriptions.open"), [
    "host",
    "subscriptions.open",
    { artifactRef: "artifact-1", subscriptionId: "subscription-1", threadId: "thread-1" },
  ]);
  equal(opened.record, {
    artifactRef: "artifact-1",
    document: { artifactRef: "artifact-1" },
  });
  equal(opened.subscription, harness.wrappers[0]);

  const appendResult = await opened.subscription.append({
    baseStateVersion: 2,
    bytes: Uint8Array.from([1, 2, 3]),
    originId: "origin-1",
    summary: "Edit",
    updateId: "update-1",
  });
  equal(appendResult, { applied: true, stateVersion: 3 });
  equal(harness.calls.find(([name, method]) => name === "host" && method === "documents.appendUpdate")[2], {
    artifactRef: "artifact-1",
    threadId: "thread-1",
    update: {
      baseStateVersion: 2,
      crdtUpdateBase64: "AQID",
      originId: "origin-1",
      source: "user",
      summary: "Edit",
      updateId: "update-1",
    },
  });

  opened.subscription.markDirty();
  await flush();
  equal(harness.calls.filter(([name, method]) => name === "host" && method === "viewer.markDirty").length, 1);
  const asset = await opened.subscription.readAsset({ sha256: "sha-1" });
  equal(Buffer.from(asset).toString(), "asset");
  equal(harness.calls.find(([name, method]) => name === "host" && method === "assets.read")[2], {
    artifactRef: "artifact-1",
    sha256: "sha-1",
    threadId: "thread-1",
  });

  harness.manager.handleEvent({ subscriptionId: "subscription-1", event: { version: 4 } });
  equal(onUpdate.calls.at(-1), ["call", { parsed: { version: 4 } }]);
  equal(updateResults, ["disposed"]);
  harness.manager.handleEvent({ subscriptionId: "missing", event: {} });
  equal(onUpdate.calls.filter(([name]) => name === "call").length, 1);

  const signal = { checks: 0, throwIfAborted() { this.checks += 1; } };
  equal(
    await harness.manager.handleHostCall(
      harness.client,
      "viewer.flush",
      { subscriptionId: "subscription-1" },
      signal,
    ),
    { flushed: true },
  );
  equal(signal.checks, 3);
  equal(onFlush.calls.filter(([name]) => name === "call").length, 1);
  equal(flushResults, ["disposed"]);

  opened.subscription.unsubscribe();
  await flush();
  equal(onUpdate.disposed, 1);
  equal(onFlush.disposed, 1);
  equal(harness.calls.filter(([name, method]) => name === "host" && method === "subscriptions.close").length, 1);
  await assert.rejects(opened.subscription.append({}), /subscription is closed/);
  assertions += 1;
}

{
  const harness = createHarness();
  const onUpdate = createEndpoint("update");
  const onFlush = createEndpoint("flush");
  await harness.manager.open(request, onUpdate, onFlush);
  onUpdate.break();
  await flush();
  equal(onUpdate.disposed, 1);
  equal(onFlush.disposed, 1);
  equal(harness.calls.filter(([name, method]) => name === "host" && method === "subscriptions.close").length, 1);
}

{
  const harness = createHarness({ createId: () => "collision" });
  await harness.manager.open(request, createEndpoint("update-1"), createEndpoint("flush-1"));
  const update = createEndpoint("update-2");
  const onFlush = createEndpoint("flush-2");
  await assert.rejects(harness.manager.open(request, update, onFlush), /could not be opened/);
  assertions += 1;
  equal(update.disposed, 1);
  equal(onFlush.disposed, 1);
  equal(harness.calls.some(([name, event]) => name === "log" && event === "open_failed"), true);
}

{
  const harness = createHarness({
    parseOpenResult() { throw Error("invalid open response"); },
  });
  const update = createEndpoint("update");
  const onFlush = createEndpoint("flush");
  await assert.rejects(harness.manager.open(request, update, onFlush), /could not be opened/);
  assertions += 1;
  equal(update.disposed, 1);
  equal(onFlush.disposed, 1);
  equal(harness.calls.filter(([name, method]) => name === "host" && method === "subscriptions.close").length, 1);
}

{
  const harness = createHarness();
  const update = createEndpoint("update");
  const onFlush = createEndpoint("flush");
  const opened = await harness.manager.open(request, update, onFlush);
  harness.setActive(false);
  await assert.rejects(opened.subscription.append({}), /could not be saved/);
  assertions += 1;
  equal(harness.calls.some(([name, event]) => name === "log" && event === "append_failed"), true);
  await assert.rejects(
    harness.manager.handleHostCall(
      harness.client,
      "viewer.flush",
      { subscriptionId: "subscription-1" },
      { throwIfAborted() {} },
    ),
    /connection is unavailable/,
  );
  assertions += 1;
}

{
  const notFound = Object.assign(Error("missing"), { code: "ASSET_NOT_FOUND" });
  const harness = createHarness();
  const originalCall = harness.client.call;
  harness.client.call = async (method, payload) => {
    if (method === "assets.read") throw notFound;
    return originalCall.call(harness.client, method, payload);
  };
  const opened = await harness.manager.open(request, createEndpoint("update"), createEndpoint("flush"));
  equal(await opened.subscription.readAsset({ sha256: "missing" }), null);
  equal(harness.calls.some(([name, event]) => name === "log" && event === "read_asset_failed"), false);
}

{
  const harness = createHarness();
  const firstUpdate = createEndpoint("update-1");
  const firstFlush = createEndpoint("flush-1");
  const secondUpdate = createEndpoint("update-2");
  const secondFlush = createEndpoint("flush-2");
  const first = await harness.manager.open(request, firstUpdate, firstFlush);
  await harness.manager.open({ artifactRef: "artifact-2", threadId: "thread-2" }, secondUpdate, secondFlush);
  const opened = harness.manager.drain();
  equal(opened.map(({ subscriptionId }) => subscriptionId), ["subscription-1", "subscription-2"]);
  equal(firstUpdate.disposed, 1);
  equal(firstFlush.disposed, 1);
  equal(secondUpdate.disposed, 1);
  equal(secondFlush.disposed, 1);
  equal(harness.calls.filter(([name, method]) => name === "host" && method === "subscriptions.close").length, 0);
  await assert.rejects(first.subscription.readAsset({ sha256: "sha" }), /subscription is closed/);
  assertions += 1;
  const lateUpdate = createEndpoint("late-update");
  const lateFlush = createEndpoint("late-flush");
  await assert.rejects(harness.manager.open(request, lateUpdate, lateFlush), /viewer is unavailable/);
  assertions += 1;
  equal(lateUpdate.disposed, 0);
  equal(lateFlush.disposed, 0);
}

{
  const harness = createHarness();
  await assert.rejects(
    harness.manager.handleHostCall(
      harness.client,
      "unknown",
      { subscriptionId: "subscription-1" },
      { throwIfAborted() {} },
    ),
    /Unsupported Artifact Session/,
  );
  assertions += 1;
  harness.manager.handleEvent({ subscriptionId: "missing", event: { invalid: true } });
  equal(harness.calls.some(([name, event]) => name === "log" && event === "event_delivery_failed"), false);
}

console.log(`${assertions} main artifact subscription manager assertions passed`);
