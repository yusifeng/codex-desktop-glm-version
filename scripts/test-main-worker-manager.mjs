import assert from "node:assert/strict";
import fs from "node:fs";
import { createWorkerManagerClass } from "../src/main/main-app/worker/worker-manager.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

class FakeWorker {
  static instances = [];
  constructor(path, options) {
    this.path = path;
    this.options = options;
    this.handlers = new Map();
    this.messages = [];
    FakeWorker.instances.push(this);
  }
  on(event, handler) { this.handlers.set(event, handler); }
  postMessage(message) { this.messages.push(message); }
  emit(event, value) { this.handlers.get(event)?.(value); }
  unref() { this.unrefed = true; }
  terminate() { this.terminated = true; return Promise.resolve(); }
}

let portId = 0;
class FakeMessageChannel {
  constructor() {
    this.port1 = { id: `port-${++portId}` };
    this.port2 = { id: `port-${++portId}` };
  }
}

function createHarness({ resolved = { analytics: { enabled: true } }, flushGit = false } = {}) {
  const logs = [];
  const rpcSessions = [];
  const telemetry = [];
  const otel = [];
  const startupConfig = {
    getResolved: () => resolved,
    get: async () => ({ analytics: { enabled: false } }),
  };
  class SentryRpcHandler {}
  const WorkerManager = createWorkerManagerClass({
    createLogger: () => ({ warning: (...args) => logs.push(args), mt: "metrics" }),
    workerFilePath: "/app/worker.js",
    resolveMaxLogLevel: () => "debug",
    app: { isPackaged: true, getAppPath: () => "/app" },
    Worker: FakeWorker,
    MessageChannel: FakeMessageChannel,
    sentryInitOptions: { desktopTraceSampleRate: 0.25, release: "release" },
    spawnInsideWsl: () => true,
    shouldFlushGitWorker: () => flushGit,
    createRpcSession: (port, target) => {
      const session = { port, target, disposed: false, [Symbol.dispose]() { this.disposed = true; } };
      rpcSessions.push(session);
      return session;
    },
    SentryRpcHandler,
    isWorkerMainRpcCancel: (message) => message.type === "worker-main-rpc-cancel",
    isWorkerMainRpcRequest: (message) => message.type === "worker-main-rpc-request",
    parseCesPayload: (value) => ({ parsed: value }),
    sendTelemetryRequest: async (...args) => { telemetry.push(args); return { status: 200 }; },
    exportOtel: async (bytes) => { otel.push(bytes); },
  });
  return { WorkerManager, logs, otel, rpcSessions, startupConfig, telemetry };
}

{
  const harness = createHarness();
  const manager = new harness.WorkerManager("git", harness.startupConfig, "network");
  manager.setMainRpcTarget("rpc-target");
  manager.setSentryUser("auth", "user", "email", "account");
  manager.setTracingSampleRate(0.5);
  const messages = [];
  manager.addListener((message) => messages.push(message));
  const worker = manager.ensureWorker();
  equal(worker.path, "/app/worker.js");
  equal(worker.options.name, "git");
  equal(worker.options.workerData.analyticsEnabled, true);
  equal(worker.options.workerData.sentryInitOptions.desktopTraceSampleRate, 0.5);
  equal(worker.options.workerData.maxLogLevel, "debug");
  equal(worker.options.workerData.sentryRewriteFramesRoot, "/app");
  equal(worker.options.workerData.spawnInsideWsl, true);
  equal(worker.options.transferList.length, 2);
  equal(harness.rpcSessions.length, 2);
  equal(worker.messages[0], {
    type: "worker-sentry-user-update",
    authMethod: "auth",
    userId: "user",
    email: "email",
    accountId: "account",
  });
  worker.emit("message", { type: "ordinary" });
  equal(messages, [{ type: "ordinary" }]);
  assert.throws(() => manager.setMainRpcTarget("late"), /before starting/);
  assertions += 1;
  equal(manager.ensureWorker(), worker);
}

