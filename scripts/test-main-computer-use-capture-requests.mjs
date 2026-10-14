#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "capture-requests-"));
const output = path.join(temporaryDirectory, "capture-requests.mjs");

await build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/computer-use/capture-requests.ts")],
  format: "esm",
  logLevel: "silent",
  outfile: output,
  platform: "node",
  plugins: [
    {
      name: "capture-request-test-dependencies",
      setup(build) {
        build.onResolve({ filter: /^@chunk\/(logger|shared)$/ }, (args) => ({
          namespace: "capture-test",
          path: args.path,
        }));
        build.onLoad({ filter: /.*/, namespace: "capture-test" }, (args) =>
          args.path.endsWith("logger")
            ? {
                contents: `export const memoizedTaggedLogger = () => () => ({
                  debug: (message, context) => globalThis.__captureLogs.push(["debug", message, context]),
                  warning: (message, context) => globalThis.__captureLogs.push(["warning", message, context]),
                });`,
                loader: "js",
              }
            : {
                contents: `export const gr = error => error?.permissionState ?? "failed";
                  export const hr = error => error?.classification ?? null;`,
                loader: "js",
              },
        );
      },
    },
  ],
});

globalThis.__captureLogs = [];
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;
const timers = [];
globalThis.setTimeout = (callback, delay) => {
  const timer = {
    callback,
    cleared: false,
    delay,
    unrefCalled: false,
    unref() {
      this.unrefCalled = true;
      return this;
    },
  };
  timers.push(timer);
  return timer;
};
globalThis.clearTimeout = (timer) => {
  if (timer != null) timer.cleared = true;
};

const capture = await import(pathToFileURL(output));
let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const ok = (value, message) => {
  assert.ok(value, message);
  assertions += 1;
};
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
};

function createOrigin(id = 1) {
  const listeners = new Map();
  return {
    destroyed: false,
    id,
    emit(event) {
      const listener = listeners.get(event);
      listeners.delete(event);
      listener?.();
    },
    isDestroyed() {
      return this.destroyed;
    },
    listenerCount(event) {
      return listeners.has(event) ? 1 : 0;
    },
    once(event, listener) {
      listeners.set(event, listener);
    },
    removeListener(event, listener) {
      if (listeners.get(event) === listener) listeners.delete(event);
    },
  };
}

function createMacHarness(requestComputerUseCaptureWorker) {
  const messages = [];
  const subscriptions = [];
  const origin = createOrigin();
  const args = {
    animationTarget: { x: 1 },
    bundleIdentifier: "com.example.App",
    origin,
    requestComputerUseCaptureWorker,
    requestId: "request-1",
    subscribeComputerUseCaptureWorkerEvent(event, handler) {
      const subscription = { event, handler, unsubscribed: false };
      subscriptions.push(subscription);
      return () => {
        subscription.unsubscribed = true;
      };
    },
    windowManager: {
      sendInlineMessageForView(target, message) {
        messages.push({ message, target });
      },
    },
  };
  return { args, messages, origin, subscriptions };
}

