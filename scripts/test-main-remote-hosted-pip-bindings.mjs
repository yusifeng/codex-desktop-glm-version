import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/startup/remote-hosted-pip-bindings.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", output.code)(loaded, loaded.exports);
const { installRemoteHostedPipBindings } = loaded.exports;

const events = [];
const settingsDispose = () => events.push(["dispose-settings"]);
const hostDispose = () => events.push(["dispose-host"]);
let windowSender;
let wakeRequest;
let contentHostStarted;
const manager = {
  handleGlobalHiddenChanged: () => events.push(["hidden-changed"]),
  onContentHostStarted(listener) { events.push(["subscribe-host"]); contentHostStarted = listener; return hostDispose; },
  reconcileContentHostLifecycle() { events.push(["reconcile-content-host"]); },
  setPetWakeRequestHandler(handler) { events.push(["set-wake"]); wakeRequest = handler; },
  setWindowMessageSender(sender) { events.push(["set-sender"]); windowSender = sender; },
};
const disposers = [];
const wakeFailure = new Error("wake failed");
installRemoteHostedPipBindings({
  hiddenSettingKey: "always-hide",
  logger: { warning: (message, fields) => events.push(["warning", message, fields.sensitive.error]) },
  manager,
  reconcileOverlayContentHost: () => events.push(["reconcile-overlay"]),
  registerDispose: (dispose) => disposers.push(dispose),
  sendWindowMessage: (message) => events.push(["window-message", message]),
  settingsStore: {
    onDidChange(key, listener) { events.push(["subscribe-setting", key, listener]); return settingsDispose; },
  },
  wakeOverlay: async () => { throw wakeFailure; },
});
equal(events.map(([type]) => type), [
  "set-sender",
  "subscribe-setting",
  "set-wake",
  "subscribe-host",
  "reconcile-content-host",
]);
equal(disposers, [settingsDispose, hostDispose]);
windowSender({ type: "pip" });
equal(events.at(-1), ["window-message", { type: "pip" }]);
contentHostStarted();
equal(events.at(-1), ["reconcile-overlay"]);
wakeRequest();
await Promise.resolve();
await Promise.resolve();
equal(events.at(-1), ["warning", "Failed to wake pet for PiP placement request", wakeFailure]);
events[1][2]();
equal(events.at(-1), ["hidden-changed"]);

console.log(`${assertions} remote-hosted PiP binding assertions passed`);