{
  const harness = createHarness({ resolved: null });
  const manager = new harness.WorkerManager("open-in", harness.startupConfig, "network");
  const worker = manager.ensureWorker();
  await new Promise((resolve) => setImmediate(resolve));
  equal(worker.options.workerData.analyticsEnabled, false);
  equal(worker.messages, [{ type: "worker-analytics-enabled-update", enabled: false }]);
}

{
  const harness = createHarness();
  const manager = new harness.WorkerManager("git", harness.startupConfig, "network");
  const worker = manager.ensureWorker();
  manager.setMainRpcHandler(async (request) => ({ echoed: request.params }));
  await manager.handleMainRpcRequest(worker, {
    type: "worker-main-rpc-request",
    workerId: "git",
    requestId: "one",
    method: "custom",
    params: { value: 1 },
  });
  equal(worker.messages.at(-1).result, { type: "ok", value: { echoed: { value: 1 } } });

  manager.setMainRpcHandler(async () => { const error = Error("failed"); error.code = "E_FAIL"; throw error; });
  await manager.handleMainRpcRequest(worker, {
    workerId: "git", requestId: "two", method: "custom", params: {},
  });
  equal(worker.messages.at(-1).result, {
    type: "error",
    error: { code: "E_FAIL", message: "failed" },
  });
}

{
  const harness = createHarness();
  const manager = new harness.WorkerManager("git", harness.startupConfig, "network");
  const worker = manager.ensureWorker();
  await manager.handleMainRpcRequest(worker, {
    workerId: "git", requestId: "none", method: "missing", params: {},
  });
  equal(worker.messages.at(-1).result.error.message, "No main RPC handler configured for worker 'git'");
  await manager.handleMainRpcRequest(worker, {
    workerId: "wrong", requestId: "wrong", method: "missing", params: {},
  });
  equal(harness.logs.at(-1)[0], "Received main RPC request for wrong worker");
}

{
  const harness = createHarness();
  const manager = new harness.WorkerManager("git", harness.startupConfig, "network");
  const worker = manager.ensureWorker();
  await manager.handleMainRpcRequest(worker, {
    workerId: "git", requestId: "telemetry", method: "ces-telemetry", params: { payload: 1 },
  });
  equal(harness.telemetry[0][0], "network");
  equal(harness.telemetry[0][1], { parsed: { payload: 1 } });
  equal(harness.telemetry[0][3], "metrics");
  await manager.handleMainRpcRequest(worker, {
    workerId: "git", requestId: "otel", method: "otel-export", params: { bytes: [1, 2] },
  });
  equal(harness.otel, [[1, 2]]);
  equal(worker.messages.at(-1).result, { type: "ok", value: {} });
}

{
  const harness = createHarness();
  const manager = new harness.WorkerManager("open-in", harness.startupConfig, "network");
  const exits = [];
  manager.addExitListener(() => exits.push(true));
  const worker = manager.ensureWorker();
  worker.emit("error", Error("worker error"));
  equal(harness.logs.at(-1)[0], "Worker error");
  worker.emit("exit", 1);
  equal(exits.length, 1);
  equal(manager.worker, null);
  equal(harness.logs.at(-1)[0], "Worker exited");
  equal(harness.rpcSessions[0].disposed, true);
}

{
  const harness = createHarness();
  const manager = new harness.WorkerManager("open-in", harness.startupConfig, "network");
  const worker = manager.ensureWorker();
  await manager.flushAndDispose();
  equal(worker.terminated, true);
  equal(manager.worker, null);
  equal(await manager.flushAndDispose(), undefined);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createWorkerManagerClass"), true);
equal(main.includes("bst = createWorkerManagerClass({"), true);
equal(main.includes("bst = class"), false);

console.log(`${assertions} main worker-manager assertions passed`);
