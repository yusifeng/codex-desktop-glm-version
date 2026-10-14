import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [
    path.join(root, "src/main/main-app/startup/startup-renderer-coordinator.ts"),
  ],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { StartupRendererCoordinator } = await import(
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
  for (let index = 0; index < 6; index += 1) await Promise.resolve();
};

function deferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function createEmitter(id) {
  const listeners = new Map();
  return {
    id,
    emit(event) {
      const listener = listeners.get(event);
      listeners.delete(event);
      listener?.();
    },
    listenerCount(event) {
      return listeners.has(event) ? 1 : 0;
    },
    off(event, listener) {
      if (listeners.get(event) === listener) listeners.delete(event);
    },
    once(event, listener) {
      listeners.set(event, listener);
    },
  };
}

function createHarness({ includeStartupTiming = false, startupReady = null } = {}) {
  const origin = createEmitter(10);
  const reached = [];
  const reachedSet = new Set();
  const phaseListeners = new Set();
  const primaryListeners = new Set();
  let primary = { webContents: { id: 10 } };
  let sentryEnabled = true;
  const startupPhases = {
    hasReached(phase) {
      return reachedSet.has(phase);
    },
    reach(phase) {
      reached.push(phase);
      reachedSet.add(phase);
    },
    subscribe(listener) {
      phaseListeners.add(listener);
      return () => phaseListeners.delete(listener);
    },
  };
  const windowManager = {
    getPrimaryWindow() {
      return primary;
    },
    subscribePrimaryWindowChanges(listener) {
      primaryListeners.add(listener);
      return () => primaryListeners.delete(listener);
    },
  };
  const coordinator = new StartupRendererCoordinator({
    includeStartupTiming,
    isSentryEnabled: () => sentryEnabled,
    origin,
    startupPhases,
    startupReady,
    windowManager,
  });
  return {
    coordinator,
    origin,
    phaseListeners,
    primaryListeners,
    reached,
    reachHost() {
      reachedSet.add("host_ready");
      for (const listener of [...phaseListeners]) listener();
    },
    replacePrimary(id = 99) {
      primary = { webContents: { id } };
      for (const listener of [...primaryListeners]) listener(primary);
    },
    restorePrimary() {
      primary = { webContents: { id: 10 } };
    },
    setSentryEnabled(value) {
      sentryEnabled = value;
    },
  };
}

{
  const harness = createHarness();
  equal(await harness.coordinator.whenReady(), undefined);
  equal(harness.primaryListeners.size, 0);
  equal(harness.origin.listenerCount("destroyed"), 0);
  equal(harness.coordinator.isSentryEnabled(), true);
  harness.setSentryEnabled(false);
  equal(harness.coordinator.isSentryEnabled(), false);
}

{
  const ready = deferred();
  const harness = createHarness({ includeStartupTiming: true, startupReady: ready.promise });
  const waiting = harness.coordinator.whenReady();
  equal(harness.primaryListeners.size, 1);
  equal(harness.origin.listenerCount("destroyed"), 1);
  ready.resolve({ startupMs: 123 });
  equal(await waiting, { startupMs: 123 });
  equal(harness.primaryListeners.size, 0);
  equal(harness.origin.listenerCount("destroyed"), 0);
}

for (const replacement of ["primary", "destroyed"]) {
  const ready = deferred();
  const harness = createHarness({ startupReady: ready.promise });
  const waiting = harness.coordinator.whenReady();
  if (replacement === "primary") harness.replacePrimary();
  else harness.origin.emit("destroyed");
  await assert.rejects(waiting, (error) => error.name === "AbortError");
  assertions += 1;
  equal(harness.primaryListeners.size, 0);
  equal(harness.origin.listenerCount("destroyed"), 0);
}

{
  const ready = deferred();
  const harness = createHarness({ startupReady: ready.promise });
  harness.replacePrimary();
  ready.resolve("done");
  await flush();
  await assert.rejects(harness.coordinator.whenReady(), (error) => error.name === "AbortError");
  assertions += 1;
}

{
  const ready = deferred();
  const harness = createHarness({ startupReady: ready.promise });
  harness.coordinator.reach("unknown");
  harness.coordinator.reach("first_content_visible");
  harness.coordinator.reach("background_ready");
  equal(harness.reached, []);
  equal(harness.phaseListeners.size, 0);

  harness.coordinator.reach("renderer_ready");
  harness.coordinator.reach("renderer_ready");
  harness.coordinator.reach("first_content_visible");
  harness.coordinator.reach("background_ready");
  equal(harness.reached, []);
  equal(harness.phaseListeners.size, 1);
  equal(harness.primaryListeners.size, 1);
  equal(harness.origin.listenerCount("destroyed"), 1);

  ready.resolve({ startupMs: 10 });
  await flush();
  equal(harness.reached, []);
  equal(harness.phaseListeners.size, 1);
  harness.reachHost();
  equal(harness.reached, [
    "window_created",
    "renderer_ready",
    "first_content_visible",
    "background_ready",
  ]);
  equal(harness.phaseListeners.size, 0);
  equal(harness.primaryListeners.size, 0);
  equal(harness.origin.listenerCount("destroyed"), 0);
}

{
  const ready = deferred();
  const harness = createHarness({ startupReady: ready.promise });
  harness.reachHost();
  harness.coordinator.reach("renderer_ready");
  equal(harness.reached, []);
  ready.resolve();
  await flush();
  equal(harness.reached, ["window_created", "renderer_ready"]);
}

{
  const harness = createHarness();
  harness.reachHost();
  harness.coordinator.reach("background_ready");
  equal(harness.reached, []);
  harness.coordinator.reach("first_content_visible");
  equal(harness.reached, []);
  harness.coordinator.reach("renderer_ready");
  equal(harness.reached, ["window_created", "renderer_ready"]);
  harness.coordinator.reach("background_ready");
  equal(harness.reached, ["window_created", "renderer_ready"]);
  harness.coordinator.reach("first_content_visible");
  harness.coordinator.reach("background_ready");
  equal(harness.reached, [
    "window_created",
    "renderer_ready",
    "first_content_visible",
    "background_ready",
  ]);
}

for (const disposal of ["primary", "destroyed"]) {
  const harness = createHarness();
  harness.coordinator.reach("renderer_ready");
  equal(harness.phaseListeners.size, 1);
  if (disposal === "primary") harness.replacePrimary();
  else harness.origin.emit("destroyed");
  equal(harness.phaseListeners.size, 0);
  equal(harness.primaryListeners.size, 0);
  equal(harness.origin.listenerCount("destroyed"), 0);
  harness.restorePrimary();
  harness.reachHost();
  harness.coordinator.reach("renderer_ready");
  equal(harness.reached, []);
}

console.log(`${assertions} main startup renderer coordinator assertions passed`);
