import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [
    path.join(root, "src/main/main-app/remote-artifact/artifact-session-host-service.ts"),
  ],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { ArtifactSessionHostService } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const rejects = async (promise, pattern) => {
  await assert.rejects(promise, pattern);
  assertions += 1;
};
const flush = async () => {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
};

function createHarness(overrides = {}) {
  const calls = [];
  let info = { socketPath: "socket-1", token: "token-1" };
  let disconnect;
  let event;
  let hostCall;
  let connectionInfoListener;
  let connectionEpoch = 4;
  const responses = new Map([
    ["host.ping", { capabilities: ["native-snapshot-v1", "external-documents-v1"] }],
    [
      "outputs.publishNativeSnapshot",
      { artifactRef: "artifact-1", fileName: "workbook.xlsx", path: "/tmp/workbook.xlsx" },
    ],
    ["documents.resolveArtifactRef", { kind: "spreadsheet" }],
  ]);
  const client = {
    get connectionEpoch() {
      return connectionEpoch;
    },
    async connect() {
      calls.push(["connect"]);
    },
    async close() {
      calls.push(["close"]);
      if (overrides.closeError) throw overrides.closeError;
    },
    async call(method, payload) {
      calls.push(["call", method, payload]);
      const response = responses.get(method);
      if (response instanceof Error) throw response;
      return response ?? { ok: true };
    },
    onDisconnect(listener) {
      calls.push(["onDisconnect", typeof listener]);
      disconnect = listener;
    },
    onEvent(listener) {
      calls.push(["onEvent", typeof listener]);
      event = listener;
    },
    onHostCall(listener) {
      calls.push(["onHostCall", typeof listener]);
      hostCall = listener;
    },
  };
  let subscriptionConnection;
  const subscriptionManager = {
    async open(request) {
      calls.push(["subscription.open", request]);
      const activeClient = await subscriptionConnection.connect();
      return { activeClient, record: request };
    },
    handleEvent(value) {
      calls.push(["subscription.event", value]);
    },
    async handleHostCall(activeClient, method, request) {
      calls.push(["subscription.hostCall", activeClient, method, request]);
      return { subscription: true };
    },
    drain() {
      calls.push(["subscription.drain"]);
      return overrides.openedSubscriptions ?? [];
    },
    async closeHostSubscription(activeClient, subscriptionId) {
      calls.push(["subscription.close", activeClient, subscriptionId]);
    },
  };
  let externalConnect;
  let externalCallHost;
  const externalDocuments = {
    async bind(request) {
      calls.push(["external.bind", request]);
      const callHost = await externalConnect(request.kind);
      if (callHost == null) return { status: "unsupported" };
      externalCallHost = callHost;
      return { status: "bound", result: await callHost("documents.bindExternal", request) };
    },
    async handleCall(method, request) {
      calls.push(["external.hostCall", method, request]);
      return { external: true };
    },
    dispose() {
      calls.push(["external.dispose"]);
    },
  };
  let nativeOperations;
  const nativeFiles = {
    async getTargets(request) {
      return nativeOperations.resolveArtifactKind(request);
    },
    async performFileAction(request) {
      return nativeOperations.publishNativeSnapshot(request);
    },
    async readSnapshot(request) {
      return nativeOperations.publishNativeSnapshot(request);
    },
  };
  const dependencies = {
    compareConnectionInfo(left, right) {
      return left.socketPath === right.socketPath && left.token === right.token;
    },
    async createClient(value) {
      calls.push(["createClient", value]);
      if (overrides.createClientGate) await overrides.createClientGate;
      return client;
    },
    createExternalDocuments(connect) {
      externalConnect = connect;
      return externalDocuments;
    },
    createNativeFiles(operations) {
      nativeOperations = operations;
      return nativeFiles;
    },
    createSubscriptions(connection) {
      subscriptionConnection = connection;
      return subscriptionManager;
    },
    getViewerConnectionInfo() {
      return info;
    },
    isErrorCode(error, code) {
      return error?.code === code;
    },
    logFailure(name, error) {
      calls.push(["log", name, error?.message]);
    },
    parseArtifactKind(value) {
      if (value.kind !== "presentation" && value.kind !== "spreadsheet") throw Error("bad kind");
      return value.kind;
    },
    parseCapabilities(value) {
      return value.capabilities;
    },
    parseNativeSnapshot(value, artifactRef) {
      if (value.artifactRef !== artifactRef) throw Error("wrong artifact");
      return { fileName: value.fileName, path: value.path };
    },
    requestConnectionReconciliation() {
      calls.push(["reconcile"]);
    },
    subscribeToConnectionInfo(listener) {
      connectionInfoListener = listener;
      return () => calls.push(["unsubscribeConnectionInfo"]);
    },
  };
  const service = new ArtifactSessionHostService(dependencies);
  return {
    calls,
    client,
    callExternalHost(method, request) {
      return externalCallHost?.(method, request);
    },
    dependencies,
    emitDisconnect(epoch = connectionEpoch) {
      disconnect?.(epoch);
    },
    emitEvent(value) {
      event?.(value);
    },
    emitHostCall(method, request = {}, signal = {}) {
      return hostCall?.(method, request, signal);
    },
    responses,
    service,
    setConnectionEpoch(value) {
      connectionEpoch = value;
    },
    setInfo(value) {
      info = value;
    },
    subscriptionConnection: () => subscriptionConnection,
    updateConnectionInfo(value) {
      return connectionInfoListener?.(value);
    },
  };
}

