import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/chronicle/service.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const classNode = ast.body.find((node) => node.type === "ClassDeclaration" && node.id?.name === "ChronicleService");
assert.ok(classNode); assertions += 1;
equal(classNode.body.body.length, 25);
class EventEmitterBase {}
let classification = null;
const ChronicleService = Function(
  "EventEmitterBase", "classifyErrorSource", "configKeyPath", "rollbackWithErrors", "throwAfterRollback",
  `${transpiled.code.slice(classNode.start, classNode.end)}; return ChronicleService;`,
)(EventEmitterBase, () => classification, (key) => [key], async () => {}, async (error) => { throw error; });
const requests = [];
const controller = {
  status: async () => ({ state: "stopped" }), disable: async () => ({ state: "stopped" }),
  pause: async () => ({ state: "paused" }), reconcileEnabled: async () => {},
  getSettings: async () => ({ retention: 7 }), updateSettings: async (value) => value,
  clearHistory: async (...args) => requests.push(["clear", ...args]),
};
const connection = {
  isChronicleFeatureConfigured: async () => true,
  reconcileSkysightChronicle: async () => {},
  enableSkysightChronicle: async () => ({ state: "running" }),
  resumeChronicle: async () => ({ enabled: true, running: true }),
  getSkysightChronicleActivationState: () => "waiting",
  sendAppServerRequest: async (...args) => requests.push(args),
};
const history = { list: async () => [1], listSuggestions: async () => [2], listSummaryIntervals: async (since) => [since] };
const service = new ChronicleService(connection, () => controller, () => true, async () => ["app"], async (ids) => ids, history);
equal(await service.getState(), { enabled: true, recorderState: "stopped", activationState: "waiting" });
equal(await service.setEnabled(true), { enabled: true, recorderState: "running", activationState: "idle" });
equal(requests.at(-1), ["config/value/write", { keyPath: ["chronicle"], value: true, mergeStrategy: "upsert", expectedVersion: null }]);
equal(await service.pause(), { enabled: true, recorderState: "paused", activationState: "idle" });
equal(await service.resume(), { enabled: true, recorderState: "running", activationState: "idle" });
equal(await service.listHistory(), [1]);
equal(await service.listHistorySummaryIntervals({ sinceMs: 10 }), [10]);
classification = "pending";
connection.enableSkysightChronicle = async () => { throw new Error("permissions"); };
equal(await service.setEnabled(true), { enabled: true, recorderState: "stopped", activationState: "waiting_for_permissions" });

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('const { ChronicleService: IO } = require("./main-app/chronicle/service.js");'), true);
equal(main.includes("IO = class"), false);
equal(main.includes("async function LO("), false);
equal(main.includes("async function RO("), false);
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(windowContext.includes("? new IO("), true);
console.log(`${assertions} main ChronicleService owner assertions passed`);
