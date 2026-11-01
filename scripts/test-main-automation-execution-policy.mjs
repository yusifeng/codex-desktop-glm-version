import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
};
const rejects = async (operation, pattern) => {
  assertions += 1;
  await assert.rejects(operation, pattern);
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/automations/execution-policy.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", output.code)(loaded, loaded.exports);
const { HEARTBEAT_RETRY_MS, createAutomationExecutionPolicy } = loaded.exports;

const warnings = [];
const dependencyCalls = [];
const dependencies = {
  localProjectsKey: "projects",
  appConfigStateKey: "config",
  agentModeByHostKey: "agentModes",
  agentModeSchema: {
    safeParse: (value) => typeof value === "string"
      ? { success: true, data: `parsed:${value}` }
      : { success: false },
  },
  parseLocalProjects: (value) => value ?? {},
  normalizePath: (value) => `normalized:${value}`,
  defaultPermissions: () => ({ sandboxPolicy: { type: "readOnly" } }),
  permissionProfileOf: (sandbox) => sandbox.type,
  managedRequirementsAllow: (_requirements, profile, policy, reviewer) =>
    profile === "readOnly" && policy === "on-request" && reviewer === "user",
  parseIntervalMs: (rrule) => rrule === "interval" ? 60_000 : null,
  computeNextRun: ({ now }) => now + 123,
  withHostedAutomationInstructions: (input) => ({ wrapped: input }),
  selectAutomationModel: ({ automation }) => ({
    model: automation.model === "old-upgrade" ? "selected" : automation.model,
    reasoningEffort: "high",
  }),
  findModel: (_models, model) => model === "old" ? { upgrade: "old-upgrade" } : null,
  shouldNormalizeDesktopPaths: () => true,
  normalizeDesktopPath: (value, enabled) => enabled ? `desktop:${value}` : value,
  permissionModes: (requirements) => requirements?.allowedModes ?? [],
  requestedPermissionMode: (config) => config.requestedMode ?? "auto-request",
  isGuardianApprovalsMode: (mode) => mode === "guardian-request",
  permissionConfig: (mode, roots, config) => ({
    approvalPolicy: config.approvalPolicy ?? "on-request",
    approvalsReviewer: config.reviewer ?? "user",
    sandboxPolicy: config.sandboxPolicy ?? { type: "workspaceWrite", roots },
    mode,
  }),
  appServerProtocolVersion: () => [0, 1, 0],
  logger: { warning: (...args) => warnings.push(args) },
};
const policy = createAutomationExecutionPolicy(dependencies);

equal(HEARTBEAT_RETRY_MS, 60_000);
const values = new Map([["projects", {
  first: { id: "first", rootPaths: ["/one", "/two"] },
}]]);
const globalState = { get: (key) => values.get(key) };
equal(policy.resolveAutomationProjectTarget(globalState, { type: "projectless" }), null);
equal(policy.resolveAutomationProjectTarget(globalState, { type: "project", projectId: "first" }), {
  projectId: "first",
  roots: ["normalized:/one", "normalized:/two"],
});
await rejects(
  () => Promise.resolve().then(() => policy.resolveAutomationProjectTarget(globalState, { type: "project", projectId: "missing" })),
  /no longer exists/,
);
equal(policy.resolveAutomationCompatibilityCwds(globalState, null), ["normalized:~"]);
equal(policy.resolveAutomationCompatibilityCwds(globalState, "first"), ["normalized:/one", "normalized:/two"]);
equal(policy.assertWorktreeAutomationTarget({ compatibilityCwds: ["/one"], executionEnvironment: "worktree", projectId: "first" }), undefined);
await rejects(
  () => Promise.resolve().then(() => policy.assertWorktreeAutomationTarget({ compatibilityCwds: [], executionEnvironment: "worktree", projectId: "first" })),
  /require a project with a folder/,
);

equal(policy.nextHeartbeatPollAt({ nextScheduledRunAt: null, now: 1_000 }), 61_000);
equal(policy.nextHeartbeatPollAt({ nextScheduledRunAt: 20_000, now: 1_000 }), 20_000);
equal(policy.nextHeartbeatPollAt({ nextScheduledRunAt: 80_000, now: 1_000 }), 61_000);
equal(policy.classifyAutomationSchedule({ rrule: "interval", now: 10 }), {
  scheduleKind: "interval",
  intervalMs: 60_000,
  nextScheduledRunAt: 133,
});
equal(policy.classifyAutomationSchedule({ rrule: "wall", now: 10 }).scheduleKind, "wall_clock");
equal(policy.withHostedAutomationInstructions(null), null);
equal(policy.withHostedAutomationInstructions({ settings: { developer_instructions: "base", model: "m" } }, true), {
  settings: {
    developer_instructions: {
      wrapped: { baseInstructions: "base", hostedAutomationsEnabled: true },
    },
    model: "m",
  },
});

const modelPages = [
  { data: [{ id: "one" }], nextCursor: "next" },
  { data: [{ id: "two" }], nextCursor: null },
];
const collaborationMode = { settings: { model: "old", reasoning_effort: null, developer_instructions: "x" } };
const resolvedMode = await policy.resolveHeartbeatCollaborationMode({
  automation: { id: "automation" },
  appServerConnection: { listModels: async () => modelPages.shift() },
  collaborationMode,
});
equal(resolvedMode.settings.model, "selected");
equal(resolvedMode.settings.reasoning_effort, "high");
equal(warnings.at(-1)[0], "Heartbeat model changed for run");
equal(await policy.resolveHeartbeatCollaborationMode({
  automation: { id: "automation" },
  appServerConnection: { listModels: async () => { throw new Error("offline"); } },
  collaborationMode,
}), collaborationMode);
equal(warnings.at(-1)[0], "Failed to load models for heartbeat run");

let gitRequest;
equal(await policy.resolveDefaultRemoteBranchStartingState(
  "/repo",
  async (request) => { gitRequest = request; return { branch: null }; },
  { hostConfig: { id: "local" } },
), { type: "branch", branchName: "HEAD" });
equal(gitRequest, {
  method: "default-remote-branch",
  params: { cwd: "/repo", hostConfig: { id: "local" }, operationSource: "git_direct_call" },
});

const rootRequests = [];
const appServerClient = {
  hostConfig: { id: "local" },
  codexHome: async () => "/codex-home",
  platformPath: async () => ({ join: (...parts) => parts.join("/") }),
};
equal(await policy.collectAutomationWritableRoots({
  sourceCwds: ["/source", "/source"],
  worktreeCwd: "/worktree",
  requestGitWorker: async (request) => { rootRequests.push(request); return { roots: ["/git", "/source"] }; },
  appServerClient,
  automationId: "automation",
  includeGitRoots: true,
}), ["/source", "/worktree", "desktop:/codex-home/automations/automation", "/git"]);
equal(rootRequests.length, 2, "each source is queried before output dedupe");
equal(rootRequests[0].params.operationSource, "git_direct_call");

values.set("config", { agentModes: { local: "auto", invalid: 1 } });
equal(policy.readStoredAgentMode(globalState, "local"), "parsed:auto");
equal(policy.readStoredAgentMode(globalState, "invalid"), null);
equal(policy.readStoredAgentMode({ get: () => ({ agentModes: [] }) }, "local"), null);

equal(policy.resolveAutomationPermissionSelection(["/one"], { requestedMode: "auto-request" }, {
  allowedModes: ["guardian-approvals"],
}).mode, "guardian-approvals");
equal(policy.resolveAutomationPermissionSelection(["/one"], { requestedMode: "custom", sandbox_mode: "workspace-write" }, {
  allowedModes: ["read-only"],
}).mode, "read-only");
const forced = policy.resolveAutomationPermissions(
  ["/one"],
  {
    requestedMode: "auto-request",
    sandbox_mode: "workspace-write",
    sandbox_workspace_write: { network_access: true },
  },
  { allowedModes: ["auto"], allowedApprovalPolicies: ["never"], allowedApprovalsReviewers: ["user"] },
  null,
  true,
);
equal(forced.approvalPolicy, "never");
equal(forced.approvalsReviewer, "user");
equal(forced.sandboxPolicy.networkAccess, true);
equal(policy.findCompatibleAutomationPermissions({
  approvalsReviewer: "admin",
  approvalPolicy: "always",
  sandboxPolicy: { type: "dangerFullAccess" },
}, {
  allowedApprovalsReviewers: ["user"],
  allowedApprovalPolicies: ["on-request"],
}), {
  approvalsReviewer: "user",
  approvalPolicy: "on-request",
  sandboxPolicy: { type: "readOnly" },
  activePermissionProfile: null,
});

const order = [];
await policy.forEachSequentially(["a", "b", "c"], async (value, index) => {
  dependencyCalls.push(index);
  await Promise.resolve();
  order.push(value);
});
equal(order, ["a", "b", "c"]);
equal(dependencyCalls, [0, 1, 2]);
equal(await policy.checkHostedAutomationAppAvailable(async () => true), true);
equal(await policy.checkHostedAutomationAppAvailable(async () => { throw new Error("offline"); }), false);
equal(warnings.at(-1)[0], "Failed to check hosted Automations availability");

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/automations/execution-policy.js")'), true);
equal(main.includes("createAutomationExecutionPolicy({"), true);
for (const generatedName of ["fs", "ps", "ms", "hs", "ws", "sae", "Ts", "Es", "cae", "lae", "Ds", "uae", "dae", "fae"]) {
  equal(new RegExp(`^(?:async )?function ${generatedName}\\(`, "m").test(main), false);
}

console.log(`${assertions} automation execution policy assertions passed`);
