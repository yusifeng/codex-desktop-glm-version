import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const delegationCalls = [];
const source = fs.readFileSync(new URL("../src/main/main-app/threads/fork-rollback.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)((specifier) => {
  if (specifier === "@chunk/shared") return {
    Wn: class ResumeNotReadyError extends Error {},
    Zo: (error) => error instanceof Error ? error.message : String(error),
  };
  if (specifier === "../files/open-file-watches") return {
    delegateRequestToFollowerOwner: async (options) => {
      delegationCalls.push(options);
      return options.sendRequest(options.getStreamRole(options.conversationId));
    },
  };
  if (specifier === "./hydration") return {
    projectReadResponseTurns: (response) => response.thread.turns.map((turn) => ({ turnId: turn.id, items: [] })),
  };
  if (specifier === "../turns/canonical-history") return {
    applyConversationTurns: (conversation, turns) => { conversation.turns = turns; },
    completeHistoryEntities: (conversation) => conversation?.completeTurns ?? null,
    exhaustedTailIsland: (history) => history.islands.at(-1) ?? null,
    hasCompleteHistory: (conversation) => conversation.complete === true,
  };
  throw new Error(`unexpected require ${specifier}`);
}, module, module.exports);
const owner = module.exports;

const state = {
  cwd: "/old", latestModel: "gpt", latestReasoningEffort: "high", lastInjectedPassiveContextKey: "ctx",
  turns: [{ turnId: "stale" }], rolloutPath: "/old/rollout", originator: "old", hasUnreadTurn: true,
};
const accepted = [];
owner.applyRollbackResponse({
  updateConversationState: (_id, update) => update(state),
}, {
  conversationId: "thread-1", conversationState: state,
  rollbackResponse: { thread: {
    id: "thread-1", turns: [{ id: "turn-1" }], sessionId: "session-1", path: "/new/rollout", cwd: "/new",
    originator: "user", source: "fork", agentNickname: "helper", forkedFromId: "parent", gitInfo: { branch: "main" },
    status: { type: "idle" }, updatedAt: 10,
  } },
}, (...args) => accepted.push(args));
equal(state.turns, [{ turnId: "turn-1", items: [] }]);
equal(state.turnsPagination, { olderCursor: null, oldestLoadedTurnId: null, isLoadingOlder: false, hasLoadedOldest: true });
equal({ sessionId: state.sessionId, cwd: state.cwd, originator: state.originator, source: state.source, forkedFromId: state.forkedFromId },
  { sessionId: "session-1", cwd: "/new", originator: "user", source: "fork", forkedFromId: "parent" });
equal(state.updatedAt, 10_000);
equal("lastInjectedPassiveContextKey" in state, false);
equal(accepted, [[[ { id: "turn-1" } ]]]);

const legacy = { lastInjectedPassiveContextKey: "ctx", turns: [{ turnId: "keep" }, { turnId: "remove" }], turnsPagination: {} };
let truncated;
owner.applyRevertResponse({ updateConversationState: (_id, update) => update(legacy) }, {
  conversationId: "thread-2", revertedTurns: [{ turnId: "remove" }],
  response: { thread: { sessionId: "s2", path: "/r", cwd: "/w", status: { type: "idle" } }, turnsBackwardsCursor: "older", itemsBackwardsCursor: "items" },
}, (value) => { truncated = value; });
equal(legacy.turns, [{ turnId: "keep" }]);
equal(legacy.paginatedHistory, { itemsBackwardsCursor: "items" });
equal(truncated, true);

const canonical = {
  turns: [], turnsPagination: { olderCursor: "old", hasLoadedOldest: false },
  turnHistory: { kind: "canonical", history: {
    generation: 2, isComplete: false, entitiesByKey: { a: { turnId: "remove" }, draft: { turnId: null } },
    islands: [{ id: "tail", entries: [{ value: "a" }, { value: "draft" }], olderBoundary: {}, newerBoundary: { status: "exhausted" } }],
  } },
};
owner.applyRevertResponse({ updateConversationState: (_id, update) => update(canonical) }, {
  conversationId: "thread-3", revertedTurns: [{ turnId: "remove" }],
  response: { thread: { sessionId: "s3", status: null }, turnsBackwardsCursor: null, itemsBackwardsCursor: null },
}, () => {});
equal(canonical.turnHistory.history.generation, 3);
equal(canonical.turnHistory.history.islands[0].entries, []);
equal(canonical.turnHistory.history.entitiesByKey, {});
equal(canonical.turnHistory.history.isComplete, true);
equal(canonical.turnsPagination, { olderCursor: null, hasLoadedOldest: true, oldestLoadedTurnId: null });

let conversation = { resumeState: "resumed", complete: false, completeTurns: null };
const historyManager = {
  getConversation: () => conversation,
  isConversationSuppressedAfterArchive: () => false,
  getHostId: () => "local",
  getStreamRole: () => ({ role: "owner" }),
  loadRemainingConversationTurns: async () => { conversation = { ...conversation, complete: true, completeTurns: [{ turnId: "done" }] }; },
};
equal(await owner.getCompleteConversationTurns(historyManager, "thread-4"), [{ turnId: "done" }]);
conversation = { resumeState: "needs_resume" };
await assert.rejects(owner.getCompleteConversationTurns(historyManager, "thread-4"), /must be resumed/);
assertions += 1;

const ensureCalls = [];
conversation = { resumeState: "resumed", latestCollaborationMode: null, latestReasoningEffort: "medium" };
await owner.ensureConversationHistoryLoaded({
  ...historyManager,
  getConversation: () => conversation,
  useTailHydration: () => true,
  getConversationCwd: () => "/workspace",
  markConversationNeedsResumeForUnavailableOwner() {},
  resumeConversationForUnavailableOwner: async () => ({ status: "ready" }),
  sendThreadFollowerRequest: async (...args) => (ensureCalls.push(args), { revision: 8 }),
  waitForConversationRevision: async () => {},
  getCompleteConversationTurns: async () => ensureCalls.push(["local"]),
}, "thread-5");
equal(ensureCalls[0][1], "thread-follower-load-complete-history");
equal(ensureCalls[0][3], { timeoutMs: 305_000 });
equal(delegationCalls.length > 0, true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
for (const name of ["fve", "pve", "hve", "gve", "_ve", "cy", "ly"])
  equal(main.includes(`${name === "_ve" || name === "gve" || name === "hve" ? "async " : ""}function ${name}(`), false);
const managerSource = fs.readFileSync(new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url), "utf8");
equal(managerSource.includes("waitForConversationRevision(conversationId, ownerClientId, revision, timeoutMs)"), true);

console.log(`${assertions} main fork rollback owner assertions passed`);
