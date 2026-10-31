import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/startup/dev-process-lifecycle.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)(
  createRequire(import.meta.url),
  module,
  module.exports,
);
const lifecycle = module.exports;

equal(lifecycle.parsePositivePid(" 42 "), 42);
equal(lifecycle.parsePositivePid("0"), null);
equal(lifecycle.parsePositivePid("1.5"), null);
equal(lifecycle.parsePositivePid(undefined), null);
const markerWrites = [];
equal(
  lifecycle.requestDevRelaunch({ markerPath: "/tmp/relaunch", writeMarker: (path) => markerWrites.push(path) }),
  true,
);
equal(markerWrites, ["/tmp/relaunch"]);
equal(lifecycle.requestDevRelaunch({ markerPath: "" }), false);
equal(
  lifecycle.requestDevRelaunch({ markerPath: "/tmp/relaunch", writeMarker: () => { throw new Error("denied"); } }),
  false,
);
equal(lifecycle.isProcessRunning(7, () => {}), true);
equal(
  lifecycle.isProcessRunning(7, () => { throw Object.assign(new Error("missing"), { code: "ESRCH" }); }),
  false,
);
equal(
  lifecycle.isProcessRunning(7, () => { throw Object.assign(new Error("denied"), { code: "EPERM" }); }),
  true,
);

let intervalCallback;
let cleared = 0;
let quit = 0;
const appListeners = new Map();
const disposeMonitor = lifecycle.installDevParentProcessMonitor({
  app: {
    once: (event, listener) => appListeners.set(event, listener),
    quit: () => { quit += 1; },
  },
  parentPid: 99,
  isParentProcessRunning: () => false,
  setIntervalImpl: (callback) => ((intervalCallback = callback), 17),
  clearIntervalImpl: (timer) => { equal(timer, 17); cleared += 1; },
});
intervalCallback();
equal(quit, 1);
equal(cleared, 1);
disposeMonitor();
equal(cleared, 1);

const kills = [];
let cleanupListener;
let removedListener;
const disposeWebview = lifecycle.installDevWebviewCleanup({
  app: {
    once: (_event, listener) => { cleanupListener = listener; },
    off: (_event, listener) => { removedListener = listener; },
  },
  webviewPid: 123,
  killImpl: (pid, signal) => {
    kills.push([pid, signal]);
    if (pid < 0) throw new Error("no process group");
  },
});
cleanupListener();
equal(kills, [[-123, "SIGKILL"], [123, "SIGKILL"]]);
disposeWebview();
equal(removedListener, cleanupListener);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/startup/dev-process-lifecycle.js")'), true);
equal(main.includes('require("./main-app/misc/installer-attribution.js")'), true);
equal(main.includes("requestDevRelaunch: Yoe"), true);
equal(main.includes("installDevParentProcessMonitor: Zoe"), true);
equal(main.includes("installDevWebviewCleanup: Qoe"), true);
equal(main.includes("getInstallerAttribution: au"), true);
equal(main.includes("var Hoe ="), false);
equal(main.includes("var nu = 4096"), false);
equal(main.includes("function au("), false);
equal(main.includes("O = Zoe({ app: l.app })"), true);
equal(main.includes("defaultRequestDevRelaunch: Yoe"), true);

console.log(`${assertions} main dev process lifecycle owner assertions passed`);
