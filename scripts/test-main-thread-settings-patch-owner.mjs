import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/threads/patch-classification.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)(
  (specifier) => {
    if (specifier === "../turns/canonical-history")
      return {
        conversationTurns: (conversation) => conversation._turns,
        lastTurn: (conversation) => conversation._turns.at(-1) ?? null,
      };
    throw new Error(`unexpected require ${specifier}`);
  },
  module,
  module.exports,
);
const owner = module.exports;
equal(owner.zv, owner.applyThreadSettingsUpdate);
equal(owner.Bv, owner.buildModelSettingsUpdate);
equal(owner.Vv, owner.permissionSettingsUpdate);
equal(owner.D_e, owner.collectConversationMetrics);
equal(owner.O_e, owner.applyModelSettingsUpdate);

const collaborationMode = {
  mode: "default",
  settings: { model: "m1", reasoning_effort: "low", developer_instructions: null },
};
const conversation = {
  _turns: [{ items: [], status: "completed" }],
  latestThreadSettings: { model: "m1", effort: "low" },
  latestModel: "m1",
  latestReasoningEffort: "low",
  latestCollaborationMode: collaborationMode,
  previousTurnModel: null,
  cwd: "/old",
};
owner.applyThreadSettingsUpdate(conversation, {
  model: "m2",
  permissions: "workspace-write",
  cwd: "/new",
});
equal(conversation.latestCollaborationMode, {
  ...collaborationMode,
  settings: { ...collaborationMode.settings, model: "m2" },
});
equal(conversation.latestThreadSettings.activePermissionProfile, {
  id: "workspace-write",
  extends: null,
});
equal(conversation.latestThreadSettings.effort, "low");
equal(conversation.latestModel, "m2");
equal(conversation.previousTurnModel, "m1");
equal(conversation.cwd, "/new");

owner.applyThreadSettingsUpdate(conversation, { model: "m1", sandboxPolicy: { type: "danger" } });
equal(conversation.latestThreadSettings.activePermissionProfile, null);
equal(conversation.latestThreadSettings.permissions, null);
equal(conversation.previousTurnModel, null);

const settings = owner.buildModelSettingsUpdate(
  {
    approvalPolicy: "never",
    approvalsReviewer: "guardian",
    activePermissionProfile: { id: "profile-1" },
    sandbox: { type: "workspace-write" },
    serviceTier: "fast",
    multiAgentMode: "default",
  },
  "m3",
  "high",
  "/cwd",
  { mode: "plan", settings: { model: "m3", reasoning_effort: "high" } },
);
equal(settings.effort, "high");
equal(settings.reasoningEffort, undefined);
equal(settings.permissions, "profile-1");
equal(settings.sandboxPolicy, { type: "workspace-write" });
equal(owner.permissionSettingsUpdate({ activePermissionProfile: { id: "profile-2" } }).permissions, "profile-2");

const reset = { ...conversation, _turns: [], latestCollaborationMode: collaborationMode };
owner.applyModelSettingsUpdate(reset, settings);
equal(reset.latestModel, "m3");
equal(reset.latestReasoningEffort, "high");
equal(reset.previousTurnModel, null);

const conversations = new Map([
  ["a", { _turns: [{ status: "inProgress", items: [{}, {}] }], threadRuntimeStatus: { type: "active" } }],
  ["b", { _turns: [{ status: "completed", items: [{}] }, { status: "inProgress", items: [] }] }],
]);
const metrics = owner.collectConversationMetrics({
  conversations,
  recentConversationIds: ["a"],
  streamingConversations: new Set(["a", "b", "missing"]),
  getStreamRole: (id) => id === "a" ? { role: "owner" } : id === "b" ? { role: "follower" } : undefined,
  pendingRequestCount: 4,
  reviewPaneSnapshotMetrics: {
    reviewDiffFilesTotal: 5,
    reviewDiffLinesTotal: 6,
    reviewDiffBytesEstimate: 7,
  },
});
equal(metrics, {
  threadCountTotal: 2,
  threadCountLoadedRecent: 1,
  threadCountActive: 3,
  threadCountStreamingOwner: 1,
  threadCountStreamingFollower: 1,
  threadCountStreamingWithoutRole: 1,
  threadCountStreamingWithActiveRuntime: 1,
  threadCountStreamingWithoutActiveRuntime: 2,
  threadCountWithInflightTurn: 2,
  turnCountTotalLoaded: 3,
  itemCountTotalLoaded: 3,
  maxTurnsInSingleThread: 2,
  maxItemsInSingleTurn: 2,
  pendingRequestCount: 4,
  inflightTurnCount: 2,
  reviewDiffFilesTotal: 5,
  reviewDiffLinesTotal: 6,
  reviewDiffBytesEstimate: 7,
});

const manager = fs.readFileSync(
  new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url),
  "utf8",
);
const creation = fs.readFileSync(
  new URL("../src/main/main-app/conversation/conversation-creation.ts", import.meta.url),
  "utf8",
);
equal(manager.includes("applyThreadSettingsUpdate(state, settings)"), true);
equal(manager.includes("...collectConversationMetrics({"), true);
equal(creation.includes("applyModelSettingsUpdate(freezeIdentity(conversationState)"), true);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('const { O_e, zv, Bv, Vv, D_e } = require("./main-app/threads/patch-classification.js")'), true);
for (const name of ["D_e", "O_e", "zv", "Bv", "Vv", "k_e", "A_e", "j_e", "Hv"])
  equal(main.includes(`function ${name}(`), false);

console.log(`${assertions} main thread settings patch owner assertions passed`);
