import assert from "node:assert/strict";
import fs from "node:fs";
import { createWorkerBusClass } from "../src/main/main-app/worker/worker-bus.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

class FakeWorkerManager {
  static instances = [];
  constructor(...args) {
    this.args = args;
    this.messages = [];
    this.listeners = [];
    this.exitListeners = [];
    FakeWorkerManager.instances.push(this);
  }
  addListener(listener) { this.listeners.push(listener); return () => {}; }
  addExitListener(listener) { this.exitListeners.push(listener); return () => {}; }
  postMessage(message) { this.messages.push(message); }
  dispose() { this.disposed = true; }
  flushAndDispose() { return "flushed"; }
  setSentryUser(...args) { this.sentry = args; }
  emitAppEvent(value) { this.appEvent = value; }
  emitGitTurnComplete(...args) { this.gitTurn = args; }
  setTracingSampleRate(value) { this.sampleRate = value; }
  setMainRpcHandler(value) { this.rpcHandler = value; }
  setMainRpcTarget(value) { this.rpcTarget = value; }
  start() { this.started = true; }
  emit(message) { for (const listener of this.listeners) listener(message); }
  exit() { for (const listener of this.exitListeners) listener(); }
}

const logs = [];
let requestNumber = 0;
const WorkerBus = createWorkerBusClass({
  WorkerManager: FakeWorkerManager,
  createLogger: () => ({ warning: (...args) => logs.push(args) }),
  createRequestId: () => `request-${++requestNumber}`,
  channelForWorker: (workerId) => `channel:${workerId}`,
  now: () => 1234,
});

function createWebContents(id) {
  const handlers = {};
  const sent = [];
  return {
    id,
    sent,
    once: (event, handler) => { handlers[event] = handler; },
    destroy: () => handlers.destroyed?.(),
    isDestroyed: () => false,
    send: (...args) => sent.push(args),
  };
}

{
  const invocations = [];
  const bus = new WorkerBus("git", {
    startupConfig: "startup",
    applicationNetwork: "network",
    onWorkerRequestSent: () => invocations.push(true),
  });
  const manager = bus.workerManager;
  equal(manager.args, ["git", "startup", "network"]);
  const origin = createWebContents("origin");
  await bus.handleMessage(origin, {
    type: "worker-request",
    workerId: "git",
    request: { id: "renderer-request" },
  });
  equal(invocations.length, 1);
  equal(manager.messages[0].request.id, "renderer-request");
  manager.emit({
    type: "worker-response",
    workerId: "git",
    response: { id: "renderer-request", method: "method", result: { type: "ok", value: 1 } },
  });
  equal(origin.sent[0][0], "channel:git");
  equal(bus.pending.size, 0);

  await bus.handleMessage(origin, { type: "worker-request-cancel", workerId: "git", id: "missing" });
  equal(manager.messages.at(-1).type, "worker-request-cancel");
  await bus.handleMessage(origin, { type: "worker-request", workerId: "wrong", request: { id: "x" } });
  equal(logs.at(-1)[0], "Received worker message for wrong worker");
}

{
  const bus = new WorkerBus("open-in", {});
  const manager = bus.workerManager;
  const result = bus.requestFromHost({ method: "read", params: { path: "/file" } });
  equal(manager.messages[0], {
    type: "worker-request",
    workerId: "open-in",
    request: { enqueuedAtMs: 1234, id: "request-1", method: "read", params: { path: "/file" } },
  });
  manager.emit({
    type: "worker-response",
    workerId: "open-in",
    response: { id: "request-1", method: "read", result: { type: "ok", value: "value" } },
  });
  equal(await result, "value");
}

{
  const bus = new WorkerBus("git", {});
  const mismatch = bus.requestFromHost({ method: "expected", params: {} });
  bus.workerManager.emit({
    type: "worker-response",
    workerId: "git",
    response: { id: "request-2", method: "other", result: { type: "ok", value: null } },
  });
  await assert.rejects(mismatch, /Mismatched worker response method/);
  assertions += 1;

  const failed = bus.requestFromHost({ method: "failed", params: {} });
  bus.workerManager.emit({
    type: "worker-response",
    workerId: "git",
    response: { id: "request-3", method: "failed", result: { type: "error", error: { message: "no" } } },
  });
  await assert.rejects(failed, /no/);
  assertions += 1;
}

{
  const controller = new AbortController();
  const bus = new WorkerBus("git", {});
  const result = bus.requestFromHost({ method: "slow", params: {}, signal: controller.signal });
  controller.abort();
  await assert.rejects(result, { name: "AbortError" });
  assertions += 1;
  equal(bus.workerManager.messages.at(-1), {
    type: "worker-request-cancel",
    workerId: "git",
    id: "request-4",
  });
  await assert.rejects(
    bus.requestFromHost({ method: "never", params: {}, signal: AbortSignal.abort() }),
    { name: "AbortError" },
  );
  assertions += 1;
}

{
  const bus = new WorkerBus("git", {});
  bus.workerManager.postMessage = () => { throw "post failed"; };
  await assert.rejects(bus.requestFromHost({ method: "method", params: {} }), /post failed/);
  assertions += 1;
  equal(bus.pendingRequestFromHost.size, 0);
}

{
  const bus = new WorkerBus("git", {
    hostOnlyEventTypes: new Set(["host-only"]),
    singleRecipientEventTypes: new Set(["single"]),
  });
  const first = createWebContents("first");
  const second = createWebContents("second");
  await bus.handleMessage(first, { type: "other", workerId: "git" });
  await bus.handleMessage(second, { type: "other", workerId: "git" });
  const hostEvents = [];
  const unsubscribe = bus.subscribeFromHost((message) => hostEvents.push(message));
  bus.workerManager.emit({ workerId: "git", type: "worker-event", event: { type: "broadcast" } });
  equal(first.sent.length, 1);
  equal(second.sent.length, 1);
  equal(hostEvents.length, 1);
  bus.workerManager.emit({ workerId: "git", type: "worker-event", event: { type: "host-only" } });
  equal(first.sent.length, 1);
  bus.workerManager.emit({ workerId: "git", type: "worker-event", event: { type: "single" } });
  equal(first.sent.length, 2);
  equal(second.sent.length, 1);
  unsubscribe();

  await bus.handleMessage(first, {
    type: "worker-request",
    workerId: "git",
    request: { id: "pending" },
  });
  first.destroy();
  equal(bus.workerManager.messages.at(-1).type, "worker-request-cancel");
  equal(bus.knownWebContents.has(first), false);
}

{
  const bus = new WorkerBus("git", {});
  const pending = bus.requestFromHost({ method: "pending", params: {} });
  bus.workerManager.exit();
  await assert.rejects(pending, /Worker exited/);
  assertions += 1;
  equal(bus.pendingRequestFromHost.size, 0);
  equal(bus.flushAndDisposeWorker(), "flushed");
  bus.setSentryUser("auth", "user");
  bus.emitAppEvent("event");
  bus.emitGitTurnComplete(["cwd"], "host");
  bus.setTracingSampleRate(0.5);
  bus.setMainRpcHandler("handler");
  bus.setMainRpcTarget("target");
  bus.startWorker();
  equal(bus.workerManager.sentry, ["auth", "user"]);
  equal(bus.workerManager.started, true);
  bus.dispose();
  equal(bus.workerManager.disposed, true);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createWorkerBusClass"), true);
equal(main.includes("H9 = createWorkerBusClass({"), true);
equal(main.includes("H9 = class"), false);

console.log(`${assertions} main worker-bus assertions passed`);
