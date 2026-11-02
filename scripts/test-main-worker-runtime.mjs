import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/main/main-app/worker/worker-runtime.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const { createWorkerRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

class AppEventPublisher {
  handlers = new Set();
  subscribe(handler) {
    this.handlers.add(handler);
    return { dispose: () => this.handlers.delete(handler) };
  }
  emit(type, at = Date.now()) {
    for (const handler of this.handlers) handler({ type, at });
  }
}

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const flush = () => new Promise((resolve) => setImmediate(resolve));

class FakeWorkerBus {
  static instances = [];
  static requestHandler = async (_bus, request) => ({ request });
  constructor(id, options) {
    this.id = id;
    this.options = options;
    this.hostListeners = new Set();
    this.exitListeners = new Set();
    this.calls = [];
    FakeWorkerBus.instances.push(this);
  }
  setMainRpcHandler(value) { this.mainRpcHandler = value; }
  setMainRpcTarget(value) { this.mainRpcTarget = value; }
  setSentryUser(...args) { this.calls.push(["sentry", ...args]); }
  setTracingSampleRate(value) { this.calls.push(["tracing", value]); }
  emitGitTurnComplete(...args) { this.calls.push(["git-turn", ...args]); }
  emitAppEvent(value) { this.calls.push(["app-event", value]); }
  startWorker() { this.calls.push(["start"]); }
  requestFromHost(request) {
    this.calls.push(["request", request]);
    this.options.onWorkerRequestSent?.();
    return FakeWorkerBus.requestHandler(this, request);
  }
  handleMessage(...args) { this.calls.push(["message", ...args]); }
  subscribeFromHost(listener) { this.hostListeners.add(listener); return () => this.hostListeners.delete(listener); }
  subscribeWorkerExit(listener) { this.exitListeners.add(listener); return () => this.exitListeners.delete(listener); }
  emitHost(message) { for (const listener of this.hostListeners) listener(message); }
  emitExit() { for (const listener of this.exitListeners) listener(); }
  flushAndDisposeWorker() { this.calls.push(["flush"]); return "flushed"; }
  dispose() { this.calls.push(["dispose"]); }
}

function createHarness() {
  FakeWorkerBus.instances = [];
  FakeWorkerBus.requestHandler = async (_bus, request) => ({ request });
  const disposableValues = [];
  const ipcHandlers = new Map();
  const sampler = { count: 0, recordInvocation() { this.count += 1; } };
  const runtime = createWorkerRuntime({
    disposables: { add: (value) => disposableValues.push(value) },
    isTrustedIpcEvent: (event) => event.trusted,
    startupConfig: "startup",
    applicationNetwork: "network",
    AppEventPublisher,
    createGitInvocationSampler: () => sampler,
    WorkerBus: FakeWorkerBus,
    createShortcutLinkReader: (read) => (path) => read(path),
    readShortcutLink: (path) => ({ path }),
    ipcMain: { handle: (channel, handler) => ipcHandlers.set(channel, handler) },
    workerChannel: (id) => `worker:${id}`,
    registeredWorkerIds: ["git", "other"],
    localHostId: "local",
    isWorkerStartResult: (value) => value?.result === "started",
    isWorkerEventType: (event, type) => event.type === type,
    isWorkerNotificationType: (event, type) => event.type === type,
  });
  return { disposableValues, ipcHandlers, runtime, sampler };
}

{
  const harness = createHarness();
  equal(FakeWorkerBus.instances.map((bus) => bus.id), ["git", "open-in"]);
  equal(FakeWorkerBus.instances[0].options.hostOnlyEventTypes.has("create-worktree-path"), true);
  equal(FakeWorkerBus.instances[0].options.singleRecipientEventTypes.has("git-performance-operation"), true);
  equal(await FakeWorkerBus.instances[1].mainRpcHandler({
    method: "read-shortcut-link",
    params: { path: "/shortcut" },
  }), { path: "/shortcut" });
  await assert.rejects(
    FakeWorkerBus.instances[1].mainRpcHandler({ method: "ces-telemetry", params: {} }),
    /Unsupported open-in/,
  );
  assertions += 1;

  equal(await harness.runtime.requestGitWorker({ method: "git" }), { request: { method: "git" } });
  equal(harness.sampler.count, 1);
  equal(await harness.runtime.requestOpenInWorker({ method: "open" }), { request: { method: "open" } });
  harness.runtime.setGitWorkerTracingSampleRate(0.5);
  harness.runtime.completeLocalGitTurn(["/repo"]);
  equal(FakeWorkerBus.instances[0].calls.slice(-2), [
    ["tracing", 0.5],
    ["git-turn", ["/repo"], "local"],
  ]);
  equal(harness.runtime.flushAndDisposeGitWorker(), "flushed");
}

{
  const harness = createHarness();
  harness.runtime.registerWorkerBusMessageHandlers();
  equal([...harness.ipcHandlers.keys()], ["worker:git", "worker:other"]);
  equal(FakeWorkerBus.instances.map((bus) => bus.id), ["git", "open-in", "other"]);
  const git = FakeWorkerBus.instances[0];
  await harness.ipcHandlers.get("worker:git")({ trusted: false, sender: "bad" }, "ignored");
  equal(git.calls.filter(([name]) => name === "message"), []);
  await harness.ipcHandlers.get("worker:git")({ trusted: true, sender: "renderer" }, "message");
  equal(git.calls.at(-1), ["message", "renderer", "message"]);
  equal(harness.disposableValues.includes(git), true);

  harness.runtime.updateWorkerSentryUser("auth", "user", "email", "account");
  equal(git.calls.at(-1), ["sentry", "auth", "user", "email", "account"]);
  harness.runtime.appEvent.emit("foreground", 100);
  equal(git.calls.at(-1), ["app-event", { type: "foreground", at: 100 }]);
}

{
  const harness = createHarness();
  harness.runtime.setComputerUseWorkerMainRpcHandler("rpc-handler");
  harness.runtime.updateWorkerSentryUser("auth", "user", "email", "account");
  FakeWorkerBus.requestHandler = async (bus, request) => {
    if (bus.id === "computer-use" && request.method === "start") return { result: "not-started" };
    return {};
  };
  equal(await harness.runtime.requestComputerUseWorker({
    method: "start",
    params: { requestId: "request" },
  }), { result: "not-started" });
  const worker = FakeWorkerBus.instances[2];
  equal(worker.mainRpcHandler, "rpc-handler");
  equal(worker.calls[0], ["sentry", "auth", "user", "email", "account"]);
  equal(worker.calls.some(([name]) => name === "dispose"), true);
}

{
  const harness = createHarness();
  let resolveWatch;
  FakeWorkerBus.requestHandler = async (bus, request) => {
    if (request.method === "start") return { result: "started" };
    if (request.method === "watchUpdates") {
      return new Promise((resolve) => { resolveWatch = resolve; });
    }
    return {};
  };
  await harness.runtime.requestComputerUseWorker({
    method: "start",
    params: { requestId: "capture" },
  });
  await flush();
  const watcher = FakeWorkerBus.instances[3];
  equal(watcher.id, "computer-use");
  equal(watcher.calls.some(([, request]) => request?.method === "watchUpdates"), true);
  const events = [];
  const unsubscribe = harness.runtime.subscribeComputerUseCaptureWorkerEvent(
    "update",
    (event) => events.push(event),
  );
  watcher.emitHost({
    type: "worker-event",
    event: {
      type: "update",
      requestId: "capture",
      update: { type: "screenshot", transitionSnapshotDataURL: "data:image/png;base64,x" },
    },
  });
  equal(events.length, 1);
  equal(watcher.calls.at(-1), ["dispose"]);
  unsubscribe();
  resolveWatch?.({});
}

{
  const harness = createHarness();
  let rejectWatch;
  FakeWorkerBus.requestHandler = async (_bus, request) => {
    if (request.method === "watchUpdates") {
      return new Promise((_resolve, reject) => { rejectWatch = reject; });
    }
    return {};
  };
  const failures = [];
  harness.runtime.subscribeComputerUseCaptureWorkerEvent("update", (event) => failures.push(event));
  const watch = harness.runtime.requestComputerUseCaptureUpdate({
    params: { requestId: "failed" },
  });
  await flush();
  rejectWatch(Error("failed"));
  await assert.rejects(watch, /failed/);
  assertions += 1;
  equal(failures, [{
    type: "update",
    requestId: "failed",
    update: { type: "failed", failureReason: "update_watch_failed" },
  }]);
}

{
  const harness = createHarness();
  const gitEvents = [];
  harness.runtime.subscribeGitWorkerEvent("notification", (event) => gitEvents.push(event));
  FakeWorkerBus.instances[0].emitHost({
    type: "worker-event",
    event: { type: "notification", value: 1 },
  });
  equal(gitEvents, [{ type: "notification", value: 1 }]);
  harness.runtime.setGitWorkerMainRpcTarget("target");
  equal(FakeWorkerBus.instances[0].mainRpcTarget, "target");
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createWorkerRuntime"), true);
equal(main.includes("var xst = createWorkerRuntimeFactory({"), true);
equal(main.includes("let i = new AppEventPublisher()"), false);

console.log(`${assertions} main worker-runtime assertions passed`);
