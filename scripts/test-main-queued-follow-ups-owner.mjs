import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL("../src/main/main-app/conversation/queued-follow-ups.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, {
  loader: "ts",
  format: "esm",
  target: "es2022",
});
const ast = acorn.parse(transpiled.code, {
  ecmaVersion: "latest",
  sourceType: "module",
});
const classNode = ast.body.find(
  (node) => node.type === "ClassDeclaration" && node.id?.name === "QueuedFollowUpsCoordinator",
);
assert.ok(classNode, "queued follow-ups coordinator should survive TypeScript transformation");
const classSource = transpiled.code.slice(classNode.start, classNode.end);
const QueuedFollowUpsCoordinator = Function(
  "ConversationEventEmitterBase",
  `${classSource}; return QueuedFollowUpsCoordinator;`,
)(class {});

let assertions = 1;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const errors = [];
const coordinator = new QueuedFollowUpsCoordinator({
  execution: null,
  coordination: null,
  getStreamRole: () => null,
  logger: { error: (...args) => errors.push(args), warning() {} },
});
await coordinator.executionReady;
equal(errors, []);
equal(coordinator.disposed, false);

const events = [];
const makeQueue = (name) => ({
  dispose: () => events.push(`${name}:dispose`),
  subscribe: () => {
    events.push(`${name}:subscribe`);
    return () => events.push(`${name}:unsubscribe`);
  },
});
coordinator.setServerQueue(makeQueue("first"));
equal(events, ["first:subscribe"]);
coordinator.setServerQueue(makeQueue("second"));
equal(events, ["first:subscribe", "first:unsubscribe", "first:dispose", "second:subscribe"]);
coordinator.dispose();
equal(events.slice(-2), ["second:unsubscribe", "second:dispose"]);
equal(coordinator.disposed, true);
equal(coordinator.messages.size, 0);
equal(coordinator.pending.size, 0);

const lateQueue = makeQueue("late");
coordinator.setServerQueue(lateQueue);
equal(events.at(-1), "late:dispose");

equal(classNode.body.body.length, 56);
const memberNames = classNode.body.body
  .map((member) => member.key?.name ?? member.key?.value)
  .filter(Boolean);
equal(memberNames.includes("sendMessage"), true);
equal(memberNames.includes("acceptFromFollower"), true);

const turnContextSource = fs.readFileSync(new URL("../src/main/main-app/conversation/turn-context.ts", import.meta.url), "utf8");
const turnContextTranspiled = await transform(turnContextSource, { loader: "ts", format: "esm", target: "es2022" });
const turnContextAst = acorn.parse(turnContextTranspiled.code, { ecmaVersion: "latest", sourceType: "module" });
const fallbackNode = turnContextAst.body.find((node) => node.type === "FunctionDeclaration" && node.id?.name === "controlFallbackValue");
assert.ok(fallbackNode, "control fallback owner should be exported from turn-context");
assertions += 1;
const controlFallbackValue = Function(`${turnContextTranspiled.code.slice(fallbackNode.start, fallbackNode.end)}; return controlFallbackValue;`)();
equal(controlFallbackValue({ type: "toggle" }), false);
equal(controlFallbackValue({ type: "color" }), "#ffffff");
equal(controlFallbackValue({ type: "range", min: 2 }), 2);
equal(controlFallbackValue({ type: "select", options: [{ value: "first" }] }), "first");
equal(controlFallbackValue({ type: "toggle", currentValue: true }), true);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/conversation/queued-follow-ups.js")'), true);
for (const generatedName of ["zSe", "BSe", "wC", "VSe", "TC", "HSe", "USe"])
  equal(new RegExp(`\\b${generatedName}\\b`).test(main), false);
const managerSource = fs.readFileSync(new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url), "utf8");
equal(managerSource.includes('import { createQueuedFollowUps } from "./queued-follow-ups"'), true);
equal(managerSource.includes("this.turnCoordinator = createQueuedFollowUps("), true);
for (const generatedName of ["EC", "WSe", "DC", "GSe", "OC", "KSe", "qSe", "eCe", "zC", "XCe", "nwe", "iwe", "awe"])
  equal(main.includes(`function ${generatedName}(`), false);
equal(main.includes("controlFallbackValue(e) !== e.currentValue"), true);

console.log(`${assertions} main queued follow-ups owner assertions passed`);
