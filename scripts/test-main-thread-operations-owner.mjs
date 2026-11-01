import assert from "node:assert/strict";
import fs from "node:fs";
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
  return { owner: module.exports, source };
}

const calls = [];
const turn = {
  turnId: "turn-1",
  status: "completed",
  params: {
    input: [{ type: "text", text: "before\n## My request:\nold\n" }],
    attachments: [],
    commentAttachments: [],
  },
  items: [],
};
const dependencyStubs = {
  "@chunk/shared": {
    $u: (value) => String(value),
    Dd: (profile, roots, config) => ({
      activePermissionProfile: { id: profile },
      approvalPolicy: config.approval_policy,
      approvalsReviewer: "reviewer",
      sandboxPolicy: { type: "workspaceWrite" },
      runtimeWorkspaceRoots: roots,
    }),
    Nd: (permissions) => ({ permissions: permissions.activePermissionProfile.id }),
    Wu: (_version, feature) => feature === "tokenBudgetHistoryNotes",
    Zo: (error) => error instanceof Error ? error.message : String(error),
    jd: (permissions) => permissions.runtimeWorkspaceRoots,
  },
  "../turns/canonical-history": {
    applyCanonicalTurns: (conversation, turns) => {
      conversation.turnHistory = { kind: "canonical", turns: [...turns] };
      conversation.turns = [];
    },
    findTurnById: (conversation, id) => conversation.turns.find((candidate) => candidate.turnId === id) ?? null,
    mergedConversationTurns: (conversation) => conversation.turns,
  },
  "../prompts/section-markers": {
    replaceLastRequestSection: (prompt, message) => prompt.replace("old", message),
  },
  "./hydration": {
    newConversationFromThread: (input) => ({
      id: input.conversationId,
      turns: input.turns,
      latestCollaborationMode: input.latestCollaborationMode,
      latestModel: "",
      latestReasoningEffort: null,
      workspaceKind: input.workspaceKind,
    }),
    turnParamsFromReadResponse: (response, context) => ({ response, context }),
    withThreadMode: (thread) => ({ ...thread }),
  },
  "./history-policy": {
    bx: (mode, action) => {
      if (mode === "paginated") throw new Error(`${action} unavailable`);
    },
  },
  "./patch-classification": {
    applyThreadSettingsUpdate: (state, patch) => {
      state.appliedSettings = patch;
    },
    buildModelSettingsUpdate: (_response, model, effort, cwd, collaborationMode) => ({
      model, effort, cwd, collaborationMode,
    }),
  },
  "./maybe-resume": {
    mergePermissionSettings: (derived, response) => ({
      activePermissionProfile: derived.activePermissionProfile ?? response.activePermissionProfile ?? null,
      approvalPolicy: derived.approvalPolicy ?? response.approvalPolicy,
      approvalsReviewer: derived.approvalsReviewer ?? response.approvalsReviewer,
      sandboxPolicy: derived.sandboxPolicy ?? response.sandbox,
      runtimeWorkspaceRoots: derived.runtimeWorkspaceRoots ?? [],
    }),
    resolveResumeCwd: ({ requestedCwd, responseCwd, threadCwd, fallbackCwd }) =>
      responseCwd || threadCwd || requestedCwd || fallbackCwd,
  },
  "./start-config": {
    yx: async (client, cwd) => (await client.sendRequest("config/read", { cwd })).config,
  },
  "../workspace/config": {
    mergeThreadProfiles: (config) => ({ ...config, merged: true }),
  },
  "./reference-capability": {
    threadReferenceCapabilityKey: (id) => `references:${id}`,
  },
  "./fork-placement": {
    readForkPlacement: () => ({ status: "ready", placement: null }),
    prependForkedProjectThread: async () => {},
    moveForkedThreadToSection: async () => {},
  },
};

const { owner: operations, source } = await load(
  "../src/main/main-app/threads/operations.ts",
  (specifier) => {
    if (specifier in dependencyStubs) return dependencyStubs[specifier];
    throw new Error(`unexpected operations require ${specifier}`);
  },
);
equal(operations.tokenBudgetThreadKey("local", "thread-1"), 'token-budget-thread:["local","thread-1"]');

