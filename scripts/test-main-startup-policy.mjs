import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { collectStartupPathExtensions, createStartupPhaseTracker, resolveRemoteHostedPipProcessIdentifier, resolveStartupFlavorFlags, shouldEnableDebugChromePages } = require("../app/.vite/build/main-app/startup/startup-policy.js");
const policy = {
  Dev: "dev",
  Agent: "agent",
  shouldIncludeSparkle: (flavor, platform) => flavor === "prod" && platform === "darwin",
  shouldIncludeUpdater: (flavor, platform) => flavor === "prod" && platform !== "linux",
  allowDevtools: (flavor) => flavor !== "prod",
  allowDebugMenu: (flavor) => flavor === "dev" || flavor === "agent",
};

assert.deepEqual(resolveStartupFlavorFlags({ buildFlavor: "dev", platform: "darwin", env: {}, isPackaged: false, policy }), { enableSparkle: false, enableUpdater: false, allowDevtools: true, allowInspectElement: true, allowDebugMenu: true, isDarwin: true, isWindows: false, isUnpackaged: true });
assert.equal(resolveStartupFlavorFlags({ buildFlavor: "prod", platform: "darwin", env: {}, isPackaged: true, policy }).enableSparkle, true);
assert.equal(resolveStartupFlavorFlags({ buildFlavor: "prod", platform: "win32", env: {}, isPackaged: true, policy }).isWindows, true);
assert.equal(resolveStartupFlavorFlags({ buildFlavor: "prod", platform: "linux", env: {}, isPackaged: true, policy }).enableUpdater, false);
assert.equal(resolveStartupFlavorFlags({ buildFlavor: "agent", platform: "linux", env: {}, isPackaged: false, policy }).allowInspectElement, true);

const durations = {};
const traces = [];
const track = createStartupPhaseTracker({ startedAtMs: 100, now: () => 175, phaseDurations: durations, trace: (phase, detail) => traces.push([phase, detail]) });
track("ready", 125, { appWhenReadyResolved: true });
track("background", 150, { background: true });
assert.equal(durations.ready, 50);
assert.equal(durations.background, undefined);
assert.equal(traces[0][1].safe.startupElapsedMs, 75);
assert.equal(traces[1][1].safe.background, true);

const extname = (path) => path.includes(".") ? path.slice(path.lastIndexOf(".")) : "";
assert.deepEqual(collectStartupPathExtensions([{ path: "A.SKILL" }, { path: "b.skill" }, { path: "README" }, { path: "c.TXT" }], extname), ["", "skill", "txt"]);
assert.equal(shouldEnableDebugChromePages(true, true), true);
assert.equal(shouldEnableDebugChromePages(false, true), false);
assert.equal(shouldEnableDebugChromePages(true, 1), false);
assert.equal(resolveRemoteHostedPipProcessIdentifier(true, "42"), 42);
assert.equal(resolveRemoteHostedPipProcessIdentifier(false, "42"), null);
assert.equal(resolveRemoteHostedPipProcessIdentifier(true, "0"), null);
assert.equal(resolveRemoteHostedPipProcessIdentifier(true, "1.5"), null);

console.log("17 main startup policy assertions passed");
