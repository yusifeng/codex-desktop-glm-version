import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const loadModule = async (path) => {
  const source = fs.readFileSync(new URL(path, import.meta.url), "utf8");
  const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
  const loaded = { exports: {} };
  Function("module", "exports", output.code)(loaded, loaded.exports);
  return loaded.exports;
};

const { installNativeThemeWindowSync } = await loadModule(
  "../src/main/main-app/startup/native-theme-window-sync.ts",
);
const { createRemoteHostedPipAvailabilityReconciler } = await loadModule(
  "../src/main/main-app/startup/remote-hosted-pip-availability.ts",
);
const { installLocaleRefreshLifecycle } = await loadModule(
  "../src/main/main-app/startup/locale-refresh-lifecycle.ts",
);

const themeCalls = [];
let themeListener;
const nativeTheme = {
  shouldUseDarkColors: true,
  on: (event, listener) => { themeCalls.push(["on", event]); themeListener = listener; },
  off: (event, listener) => themeCalls.push(["off", event, listener === themeListener]),
};
const liveWindow = {
  isDestroyed: () => false,
  webContents: { send: (...args) => themeCalls.push(["send", ...args]) },
};
const destroyedWindow = {
  isDestroyed: () => true,
  webContents: { send: (...args) => themeCalls.push(["destroyed-send", ...args]) },
};
const disposeThemeSync = installNativeThemeWindowSync({
  listWindows: () => [liveWindow, destroyedWindow],
  nativeTheme,
  refreshWindowBackdrops: () => themeCalls.push(["refresh-backdrops"]),
  themeChannel: "theme-channel",
});
equal(themeCalls, [["on", "updated"]]);
themeListener();
equal(themeCalls.slice(1), [
  ["refresh-backdrops"],
  ["send", "theme-channel", "dark"],
]);
nativeTheme.shouldUseDarkColors = false;
themeListener();
equal(themeCalls.at(-1), ["send", "theme-channel", "light"]);
disposeThemeSync();
equal(themeCalls.at(-1), ["off", "updated", true]);

const pipCalls = [];
let pipEnabled = false;
const reconcilePip = createRemoteHostedPipAvailabilityReconciler({
  getEnabled: () => (pipCalls.push(["get-enabled"]), pipEnabled),
  getLogger: () => ({ info: (...args) => pipCalls.push(["log", ...args]) }),
  reconcileContentHostLifecycle: () => pipCalls.push(["native-reconcile"]),
  reconcileOverlayContentHost: () => pipCalls.push(["overlay-reconcile"]),
});
equal(pipCalls, [["get-enabled"]]);
pipCalls.length = 0;
reconcilePip();
equal(pipCalls, [["get-enabled"], ["native-reconcile"]]);
pipCalls.length = 0;
pipEnabled = true;
reconcilePip();
equal(pipCalls, [
  ["get-enabled"],
  ["native-reconcile"],
  ["log", "Remote hosted PiP availability changed", { safe: { enabled: true } }],
  ["overlay-reconcile"],
]);
pipCalls.length = 0;
reconcilePip();
equal(pipCalls, [["get-enabled"], ["native-reconcile"]]);
pipCalls.length = 0;
pipEnabled = false;
reconcilePip();
equal(pipCalls.at(-2), ["log", "Remote hosted PiP availability changed", { safe: { enabled: false } }]);
equal(pipCalls.at(-1), ["overlay-reconcile"]);

const localeCalls = [];
let localeListener;
let locale = "fr-FR";
let browserSession = { id: "browser-session" };
let resolveLocaleLoad;
const localeLoad = () => new Promise((resolve) => { resolveLocaleLoad = resolve; });
const unsubscribe = () => localeCalls.push(["unsubscribe"]);
const returnedUnsubscribe = installLocaleRefreshLifecycle({
  getBrowserSession: () => browserSession,
  getLocale: () => locale,
  loadLocale: (nextLocale) => (localeCalls.push(["load", nextLocale]), localeLoad()),
  refreshApplicationMenu: () => localeCalls.push(["application-menu"]),
  refreshDockMenu: () => localeCalls.push(["dock-menu"]),
  refreshPipLocale: () => localeCalls.push(["pip-locale"]),
  refreshTrayMenu: () => localeCalls.push(["tray-menu"]),
  setBrowserSessionLocale: (session, nextLocale) => localeCalls.push(["browser-locale", session.id, nextLocale]),
  subscribe: (listener) => { localeListener = listener; return unsubscribe; },
});
equal(returnedUnsubscribe, unsubscribe);
equal(localeCalls, []);
localeListener();
equal(localeCalls, [
  ["browser-locale", "browser-session", "fr-FR"],
  ["load", "fr-FR"],
]);
resolveLocaleLoad();
await Promise.resolve();
equal(localeCalls.slice(-4), [
  ["application-menu"],
  ["dock-menu"],
  ["tray-menu"],
  ["pip-locale"],
]);
browserSession = null;
locale = undefined;
localeListener();
equal(localeCalls.at(-1), ["load", undefined]);
equal(localeCalls.filter(([type]) => type === "browser-locale").length, 1);

console.log(`${assertions} startup UI lifecycle assertions passed`);
