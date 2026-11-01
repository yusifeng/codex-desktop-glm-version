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
const flush = async () => {
  for (let index = 0; index < 12; index += 1) await Promise.resolve();
};

async function load(relativePath) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
  const module = { exports: {} };
  Function("module", "exports", output.code)(module, module.exports);
  return module.exports;
}

const cronModule = await load("../src/main/main-app/automations/cron-run.ts");
const schedulerModule = await load("../src/main/main-app/automations/scheduler-runtime.ts");

const effects = [];
let randomId = 0;
const cronDependencies = {
  automationInstructions: " base instructions ",
  createProjectlessThreadPaths: async () => ({
    cwd: "/generated/cwd",
    outputDirectory: "/generated/output",
    workspaceRoot: "/generated/workspace",
  }),
  projectlessWorkspaceRootSettingKey: "projectless-root",
  homeDirectory: () => "/home/me",
  shouldNormalizeDesktopPaths: () => true,
  normalizeDesktopPath: (value, enabled) => enabled ? `desktop:${value}` : value,
  normalizePath: (value) => `normalized:${value}`,
  readStoredAgentMode: () => "auto",
  projectlessWorkspaceInstructions: (input) => `projectless:${input.projectlessOutputDirectory}`,
  buildDeveloperInstructions: (input) => `developer:${input.baseInstructions}:${input.hostedAutomationsEnabled}`,
  resolveAutomationPermissions: (roots, _config, _requirements, mode, projectless) => ({
    approvalPolicy: projectless ? "never" : "on-request",
    approvalsReviewer: "user",
    sandboxPolicy: { type: "workspaceWrite", writableRoots: [...roots], mode },
  }),
  scheduleComputerUseConfigWrite: () => effects.push("config-write"),
  buildBrowserUseThreadConfig: async () => ({ browser: true }),
  buildAppServerThreadConfig: async () => ({ server: true }),
  dynamicToolsConfigKey: () => "dynamic-tools",
  randomUUID: () => `uuid-${++randomId}`,
  recordAutomationRunStart: (...args) => effects.push(["record", ...args]),
  resolveDefaultRemoteBranchStartingState: async () => ({ type: "branch", branchName: "main" }),
  desktopWorktreesRoot: () => ({ worktreesRoot: "/worktrees" }),
  threadIdOf: (value) => `parsed:${value}`,
  threadWorkspaceRootHintsKey: "root-hints",
  threadProjectlessOutputDirectoriesKey: "output-directories",
  replaceAutomationRunThread: (...args) => { effects.push(["replace", ...args]); return true; },
  markAutomationRunFailed: (...args) => effects.push(["failed", ...args]),
  collectAutomationWritableRoots: async (input) => {
    effects.push(["collect-roots", input.sourceCwds, input.worktreeCwd]);
    return [...input.sourceCwds, input.worktreeCwd];
  },
  visualizationIdForThread: () => "visual/id",
  turnSummary: "summary",
  updateAutomationThreadTitle: async () => effects.push("title"),
  logger: { warning: (...args) => effects.push(["warning", ...args]) },
};
const cron = cronModule.createCronAutomationRunRuntime(cronDependencies);
equal(cron.automationTargetCwd({ type: "legacy", cwd: "/legacy" }), "/legacy");
equal(cron.automationTargetCwd({ type: "project", project: { roots: ["/project"] } }), "/project");
equal(cron.automationTargetCwd({ type: "projectless" }), null);

