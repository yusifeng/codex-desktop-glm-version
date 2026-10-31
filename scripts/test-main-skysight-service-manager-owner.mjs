import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/skysight/service-manager.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const classNode = ast.body.find(
  (node) => node.type === "ClassDeclaration" && node.id?.name === "SkysightServiceManager",
);
assert.ok(classNode);
assertions += 1;
equal(classNode.body.body.length, 24);
const classSource = transpiled.code.slice(classNode.start, classNode.end);
const stoppedStatus = {
  state: "stopped",
  eventStreamRootPath: null,
  currentSegmentEventsPath: null,
  currentSegmentMetadataPath: null,
  suppressedEventsPath: null,
  startedAtMs: null,
  endedAtMs: null,
};
const SkysightServiceManager = Function(
  "STOPPED_STATUS",
  `${classSource}; return SkysightServiceManager;`,
)(stoppedStatus);

const requests = [];
const reconciliations = [];
let archiveCalls = 0;
let state = "stopped";
const status = (nextState = state) => ({
  ...stoppedStatus,
  state: nextState,
});
const manager = new SkysightServiceManager({
  async request(input) {
    requests.push(input);
    if (input.method === "skysightStart") state = "running";
    else if (input.method === "skysightStop") state = "stopped";
    else if (input.method === "skysightPause") state = "paused";
    else if (input.method === "skysightResume") state = "running";
    return status();
  },
  async archiveLegacyChronicleSkill() {
    archiveCalls += 1;
  },
  reconcileComputerHistoryPluginInstallation(enabled) {
    reconciliations.push(enabled);
  },
});

equal(manager.getCachedStatus(), stoppedStatus);
equal(manager.shouldReconcileAfterServiceRespawn(), false);
equal((await manager.enable()).state, "running");
equal(manager.shouldReconcileAfterServiceRespawn(), true);
equal(archiveCalls, 1);
equal(reconciliations, [true]);
equal(requests.at(-1), { method: "skysightStart", params: {} });
equal((await manager.pause()).state, "paused");
equal(requests.at(-1), { method: "skysightPause", params: {} });
equal((await manager.resume()).state, "running");
equal(requests.slice(-2).map(({ method }) => method), ["skysightStatus", "skysightResume"]);
equal((await manager.disable()).state, "stopped");
equal(reconciliations, [true, false]);
equal(manager.shouldReconcileAfterServiceRespawn(), false);
equal(
  await manager.updateSettings({ retentionDays: 7 }),
  status(),
);
equal(requests.at(-1), {
  method: "skysightUpdateSettings",
  params: { settings: { retentionDays: 7 } },
});
await manager.clearHistory("all", { beforeMs: 10 });
equal(requests.at(-1), {
  method: "skysightClearHistory",
  params: { interval: { beforeMs: 10 }, scope: "all" },
});

const originalError = Error("start failed");
const rollbackRequests = [];
const failing = new SkysightServiceManager({
  async request(input) {
    rollbackRequests.push(input.method);
    if (input.method === "skysightStart") throw originalError;
    return status("stopped");
  },
  async archiveLegacyChronicleSkill() {},
  reconcileComputerHistoryPluginInstallation() {},
});
await assert.rejects(failing.enable(), (error) => error === originalError);
assertions += 1;
equal(rollbackRequests, ["skysightStart", "skysightStop"]);
equal(failing.shouldReconcileAfterServiceRespawn(), false);

const invalidStop = new SkysightServiceManager({
  async request() {
    return { ...status("stopped"), currentSegmentEventsPath: "/still-open.jsonl" };
  },
  async archiveLegacyChronicleSkill() {},
  reconcileComputerHistoryPluginInstallation() {},
});
await assert.rejects(invalidStop.stop(), /did not close its current segment/);
assertions += 1;

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("var Moe = SkysightServiceManager;"), true);
equal(main.includes("Moe = class"), false);
equal(main.includes("be = new Moe({"), true);

console.log(`${assertions} main Skysight service manager owner assertions passed`);
