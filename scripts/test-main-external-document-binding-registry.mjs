import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [
    path.join(
      root,
      "src/main/main-app/remote-artifact/external-document-binding-registry.ts",
    ),
  ],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { ExternalDocumentBindingRegistry } = await import(
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

function createEndpoint(name, implementation = async () => ({})) {
  const calls = [];
  const brokenListeners = [];
  const endpoint = async (payload) => {
    calls.push(["call", payload]);
    return implementation(payload);
  };
  endpoint.calls = calls;
  endpoint.disposed = 0;
  endpoint.dup = () => {
    calls.push(["dup"]);
    return endpoint;
  };
  endpoint.onRpcBroken = (listener) => brokenListeners.push(listener);
  endpoint.break = () => {
    for (const listener of brokenListeners) listener();
  };
  endpoint[Symbol.dispose] = () => {
    endpoint.disposed += 1;
    calls.push(["dispose", name]);
  };
  return endpoint;
}

function createHarness({ callHost, connectSupported = true } = {}) {
  const hostCalls = [];
  const bindings = [];
  const ids = ["artifact-id", "binding-id", "artifact-id-2", "binding-id-2"];
  const registry = new ExternalDocumentBindingRegistry({
    async connect(kind) {
      hostCalls.push(["connect", kind]);
      if (!connectSupported) return null;
      return async (method, payload) => {
        hostCalls.push([method, payload]);
        return callHost == null ? {} : callHost(method, payload);
      };
    },
    createBinding(activate, unbind) {
      const binding = { activate, unbind };
      bindings.push(binding);
      return binding;
    },
    createId() {
      return ids.shift();
    },
    parseApplyRequest(value) {
      if (value?.bindingId == null || value?.invalid) throw Error("invalid apply");
      return value;
    },
    parseBindingRequest(value) {
      if (value?.bindingId == null) throw Error("invalid binding");
      return { bindingId: value.bindingId };
    },
  });
  return { bindings, hostCalls, registry };
}

const request = {
  documentId: "document-1",
  kind: "spreadsheet",
  targetUri: "file:///book.xlsx",
  title: "Book",
};

{
  const capture = createEndpoint("capture");
  const apply = createEndpoint("apply");
  const harness = createHarness({ connectSupported: false });
  equal(await harness.registry.bind(request, capture, apply), { status: "unsupported" });
  equal(capture.calls[0], ["dup"]);
  equal(apply.calls[0], ["dup"]);
  equal(capture.disposed, 1);
  equal(apply.disposed, 1);
  equal(harness.bindings.length, 0);
}

{
  const captureResult = { bytes: "snapshot", [Symbol.dispose]: () => (captureResult.disposed = true) };
  const applyResult = { applied: true, [Symbol.dispose]: () => (applyResult.disposed = true) };
  const capture = createEndpoint("capture", async () => captureResult);
  const apply = createEndpoint("apply", async () => applyResult);
  const harness = createHarness();
  const bound = await harness.registry.bind(request, capture, apply);
  equal(bound.status, "bound");
  equal(bound.artifactRef, "artifact_external_artifact-id");
  equal(harness.bindings.length, 1);
  equal(capture.disposed, 0);
  equal(apply.disposed, 0);

  await harness.bindings[0].activate("thread-1");
  equal(harness.hostCalls[1], [
    "documents.bindExternal",
    {
      artifactRef: "artifact_external_artifact-id",
      artifactType: "spreadsheet",
      bindingId: "binding-id",
      documentId: "document-1",
      externalTarget: { uri: "file:///book.xlsx" },
      threadId: "thread-1",
      title: "Book",
    },
  ]);
  await harness.bindings[0].activate("thread-1");
  equal(harness.hostCalls.filter((call) => call[0] === "documents.bindExternal").length, 1);
  await assert.rejects(harness.bindings[0].activate("thread-2"), /belongs to another task/);
  assertions += 1;

  const signal = { checks: 0, throwIfAborted() { this.checks += 1; } };
  const captured = await harness.registry.handleCall(
    "externalDocument.capture",
    { bindingId: "binding-id" },
    signal,
  );
  equal(captured.bytes, "snapshot");
  equal(typeof captured[Symbol.dispose], "function");
  equal(signal.checks, 2);
  equal(captureResult.disposed, true);
  const applied = await harness.registry.handleCall(
    "externalDocument.apply",
    {
      bindingId: "binding-id",
      snapshotId: "snapshot",
      invocationId: "invoke",
      updateId: "update",
      crdtUpdateBase64: "bytes",
    },
    signal,
  );
  equal(applied.applied, true);
  equal(typeof applied[Symbol.dispose], "function");
  equal(apply.calls.at(-1), [
    "call",
    {
      snapshotId: "snapshot",
      invocationId: "invoke",
      updateId: "update",
      crdtUpdateBase64: "bytes",
    },
  ]);
  equal(applyResult.disposed, true);

  await harness.bindings[0].unbind();
  equal(capture.disposed, 1);
  equal(apply.disposed, 1);
  equal(harness.hostCalls.at(-1), ["documents.unbindExternal", { bindingId: "binding-id" }]);
  await assert.rejects(
    harness.registry.handleCall(
      "externalDocument.capture",
      { bindingId: "binding-id" },
      signal,
    ),
    /binding is unavailable/,
  );
  assertions += 1;
}

{
  let attempts = 0;
  const harness = createHarness({
    callHost(method) {
      if (method === "documents.bindExternal" && attempts++ === 0) {
        return Promise.reject(Error("activation failed"));
      }
      return Promise.resolve({});
    },
  });
  const bound = await harness.registry.bind(request, createEndpoint("capture"), createEndpoint("apply"));
  await assert.rejects(bound.binding.activate("thread-1"), /activation failed/);
  assertions += 1;
  await bound.binding.activate("thread-1");
  equal(attempts, 2);
}

{
  const harness = createHarness();
  const capture = createEndpoint("capture");
  const apply = createEndpoint("apply");
  const bound = await harness.registry.bind(request, capture, apply);
  await assert.rejects(bound.binding.activate(""), /binding is unavailable/);
  assertions += 1;
  capture.break();
  await flush();
  equal(capture.disposed, 1);
  equal(apply.disposed, 1);
  await assert.rejects(bound.binding.activate("thread-1"), /binding is unavailable/);
  assertions += 1;
}

{
  const harness = createHarness();
  const firstCapture = createEndpoint("capture-1");
  const firstApply = createEndpoint("apply-1");
  const secondCapture = createEndpoint("capture-2");
  const secondApply = createEndpoint("apply-2");
  const first = await harness.registry.bind(request, firstCapture, firstApply);
  const second = await harness.registry.bind({ ...request, title: null }, secondCapture, secondApply);
  await first.binding.activate("thread-1");
  await second.binding.activate("thread-2");
  harness.registry.dispose();
  await flush();
  equal(firstCapture.disposed, 1);
  equal(firstApply.disposed, 1);
  equal(secondCapture.disposed, 1);
  equal(secondApply.disposed, 1);
  equal(
    harness.hostCalls.filter((call) => call[0] === "documents.unbindExternal").length,
    2,
  );
  const lateCapture = createEndpoint("late-capture");
  const lateApply = createEndpoint("late-apply");
  await assert.rejects(harness.registry.bind(request, lateCapture, lateApply), /connection is closed/);
  assertions += 1;
  equal(lateCapture.disposed, 1);
  equal(lateApply.disposed, 1);
}

{
  const harness = createHarness();
  const bound = await harness.registry.bind(request, createEndpoint("capture"), createEndpoint("apply"));
  await bound.binding.activate("thread-1");
  await assert.rejects(
    harness.registry.handleCall("unknown", { bindingId: "binding-id" }, { throwIfAborted() {} }),
    /Unsupported Artifact Session/,
  );
  assertions += 1;
  await assert.rejects(
    harness.registry.handleCall("externalDocument.apply", { bindingId: "binding-id", invalid: true }, { throwIfAborted() {} }),
    /invalid apply/,
  );
  assertions += 1;
  await assert.rejects(
    harness.registry.handleCall("externalDocument.capture", {}, { throwIfAborted() {} }),
    /invalid binding/,
  );
  assertions += 1;
}

console.log(`${assertions} main external-document binding registry assertions passed`);