// MCP reads are single-flight by effective options and always clean their cache.
let resolveMcp;
const mcpCache = new Map();
const mcpClient = {
  sendRequest: (method, params, options) => {
    calls.push(["mcp", method, params, options]);
    return new Promise((resolve) => { resolveMcp = resolve; });
  },
};
const mcpA = operations.Fye(mcpClient, mcpCache, { threadId: "thread-1" });
const mcpB = operations.Fye(mcpClient, mcpCache, { threadId: "thread-1" });
equal(mcpA === mcpB, false);
equal(calls.filter(([kind]) => kind === "mcp").length, 1);
equal(calls.at(-1)[3].priority, "interactive");
resolveMcp({ data: [] });
await mcpA;
equal(mcpCache.size, 0);

// Config personality wins; experiment is only a fallback when config exists.
let experimentReads = 0;
const settings = {
  readExperimentPersonality: async () => (experimentReads += 1, "friendly"),
};
const configClient = {
  sendRequest: async () => ({ config: { personality: "pragmatic" } }),
};
equal(await operations.Iye(configClient, settings, "/repo"), "pragmatic");
equal(experimentReads, 0);
equal(
  await operations.Iye(configClient, settings, "/repo", { model_personality: "" }),
  "friendly",
);

// Follower edits delegate without mutating local history.
const followerManager = {
  getConversation: () => ({ turns: [turn] }),
  getStreamRole: () => ({ role: "follower" }),
  sendThreadFollowerRequest: async (...args) => (calls.push(["delegate", ...args]), true),
};
await operations.Eye({
  manager: followerManager,
  conversationId: "thread-1",
  options: { turnId: "turn-1", message: "new" },
});
equal(calls.at(-1)[0], "delegate");

// Owner edits preserve rollback-before-start ordering and permission overrides.
const editOrder = [];
const conversation = {
  turns: [turn],
  historyMode: "eager",
  cwd: "/repo",
  latestThreadSettings: { activePermissionProfile: { id: "existing" } },
};
const editManager = {
  getConversation: () => conversation,
  getStreamRole: () => ({ role: "owner" }),
  sendThreadFollowerRequest: async () => false,
  waitForPendingThreadSettingsUpdate: async () => editOrder.push("wait-settings"),
  requestClient: { getAppServerVersion: () => "0.1.0" },
  sendRequest: async (method) => {
    editOrder.push(method);
    return method === "config/read"
      ? { config: { approval_policy: "on-request" } }
      : { thread: { cwd: "/repo" } };
  },
  applyRollbackResponseToConversation: () => editOrder.push("apply-rollback"),
};
let startRequest;
await operations.Eye({
  manager: editManager,
  conversationId: "thread-1",
  options: {
    turnId: "turn-1",
    message: "new",
    agentMode: "auto",
    shouldSendPermissionOverrides: true,
    serviceTier: "fast",
  },
  startTurn: async (request, bufferedTurn, useDefault) => {
    editOrder.push("start");
    startRequest = { request, bufferedTurn, useDefault };
  },
});
equal(editOrder, ["wait-settings", "config/read", "thread/rollback", "apply-rollback", "start"]);
equal(startRequest.request.input[0].text.includes("new"), true);
equal(startRequest.request.permissions, "existing");
equal(startRequest.request.turnTrigger, "edit_user_message");

