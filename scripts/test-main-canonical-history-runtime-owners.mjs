import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const ok = (value, message) => {
  assert.ok(value, message);
  assertions += 1;
};

async function loadTypeScript(relativePath, requireStub) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const transpiled = await transform(source, {
    loader: "ts",
    format: "cjs",
    target: "es2022",
  });
  const module = { exports: {} };
  Function("require", "module", "exports", transpiled.code)(requireStub, module, module.exports);
  return module.exports;
}

const freezeIdentity = (value) => value;
const canonical = await loadTypeScript(
  "../src/main/main-app/turns/canonical-history.ts",
  (specifier) => {
    if (specifier === "../vendor/immer") return { freezeIdentity };
    if (specifier === "../util/lodash-interop")
      return {
        findLast: (values, predicate) => [...(values ?? [])].reverse().find(predicate),
      };
    if (specifier === "./item-merge")
      return {
        mergeTurnLists: (existing, incoming) => [
          ...existing.map((turn) => {
            const next = incoming.find((candidate) => candidate.turnId === turn.turnId);
            return next == null ? turn : { ...turn, ...next };
          }),
          ...incoming.filter(
            (turn) => !existing.some((candidate) => candidate.turnId === turn.turnId),
          ),
        ],
      };
    throw new Error(`unexpected canonical require ${specifier}`);
  },
);

const turn = (turnId, overrides = {}) => ({
  turnId,
  turnStartedAtMs: 1,
  status: "completed",
  error: null,
  params: { input: [], toolOutput: null },
  items: [],
  ...overrides,
});
const legacy = {
  id: "legacy",
  turns: [turn("a"), turn("b")],
  resumeState: "resumed",
  turnsPagination: { hasLoadedOldest: true },
};

equal(canonical.canonicalHistory(legacy), null);
equal(canonical.conversationTurns(legacy).map((value) => value.turnId), ["a", "b"]);
equal(canonical.lastTurn(legacy).turnId, "b");
equal(canonical.lastTurnWithTurnId(legacy).turnId, "b");
equal(canonical.historyTurnCount(legacy), 2);
equal(canonical.hasCompleteHistory(legacy), true);
equal(canonical.completeHistoryEntities(legacy), legacy.turns);

const built = canonical.buildExhaustedTailHistory([turn("a"), turn("b")], 4);
equal(built.generation, 4);
equal(built.isComplete, true);
equal(built.islands[0].entries.map((entry) => entry.value), ["turn:a", "turn:b"]);
equal(canonical.allHistoryEntities(built).map((value) => value.turnId), ["a", "b"]);
equal(canonical.exhaustedTailIsland(built).id, "tail:4");

const canonicalConversation = {
  id: "canonical",
  turns: [],
  turnHistory: { kind: "canonical", history: built },
};
equal(canonical.conversationTurns(canonicalConversation).map((value) => value.turnId), ["a", "b"]);
equal(canonical.findTurnById(canonicalConversation, "a").turnId, "a");
equal(canonical.latestTurn(canonicalConversation).turnId, "b");
equal(canonical.findLatestTurnEntry(canonicalConversation).entityKey, "turn:b");
equal(canonical.findTurnEntity(canonicalConversation, (value) => value.turnId === "a").turnId, "a");
equal(canonical.findTurnEntry(canonicalConversation, (value) => value.turnId === "a").entityKey, "turn:a");

const bounded = canonical.buildBoundedTailHistory(
  [turn("b")],
  { source: "timeline", cursor: "older", oldestLoadedTurnId: "b" },
  2,
);
equal(bounded.isComplete, false);
equal(bounded.islands[0].olderBoundary.status, "available");
equal(bounded.islands[0].olderBoundary.progressKey, JSON.stringify(["older", "b"]));
equal(canonical.listHistorySegments(bounded).map((segment) => segment.type), ["gap", "content"]);
equal(canonical.listHistorySegments(bounded)[0].newerBoundaryRef.handle.cursor, "older");

