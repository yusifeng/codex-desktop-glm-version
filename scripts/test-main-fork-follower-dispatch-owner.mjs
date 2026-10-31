import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
async function load(relativePath, requireStub) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
  const module = { exports: {} };
  Function("require", "module", "exports", transpiled.code)(requireStub, module, module.exports);
  return { owner: module.exports, source };
}

const { owner: operations } = await load("../src/main/main-app/threads/operations.ts", (specifier) => {
  if (specifier === "@chunk/shared") return { Zo: (error) => error instanceof Error ? error.message : String(error) };
  throw new Error(`unexpected operations require ${specifier}`);
});

const modernCalls = [];
const modernManager = {
  getConversation: () => ({ historyMode: "paginated", title: "Source" }),
  requestClient: { getAppServerVersion: () => "0.100.0" },
  forkConversationFromLatest: async (params) => (modernCalls.push(params), { status: "created" }),
};
await operations.uve(modernManager, {
  sourceConversationId: "source-1",
  targetTurnId: "turn-2",
  sourceTitle: "Fork",
}, () => -1);
equal(modernCalls, [{ sourceConversationId: "source-1", sourceTitle: "Fork", lastTurnId: "turn-2" }]);

const legacyCalls = [];
const forked = { title: "Fork", historyMode: "eager" };
const legacyManager = {
  getConversation: (id) => id === "source-2" ? { historyMode: "eager", title: "Original" } : forked,
  requestClient: { getAppServerVersion: () => "0.142.0" },
  getCompleteConversationTurns: async () => [{ turnId: "turn-1" }, { turnId: "turn-2" }, { turnId: "turn-3" }],
  forkConversationFromLatest: async (params) => (legacyCalls.push(["fork", params]), {
    status: "created", conversationId: "fork-2", synchronization: { status: "succeeded" },
  }),
  sendRequest: async (...args) => (legacyCalls.push(["request", ...args]), { thread: { id: "fork-2" } }),
  applyRollbackResponseToConversation: (params) => legacyCalls.push(["apply", params]),
  addForkedFromConversationSyntheticItem: (...args) => legacyCalls.push(["synthetic", ...args]),
};
const legacyResult = await operations.uve(legacyManager, {
  sourceConversationId: "source-2", targetTurnId: "turn-2", sourceTitle: undefined,
}, () => -1);
equal(legacyResult.conversationId, "fork-2");
equal(legacyCalls[0], ["fork", { sourceConversationId: "source-2", sourceTitle: undefined, addForkedSyntheticItem: false }]);
equal(legacyCalls[1], ["request", "thread/rollback", { threadId: "fork-2", numTurns: 1 }]);
equal(legacyCalls.at(-1), ["synthetic", "fork-2", "source-2", "Original"]);

legacyManager.sendRequest = async () => { throw new Error("rollback failed"); };
const failed = await operations.uve(legacyManager, {
  sourceConversationId: "source-2", targetTurnId: "turn-2",
}, () => -1);
equal(failed, {
  status: "created", conversationId: "fork-2",
  synchronization: { status: "failed", message: "rollback failed" },
});
await assert.rejects(
  operations.uve(legacyManager, { sourceConversationId: "source-2", targetTurnId: "missing" }, () => -1),
  /Target turn not found/,
);
assertions += 1;

const { owner: followers } = await load("../src/main/main-app/files/open-file-watches.ts", (specifier) => {
  if (specifier === "@chunk/shared") return {
    Wn: class ResumeNotReadyError extends Error {},
    Zo: (error) => error instanceof Error ? error.message : String(error),
  };
  if (specifier === "../turns/canonical-history") return {
    hasCompleteHistory: (conversation) => conversation.complete === true,
    mergedConversationTurns: (conversation) => conversation.turns ?? [],
    lastIncompleteTurn: () => null,
    lastTurn: () => null,
  };
  throw new Error(`unexpected follower require ${specifier}`);
});

const dispatchCalls = [];
const dispatchManager = {
  assertThreadFollowerOwner: (id) => dispatchCalls.push(["assert", id]),
  startTurn: async (...args) => (dispatchCalls.push(["start", ...args]), { turnId: "turn-new" }),
  updateThreadSettingsForNextTurn: async (...args) => (dispatchCalls.push(["next", ...args]), false),
  updateThreadPermissions: async (...args) => dispatchCalls.push(["permissions", ...args]),
};
equal(await followers.handleThreadFollowerRequest(dispatchManager, {
  method: "thread-follower-start-turn", params: { conversationId: "thread-1", turnStart: { input: [] } },
}), { method: "thread-follower-start-turn", result: { result: { turnId: "turn-new" } } });
equal(await followers.handleThreadFollowerRequest(dispatchManager, {
  method: "thread-follower-update-thread-settings",
  params: { conversationId: "thread-1", activeTurnId: null, threadSettings: { model: "gpt" }, condition: "idle" },
}), { method: "thread-follower-update-thread-settings", result: { applied: false } });
equal(await followers.handleThreadFollowerRequest(dispatchManager, {
  method: "thread-follower-update-thread-settings",
  params: { conversationId: "thread-1", activeTurnId: "turn-1", threadSettings: { sandbox: "write" } },
}), { method: "thread-follower-update-thread-settings", result: { applied: true } });
equal(dispatchCalls.some(([kind]) => kind === "permissions"), true);

const stopError = new Error("goal pause failed");
stopError.interruptedTurnId = "turn-paused";
dispatchManager.interruptConversation = async () => { throw stopError; };
equal(await followers.handleThreadFollowerRequest(dispatchManager, {
  method: "thread-follower-interrupt-turn",
  params: { conversationId: "thread-1", mode: "user-stop", expectedTurnId: "turn-1" },
}), {
  method: "thread-follower-interrupt-turn",
  result: { interruptedTurnId: "turn-paused", goalPauseError: "goal pause failed", ok: true },
});

let revision = 4;
Object.assign(dispatchManager, {
  getConversation: () => ({ complete: false }),
  getConversationStreamRevision: () => revision,
  getCompleteConversationTurns: async () => { revision = 5; },
  broadcastConversationSnapshot: () => 9,
});
equal(await followers.handleThreadFollowerRequest(dispatchManager, {
  method: "thread-follower-load-complete-history", params: { conversationId: "thread-1" },
}), { method: "thread-follower-load-complete-history", result: { revision: 5 } });

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/files/open-file-watches.js")'), true);
equal(main.includes("async function uve("), false);
equal(main.includes("async function dve("), false);
const managerSource = fs.readFileSync(new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url), "utf8");
equal(managerSource.includes("uve as forkConversationFromTurn"), true);

console.log(`${assertions} main fork and follower dispatch owner assertions passed`);