const stateUpdates = [];
const assignments = [];
const threadStarts = [];
const turnStarts = [];
const notifications = [];
const connection = {
  appServerVersion: "1.0.0",
  getUserSavedConfiguration: async () => ({ desktop: {} }),
  startThread: async (input) => {
    threadStarts.push(input);
    effects.push("start-thread");
    return { thread: { id: "thread", sessionId: "session" }, cwd: input.cwd };
  },
  notifyAutomationRunsUpdated: () => { notifications.push("updated"); effects.push("notify"); },
  startTurn: async (params, options) => { turnStarts.push([params, options]); effects.push("start-turn"); },
};
const appServerClient = {
  hostConfig: { id: "local" },
  workspacesRoot: async () => "/workspaces",
  codexHome: async () => "/codex-home",
  platformPath: async () => ({ join: (...parts) => parts.join("/") }),
  createDirectory: async (directory) => effects.push(["mkdir", directory]),
};
const automation = {
  id: "automation",
  kind: "cron",
  name: "Daily check",
  prompt: "Inspect repository",
  executionEnvironment: "local",
  notificationPolicy: "failed_runs_only",
  lastRunAt: null,
};
await cron.executeCronAutomationTarget({
  runTrigger: "scheduled",
  appVersion: "1",
  automation,
  appServerConnection: connection,
  desktopFeatureAvailability: { workspaceDir: true },
  requestGitWorker: async () => { throw new Error("git worker should not be used"); },
  globalState: { update: (key, update) => stateUpdates.push([key, update({})]) },
  threadProjectAssignments: {
    setProjectless: async (input) => assignments.push(["projectless", input]),
    setAssignment: async (input) => assignments.push(["project", input]),
  },
  settingsStore: { getEffective: () => "/configured" },
  appServerClient,
  worktreeLifecycle: {},
  configRequirements: null,
  target: { type: "projectless" },
  automationModelSettings: { model: "model", reasoningEffort: "high" },
  appToolNames: ["tool"],
  hostedAutomationsAvailable: true,
  prepareCronTurnReadState: () => ({ handleStartFailure: () => effects.push("read-failure") }),
  isPackaged: true,
  repoRoot: "/repo",
});
equal(threadStarts.length, 1);
equal(threadStarts[0].cwd, "normalized:desktop:/generated/cwd");
equal(threadStarts[0].config, { browser: true, server: true, "dynamic-tools": ["tool"] });
equal(threadStarts[0].developerInstructions.includes("projectless:desktop:/generated/output"), true);
equal(assignments, [["projectless", { threadId: "parsed:thread", projectless: true }]]);
equal(stateUpdates, [
  ["root-hints", { thread: "desktop:/generated/workspace" }],
  ["output-directories", { thread: "desktop:/generated/output" }],
]);
equal(turnStarts.length, 1);
equal(turnStarts[0][0].threadId, "thread");
equal(turnStarts[0][0].turnTrigger, "automation_cron_scheduled");
equal(turnStarts[0][0].input[0].text.includes("Automation memory: $CODEX_HOME/automations/automation/memory.md"), true);
equal(turnStarts[0][0].approvalPolicy, "never");
equal(turnStarts[0][0].sandboxPolicy.writableRoots.includes("normalized:desktop:/generated/workspace"), true);
equal(turnStarts[0][1], {
  automationKind: "cron",
  notificationPolicy: "failed_runs_only",
  sessionId: "session",
});
equal(notifications.length, 2, "pending and resolved run records both notify");
equal(effects.indexOf("start-thread") < effects.findIndex((item) => Array.isArray(item) && item[0] === "replace"), true);
equal(effects.findIndex((item) => Array.isArray(item) && item[0] === "collect-roots") < effects.indexOf("start-turn"), true);

await rejects(
  cron.executeCronAutomationTarget({
    runTrigger: "scheduled",
    appVersion: "1",
    automation: { ...automation, executionEnvironment: "worktree" },
    appServerConnection: connection,
    desktopFeatureAvailability: {},
    requestGitWorker: async () => null,
    globalState: {},
    threadProjectAssignments: {},
    settingsStore: { getEffective: () => null },
    appServerClient,
    worktreeLifecycle: {},
    configRequirements: null,
    target: { type: "project", project: { projectId: "empty", roots: [] } },
    automationModelSettings: { model: "model", reasoningEffort: "medium" },
    appToolNames: [],
    hostedAutomationsAvailable: false,
    isPackaged: true,
    repoRoot: "/repo",
  }),
  /require a project with a folder/,
);

let schedulerNow = 10_000;
let protocolMajor = 0;
const due = [];
const schedulerEffects = [];
let heartbeatResolve;
class ExecutionConfigError extends Error {
  constructor(reason) { super(reason); this.result = { reason }; }
}
const schedulerDependencies = {
  defaultDesktopFeatureAvailability: { workspaceDir: false },
  listDueAutomations: () => [...due],
  updateAutomationNextRun: (...args) => schedulerEffects.push(["next", ...args]),
  isHeartbeatAutomation: (item) => item.kind === "heartbeat",
  runScheduledHeartbeat: (input) => {
    schedulerEffects.push(["heartbeat", input.automation.id]);
    return new Promise((resolve) => { heartbeatResolve = resolve; });
  },
  runHeartbeatNow: async (input) => schedulerEffects.push(["heartbeat-now", input.automation.id]),
  getAutomation: (id) => due.find((item) => item.id === id),
  markAutomationRun: (...args) => schedulerEffects.push(["mark", ...args]),
  computeAutomationNextRun: () => schedulerNow + 1_000,
  hasAnchoredSchedule: () => false,
  resolveAutomationModelRouting: async () => ({ automationModel: "default-model" }),
  selectAutomationModel: ({ automation }) => ({
    model: automation.model ?? "selected-model",
    reasoningEffort: automation.reasoningEffort ?? "medium",
  }),
  resolveAutomationProjectTarget: () => ({ projectId: "project", roots: ["/project"] }),
  automationTargetCwd: (target) => target.cwd ?? target.project?.roots[0] ?? null,
  forEachSequentially: async (values, iteratee) => {
    for (let index = 0; index < values.length; index += 1) await iteratee(values[index], index);
  },
  executeCronAutomationTarget: async (input) => schedulerEffects.push(["cron", input.automation.id, input.target.type]),
  checkHostedAutomationAppAvailable: async (check) => protocolMajor === 0 ? check() : false,
  executionConfigErrorClass: ExecutionConfigError,
  settleInterruptedAutomationRuns: () => true,
  markSchedulerStarted: (value) => schedulerEffects.push(["scheduler-started", value]),
  now: () => schedulerNow,
  isOnline: () => true,
  logger: {
    warning: (...args) => schedulerEffects.push(["warning", ...args]),
    debug: (...args) => schedulerEffects.push(["debug", ...args]),
  },
};
const schedulerRuntime = schedulerModule.createAutomationSchedulerRuntime(schedulerDependencies);
equal(schedulerModule.DEFAULT_AUTOMATION_SCHEDULER_TICK_MS, 30_000);
equal(schedulerModule.DEFAULT_AUTOMATION_MAX_PER_TICK, 3);