const adapter = {
  getIdentity: (value) => value,
  getPosition: (entry) => Number(entry.value.slice(1)),
  merge: (_existing, incoming) => incoming,
};
const emptyHistory = { generation: 0, isComplete: false, islands: [], entitiesByKey: {} };
const withIsland = canonical.appendHistoryIsland(
  emptyHistory,
  {
    id: "island",
    entries: [{ key: "k2", value: "v2" }, { key: "k1", value: "v1" }],
    olderBoundary: {
      status: "available",
      handle: { source: "compact", cursor: "c1", oldestLoadedTurnId: null },
      progressKey: "p1",
    },
    newerBoundary: { status: "exhausted" },
  },
  adapter,
);
equal(withIsland.islands[0].entries.map((entry) => entry.value), ["v1", "v2"]);
equal(withIsland.islands[0].olderBoundary.boundaryId, "island:older");
equal(withIsland.isComplete, false);
assert.throws(
  () => canonical.appendHistoryIsland(withIsland, {
    id: "island", entries: [], olderBoundary: { status: "exhausted" }, newerBoundary: { status: "exhausted" },
  }, adapter),
  /Duplicate history island ID/,
);
assertions += 1;

const boundary = {
  edge: "older",
  generation: 0,
  islandId: "island",
  boundaryId: "island:older",
  progressKey: "p1",
  handle: { source: "compact", cursor: "c1", oldestLoadedTurnId: null },
};
equal(
  canonical.applyHistoryBoundarySegment(withIsland, {
    boundary: { ...boundary, generation: 99 },
    segment: { entries: [], olderBoundary: { status: "exhausted" }, newerBoundary: { status: "exhausted" } },
  }, adapter).status,
  "stale",
);
const applied = canonical.applyHistoryBoundarySegment(withIsland, {
  boundary,
  segment: {
    entries: [{ key: "k0", value: "v0" }],
    olderBoundary: { status: "exhausted" },
    newerBoundary: { status: "exhausted" },
  },
}, adapter);
equal(applied.status, "applied");
equal(applied.topology.islands[0].entries.map((entry) => entry.value), ["v0", "v1", "v2"]);
equal(applied.topology.isComplete, true);

const mutable = { id: "mutable", turns: [turn("legacy")] };
canonical.applyCanonicalTurns(mutable, [turn("server", {
  itemsPagination: { isLoadingOlder: true, hasLoadedOldest: true },
})], true, null);
equal(mutable.turns, []);
equal(mutable.turnHistory.kind, "canonical");
equal(mutable.turnHistory.history.entitiesByKey["turn:server"].itemsPagination.isLoadingOlder, false);
equal(mutable.turnHistory.history.generation, 0);

const ids = ["island", "entity"];
const appended = canonical.appendConversationTurn(mutable, turn(null), () => ids.shift());
equal(canonical.latestTurn(mutable), appended);
equal(mutable.turnHistory.history.islands.at(-1).id, "tail:0");
canonical.removeTurn(mutable, appended);
equal(canonical.latestTurn(mutable).turnId, "server");

const commandTurn = turn("command", {
  items: [{ id: "run", type: "commandExecution", status: "inProgress" }],
});
const commandConversation = { id: "commands", turns: [commandTurn] };
canonical.markInterruptedCommandExecutions(commandConversation);
equal(commandTurn.interruptedCommandExecutionItemIds, ["run"]);

const placeholder = turn(null, { turnStartedAtMs: null, status: "completed" });
const logs = [];
const rebound = canonical.findTurnEntryForEvent(
  { id: "events", turns: [placeholder] },
  "turn-event",
  { logger: { error: (...args) => logs.push(["error", ...args]), warning: (...args) => logs.push(["warning", ...args]) } },
);
equal(rebound.turn.turnId, "turn-event");
equal(rebound.turn.status, "inProgress");
equal(logs[0][0], "warning");

