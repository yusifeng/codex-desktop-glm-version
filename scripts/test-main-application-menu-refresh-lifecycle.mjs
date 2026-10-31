import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/startup/application-menu-refresh-lifecycle.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", output.code)(loaded, loaded.exports);
const { createApplicationMenuRefreshLifecycle } = loaded.exports;

const calls = [];
const appListeners = new Map();
const disposers = [];
const app = {
  on(event, listener) {
    calls.push(["on", event]);
    appListeners.set(event, listener);
  },
  off(event, listener) {
    calls.push(["off", event, listener]);
    if (appListeners.get(event) === listener) appListeners.delete(event);
  },
};
const lifecycle = createApplicationMenuRefreshLifecycle({
  app,
  registerDispose: (dispose) => disposers.push(dispose),
});

lifecycle.requestRefresh();
equal(calls, [], "refresh is a safe no-op before the menu builder exists");
lifecycle.bindRefresh(() => calls.push(["refresh"]));
lifecycle.requestRefresh();
equal(calls, [["refresh"]]);

let browserStateChanged;
let inspectorStateChanged;
lifecycle.installObservers({
  setOnBrowserStateChanged: (listener) => { browserStateChanged = listener; },
  setOnInspectorStateChanged: (listener) => { inspectorStateChanged = listener; },
  syncActiveThreadForFocusedWindow: () => calls.push(["sync-active-thread"]),
});
equal(typeof browserStateChanged, "function");
equal(typeof inspectorStateChanged, "function");
equal(disposers.length, 1);
equal(typeof appListeners.get("browser-window-focus"), "function");

calls.length = 0;
browserStateChanged();
equal(calls, [["refresh"], ["sync-active-thread"]], "browser changes refresh before syncing");
calls.length = 0;
appListeners.get("browser-window-focus")();
equal(calls, [["refresh"]]);
calls.length = 0;
inspectorStateChanged();
equal(calls, [["refresh"]]);

lifecycle.installObservers({
  setOnBrowserStateChanged: () => calls.push(["duplicate-browser-observer"]),
  setOnInspectorStateChanged: () => calls.push(["duplicate-inspector-observer"]),
  syncActiveThreadForFocusedWindow: () => calls.push(["duplicate-sync"]),
});
equal(disposers.length, 1, "observer installation is idempotent");
equal(calls, [["refresh"]]);

const focusListener = appListeners.get("browser-window-focus");
disposers[0]();
equal(appListeners.has("browser-window-focus"), false);
equal(calls.at(-1), ["off", "browser-window-focus", focusListener]);

console.log(`${assertions} application-menu refresh lifecycle assertions passed`);
