import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/threads/history-policy.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const automationDetector = { isAutomationUserInput: () => false, isAutomationAssistantMessage: () => false };
const calls = [];
const projectItems = (items) => { calls.push(["items", items]); return ["projected-items"]; };
const projectTurns = (input) => { calls.push(["turns", input]); return ["projected-turns"]; };
const attachmentsFromInput = (input) => { calls.push(["attachments", input]); return [{ path: "/attachment" }]; };
const mergeTurnLists = (left, right, options) => { calls.push(["merge", left, right, options]); return ["merged"]; };
class ArchivedThreadPreviewRead {}
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)(
  (specifier) => {
    if (specifier === "./archived-preview") return { ArchivedThreadPreviewRead };
    if (specifier === "@chunk/shared") return {
      Cs: (hostId) => hostId === "durable",
      kd: () => ({ approvalPolicy: "on-request", approvalsReviewer: null, sandboxPolicy: { type: "workspaceWrite" } }),
    };
    if (specifier === "./automation-detector") return { AUTOMATION_DETECTOR: automationDetector };
    if (specifier === "./hydration") return { attachmentsFromInput, projectItems, projectTurns };
    if (specifier === "../turns/item-merge") return { mergeTurnLists };
    if (specifier === "../turns/canonical-history") return {
      exhaustedTailIsland: (history) => history.islands.at(-1)?.newerBoundary?.status === "exhausted" ? history.islands.at(-1) : null,
      lastTurnWithTurnId: () => null,
      appendHistoryIsland: (history, segment, adapter) => ({
        ...history,
        islands: [...history.islands, {
          id: segment.id,
          entries: segment.entries.sort((a, b) => adapter.getPosition(a) - adapter.getPosition(b)),
          olderBoundary: segment.olderBoundary,
          newerBoundary: segment.newerBoundary,
        }],
      }),
    };
    if (specifier === "../turns/history-requests") return { listTurnItems: async () => { throw new Error("unexpected item page"); } };
    if (specifier === "../vendor/immer") return { freezeIdentity: (value) => value };
    throw new Error(`unexpected require ${specifier}`);
  },
  module,
  module.exports,
);
const policyModule = module.exports;
const policy = policyModule.Cve;

equal(policy.turnMergePolicy, automationDetector);
equal(policy.mapThreadItems([1]), ["projected-items"]);
equal(policy.mapThreadTurns({ turns: [2] }), ["projected-turns"]);
equal(policy.mergeTurns([{ turnId: "a" }], [{ turnId: "b" }], { isResumeSnapshot: true }), ["merged"]);
equal(calls.at(-1), [
  "merge",
  [{ turnId: "a" }],
  [{ turnId: "b" }],
  { isResumeSnapshot: true, policy: automationDetector },
]);
const turn = { params: { model: "gpt" } };
const item = { type: "userMessage", content: [{ type: "text", text: "hello" }], clientId: "client" };
policy.applyOldestUserInput(turn, item);
equal(turn, {
  params: {
    model: "gpt",
    input: item.content,
    clientUserMessageId: "client",
    attachments: [{ path: "/attachment" }],
  },
});
equal(calls.at(-1), ["attachments", item.content]);
equal(policyModule.Tve("durable", true, false), 50);
equal(policyModule.Tve("local", false, false), 50);
equal(policyModule.Tve("local", true, true), 0);
equal(policyModule.Tve("local", true, false), 500);
equal(policyModule.yve, ArchivedThreadPreviewRead);
equal(policyModule.uy({
  turns: [{ turnId: "draft" }],
  turnHistory: { kind: "canonical", history: {
    islands: [{ entries: [{ value: "remote" }], newerBoundary: { status: "available" } }],
    entitiesByKey: { remote: { turnId: "remote" } },
  } },
}, { mergeTurns: (left, right) => [...left, ...right] }), [{ turnId: "draft" }]);

const searchConversation = {
  cwd: "/work", latestModel: "gpt", latestReasoningEffort: "high", turns: [],
  turnHistory: { kind: "canonical", history: { generation: 0, isComplete: false, islands: [], entitiesByKey: {} } },
};
let snapshots = 0;
await policyModule.bve({
  getConversation: () => searchConversation,
  listThreadTurns: async (_id, options) => ({
    response: { data: [{ id: "turn-search", items: [{ id: "item-search" }], startedAt: 10 }], nextCursor: null },
    itemsPaginationByTurnId: { "turn-search": { hasLoadedOldest: true } },
  }),
  updateConversationState: (_id, update) => update(searchConversation),
  broadcastConversationSnapshot: () => { snapshots += 1; },
  sendRequest: async () => { throw new Error("unexpected request"); },
}, {
  mapThreadTurns: ({ turns }) => turns.map((entry) => ({ turnId: entry.id, items: entry.items, turnStartedAtMs: entry.startedAt })),
  createSearchIslandId: () => "match-1",
}, { conversationId: "thread-search", itemId: "item-search", turnCursor: "cursor", turnId: "turn-search" });
equal(searchConversation.turnHistory.history.islands[0].id, "search:match-1");
equal(searchConversation.turnHistory.history.entitiesByKey["turn:turn-search"].items[0].id, "item-search");
equal(snapshots, 1);

const hydration = fs.readFileSync(new URL("../src/main/main-app/threads/hydration.ts", import.meta.url), "utf8");
equal(hydration.includes("export function projectItems("), true);
equal(source.includes('import { mergeTurnLists } from "../turns/item-merge"'), true);
equal(source.includes('import { AUTOMATION_DETECTOR } from "./automation-detector"'), true);
equal(source.includes("exhaustedTailIsland"), true);
equal(source.includes("turnMergePolicy: {}"), false);

const previewSource = fs.readFileSync(new URL("../src/main/main-app/threads/archived-preview.ts", import.meta.url), "utf8");
equal(previewSource.includes('from "./history-policy"'), false);

const manager = fs.readFileSync(new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url), "utf8");
equal(manager.includes('import { Cve as historyPolicyDefaults, Tve as recentHistoryLimit } from "../threads/history-policy"'), true);
equal(manager.includes("historyPolicyDefaults"), true);
equal(manager.includes("recentHistoryLimit("), true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("var Cve = {"), false);
equal(main.includes("function Tve("), false);
equal(main.includes("function wve("), false);
equal(main.includes("yve = class"), false);
equal(main.includes("function uy("), false);
equal(main.includes("async function bve("), false);
equal(main.includes("function xve("), false);
equal(main.includes("function Sve("), false);
equal(main.includes('const { AppServerConversationManager } = require("./main-app/conversation/app-server-manager.js");'), true);

console.log(`${assertions} main thread history policy owner assertions passed`);