const historyRequests = await loadTypeScript(
  "../src/main/main-app/turns/history-requests.ts",
  (specifier) => {
    if (specifier === "@chunk/shared")
      return {
        $u: String,
        _s: "durable",
        kd: () => ({ approvalPolicy: "default", approvalsReviewer: "user", sandboxPolicy: "workspace-write" }),
      };
    if (specifier === "../vendor/immer")
      return {
        freezeIdentity,
        produce: (value, recipe) => {
          const draft = structuredClone(value);
          recipe(draft);
          return draft;
        },
      };
    if (specifier === "../util/lodash-interop")
      return { findLastIndex: (values, predicate) => values.findLastIndex(predicate) };
    if (specifier === "./canonical-history") return canonical;
    if (specifier === "./item-merge") return { mergeTurnLists: (_existing, incoming) => incoming };
    if (specifier === "./steering-merge")
      return { isUnboundSteeringMessage: () => false, recoverSteeringOrphans() {} };
    throw new Error(`unexpected history request require ${specifier}`);
  },
);

equal(historyRequests.defaultTurnsPagination(), {
  olderCursor: null,
  oldestLoadedTurnId: null,
  isLoadingOlder: false,
  hasLoadedOldest: true,
});
const listed = await historyRequests.listTurnItems(
  async () => ({
    data: [
      { turnId: "turn", item: { id: "new" } },
      { turnId: "turn", item: { id: "old" } },
    ],
    nextCursor: "next",
  }),
  "thread",
  "turn",
  null,
);
equal(listed.items.map((item) => item.id), ["old", "new"]);
equal(listed.nextCursor, "next");

const limits = [];
const allItems = await historyRequests.listAllTurnItems(async (_method, request) => {
  limits.push(request.limit);
  if (limits.length === 1) throw new Error("decoded message length too large");
  return request.cursor == null
    ? { data: [{ turnId: "turn", item: { id: "one" } }], nextCursor: "page-2" }
    : { data: [{ turnId: "turn", item: { id: "two" } }], nextCursor: null };
}, "thread", "turn");
equal(limits, [500, 250, 250]);
equal(allItems.map((item) => item.id), ["one", "two"]);

const timelineConversation = {
  id: "voice",
  turns: [],
  canonicalVoiceHistory: true,
  itemTimeline: { entries: [{ type: "realtime", item: { id: "live" } }] },
  realtimeItems: { live: { item: { id: "live" }, completed: false } },
};
historyRequests.applyTimelinePage(timelineConversation, {
  data: [{ type: "item", turnId: "turn", item: { id: "answer", type: "agentMessage", text: "hidden" } }],
  nextCursor: "older",
  activeRealtimeSessionAtPageStart: "session",
}, "replace");
equal(timelineConversation.itemTimeline.entries.map((entry) => entry.item.id), ["answer", "live"]);
equal(timelineConversation.itemTimeline.entries[0].item, {
  id: "answer", type: "agentMessage", completed: true,
});
equal(timelineConversation.realtimeItems.live.completed, false);

const resumeHistory = canonical.buildExhaustedTailHistory([turn("known")], 0);
const resumeConversation = { id: "resume", turns: [], turnHistory: { kind: "canonical", history: resumeHistory } };
historyRequests.reconcileResumeTurns(resumeConversation, [turn("known", { status: "failed" }), turn("new")], () => "local");
equal(resumeHistory.entitiesByKey["turn:known"].status, "failed");
equal(canonical.conversationTurns(resumeConversation).map((value) => value.turnId), ["known", "new"]);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/turns/canonical-history.js")'), true);
equal(main.includes('require("./main-app/turns/history-requests.js")'), true);
for (const oldDefinition of [
  "Eg", "Og", "kg", "Ag", "Ng", "Pg", "Ug", "p_", "m_", "w_", "j_", "Hge", "N_", "P_", "Gge",
]) equal(new RegExp(`(?:async )?function ${oldDefinition.replace("$", "\\$")}\\(`).test(main), false);
ok(main.includes("applyTimelinePage: Ug"));
ok(main.includes("fetchTurnsWithItems: w_"));

console.log(`${assertions} main canonical/history runtime owner assertions passed`);
