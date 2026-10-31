import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modulePath = path.join(root, "src/main/main-app/browser-use/iab-capabilities.ts");
const bundle = await esbuild.build({
  bundle: true,
  entryPoints: [modulePath],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createIabCapabilityRuntime, IAB_CAPABILITY_COMMANDS } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => { assert.equal(actual, expected); assertions += 1; };
const deepEqual = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };

const featureChecks = [];
const runtime = createIabCapabilityRuntime({
  async dispatchBrowserCommand({ backendName, commandSets, handlers, payload }) {
    if (!commandSets.some(({ commands }) => Object.hasOwn(commands, payload.type))) {
      throw new Error(`${backendName} does not support command "${payload.type}".`);
    }
    return handlers[payload.type](payload);
  },
  isWebMcpEnabled(buildFlavor, flag) {
    featureChecks.push([buildFlavor, flag]);
    return buildFlavor === "prod" && flag === true;
  },
});

deepEqual(runtime.browserCapabilityInfos.map(({ id }) => id), ["visibility", "viewport"]);
deepEqual(runtime.tabCapabilityInfos(null, { webMcp: true }).map(({ id }) => id), ["pageAssets"]);
deepEqual(runtime.tabCapabilityInfos("prod", { webMcp: true }).map(({ id }) => id), ["pageAssets", "webmcp"]);
deepEqual(runtime.tabCapabilityInfos("dev", { webMcp: true }).map(({ id }) => id), ["pageAssets"]);
deepEqual(featureChecks, [["prod", true], ["dev", true]]);

equal(runtime.isDeferredCapabilityCommand({ type: IAB_CAPABILITY_COMMANDS.visibilitySet }), true);
equal(runtime.isDeferredCapabilityCommand({ type: IAB_CAPABILITY_COMMANDS.viewportSet }), true);
equal(runtime.isDeferredCapabilityCommand({ type: IAB_CAPABILITY_COMMANDS.viewportReset }), true);
equal(runtime.isDeferredCapabilityCommand({ type: IAB_CAPABILITY_COMMANDS.visibilityGet }), false);
equal(runtime.isDeferredCapabilityCommand({ type: "unknown" }), false);

deepEqual(runtime.parseDeferredCapabilityIntent({
  type: IAB_CAPABILITY_COMMANDS.visibilitySet,
  browser_id: "browser-1",
  visible: true,
}), { kind: "visibility", visible: true });
deepEqual(runtime.parseDeferredCapabilityIntent({
  type: IAB_CAPABILITY_COMMANDS.viewportSet,
  browser_id: "browser-1",
  width: 1280,
  height: 720,
}), { kind: "viewport", viewportSize: { width: 1280, height: 720 } });
deepEqual(runtime.parseDeferredCapabilityIntent({
  type: IAB_CAPABILITY_COMMANDS.viewportReset,
  browser_id: "browser-1",
}), { kind: "viewport", viewportSize: null });
equal(runtime.parseDeferredCapabilityIntent({ type: "unknown" }), null);
assert.throws(
  () => runtime.parseDeferredCapabilityIntent({
    type: IAB_CAPABILITY_COMMANDS.viewportSet,
    browser_id: "browser-1",
    width: 0,
    height: 720,
  }),
  /greater than 0/,
);
assertions += 1;

const calls = [];
let visible = false;
let releaseDebuggerSync;
const debuggerSync = new Promise((resolve) => { releaseDebuggerSync = resolve; });
const host = {
  isBrowserVisibleForBrowserUse(browserTabId) {
    calls.push(["get-visible", browserTabId]);
    return visible;
  },
  setBrowserVisibleForBrowserUse(nextVisible, browserTabId) {
    visible = nextVisible;
    calls.push(["set-visible", nextVisible, browserTabId]);
  },
  setViewportForBrowserUse(viewport, browserTabId) {
    calls.push(["set-viewport", viewport, browserTabId]);
  },
  waitForPendingDebuggerSync(browserTabId) {
    calls.push(["wait-debugger", browserTabId]);
    return debuggerSync;
  },
};

deepEqual(await runtime.dispatchCapabilityCommand({
  browserTabId: "tab-1",
  host,
  payload: {
    type: IAB_CAPABILITY_COMMANDS.visibilitySet,
    browser_id: "browser-1",
    visible: true,
  },
}), {});
deepEqual(await runtime.dispatchCapabilityCommand({
  browserTabId: "tab-1",
  host,
  payload: { type: IAB_CAPABILITY_COMMANDS.visibilityGet, browser_id: "browser-1" },
}), { visible: true });

let viewportSettled = false;
const viewportRequest = runtime.dispatchCapabilityCommand({
  browserTabId: "tab-1",
  host,
  payload: {
    type: IAB_CAPABILITY_COMMANDS.viewportSet,
    browser_id: "browser-1",
    width: 900,
    height: 600,
  },
}).then((value) => { viewportSettled = true; return value; });
await Promise.resolve();
equal(viewportSettled, false);
releaseDebuggerSync();
deepEqual(await viewportRequest, {});
equal(viewportSettled, true);
deepEqual(calls, [
  ["set-visible", true, "tab-1"],
  ["get-visible", "tab-1"],
  ["set-viewport", { width: 900, height: 600 }, "tab-1"],
  ["wait-debugger", "tab-1"],
]);

await assert.rejects(
  runtime.dispatchCapabilityCommand({
    browserTabId: "tab-1",
    host,
    payload: { type: "browser_unknown" },
  }),
  /does not support command "browser_unknown"/,
);
assertions += 1;

const main = fs.readFileSync(
  path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"),
  "utf8",
);
equal(main.includes('require("./main-app/browser-use/iab-capabilities.js")'), true);
equal(main.includes("dispatchBrowserCommand: lte"), true);
equal(main.includes("isWebMcpEnabled: MG"), true);
equal(main.includes("capabilities: iabCapabilityRuntime"), true);
equal(main.includes("var _q = class"), false);
equal(main.includes("var dYe = [wY.info, FY.info]"), false);
equal(fs.existsSync(path.join(root, "src/main/main-app/browser-use/locator-engine.ts")), false);
equal(fs.existsSync(path.join(root, "src/main/main-app/browser-use/tool-schemas.ts")), false);

console.log(`${assertions} main IAB capability runtime assertions passed`);
