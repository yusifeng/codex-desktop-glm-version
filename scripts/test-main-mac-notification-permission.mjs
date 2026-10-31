import assert from "node:assert/strict";
import fs from "node:fs";
import { createMacNotificationPermissionRuntime } from "../src/main/main-app/notifications/mac-notification-permission.ts";

const flush = () => new Promise((resolve) => setImmediate(resolve));

const logs = [];
const callbacks = [];
let runStarts = 0;
let runStops = 0;
let libraryInstances = 0;
const center = {
  requestAuthorizationWithOptions$completionHandler$: (options, callback) => {
    assert.equal(options, 7);
    callbacks.push(callback);
  },
};
const objc = {
  RunLoop: { run: () => { runStarts += 1; return () => { runStops += 1; }; } },
  typedBlock: (signature, callback) => {
    assert.deepEqual(signature, { returns: "v", args: ["B", "@"] });
    return callback;
  },
  NobjcLibrary: class {
    constructor(frameworkPath) {
      libraryInstances += 1;
      assert.match(frameworkPath, /UserNotifications\.framework/);
      this.UNUserNotificationCenter = { currentNotificationCenter: () => center };
    }
  },
};
const runtime = createMacNotificationPermissionRuntime({
  platform: "darwin",
  createLogger: () => () => ({
    info: (message, details) => logs.push(["info", message, details]),
    warning: (message, details) => logs.push(["warning", message, details]),
  }),
  loadObjcJs: async () => objc,
});

const first = runtime.requestAuthorization();
const second = runtime.requestAuthorization();
await flush();
assert.equal(callbacks.length, 2);
assert.equal(runStarts, 1);
assert.equal(runStops, 0);
assert.equal(libraryInstances, 2);
callbacks[0](true, null);
assert.equal(await first, true);
assert.equal(runStops, 0);
callbacks[1](false, null);
assert.equal(await second, false);
assert.equal(runStops, 1);

const request = runtime.requestAuthorization();
await flush();
const nativeError = {
  code: () => 9,
  domain: () => ({ toString: () => "domain" }),
  localizedDescription: () => ({ toString: () => "denied" }),
};
callbacks.at(-1)(false, nativeError);
await assert.rejects(() => request, /Failed to request macOS notification authorization/);
assert.equal(runStarts, 2);
assert.equal(runStops, 2);
assert.equal(logs.some(([level, message]) => level === "warning" && message.includes("returned an error")), true);

const highLevel = runtime.requestNotificationAuthorization();
await flush();
callbacks.at(-1)(true, null);
await highLevel;
assert.equal(logs.some(([, message]) => message.includes("request started")), true);
assert.equal(logs.some(([, message]) => message.includes("request completed")), true);

let nonDarwinLoads = 0;
const nonDarwin = createMacNotificationPermissionRuntime({
  platform: "linux",
  createLogger: () => () => ({ info: () => {}, warning: () => {} }),
  loadObjcJs: async () => { nonDarwinLoads += 1; return objc; },
});
assert.equal(await nonDarwin.requestNotificationAuthorization(), undefined);
assert.equal(nonDarwinLoads, 0);

const throwingCenter = { requestAuthorizationWithOptions$completionHandler$: () => { throw new Error("native throw"); } };
const throwing = createMacNotificationPermissionRuntime({
  platform: "darwin",
  createLogger: () => () => ({ info: () => {}, warning: () => {} }),
  loadObjcJs: async () => ({
    ...objc,
    NobjcLibrary: class { constructor() { this.UNUserNotificationCenter = { currentNotificationCenter: () => throwingCenter }; } },
  }),
});
await assert.rejects(() => throwing.requestAuthorization(), /Failed to request macOS notification authorization/);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /requestNotificationAuthorization: ctt/);
assert.doesNotMatch(main, /async function ctt\(/);
assert.doesNotMatch(main, /async function ltt\(/);
assert.doesNotMatch(main, /function utt\(/);
assert.match(main, /requestNotificationAuthorization: \(\) => ctt\(\)/);

console.log("mac notification permission assertions: 27");
