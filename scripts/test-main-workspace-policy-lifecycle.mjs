import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/startup/workspace-policy-runtime.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", output.code)(loaded, loaded.exports);
const { createWorkspacePolicyRuntime } = loaded.exports;

const events = [];
let checkerOptions;
const checker = {
  checkForChanges: async () => { events.push(["check"]); },
  handleNotification: async (notification) => { events.push(["notification", notification]); },
};
const createLifecycle = createWorkspacePolicyRuntime({
  createWorkspacePolicyChecker: (options) => { checkerOptions = options; return checker; },
  showWorkspacePolicyRestartDialog: (options) => events.push(["dialog", options]),
  getIntl: () => "intl",
  getAppName: () => "Codex",
  showMessageBoxSync: () => {},
  relaunchAndQuit: () => {},
  onError: (error) => events.push(["error", error]),
});
const lifecycle = createLifecycle({
  quitState: { markQuitApproved: () => events.push(["approved"]) },
  isAppQuitting: () => false,
  getAuthMethod: async () => "chatgpt",
  hasStartupPolicyChanges: async () => true,
});
equal(typeof checkerOptions.onRestartRequired, "function");
checkerOptions.onRestartRequired();
equal(events[0][0], "dialog");

let notificationListener;
let configRefreshListener;
const disposers = [];
const connection = {
  registerInternalNotificationHandler(listener) {
    events.push(["register-notification"]);
    notificationListener = listener;
    return () => events.push(["dispose-notification"]);
  },
  registerInternalConfigRefreshHandler(listener) {
    events.push(["register-config"]);
    configRefreshListener = listener;
    return () => events.push(["dispose-config"]);
  },
  getUserSavedConfiguration: async () => ({ model: "gpt" }),
  sendAppServerRequest: async (...args) => { events.push(["request", ...args]); return "written"; },
};
lifecycle.installConnectionObservers({ connection, registerDispose: (dispose) => disposers.push(dispose) });
equal(events.slice(-2), [["register-notification"], ["register-config"]]);
equal(disposers.length, 2);
notificationListener({ method: "account/updated" });
configRefreshListener();
equal(events.slice(-2), [["notification", { method: "account/updated" }], ["check"]]);
await lifecycle.handleNotification({ method: "direct" });
await lifecycle.checkForChanges();
equal(events.slice(-2), [["notification", { method: "direct" }], ["check"]]);
disposers[0]();
disposers[1]();
equal(events.slice(-2), [["dispose-notification"], ["dispose-config"]]);

events.length = 0;
let initializeOptions;
await lifecycle.initializeDesktopSettings({
  connection,
  logger: { warning: (...args) => events.push(["warning", ...args]) },
  settingsStore: {
    initialize: async (options) => { initializeOptions = options; events.push(["initialize", options.config]); },
  },
  startupConfig: {
    resolve: (config) => events.push(["resolve", config]),
    reject: (error) => events.push(["reject", error]),
  },
});
equal(events.slice(0, 3), [
  ["resolve", { model: "gpt" }],
  ["check"],
  ["initialize", { model: "gpt" }],
]);
equal(await initializeOptions.batchWriteConfigValues({ model: "gpt-2" }), "written");
equal(events.at(-1), ["request", "config/batchWrite", { model: "gpt-2" }]);

events.length = 0;
const failure = new Error("config unavailable");
await lifecycle.initializeDesktopSettings({
  connection: { ...connection, getUserSavedConfiguration: async () => { throw failure; } },
  logger: { warning: (message, fields) => events.push(["warning", message, fields.sensitive.error]) },
  settingsStore: { initialize: () => events.push(["unexpected-initialize"]) },
  startupConfig: {
    resolve: () => events.push(["unexpected-resolve"]),
    reject: (error) => events.push(["reject", error]),
  },
});
equal(events, [
  ["reject", failure],
  ["warning", "Failed to initialize desktop settings", failure],
]);

console.log(`${assertions} workspace-policy lifecycle assertions passed`);
