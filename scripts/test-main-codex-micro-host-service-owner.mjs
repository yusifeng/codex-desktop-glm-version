import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/device/codex-micro-host-service.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const declaration = (name) => ast.body.find((node) =>
  (node.type === "ClassDeclaration" || node.type === "FunctionDeclaration") && node.id?.name === name,
);
const statusNode = declaration("getInputMonitoringPermissionStatus");
const classNode = declaration("CodexMicroHostService");
assert.ok(statusNode && classNode); assertions += 1;
equal(classNode.body.body.length, 11);

const warnings = [];
const status = (loadAddon) => Function(
  "loadInputMonitoringAddon", "permissionLogger",
  `${transpiled.code.slice(statusNode.start, statusNode.end)}; return getInputMonitoringPermissionStatus;`,
)(loadAddon, { warning: (...args) => warnings.push(args) });
equal(status(() => { throw new Error("unused"); })({ platform: "win32" }), "unavailable");
equal(status(() => ({ hasInputMonitoringPermission: () => true }))({ platform: "darwin" }), "granted");
equal(status(() => ({ hasInputMonitoringPermission: () => false }))({ platform: "darwin" }), "denied");
equal(status(() => { throw new Error("missing"); })({ platform: "darwin" }), "unavailable");
equal(warnings.length, 1);

class EventEmitterBase {}
let idleState = "active";
const opened = [];
const loggerErrors = [];
const permissionStatus = () => "granted";
const CodexMicroHostService = Function(
  "EventEmitterBase", "createTaggedLogger", "getInputMonitoringPermissionStatus",
  "powerMonitor", "shell", "INPUT_MONITORING_SETTINGS_URL",
  `${transpiled.code.slice(classNode.start, classNode.end)}; return CodexMicroHostService;`,
)(
  EventEmitterBase,
  () => ({ error: (...args) => loggerErrors.push(args) }),
  permissionStatus,
  { getSystemIdleState: () => idleState },
  { openExternal: async (url) => opened.push(url) },
  "settings://input-monitoring",
);
const origin = { id: "origin" };
const calls = [];
const manager = {
  getState: () => ({ connected: true }),
  updateAgentThreadKeys: (...args) => calls.push(["keys", ...args]),
  updateLighting: async (...args) => { calls.push(["lighting", ...args]); return "updated"; },
};
const windowManager = { getPrimaryWindow: () => ({ webContents: origin }) };
const service = new CodexMicroHostService(manager, windowManager, origin);
equal(service.getState(), { connected: true });
equal(await service.getInputMonitoringPermissionStatus(), "granted");
equal(service.ownsPrimaryWindow(), true);
equal(await service.updateAgentThreadKeys(["a"], ["agent"], true), true);
equal(await service.updateLighting("blue"), "updated");
equal(calls, [["keys", ["a"], ["agent"], true], ["lighting", "blue"]]);
idleState = "locked";
equal(service.ownsPrimaryWindow(), false);
equal(await service.updateAgentThreadKeys([], []), false);
equal(await service.updateLighting("red"), false);
await service.openInputMonitoringSettings();
equal(opened, ["settings://input-monitoring"]);
equal(loggerErrors, []);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('const { CodexMicroHostService: cA } = require("./main-app/device/codex-micro-host-service.js");'), true);
equal(main.includes("cA = class"), false);
equal(main.includes("function tA("), false);
equal(main.includes("input-monitoring-permission.node"), false);
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(windowContext.includes("codexMicro: new cA(this.codexMicroServiceManager, this.options.windowManager, e)"), true);
console.log(`${assertions} main Codex Micro host service assertions passed`);