due.push({ id: "heartbeat", kind: "heartbeat", targetThreadId: "thread", rrule: "interval", updatedAt: 1 });
const schedulerConnection = {
  notifyAutomationRunsUpdated: () => schedulerEffects.push(["runs-updated"]),
  listModels: async () => ({ data: [], nextCursor: null }),
  getConfigRequirements: async () => ({ requirements: null }),
  notifyAutomationRunTriggered: (input) => schedulerEffects.push(["triggered", input]),
};
const scheduler = schedulerRuntime.createAutomationScheduler({
  appVersion: "1",
  statsig: {},
  appServerConnectionRegistry: { getConnection: () => schedulerConnection },
  requestGitWorker: async () => ({}),
  globalState: {},
  threadProjectAssignments: {},
  settingsStore: {},
  appServerClient: { hostConfig: { id: "local" } },
  worktreeLifecycle: {},
  requestDynamicToolsForThreadStart: async () => [],
  isHostedAutomationAppAvailable: async () => true,
  tickMs: 1_000_000,
});
scheduler.start();
await flush();
equal(schedulerEffects.some(([kind]) => kind === "heartbeat"), false, "capability gates scheduler ticks");
scheduler.setLocalAutomationsCapability(true);
await flush();
equal(schedulerEffects.some(([kind]) => kind === "heartbeat"), true);
equal(scheduler.getRestartBlockers(), ["automation.heartbeat"]);
heartbeatResolve();
await flush();
equal(scheduler.getRestartBlockers(), []);
scheduler.setHeartbeatThreadRendererState({
  threadId: " thread ",
  isEligible: true,
  collaborationMode: { mode: "default" },
  permissions: { approvalPolicy: "never" },
});
scheduler.dispose();
equal(scheduler.getRestartBlockers(), []);

due.splice(0, due.length, {
  id: "cron",
  kind: "cron",
  cwds: ["/one", "/two"],
  executionEnvironment: "local",
  model: null,
  reasoningEffort: null,
  rrule: "interval",
});
await schedulerRuntime.runAutomationNow({
  appVersion: "1",
  statsig: {},
  automationId: "cron",
  appServerConnection: schedulerConnection,
  requestGitWorker: async () => ({}),
  globalState: {},
  threadProjectAssignments: {},
  settingsStore: {},
  appServerClient: {},
  worktreeLifecycle: {},
  requestDynamicToolsForThreadStart: async () => [
    { type: "namespace", tools: [{ name: "one" }, { name: "write_settings" }] },
    { type: "tool", name: "two" },
  ],
  isHostedAutomationAppAvailable: async () => protocolMajor === 0,
});
equal(schedulerEffects.filter(([kind]) => kind === "cron").map((entry) => entry.slice(1)), [
  ["cron", "legacy"],
  ["cron", "legacy"],
]);
equal(schedulerEffects.filter(([kind]) => kind === "triggered").length, 2);

due.splice(0, due.length, { id: "heartbeat-now", kind: "heartbeat" });
await schedulerRuntime.runAutomationNow({ automationId: "heartbeat-now", appServerConnection: {} });
equal(schedulerEffects.at(-1), ["heartbeat-now", "heartbeat-now"]);
await rejects(
  schedulerRuntime.runAutomationNow({ automationId: "missing", appServerConnection: {} }),
  /Automation not found/,
);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/automations/cron-run.js")'), true);
equal(main.includes('require("./main-app/automations/scheduler-runtime.js")'), true);
equal(main.includes("createCronAutomationRunRuntime({"), true);
equal(main.includes("createAutomationSchedulerRuntime({"), true);
for (const generatedName of ["pae", "mae", "Os", "ks", "As", "hae", "js", "gae"]) {
  equal(new RegExp(`^(?:async )?function ${generatedName}\\(`, "m").test(main), false);
}

console.log(`${assertions} automation scheduler runtime assertions passed`);
