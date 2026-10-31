import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/streams/notifications-apply.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)((specifier) => {
  if (specifier === "@chunk/shared") return { $u: String, Zo: (error) => error instanceof Error ? error.message : String(error) };
  if (specifier === "../turns/canonical-history") return {
    conversationTurns: (conversation) => conversation.turns,
    findTurnById: (conversation, id) => conversation.turns.find((turn) => turn.turnId === id) ?? null,
    lastTurnWithTurnId: (conversation) => [...conversation.turns].reverse().find((turn) => turn.turnId != null) ?? null,
    mergedConversationTurns: (conversation) => conversation.turns,
  };
  if (specifier === "../threads/patch-classification") return { applyThreadSettingsUpdate() {} };
  throw new Error(`unexpected require ${specifier}`);
}, module, module.exports);
const owner = module.exports;

const calls = [];
const state = { id: "server-thread", sessionId: "session", turns: [{ turnId: "turn-1", status: "inProgress" }] };
const base = {
  conversationId: "thread-1", conversationState: state, expectedTurnId: null,
  killNodeReplExecutions: (_session, turnId) => ({ result: Promise.resolve({ failedCount: 0 }), cancel: () => calls.push(["cancel", turnId]) }),
  onTurnInterruptStarted: () => calls.push(["started"]), schedule: () => () => {}, backgroundCleanup: false,
  cleanBackgroundTerminals: async () => calls.push(["clean-terminals"]),
  logger: { warning: (...args) => calls.push(["warning", ...args]) },
  sendInterruptRequest: async (...args) => calls.push(["request", ...args]),
  updateConversationState: (_id, update) => update(state),
};
equal(await owner.interruptConversationCore(base), "turn-1");
equal(calls[0], ["started"]);
equal(calls.some((entry) => entry[0] === "request" && entry[1] === "server-thread" && entry[2] === "turn-1"), true);
equal(state.turns[0].status, "interrupted");

state.turns = [{ turnId: "turn-old", status: "inProgress" }, { turnId: "turn-new", status: "inProgress" }];
let requestCount = 0;
const mismatchCalls = [];
equal(await owner.interruptConversationCore({
  ...base, conversationState: state,
  onTurnInterruptStarted: () => mismatchCalls.push("started"),
  killNodeReplExecutions: (_session, id) => (mismatchCalls.push(id), { result: Promise.resolve({ failedCount: 0 }), cancel() {} }),
  sendInterruptRequest: async () => { if (requestCount++ === 0) throw new Error("expected active turn id `turn-new` but found `turn-actual`"); },
}), "turn-actual");
equal(mismatchCalls.includes("turn-new"), true);
equal(mismatchCalls.includes("turn-actual"), true);

state.turns = [{ turnId: "turn-idle", status: "completed" }];
equal(await owner.interruptConversationCore({ ...base, conversationState: state }), null);
equal(calls.some((entry) => entry[0] === "clean-terminals"), true);

const localChild = { id: "child-local", status: { type: "active" } };
const remoteChild = { id: "child-remote", status: { type: "active" } };
const descendantCalls = [];
await owner.interruptSubagentDescendants({
  logger: { warning: (...args) => descendantCalls.push(["warning", ...args]) }, conversationId: "parent",
  conversations: new Map([["child-local", { resumeState: "resumed", turns: [{ turnId: "local-turn", status: "inProgress" }] }]]),
  getDescendantSnapshot: () => ({ descendantThreads: [localChild] }),
  discoverDescendantSnapshot: async () => ({ descendantThreads: [localChild, remoteChild] }),
  interruptConversationSelf: async (id) => (descendantCalls.push(["local", id]), id === "child-local" ? "local-turn" : null),
  listThreadTurns: async (id) => (descendantCalls.push(["list", id]), { data: [{ id: "remote-turn", status: "inProgress" }] }),
  interruptTurn: async (...args) => descendantCalls.push(["remote", ...args]),
});
equal(descendantCalls.filter(([kind, id]) => kind === "local" && id === "child-local").length, 1);
equal(descendantCalls.some((entry) => entry[0] === "remote" && entry[1] === "child-remote" && entry[2] === "remote-turn"), true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
for (const name of ["my", "hy", "gy", "_y", "jve"]) equal(main.includes(`function ${name}(`), false);
for (const name of ["Ove", "kve", "Ave"]) equal(main.includes(`async function ${name}(`), false);

console.log(`${assertions} main interrupt owner assertions passed`);