{
  const harness = createHarness();
  const [first, second] = await Promise.all([
    harness.service.open({ artifactRef: "artifact-1" }),
    harness.subscriptionConnection().connect(),
  ]);
  equal(first.record, { artifactRef: "artifact-1" });
  equal(second, harness.client);
  equal(harness.calls.filter(([name]) => name === "createClient").length, 1);
  equal(harness.subscriptionConnection().getActiveClient(), harness.client);
  equal(harness.subscriptionConnection().isClientActive(harness.client), true);

  harness.emitEvent({ subscriptionId: "subscription-1" });
  equal(harness.calls.at(-1), ["subscription.event", { subscriptionId: "subscription-1" }]);
  equal(await harness.emitHostCall("viewer.flush", { subscriptionId: "subscription-1" }), {
    subscription: true,
  });
  equal(
    await harness.emitHostCall("externalDocument.capture", { bindingId: "binding-1" }),
    { external: true },
  );
}

{
  const harness = createHarness();
  equal(await harness.service.supportsNativeOpen(), true);
  equal(await harness.service.getNativeOpenTargets({ artifactRef: "artifact-1" }), {
    status: "ready",
    kind: "spreadsheet",
  });
  equal(await harness.service.readNativeSnapshot({ artifactRef: "artifact-1", threadId: "t1" }), {
    status: "ready",
    fileName: "workbook.xlsx",
    path: "/tmp/workbook.xlsx",
  });
  equal(
    harness.calls.find(([name, method]) => name === "call" && method === "outputs.publishNativeSnapshot"),
    [
      "call",
      "outputs.publishNativeSnapshot",
      { artifactRef: "artifact-1", threadId: "t1" },
    ],
  );

  harness.responses.set("documents.resolveArtifactRef", { kind: "unknown" });
  equal(await harness.service.getNativeOpenTargets({ artifactRef: "artifact-1" }), {
    status: "failed",
    reason: "target-discovery-failed",
  });
  equal(harness.calls.some(([name, event]) => name === "log" && event === "artifact_kind_invalid"), true);

  const flushError = Object.assign(Error("flush failed"), { code: "VIEWER_FLUSH_FAILED" });
  harness.responses.set("outputs.publishNativeSnapshot", flushError);
  equal(await harness.service.readNativeSnapshot({ artifactRef: "artifact-1" }), {
    status: "failed",
    reason: "sync-failed",
  });
}

{
  const harness = createHarness();
  equal(
    await harness.service.bindExternalDocument({ kind: "document", documentId: "doc-1" }),
    { status: "bound", result: { ok: true } },
  );
  equal(
    harness.calls.find(([name, method]) => name === "call" && method === "documents.bindExternal"),
    ["call", "documents.bindExternal", { kind: "document", documentId: "doc-1" }],
  );
  harness.setConnectionEpoch(5);
  await rejects(
    harness.callExternalHost("documents.captureExternal", { documentId: "doc-1" }),
    /connection changed/,
  );
  equal(
    harness.calls.some(
      ([name, event]) => name === "log" && event === "external_document_binding_failed",
    ),
    false,
  );
}

{
  const harness = createHarness();
  await harness.service.supportsNativeOpen();
  harness.emitDisconnect(3);
  equal(harness.calls.some(([name]) => name === "reconcile"), false);
  harness.emitDisconnect(4);
  await flush();
  equal(harness.calls.some(([name]) => name === "reconcile"), true);
  equal(harness.calls.filter(([name]) => name === "external.dispose").length, 1);
  equal(harness.calls.filter(([name]) => name === "subscription.drain").length, 1);
  equal(harness.calls.filter(([name]) => name === "close").length, 1);
  equal(await harness.service.supportsNativeOpen(), false);
  equal(await harness.service.getNativeOpenTargets({}), {
    status: "failed",
    reason: "session-unavailable",
  });
  await rejects(harness.updateConnectionInfo({ socketPath: "socket-2" }), /viewer is unavailable/);
}

{
  const openedClient = { name: "opened-client" };
  const harness = createHarness({
    closeError: Error("close failed"),
    openedSubscriptions: [{ client: openedClient, subscriptionId: "subscription-1" }],
  });
  await harness.service.open({ artifactRef: "artifact-1" });
  const firstDispose = harness.service.dispose();
  const secondDispose = harness.service.dispose();
  equal(firstDispose, secondDispose);
  await firstDispose;
  equal(harness.calls.filter(([name]) => name === "unsubscribeConnectionInfo").length, 1);
  equal(harness.calls.filter(([name]) => name === "external.dispose").length, 1);
  equal(
    harness.calls.find(([name]) => name === "subscription.close"),
    ["subscription.close", openedClient, "subscription-1"],
  );
  equal(harness.calls.some(([name, event]) => name === "log" && event === "client_close_failed"), true);
  equal(harness.subscriptionConnection().getActiveClient(), undefined);
  equal(harness.subscriptionConnection().isClientActive(harness.client), false);
  await rejects(harness.service.open({}), /viewer is unavailable/);
}

{
  let release;
  const createClientGate = new Promise((resolve) => {
    release = resolve;
  });
  const harness = createHarness({ createClientGate });
  const pending = harness.service.open({ artifactRef: "artifact-1" });
  await flush();
  await harness.service.dispose();
  release();
  await rejects(pending, /viewer is unavailable/);
  await flush();
  equal(harness.calls.filter(([name]) => name === "close").length, 1);
}

console.log(`${assertions} main artifact session host service assertions passed`);