// Fork products preserve metadata, placement, token-budget config and request shape.
const metadata = [];
const capabilities = {
  accountId: "account-1",
  readConfig: async () => ({ model: "default" }),
  readPlacement: () => ({
    status: "ready",
    placement: { prependToManualProject: true, customSection: null },
  }),
  prependProjectThread: async (...args) => metadata.push(["prepend", ...args]),
  moveThreadToSection: async (...args) => metadata.push(["section", ...args]),
  readTokenBudgetThread: () => true,
  writeTokenBudgetThread: (id) => metadata.push(["budget", id]),
  readThreadReferences: () => true,
  writeThreadReferences: (...args) => metadata.push(["references", ...args]),
};
const productManager = {
  getHostId: () => "local",
  getConversation: () => ({ cwd: "/repo" }),
  requestClient: { getAppServerVersion: () => "1.0.0" },
  resumeConversationForUnavailableOwner: async () => ({ status: "ready" }),
};
const product = operations.tx(productManager, {
  sourceConversationId: "source-1",
  workspaceRoots: ["/repo"],
  reasoningEffort: "high",
}, capabilities, { mapThreadTurns: (value) => [value] });
const prepared = await product.prepareRequest();
equal(prepared.request.threadId, "source-1");
equal(prepared.request.excludeTurns, true);
equal(prepared.request.config.model_reasoning_effort, "high");
equal(prepared.request.config["features.token_budget"].use_history_notes_extension, true);
product.copyThreadMetadata("source-1", "fork-1");
equal(metadata.slice(-2), [["references", "fork-1", true], ["budget", "fork-1"]]);
await product.commitAcceptedPlacement("fork-1", "project-1", prepared.placement);
equal(metadata.at(-1), ["prepend", "project-1", "fork-1"]);

// Synchronization attempts resume, project persistence and placement independently.
const syncCalls = [];
const synchronization = await operations.wx({
  conversationId: "fork-1",
  product: {
    resumeForkedConversation: async () => (syncCalls.push("resume"), { status: "not-ready", reason: "config" }),
    commitAcceptedPlacement: async () => { syncCalls.push("placement"); throw new Error("place failed"); },
  },
  resumeParams: { conversationId: "fork-1" },
  projectAssignment: { projectId: "project-1" },
  placement: null,
  workspaceStorage: {
    setProjectAssignment: async () => { syncCalls.push("project"); throw new Error("project failed"); },
  },
});
equal(syncCalls, ["resume", "project", "placement"]);
equal(synchronization, { status: "failed", message: "place failed" });

// Full fork lifecycle materializes runtime state, resumes, and returns the public result.
const forkCalls = [];
const forkManager = {
  requestClient: { getAppServerVersion: () => "1.0.0" },
  getHostId: () => "local",
  getConversation: (id) => id === "source-1" ? {
    title: "Source",
    historyMode: "eager",
    workspaceKind: "project",
  } : null,
  getThreadProjectAssignment: async () => null,
  sendRequest: async (method, request) => {
    forkCalls.push([method, request]);
    return {
      thread: {
        id: "fork-2", cwd: "/repo", name: "Fork", turns: [],
        createdAt: 1, updatedAt: 1, status: { type: "idle" }, daybreakEnabled: false,
      },
      cwd: "/repo", model: "gpt", reasoningEffort: "high", serviceTier: "fast",
      sandbox: { type: "workspaceWrite" },
    };
  },
  setConversation: (value) => forkCalls.push(["set", value]),
  updateConversationState: (_id, update) => {
    const state = { latestCollaborationMode: { settings: {} } };
    update(state);
    forkCalls.push(["update", state]);
  },
  resumeConversationForUnavailableOwner: async () => ({ status: "ready" }),
  addForkedFromConversationSyntheticItem: (...args) => forkCalls.push(["synthetic", ...args]),
  broadcastConversationSnapshot: () => {},
  notifyConversationUpdated: () => {},
  logger: { warning: (...args) => forkCalls.push(["warning", ...args]) },
  canonicalTurnHistory: true,
  history: { turnMergePolicy: {} },
};
const lifecycleResult = await operations.Mye({
  manager: forkManager,
  params: { sourceConversationId: "source-1", cwd: "/repo", workspaceRoots: ["/repo"] },
  capabilities: { ...capabilities, readTokenBudgetThread: () => false },
  history: { mapThreadTurns: () => [] },
  hostMode: "local",
  compareSemanticVersions: () => 1,
  notificationDeferral: {
    run: async (_defer, operation) => operation((id) => forkCalls.push(["accept", id])),
  },
  workspaceStorage: { setProjectAssignment: async () => {} },
});
equal(lifecycleResult.status, "created");
equal(lifecycleResult.conversationId, "fork-2");
equal(lifecycleResult.synchronization, { status: "complete" });
equal(forkCalls.some(([kind]) => kind === "set"), true);
equal(forkCalls.some(([kind]) => kind === "synthetic"), true);

