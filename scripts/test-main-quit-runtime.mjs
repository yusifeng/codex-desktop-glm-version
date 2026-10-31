import assert from "node:assert/strict";
import fs from "node:fs";
import { createQuitRuntime } from "../src/main/main-app/startup/quit-runtime.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

function createHarness(defaultRequest = () => false) {
  const calls = [];
  const runtime = createQuitRuntime({
    app: {
      relaunch: () => calls.push("relaunch"),
      quit: () => calls.push("quit"),
    },
    defaultRequestDevRelaunch: () => {
      calls.push("default-request");
      return defaultRequest();
    },
    waitForCleanupWithTimeout: async (cleanup, timeout) => {
      calls.push(["wait", timeout]);
      await cleanup();
    },
  });
  return { calls, runtime };
}

{
  const harness = createHarness();
  harness.runtime.relaunchAndQuit();
  equal(harness.calls, ["default-request", "relaunch", "quit"]);
}

{
  const harness = createHarness();
  harness.runtime.relaunchAndQuit(() => {
    harness.calls.push("custom-request");
    return true;
  });
  equal(harness.calls, ["custom-request", "quit"]);
}

{
  const failure = new Error("request failed");
  const harness = createHarness();
  assert.throws(() => harness.runtime.relaunchAndQuit(() => { throw failure; }), failure);
  assertions += 1;
  equal(harness.calls, []);
}

{
  const harness = createHarness();
  await harness.runtime.stopServiceWithTimeout(async () => {
    harness.calls.push("stop-service");
  });
  equal(harness.calls, [["wait", 12_000], "stop-service"]);
  harness.calls.length = 0;
  await harness.runtime.waitForContextCleanup(async () => {
    harness.calls.push("cleanup-context");
  });
  equal(harness.calls, [["wait", 5_000], "cleanup-context"]);
}

{
  const harness = createHarness();
  await harness.runtime.cleanupBeforeImmediateExit({
    hotkeyWindowLifecycleManager: { dispose: () => harness.calls.push("dispose-hotkeys") },
    globalDictationLifecycleManager: { dispose: () => harness.calls.push("dispose-dictation") },
    flushAndDisposeContext: async () => harness.calls.push("flush-context"),
    disposables: { dispose: () => harness.calls.push("dispose-all") },
  });
  equal(harness.calls, [
    "dispose-hotkeys",
    "dispose-dictation",
    ["wait", 5_000],
    "flush-context",
    "dispose-all",
  ]);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createQuitRuntime"), true);
equal(main.includes("stopServiceWithTimeout(() => K.stopCodexMicro())"), true);
equal(main.includes("relaunchApp: relaunchAndQuit"), true);
equal(main.includes("waitForContextCleanup,"), true);
equal(main.includes("cleanupBeforeImmediateExit({"), true);
equal(main.includes("function a7("), false);
equal(main.includes("function Irt("), false);
equal(main.includes("function Lrt("), false);
equal(main.includes("function s7("), false);
equal(main.includes("Prt = 12e3"), false);

console.log(`${assertions} main quit-runtime assertions passed`);
