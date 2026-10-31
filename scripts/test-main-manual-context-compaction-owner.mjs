import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/threads/context-compaction.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const helperCalls = [];
const findDraftTurn = (conversation, predicate) => {
  helperCalls.push(["find", conversation]);
  const turns = conversation.turnHistory?.history?.entities ?? conversation.turns;
  return [...turns].reverse().find(predicate) ?? null;
};
const removeTurn = (conversation, turn) => {
  helperCalls.push(["remove", turn]);
  const turns = conversation.turnHistory?.history?.entities ?? conversation.turns;
  turns.splice(turns.indexOf(turn), 1);
};
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)(
  (specifier) => {
    if (specifier === "../turns/canonical-history") return { findDraftTurn, removeTurn };
    throw new Error(`unexpected require ${specifier}`);
  },
  module,
  module.exports,
);
const { ManualContextCompactionTracker, Bve } = module.exports;
equal(Bve, ManualContextCompactionTracker);

const pendingItems = [];
let updates = 0;
const older = {
  turnId: "server-turn",
  status: "completed",
  items: [{ id: "pending-manual-context-compaction" }],
};
const latest = {
  turnId: null,
  status: "inProgress",
  items: [{ id: "pending-manual-context-compaction" }],
};
const conversation = {
  id: "thread-1",
  turns: [],
  turnHistory: { kind: "canonical", history: { entities: [older, latest] } },
};
const tracker = new ManualContextCompactionTracker(
  {
    updateConversationState(id, update) {
      equal(id, "thread-1");
      updates += 1;
      update(conversation);
    },
  },
  (id, item) => pendingItems.push([id, item]),
);

tracker.register("thread-1");
tracker.register("thread-1");
equal(pendingItems, [
  ["thread-1", { type: "contextCompaction", id: "pending-manual-context-compaction", completed: false, source: "manual" }],
  ["thread-1", { type: "contextCompaction", id: "pending-manual-context-compaction", completed: false, source: "manual" }],
]);
tracker.remove("thread-1");
equal(updates, 0);
tracker.remove("thread-1");
equal(updates, 1);
equal(conversation.turnHistory.history.entities, [older]);
equal(older.items, [{ id: "pending-manual-context-compaction" }]);
equal(helperCalls.map(([kind]) => kind), ["find", "remove"]);

tracker.register("thread-1");
equal(tracker.consumeSource("thread-1"), "manual");
equal(tracker.consumeSource("thread-1"), "automatic");
tracker.register("thread-1");
tracker.clearConversation("thread-1");
equal(tracker.consumeSource("thread-1"), "automatic");

equal(source.includes('from "../turns/canonical-history"'), true);
equal(source.includes("findDraftTurn(state"), true);
equal(source.includes("removeTurn(state, turn)"), true);
equal(source.includes("for (const turn of conversation.turns"), false);

const manager = fs.readFileSync(
  new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url),
  "utf8",
);
equal(manager.includes('import { Bve as ManualContextCompactionTracker } from "../threads/context-compaction"'), true);
equal(manager.includes("new ManualContextCompactionTracker(this.threadStore"), true);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("var Sy = `pending-manual-context-compaction`"), false);
equal(main.includes("Bve = class"), false);

console.log(`${assertions} main manual context compaction owner assertions passed`);