try {
  {
    const h = createMacHarness(async () => ({ result: "started" }));
    equal(await capture.startMacCapture({ ...h.args, bundleIdentifier: "" }), null);
    equal(await capture.startMacCapture({ ...h.args, requestId: "  " }), null);
    equal(h.subscriptions.length, 0);
  }

  {
    const workerCalls = [];
    const h = createMacHarness(async (request) => {
      workerCalls.push(request);
      return { result: "started" };
    });
    equal(await capture.startMacCapture(h.args), { result: "started" });
    equal(workerCalls[0].method, "start");
    equal(workerCalls[0].params, {
      animationTarget: { x: 1 },
      bundleIdentifier: "com.example.App",
      permissionRequestId: "request-1",
      requestId: "request-1",
    });
    equal(timers.at(-1).delay, capture.CAPTURE_TIMEOUT_MS);
    equal(timers.at(-1).unrefCalled, true);
    equal(await capture.requestFinalCaptureUpdate({
      requestComputerUseCaptureUpdate: async ({ params, signal }) => {
        equal(params, { requestId: "request-1" });
        equal(signal.aborted, false);
      },
      requestId: "request-1",
    }), true);
    h.subscriptions[0].handler({ requestId: "other", update: { type: "completed" } });
    equal(h.messages.length, 0);
    h.subscriptions[0].handler({ requestId: "request-1", update: { type: "metadata", app: "A" } });
    h.subscriptions[0].handler({ requestId: "request-1", update: { type: "completed" } });
    equal(h.messages.map(({ message }) => message.update.type), ["metadata", "completed"]);
    equal(h.subscriptions[0].unsubscribed, true);
    equal(workerCalls[0].signal.aborted, true);
    equal(await capture.requestFinalCaptureUpdate({ requestComputerUseCaptureUpdate: async () => {}, requestId: "request-1" }), false);
  }

  {
    const pending = deferred();
    const first = createMacHarness(() => pending.promise);
    first.args.requestId = "duplicate";
    const start = capture.startMacCapture(first.args);
    const second = createMacHarness(async () => ({ result: "started" }));
    second.args.requestId = "duplicate";
    equal(await capture.startMacCapture(second.args), null);
    ok(globalThis.__captureLogs.some(([, message]) => message === "Rejected duplicate Codex Computer Use capture request"));
    pending.resolve({ result: "appshot_permissions_abandoned" });
    equal(await start, { result: "appshot_permissions_abandoned" });
    equal(first.subscriptions[0].unsubscribed, true);
  }

  {
    let attempts = 0;
    const h = createMacHarness(async () => {
      attempts += 1;
      if (attempts === 1) throw { permissionState: "pending" };
      return { result: "started" };
    });
    h.args.requestId = "pending-retry";
    equal(await capture.startMacCapture(h.args), { result: "started" });
    equal(attempts, 2);
    h.subscriptions[0].handler({ requestId: "pending-retry", update: { type: "failed" } });
  }

  {
    const h = createMacHarness(async () => {
      throw { classification: { source: "native", code: "denied" } };
    });
    h.args.requestId = "classified-failure";
    equal(await capture.startMacCapture(h.args), null);
    equal(h.messages[0].message.update, {
      type: "failed",
      failureReason: "start_request_failed:native:denied",
    });
    equal(h.subscriptions[0].unsubscribed, true);
  }

  {
    const h = createMacHarness(async () => ({ result: "started" }));
    h.args.requestId = "timeout";
    await capture.startMacCapture(h.args);
    const timer = timers.at(-1);
    timer.callback();
    equal(h.messages[0].message.update.failureReason, "capture_timed_out");
    equal(h.subscriptions[0].unsubscribed, true);
  }

  {
    const h = createMacHarness(async () => ({ result: "started" }));
    h.args.requestId = "final-failure";
    await capture.startMacCapture(h.args);
    equal(await capture.requestFinalCaptureUpdate({
      requestComputerUseCaptureUpdate: async () => { throw Error("final failed"); },
      requestId: "final-failure",
    }), false);
    equal(h.messages[0].message.update.failureReason, "final_update_request_failed");
  }

  {
    const origin = createOrigin(9);
    const external = new AbortController();
    const bridgeStarted = deferred();
    let bridgeArgs;
    const messages = [];
    const start = capture.startWindowsCapture({
      animationTarget: { frame: 1 },
      bundleIdentifier: "process:test.exe",
      origin,
      requestId: "windows-abort",
      signal: external.signal,
      soundEnabled: true,
      windowManager: { sendInlineMessageForView: (target, message) => messages.push({ target, message }) },
      windowsCaptureNativeBridge: {
        startCapture(args) {
          bridgeArgs = args;
          return bridgeStarted.promise;
        },
      },
    });
    equal(origin.listenerCount("destroyed"), 1);
    external.abort();
    equal(bridgeArgs.signal.aborted, true);
    equal(origin.listenerCount("destroyed"), 0);
    bridgeStarted.resolve({ result: "started" });
    equal(await start, null);
    equal(messages.length, 0);
  }

  {
    const origin = createOrigin(10);
    const bridgeStarted = deferred();
    let bridgeArgs;
    const start = capture.startWindowsCapture({
      animationTarget: {},
      bundleIdentifier: "process:test.exe",
      origin,
      requestId: "origin-destroyed",
      soundEnabled: false,
      windowManager: { sendInlineMessageForView() {} },
      windowsCaptureNativeBridge: { startCapture(args) { bridgeArgs = args; return bridgeStarted.promise; } },
    });
    origin.destroyed = true;
    origin.emit("destroyed");
    equal(bridgeArgs.signal.aborted, true);
    bridgeStarted.resolve({ result: "started" });
    equal(await start, null);
  }

  {
    const origin = createOrigin(11);
    const messages = [];
    const result = await capture.startWindowsCapture({
      animationTarget: {},
      bundleIdentifier: "process:test.exe",
      origin,
      requestId: "windows-complete-before-start",
      soundEnabled: false,
      windowManager: { sendInlineMessageForView: (target, message) => messages.push({ target, message }) },
      windowsCaptureNativeBridge: {
        async startCapture(args) {
          args.emitUpdate({ type: "metadata" });
          args.emitUpdate({ type: "screenshot" });
          args.emitUpdate({ type: "completed" });
          return { result: "started" };
        },
      },
    });
    equal(result, null);
    equal(messages.map(({ message }) => message.update.type), ["metadata", "screenshot", "completed"]);
    equal(origin.listenerCount("destroyed"), 0);
  }

  {
    const origin = createOrigin(12);
    const messages = [];
    equal(await capture.startWindowsCapture({
      animationTarget: {},
      bundleIdentifier: "process:test.exe",
      origin,
      requestId: "windows-throw",
      soundEnabled: false,
      windowManager: { sendInlineMessageForView: (target, message) => messages.push({ target, message }) },
      windowsCaptureNativeBridge: { async startCapture() { throw Error("native failed"); } },
    }), null);
    equal(messages[0].message.update.failureReason, "start_request_failed");
    equal(origin.listenerCount("destroyed"), 0);
  }

  const main = await fs.readFile(
    path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"),
    "utf8",
  );
  assertions += 7;
  assert.match(main, /require\("\.\/main-app\/computer-use\/capture-requests\.js"\)/);
  assert.match(main, /startWindowsCapture\(\{/);
  assert.match(main, /startMacCapture\(\{/);
  assert.match(main, /requestFinalCaptureUpdate\(\{/);
  assert.doesNotMatch(main, /var uM = new Map\(\)/);
  assert.doesNotMatch(main, /function pM\(/);
  assert.doesNotMatch(main, /function hM\(/);
} finally {
  globalThis.setTimeout = originalSetTimeout;
  globalThis.clearTimeout = originalClearTimeout;
  delete globalThis.__captureLogs;
}

console.log(`${assertions} main computer-use capture request assertions passed`);

