import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/threads/start-config.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const calls = [];
const shared = {
  Dc: (version) => (calls.push(["dynamic-key", version]), "dynamic_tool_names"),
  Oc: (tools) => (calls.push(["serialize-tools", tools]), ["serialized"]),
  Wa: (model, tier) => tier ?? model?.defaultServiceTier ?? null,
  Wu: (_version, feature) => feature === "defaultPaginatedHistory" || feature === "tokenBudgetHistoryNotes",
  Yo: async (...args) => {
    calls.push(["base", args]);
    return {
      cwd: args[3],
      config: { keep: 1, "shell_environment_policy.exclude": ["OLD"] },
      developerInstructions: "base",
      ephemeral: false,
    };
  },
  ic: (overrides, version) => (calls.push(["version-overrides", overrides, version]), overrides),
  nc: (start, overrides) => ({ ...start, config: { ...start.config, feature_override: overrides?.alpha } }),
  Cs: (hostId) => hostId === "durable",
  gl: (left, right) => left.replaceAll("\\", "/") === right.replaceAll("\\", "/"),
};
const workspace = {
  firstWritableRoot: (policy) => policy?.writableRoots?.find((root) => root !== "~") ?? null,
  mergeThreadProfiles: (config) => config?.profile == null
    ? config
    : { ...config, ...(config.profiles?.[config.profile] ?? {}) },
  resolveThreadCwd: (input) => input.cwd ?? input.fallbackCwd ?? null,
  resolveWorkspaceSandboxPolicy: (input) => input.sandboxPolicy,
};
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)(
  (specifier) => {
    if (specifier === "@chunk/shared") return shared;
    if (specifier === "../workspace/config") return workspace;
    if (specifier === "./hydration")
      return { turnParamsFromReadResponse: (response, context) => ({ response, context }) };
    throw new Error(`unexpected require ${specifier}`);
  },
  module,
  module.exports,
);
const owner = module.exports;
equal(owner.gx, owner.buildThreadStartConfig);
equal(owner.xye, owner.buildResumeProduct);
equal(owner.mx, owner.resolveServiceTier);

const requestCalls = [];
const requestClient = {
  hostId: "local",
  getAppServerVersion: () => "1.0.0",
  async sendRequest(method, params, options) {
    requestCalls.push([method, params, options]);
    if (method === "configRequirements/read")
      return { requirements: { featureRequirements: { fast_mode: true } } };
    if (method === "config/read")
      return { config: { "shell_environment_policy.inherit": "all", "shell_environment_policy.exclude": ["HOST"] } };
    throw new Error(`unexpected request ${method}`);
  },
};
const loggerCalls = [];
const logger = {
  warning: (...args) => loggerCalls.push(["warning", ...args]),
  info: (...args) => loggerCalls.push(["info", ...args]),
  error: (...args) => loggerCalls.push(["error", ...args]),
};
const start = await owner.buildThreadStartConfig(
  {
    model: "gpt",
    serviceTier: "fast",
    cwd: "/work",
    permissionsConfig: { approvalPolicy: "never" },
    personality: "friendly",
    approvalsReviewer: "user",
    defaultFeatureOverrides: { alpha: true, thread_tools: true },
    instructionOverrides: { memoryReadPrompt: "remember", desktopContextSection: "desktop" },
    allowMemoryPromptOverrides: true,
    usesDesktopMcp: true,
    writingBlockInstructions: true,
    additionalDeveloperInstructions: "extra",
    threadId: "thread-1",
  },
  {
    requestClient,
    logger,
    fetchProxyConfig: async () => null,
    fetchCodexConfig: async () => null,
    readShellEnvironment: async () => ({ shellEnvironment: { exclude: ["SECRET"], set: { KEEP: "yes" } } }),
    readDynamicTools: async () => [{ type: "namespace", tools: [{ name: "update_running_summary" }, { name: "other" }] }],
    readDeveloperInstructions: async (input) => (calls.push(["developer", input]), { instructions: "developer" }),
  },
  null,
  "legacy",
  "1.0.0",
);
equal(start.serviceTier, undefined);
equal(calls.find(([kind]) => kind === "base")[1][1], "fast");
equal(start.config.keep, 1);
equal(start.config.feature_override, true);
equal(start.config["memories.read_prompt"], "remember");
equal(start.config["shell_environment_policy.exclude"], ["OLD", "SECRET"]);
equal(start.config["shell_environment_policy.set"], { KEEP: "yes" });
equal(start.config.dynamic_tool_names, ["update_running_summary", "other"]);
equal(start.config["features.request_permissions_tool"], true);
equal(start.dynamicTools, []);
equal(start.historyMode, "legacy");
equal(start.developerInstructions.startsWith("developer\n\nThe pet activity pill"), true);
equal(start.developerInstructions.includes("### Writing blocks"), true);
equal(start.developerInstructions.endsWith("\n\nextra"), true);
equal(loggerCalls.some(([kind]) => kind === "warning"), false);

