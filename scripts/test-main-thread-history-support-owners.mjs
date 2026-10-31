import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

async function load(relativePath, requireStub) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
  const module = { exports: {} };
  Function("require", "module", "exports", transpiled.code)(requireStub, module, module.exports);
  return { exports: module.exports, source, transpiled: transpiled.code };
}

const boundaries = await load(
  "../src/main/main-app/turns/history-boundaries.ts",
  (specifier) => {
    if (specifier === "./canonical-history") return {};
    throw new Error(`unexpected boundary require ${specifier}`);
  },
);
const history = {
  generation: 3,
  entitiesByKey: {
    "turn:a": { turnId: "a" },
    "turn:b": { turnId: "b" },
  },
  islands: [{
    id: "tail",
    entries: [{ key: "a", value: "turn:a" }, { key: "b", value: "turn:b" }],
    olderBoundary: {
      status: "available",
      boundaryId: "tail:older",
      progressKey: "cursor-1",
      handle: { source: "compact", cursor: "cursor", oldestLoadedTurnId: "a" },
    },
    newerBoundary: { status: "exhausted", boundaryId: "tail:newer" },
  }],
};
const handle = boundaries.exports.findAvailableBoundaryHandle(history, false);
equal(handle.edge, "older");
equal(handle.generation, 3);
equal(handle.islandId, "tail");
equal(boundaries.exports.matchesTailBoundary(history, handle), true);
equal(boundaries.exports.matchesTailBoundary(history, { ...handle, progressKey: "stale" }), false);
equal(boundaries.exports.tailContainsTurnId(history, "a"), true);
equal(boundaries.exports.tailContainsTurnId(history, "missing"), false);
equal(boundaries.exports.tailContainsTurnId(history, null), false);

const multiIsland = {
  ...history,
  islands: [
    { id: "empty", entries: [], olderBoundary: { status: "exhausted" }, newerBoundary: { status: "exhausted" } },
    history.islands[0],
  ],
};
equal(boundaries.exports.findAvailableBoundaryHandle(multiIsland, true).islandId, "tail");

const normalization = await load(
  "../src/main/main-app/threads/state-normalization.ts",
  (specifier) => {
    if (specifier === "../turns/history-requests")
      return { defaultTurnsPagination: () => ({ hasLoadedOldest: true, olderCursor: null }) };
    if (specifier === "../turns/canonical-history") return {};
    throw new Error(`unexpected normalization require ${specifier}`);
  },
);
equal(normalization.exports.coerceTimestamp(new Date(1234)), 1234);
equal(normalization.exports.coerceTimestamp("5678"), 5678);
equal(normalization.exports.coerceTimestamp("2020-01-01T00:00:00Z"), 1577836800000);
equal(normalization.exports.coerceTimestamp(Number.NaN), null);
equal(normalization.exports.coerceTimestamp("not-a-date"), null);

const normalized = normalization.exports.normalizeConversationState({
  id: "thread",
  createdAt: "100",
  updatedAt: "200",
  recencyAt: "300",
  turns: [{
    turnId: "legacy",
    turnStartedAtMs: "400",
    firstTurnWorkItemStartedAtMs: new Date(500),
    finalAssistantStartedAtMs: null,
    params: { input: [] },
    items: [],
  }],
  turnHistory: { kind: "canonical", history: {
    islands: [],
    entitiesByKey: { canonical: {
      turnId: "canonical",
      turnStartedAtMs: "600",
      durationMs: 10,
      params: { input: [] },
      items: [],
    } },
  } },
}, "host");
equal(normalized.hostId, "host");
equal(normalized.workspaceKind, "project");
equal(normalized.title, null);
equal(normalized.createdAt, 100);
equal(normalized.turns[0].turnStartedAtMs, 400);
equal(normalized.turns[0].firstTurnWorkItemStartedAtMs, 500);
equal(normalized.turns[0].durationMs, null);
equal(normalized.turnHistory.history.entitiesByKey.canonical.turnStartedAtMs, 600);
equal(normalized.turnHistory.history.entitiesByKey.canonical.durationMs, 10);

const streamRoles = await load(
  "../src/main/main-app/threads/stream-roles.ts",
  () => ({}),
);
const ast = acorn.parse(streamRoles.transpiled, { ecmaVersion: "latest", sourceType: "script" });
const classNode = ast.body.find(
  (node) => node.type === "ClassDeclaration" && node.id?.name === "SubscriptionRegistry",
);
assert.ok(classNode, "SubscriptionRegistry should survive TypeScript transformation");
assertions += 1;
const classSource = streamRoles.transpiled.slice(classNode.start, classNode.end);
const SubscriptionRegistry = Function(`${classSource}; return SubscriptionRegistry;`)();
const conversation = { id: "thread" };
const selectedTurn = { items: [{ id: "first", value: 1 }, { id: "second", value: 2 }] };
const owner = {
  getRecentThreads: () => ["recent"],
  getTranscript: () => ["transcript"],
  getConversation: () => conversation,
  getTurn: () => selectedTurn,
  threadFieldReaders: { title: () => "title" },
  turnFieldReaders: { status: () => "completed" },
};
const registry = new SubscriptionRegistry(owner);
const hostValues = [];
const unsubscribeHost = registry.subscribe({
  type: "host", field: "threads", listener: (value) => hostValues.push(value),
});
equal(hostValues, [["recent"]]);
registry.notifyHostField("threads");
equal(hostValues, [["recent"], ["recent"]]);
unsubscribeHost();
registry.notifyHostField("threads");
equal(hostValues.length, 2);

const transcriptValues = [];
const unsubscribeTranscript = registry.subscribe({
  type: "conversation", key: { threadId: "thread" }, listener: (value) => transcriptValues.push(value),
});
equal(registry.hasConversationSubscribers("thread"), true);
equal(transcriptValues, [["transcript"]]);
registry.notifyTranscript("thread", ["provided"]);
equal(transcriptValues.at(-1), ["provided"]);
unsubscribeTranscript();
equal(registry.hasConversationSubscribers("thread"), false);

const itemValues = [];
const unsubscribeItem = registry.subscribe({
  type: "item",
  key: { threadId: "thread", entityKey: "turn", itemId: "second" },
  listener: (value) => itemValues.push(value),
});
equal(itemValues, [{ id: "second", value: 2 }]);
selectedTurn.items[1] = { id: "second", value: 3 };
for (const listener of registry.get("thread").get("item:turn").get("second").listeners) listener();
equal(itemValues.at(-1), { id: "second", value: 3 });
unsubscribeItem();
equal(registry.get("thread"), undefined);

console.log(`${assertions} main thread history support owner assertions passed`);
