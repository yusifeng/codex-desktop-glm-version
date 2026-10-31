import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/startup/local-app-server-startup.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", output.code)(loaded, loaded.exports);
const { runLocalAppServerStartup } = loaded.exports;

function createHarness(options = {}) {
  const calls = [];
  let recoveryOptions;
  let delayedOptions;
  let backfillOptions;
  const run = () => runLocalAppServerStartup({
    activateProgressWindows: options.activate ?? true,
    appQuit: () => calls.push(["app-quit"]),
    connect: async () => {
      calls.push(["connect"]);
      if (options.connectError != null) throw options.connectError;
    },
    enableRecovery: async () => calls.push(["enable-recovery"]),
    getLogger: () => ({ warning: (...args) => calls.push(["warning", ...args]) }),
    markQuitApproved: () => calls.push(["mark-quit-approved"]),
    runWithRecovery: async (nextOptions) => {
      recoveryOptions = nextOptions;
      if (options.backfill) await nextOptions.onBackfillWait();
      if (options.invokeOpen !== false) await nextOptions.open();
      return options.shouldContinue ?? true;
    },
    shouldHandleError: "should-handle-error",
    showBackfillProgress: async (nextOptions) => {
      backfillOptions = nextOptions;
      calls.push(["show-backfill"]);
      if (options.backfillError != null) throw options.backfillError;
      return () => calls.push(["close-backfill"]);
    },
    startDelayedProgress: (nextOptions) => {
      delayedOptions = nextOptions;
      calls.push(["start-delayed"]);
      return () => calls.push(["close-delayed"]);
    },
    waitForNetwork: async () => calls.push(["network-ready"]),
    windowIconPath: "/icons/codex.png",
  });
  return {
    calls,
    run,
    getBackfillOptions: () => backfillOptions,
    getDelayedOptions: () => delayedOptions,
    getRecoveryOptions: () => recoveryOptions,
  };
}

{
  const harness = createHarness();
  const result = await harness.run();
  equal(result.shouldContinue, true);
  equal(harness.getRecoveryOptions().databasePath, null);
  equal(harness.getRecoveryOptions().shouldHandleError, "should-handle-error");
  equal(harness.calls, [
    ["start-delayed"],
    ["connect"],
    ["network-ready"],
    ["enable-recovery"],
    ["close-delayed"],
  ]);
  equal(harness.getDelayedOptions().activate, true);
  equal(harness.getDelayedOptions().kind, "app-server");
  equal(harness.getDelayedOptions().windowIconPath, "/icons/codex.png");
  harness.getDelayedOptions().onQuit();
  equal(harness.calls.slice(-2), [["mark-quit-approved"], ["app-quit"]]);
  const delayedError = new Error("delayed failed");
  harness.getDelayedOptions().onError(delayedError);
  equal(harness.calls.at(-1)[1], "Failed to show slow app-server startup progress window");
  equal(harness.calls.at(-1)[2].sensitive.error, delayedError);
  result.closeBackfillProgress();
  equal(harness.calls.some(([type]) => type === "close-backfill"), false);
}

{
  const harness = createHarness({ backfill: true, activate: false });
  const result = await harness.run();
  equal(harness.calls, [
    ["show-backfill"],
    ["connect"],
    ["network-ready"],
    ["enable-recovery"],
  ]);
  equal(harness.getDelayedOptions(), undefined);
  equal(harness.getBackfillOptions().activate, false);
  equal(harness.getBackfillOptions().kind, "sqlite-backfill");
  harness.getBackfillOptions().onQuit();
  equal(harness.calls.slice(-2), [["mark-quit-approved"], ["app-quit"]]);
  result.closeBackfillProgress();
  equal(harness.calls.at(-1), ["close-backfill"]);
}

{
  const error = new Error("backfill window failed");
  const harness = createHarness({ backfill: true, backfillError: error });
  await harness.run();
  equal(harness.calls.some(([type]) => type === "start-delayed"), true);
  const warning = harness.calls.find(([type]) => type === "warning");
  equal(warning[1], "Failed to show SQLite backfill progress window");
  equal(warning[2].sensitive.error, error);
}

{
  const error = new Error("connect failed");
  const harness = createHarness({ connectError: error });
  await assert.rejects(harness.run(), error);
  assertions += 1;
  equal(harness.calls.at(-1), ["close-delayed"]);
}

{
  const harness = createHarness({ invokeOpen: false, shouldContinue: false });
  const result = await harness.run();
  equal(result.shouldContinue, false);
  equal(harness.calls, []);
}

console.log(`${assertions} local app-server startup assertions passed`);