equal(await owner.resolveServiceTier("fast", logger, async () => ({ requirements: { featureRequirements: { fast_mode: false } } })), null);
equal(owner.resolveThreadCwdFromResponse({ requestedCwd: "/Case/Child", responseCwd: "/case" }), "/case");
equal(owner.resolveThreadCwdFromResponse({ requestedCwd: "C:\\Work\\Child", responseCwd: "c:/work/" }), "C:\\Work\\Child");

const settings = {
  useBoundedCloudHistory: () => true,
  beginHydration: (input) => input,
  readCatalogEntry: async (_hostId, threadId) => ({ threadId }),
  restricted: false,
  isBrowserRuntime: false,
  allowMemoryPromptOverrides: false,
  usesDesktopMcp: false,
  isTokenBudgetThread: () => false,
  readSettings: async () => ({
    personality: "friendly",
    defaultFeatureOverrides: { alpha: false },
    instructionOverrides: null,
    includeProseDetailLevelInstructions: false,
    writingBlocks: false,
  }),
  fetchProxyConfig: async () => null,
  readCodexConfig: async () => null,
};
const mapped = [];
const product = owner.buildResumeProduct(
  settings,
  requestClient,
  logger,
  { mapThreadTurns: (input) => (mapped.push(input), ["turn"]) },
  () => false,
);
equal(product.useBoundedCloudHistory, true);
equal(await product.readCatalogEntry("local", "thread-2"), { threadId: "thread-2" });
equal(product.history.mapResumeResponse({ thread: { cwd: "/x" } }, { resolvedPermissions: {} }), ["turn"]);
equal(mapped[0], { response: { thread: { cwd: "/x" } }, context: { resolvedPermissions: {} } });
equal(product.workspace.getWritableRoot({ writableRoots: ["~", "/root"] }), "/root");
equal(product.workspace.arePathsEquivalent("C:\\a", "C:/a"), true);

const prepared = await product.prepare({
  conversation: {
    latestCollaborationMode: { settings: { model: "gpt" } },
    mode: "default",
    threadStartKind: "default",
  },
  params: { conversationId: "thread-2", permissions: {} },
  permissions: { approvalPolicy: "never" },
  workspaceRoots: ["/work"],
  requestOptions: { priority: "critical" },
});
equal(prepared.preserveServerPermissions, false);
equal(prepared.canReuseRunningThread, true);
equal(prepared.completeRequest({ threadId: "thread-2" }), { threadId: "thread-2" });
equal((await prepared.getResult({ model: " gpt " })).model, "gpt");

const preserveProduct = owner.buildResumeProduct(
  { ...settings, isBrowserRuntime: true },
  requestClient,
  logger,
  { mapThreadTurns: () => [] },
  () => false,
);
const preserved = await preserveProduct.prepare({
  params: { preserveServerConfiguration: true },
  requestOptions: { priority: "critical" },
});
equal(preserved.preserveServerPermissions, true);
equal(preserved.completeRequest({ threadId: "x", excludeTurns: true, initialTurnsPage: { limit: 1 }, ignored: true }), {
  threadId: "x",
  excludeTurns: true,
  initialTurnsPage: { limit: 1 },
});

const manager = fs.readFileSync(
  new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url),
  "utf8",
);
equal(manager.includes("xye as buildResumeProduct"), true);
equal(manager.includes("let product = buildResumeProduct("), true);
const creation = fs.readFileSync(
  new URL("../src/main/main-app/conversation/conversation-creation.ts", import.meta.url),
  "utf8",
);
equal(creation.includes("gx as buildThreadStartConfig"), true);
const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('const { mx, yx } = require("./main-app/threads/start-config.js")'), true);
for (const name of ["ux", "gye", "_ye", "vye", "dx", "yye", "fx", "px", "mx", "hx", "gx", "bye", "_x", "vx", "yx", "xye", "Sye", "Cye"])
  equal(main.includes(`function ${name}(`), false);

console.log(`${assertions} main thread start config owner assertions passed`);
