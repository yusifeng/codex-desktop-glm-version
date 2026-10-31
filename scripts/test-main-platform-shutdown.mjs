import assert from "node:assert/strict";
import fs from "node:fs";
import { createPlatformShutdownRuntime } from "../src/main/main-app/startup/platform-shutdown.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

function createLogger() {
  const infos = [];
  const warnings = [];
  return {
    infos,
    warnings,
    logger: {
      n: () => ({ warning: (...args) => warnings.push(args) }),
      i: (tag) => () => ({
        info: (...args) => infos.push([tag, ...args]),
        warning: (...args) => warnings.push([tag, ...args]),
      }),
    },
  };
}

{
  const calls = [];
  const logs = createLogger();
  const addon = {
    killProcessDescendants: (pid) => calls.push(["kill", pid]),
    armTerminateCurrentProcess: (timeout) => calls.push(["arm", timeout]),
  };
  const runtime = createPlatformShutdownRuntime({
    platform: "win32",
    pid: 123,
    loadNativeAddon: () => addon,
    loadObjcJs: async () => { throw new Error("unused"); },
    logger: logs.logger,
  });
  runtime.killProcessDescendants();
  runtime.armWindowsForcedExit();
  runtime.armWindowsForcedExit();
  equal(calls, [["kill", 123], ["arm", 10_000]]);
  equal(logs.warnings, []);
}

{
  const failure = new Error("addon unavailable");
  const logs = createLogger();
  let loads = 0;
  const runtime = createPlatformShutdownRuntime({
    platform: "win32",
    pid: 1,
    loadNativeAddon: () => { loads += 1; throw failure; },
    loadObjcJs: async () => ({}),
    logger: logs.logger,
  });
  runtime.armWindowsForcedExit();
  runtime.armWindowsForcedExit();
  equal(loads, 2);
  equal(logs.warnings.length, 2);
  equal(logs.warnings[0][0], "Failed to arm Windows forced exit");
  equal(logs.warnings[0][1].sensitive.error, failure);
}

{
  const logs = createLogger();
  const runtime = createPlatformShutdownRuntime({
    platform: "win32",
    pid: 1,
    loadNativeAddon: () => null,
    loadObjcJs: async () => ({}),
    logger: logs.logger,
  });
  assert.throws(() => runtime.killProcessDescendants(), /Failed to load Windows updater addon/);
  assertions += 1;
}

{
  const calls = [];
  const logs = createLogger();
  let shutdownBlock;
  class NobjcLibrary {
    constructor(framework) {
      calls.push(["framework", framework]);
      this.NSString = {
        stringWithUTF8String$: (value) => {
          calls.push(["notification", value]);
          return value;
        },
      };
      this.NSWorkspace = {
        sharedWorkspace: () => ({
          notificationCenter: () => ({
            addObserverForName$object$queue$usingBlock$: (name, object, queue, block) => {
              calls.push(["observer", name, object, queue]);
              shutdownBlock = block;
            },
          }),
        }),
      };
    }
  }
  const runtime = createPlatformShutdownRuntime({
    platform: "darwin",
    pid: 2,
    loadNativeAddon: () => { throw new Error("unused"); },
    loadObjcJs: async () => ({
      NobjcLibrary,
      typedBlock: (signature, callback) => {
        calls.push(["typed-block", signature]);
        return callback;
      },
    }),
    logger: logs.logger,
  });
  let shutdowns = 0;
  await runtime.observeSystemShutdown(() => { shutdowns += 1; });
  equal(calls[0], ["framework", "/System/Library/Frameworks/AppKit.framework/AppKit"]);
  equal(calls[1], ["notification", "NSWorkspaceWillPowerOffNotification"]);
  equal(calls[2], ["typed-block", { returns: "v", args: ["@"] }]);
  equal(calls[3], ["observer", "NSWorkspaceWillPowerOffNotification", null, null]);
  shutdownBlock();
  equal(shutdowns, 1);
  equal(logs.infos[0][0], "mac-system-shutdown");
  equal(logs.infos[0][1], "macOS system shutdown requested; allowing app quit");
}

{
  const failure = new Error("objc failed");
  const logs = createLogger();
  const runtime = createPlatformShutdownRuntime({
    platform: "darwin",
    pid: 2,
    loadNativeAddon: () => null,
    loadObjcJs: async () => { throw failure; },
    logger: logs.logger,
  });
  await runtime.observeSystemShutdown(() => {});
  equal(logs.warnings.length, 1);
  equal(logs.warnings[0][0], "mac-system-shutdown");
  equal(logs.warnings[0][1], "Failed to observe macOS system shutdown");
  equal(logs.warnings[0][2].sensitive.error, failure);
}

{
  const calls = [];
  const logs = createLogger();
  const runtime = createPlatformShutdownRuntime({
    platform: "linux",
    pid: 3,
    loadNativeAddon: () => { calls.push("addon"); },
    loadObjcJs: async () => { calls.push("objc"); },
    logger: logs.logger,
  });
  runtime.killProcessDescendants();
  runtime.armWindowsForcedExit();
  await runtime.observeSystemShutdown(() => calls.push("shutdown"));
  equal(calls, []);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createPlatformShutdownRuntime"), true);
equal(main.includes("killProcessDescendants: hrt"), true);
equal(main.includes("armWindowsForcedExit: n7"), true);
equal(main.includes("observeSystemShutdown: _rt"), true);
equal(main.includes("function hrt("), false);
equal(main.includes("function n7("), false);
equal(main.includes("function _rt("), false);
equal(main.includes("grt = `/System/Library/Frameworks/AppKit.framework/AppKit`"), false);

console.log(`${assertions} main platform-shutdown assertions passed`);
