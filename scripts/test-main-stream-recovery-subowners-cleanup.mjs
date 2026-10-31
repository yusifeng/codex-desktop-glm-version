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
  new URL("../src/main/main-app/conversation/stream-recovery.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const classes = new Map(
  ast.body
    .filter((node) => node.type === "ClassDeclaration")
    .map((node) => [node.id?.name, node]),
);
equal(classes.get("StreamRecovery")?.body.body.length, 18);
equal(classes.get("TurnStartObservations")?.body.body.length, 20);

const deferralSource = fs.readFileSync(
  new URL("../src/main/main-app/conversation/notification-deferral.ts", import.meta.url),
  "utf8",
);
const deferralTranspiled = await transform(deferralSource, { loader: "ts", format: "esm", target: "es2022" });
const deferralAst = acorn.parse(deferralTranspiled.code, { ecmaVersion: "latest", sourceType: "module" });
const deferralClasses = new Map(deferralAst.body.filter((node) => node.type === "ClassDeclaration").map((node) => [node.id?.name, node]));
equal(deferralClasses.get("ThreadStartedNotificationDeferral")?.body.body.length, 18);
equal(deferralClasses.get("UnreadTurnState")?.body.body.length, 10);
equal(deferralClasses.get("PrewarmedThreadManager")?.body.body.length, 10);

const observationNode = classes.get("TurnStartObservations");
const observationSource = transpiled.code.slice(observationNode.start, observationNode.end);
const TurnStartObservations = Function(
  `${observationSource}; return TurnStartObservations;`,
)();
const events = [];
let capturedContext;
const warnings = [];
const observations = new TurnStartObservations(
  "local",
  { warning: (...args) => warnings.push(args) },
  (context, register) => {
    capturedContext = context;
    register({
      isCurrent: () => true,
      onAccepted: (turnId) => {
        events.push(["accepted", turnId]);
        return true;
      },
      async onCompleted(completion) {
        events.push(["completed", completion.turnId]);
      },
      dispose() {
        events.push(["disposed"]);
      },
    });
  },
);
let ownerCurrent = true;
const handle = observations.begin("thread-1", () => ownerCurrent);
equal(capturedContext, {
  conversationId: "thread-1",
  hostId: "local",
  isCurrent: capturedContext.isCurrent,
});
equal(capturedContext.isCurrent(), true);
handle.dispatched();
observations.observeStart("thread-1", "turn-1");
handle.accepted("turn-1");
observations.observeCompletion({ conversationId: "thread-1", turnId: "turn-1", status: "completed" });
for (let index = 0; index < 10; index += 1) await Promise.resolve();
equal(events, [["accepted", "turn-1"], ["completed", "turn-1"], ["disposed"]]);
equal(observations.requests.size, 0);
equal(warnings, []);

const canceledEvents = [];
const canceled = new TurnStartObservations("local", { warning() {} }, (_context, register) => {
  register({
    isCurrent: () => true,
    onAccepted: () => true,
    onCompleted: () => null,
    dispose: () => canceledEvents.push("disposed"),
  });
});
const canceledHandle = canceled.begin("thread-2", () => ownerCurrent);
canceledHandle.cancel();
equal(canceledEvents, ["disposed"]);
equal(canceled.requests.size, 0);
ownerCurrent = false;

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(/\bcSe\b/.test(main), false);
equal(/\blSe\b/.test(main), false);
for (const generatedName of ["bC", "mSe", "xC", "SC", "hSe", "gSe", "xSe", "SSe", "CSe", "wSe", "TSe", "ESe", "DSe", "OSe", "kSe"])
  equal(new RegExp(`\\b${generatedName}\\b`).test(main), false);

const manager = fs.readFileSync(
  new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url),
  "utf8",
);
equal(manager.includes('import { TurnStartObservations } from "./stream-recovery"'), true);
equal(manager.includes('import { StreamRecovery, ResumeNotificationBuffer } from "./stream-recovery"'), true);
equal(manager.includes("new TurnStartObservations("), true);
equal(manager.includes("new StreamRecovery({"), true);

console.log(`${assertions} main stream recovery subowner cleanup assertions passed`);