// Projectless adoption persists all three ownership hints.
const adoptionCalls = [];
const adoption = await operations.Tx({
  manager: {
    updateConversationState: (_id, update) => {
      const state = {};
      update(state);
      adoptionCalls.push(["state", state]);
    },
  },
  projectlessConversations: {
    saveConversationId: async (id) => adoptionCalls.push(["id", id]),
    saveOutputDirectoryHint: async (...args) => adoptionCalls.push(["output", ...args]),
    saveWorkspaceRootHint: async (...args) => adoptionCalls.push(["root", ...args]),
  },
  result: {
    conversationId: "fork-3",
    synchronization: { status: "complete" },
    projectAssignment: null,
    sourceConversation: {
      workspaceKind: "projectless",
      workspaceBrowserRoot: "/workspace",
      projectlessOutputDirectory: "out",
    },
  },
  params: {},
});
equal(adoption.synchronization, { status: "complete" });
equal(adoptionCalls.map(([kind]) => kind), ["id", "state", "output", "root"]);

// Sidebar placement keeps the source-relative order and mirrors it to app-server sections.
const { owner: placementOwner } = await load(
  "../src/main/main-app/threads/fork-placement.ts",
  (specifier) => {
    if (specifier === "@chunk/shared") return {
      Ca: (value) => value ?? {},
      wa: (value, projectId, conversationId) => ({
        ...value,
        [projectId]: [conversationId, ...(value?.[projectId] ?? [])],
      }),
    };
    if (specifier === "../app-server/version-capabilities") return {
      supportsAppServerSections: () => true,
    };
    throw new Error(`unexpected placement require ${specifier}`);
  },
);
let savedSections = {
  "account-1": {
    sections: [{
      id: "section-1",
      name: "Work",
      itemKeys: ["codex:thread:local:source-1", "codex:thread:local:older"],
      hostSectionIds: { local: "server-section-1" },
    }],
    collapsedSectionIds: [],
    sectionOrder: ["custom:section-1", "threads"],
  },
};
const placementCalls = [];
const placementContext = {
  accountId: () => "account-1",
  hostId: "local",
  appServerVersion: "1.0.0",
  readSetting: () => true,
  storage: {
    readValue: (key) => key === "sidebar-custom-sections-v3"
      ? savedSections
      : key === "codex-sidebar-sort-mode-v1" ? "manual" : undefined,
    writeValue: (_key, value) => { savedSections = value; },
    updateGlobalState: async (_key, update) => placementCalls.push(["orders", update({ project: ["source-1"] })]),
  },
  pinnedThreads: async () => ({
    listSectionThreadIds: async () => ["source-1", "older"],
    setThreadSection: async (request) => (placementCalls.push(["remote", request]), { success: true }),
  }),
};
const placement = placementOwner.readForkPlacement(placementContext, "source-1");
equal(placement.status, "ready");
equal(placement.placement.prependToManualProject, true);
equal(placement.placement.customSection.sectionId, "section-1");
await placementOwner.moveForkedThreadToSection(
  placementContext,
  "fork-4",
  placement.placement.customSection,
);
equal(
  savedSections["account-1"].sections[0].itemKeys,
  ["codex:thread:local:fork-4", "codex:thread:local:source-1", "codex:thread:local:older"],
);
equal(placementCalls.at(-1)[1].beforeThreadId, "source-1");
await placementOwner.prependForkedProjectThread(placementContext, "project", "fork-4");
equal(placementCalls.at(-1)[1].project[0], "fork-4");

equal(source.includes('sendRequest("thread/editLastUserTurn"'), false);
equal(source.includes("materializeForkedConversation"), true);
equal(source.includes("readForkPlacement(placementContext"), true);

const originalMain = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
for (const oldDefinition of [
  "function tx(", "function dye(", "async function Eye(", "async function Mye(",
  "async function wx(", "async function Tx(", "function Nye(", "function Fye(",
  "async function Iye(",
]) equal(originalMain.includes(oldDefinition), false);

const managerSource = fs.readFileSync(
  new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url),
  "utf8",
);
equal(managerSource.includes("Mye as forkConversation"), true);
equal(managerSource.includes("Eye as editLastUserTurn"), true);

console.log(`${assertions} main thread operations owner assertions passed`);
