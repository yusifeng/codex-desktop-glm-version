import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

const root = new URL("../", import.meta.url);
const source = fs.readFileSync(
  new URL("src/main/main-app/conversation/turn-submission.ts", root),
  "utf8",
);
const transpiled = await transform(source, {
  loader: "ts",
  format: "esm",
  target: "es2022",
});
const ast = acorn.parse(transpiled.code, {
  ecmaVersion: "latest",
  sourceType: "module",
});

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

function compileFunction(name, dependencies) {
  const declaration = ast.body.find(
    (node) => node.type === "FunctionDeclaration" && node.id?.name === name,
  );
  assert.ok(declaration, `${name} must survive TypeScript transformation`);
  assertions += 1;
  const functionSource = transpiled.code.slice(declaration.start, declaration.end);
  return Function(
    ...Object.keys(dependencies),
    `${functionSource}; return ${name};`,
  )(...Object.values(dependencies));
}

class ResumeNotReadyError extends Error {}
class DeliveryError extends Error {}
const createDeferred = () => {
  let resolve;
  const promise = new Promise((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
};

const retryCalls = [];
const bufferedTurn = {
  turnId: "turn-1",
  status: "inProgress",
  params: {
    input: ["input"],
    effort: "high",
    clientUserMessageId: "old-message",
    attachments: ["attachment"],
    commentAttachments: ["comment"],
    useAppServerPermissionDefault: true,
    additionalContext: { retained: true },
    collaborationMode: { settings: { reasoning_effort: "high", retained: true } },
  },
};
const retrySafetyBufferedTurn = compileFunction("retrySafetyBufferedTurn", {
  findTurnById: () => bufferedTurn,
  versionSupportsFeature: () => true,
  assertLegacyHistoryMode: () => {
    throw new Error("legacy assertion must not run for paginated history");
  },
  mergedConversationTurns: () => [bufferedTurn],
  omit: (value, keys) =>
    Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key))),
  mergeWritingBlockContext: (base, override) => ({ ...base, ...override }),
});
const retryManager = {
  requestClient: { getAppServerVersion: () => "1.0.0" },
  getConversation: () => ({ historyMode: "paginated", latestReasoningEffort: "medium" }),
  sendRequest: async (method, params) => {
    retryCalls.push(["request", method, params]);
    if (method === "model/list")
      return {
        data: [
          {
            model: "model-1",
            supportedReasoningEfforts: [{ reasoningEffort: "high" }],
          },
        ],
      };
    return { reverted: true };
  },
  interruptConversation: async (...args) => {
    retryCalls.push(["interrupt", ...args]);
    return "turn-1";
  },
  applyRevertResponseToConversation: (value) => retryCalls.push(["apply", value]),
};
await retrySafetyBufferedTurn({
  conversationId: "thread-1",
  manager: retryManager,
  model: "model-1",
  additionalContext: { edited: true },
  startTurn: async (...args) => retryCalls.push(["start", ...args]),
  turnId: "turn-1",
  turnMergePolicy: "merge-policy",
});
equal(retryCalls[0][1], "model/list");
equal(retryCalls[1], ["interrupt", "thread-1", "system", "turn-1"]);
equal(retryCalls[2][1], "thread/revert");
equal(retryCalls[3][0], "apply");
equal(retryCalls[4][0], "start");
equal(retryCalls[4][1].clientUserMessageId, undefined);
equal(retryCalls[4][1].attachments, undefined);
equal(retryCalls[4][1].turnTrigger, "safety_buffer_retry");
equal(retryCalls[4][1].additionalContext, { retained: true, edited: true });
equal(retryCalls[4][1].collaborationMode.settings, {
  reasoning_effort: "high",
  retained: true,
  model: "model-1",
});

const followCalls = [];
const sendFollowUpMessage = compileFunction("sendFollowUpMessage", {
  ResumeNotReadyError,
});
const followManager = {
  resumeConversation: async (request) => {
    followCalls.push(["resume", request]);
    return { status: "ready" };
  },
  getConversationCwd: () => "/workspace",
  getConversation: () => ({
    latestCollaborationMode: { mode: "default" },
    latestModel: "existing-model",
    latestReasoningEffort: "medium",
  }),
  updateThreadSettingsForNextTurn: async (...args) =>
    followCalls.push(["settings", ...args]),
  canUsePermissionSelection: () => true,
  getHostId: () => "local",
  turnCoordinator: {
    sendPreparedMessage: async (request) => {
      followCalls.push(["send", request]);
      return "sent";
    },
  },
};
const followResult = await sendFollowUpMessage({
  conversationId: "thread-1",
  createId: () => "message-1",
  manager: followManager,
  options: {
    additionalContext: { context: true },
    inputItems: [{ type: "image" }],
    toolOutput: null,
    writingBlockContextPrepared: true,
    messageMetadata: { source: "test" },
    messageThreadId: "side-1",
    model: null,
    prompt: "  hello  ",
    turnTrigger: "user",
    reasoningEffort: "high",
    serviceTier: "fast",
    usePermissionSelection: true,
  },
});
equal(followResult, "sent");
equal(followCalls.map(([kind]) => kind), ["resume", "settings", "send"]);
equal(followCalls[1], [
  "settings",
  "thread-1",
  { model: "existing-model", effort: "high" },
]);
equal(followCalls[2][1].steer.restoreMessage.text, "hello");
equal(followCalls[2][1].steer.restoreMessage.context.workspaceRoots, ["/workspace"]);
equal(followCalls[2][1].start.request.input, [
  { type: "text", text: "hello", text_elements: [] },
  { type: "image" },
]);
equal(followCalls[2][1].start.context.usePermissionSelection, true);
await assert.rejects(
  sendFollowUpMessage({
    conversationId: "thread-1",
    createId: () => "unused",
    manager: followManager,
    options: { prompt: "   " },
  }),
  /Cannot send an empty follow-up message/,
);
assertions += 1;

const creationCalls = [];
function duplicable(name, implementation = async () => undefined) {
  const original = async (...args) => implementation(...args);
  original.dup = () => {
    const copy = async (...args) => {
      creationCalls.push([name, ...args]);
      return implementation(...args);
    };
    copy[Symbol.dispose] = () => creationCalls.push([`dispose:${name}`]);
    return copy;
  };
  return original;
}
const runConversationCreationWithFirstTurn = compileFunction(
  "runConversationCreationWithFirstTurn",
  {
    createDeferred,
    defaultSandboxConfig: () => ({ sandbox: "default" }),
    errorToString: (error) => String(error?.message ?? error),
    mergePermissionConfigWithFallback: () => ({
      approvalPolicy: "on-request",
      approvalsReviewer: "user",
    }),
    extractPermissionRequestFields: () => ({ sandboxPolicy: "workspace-write" }),
    appendWorktreeInitItem: () => creationCalls.push(["worktree-init"]),
    DeliveryError,
  },
);
const afterConversationCreated = duplicable("after-created");
const beforeFirstTurn = duplicable("before-first-turn");
const onMessageAdded = duplicable("message-added");
const onSettled = duplicable("settled");
const creationManager = {
  logger: { warning: (...args) => creationCalls.push(["warning", ...args]) },
  readDefaultPersonality: async () => {
    creationCalls.push(["personality"]);
    return "friendly";
  },
  updateThreadDaybreakEnabled: () => undefined,
  broadcastConversationSnapshot: (threadId) =>
    creationCalls.push(["broadcast", threadId]),
};
const creationFacade = {
  assertActive: () => creationCalls.push(["assert-active"]),
  runtimeSettings: {
    saveThreadProjectAssignment: async (assignment, thread) =>
      creationCalls.push(["save-assignment", assignment, thread]),
  },
  threadWorkspaceStorage: {
    setProjectAssignment: async () => {
      throw new Error("fallback assignment writer must not run");
    },
  },
  threadStartedNotificationDeferral: {
    run: async (enabled, callback) => {
      creationCalls.push(["deferral", enabled]);
      return callback();
    },
  },
  threadCreation: {
    createConversation: async (params, _inputs, _onDispatch, onCreated) => {
      creationCalls.push(["create", params]);
      await onCreated?.("thread-new", { id: "thread-new" });
      return {
        conversationId: "thread-new",
        conversationResponse: {
          model: "model-1",
          thread: { daybreakEnabled: false },
        },
        effectiveCwd: "/workspace",
        gitInfoPromise: null,
        firstTurnContext: {},
        serviceTier: "standard",
        initializationError: null,
      };
    },
    saveInitialDaybreak: async (...args) =>
      creationCalls.push(["save-daybreak", ...args.slice(0, 3)]),
  },
  settings: { readDefaultFeatureOverrides: () => ({ feature: true }) },
  history: { createSearchIslandId: () => "generated-message" },
  notifyConversationCallbacks: (threadId) =>
    creationCalls.push(["notify", threadId]),
  executeTurnStart: async () => {
    throw new Error("empty creation must not start a turn");
  },
};
const creationResult = await runConversationCreationWithFirstTurn(
  creationManager,
  creationFacade,
  {
    input: [],
    toolOutput: null,
    attachments: [],
    commentAttachments: [],
    cwd: "/workspace",
    workspaceRoots: ["/workspace"],
    projectAssignment: { projectId: "project-1" },
    turnTrigger: "user",
  },
  {
    readThreadCreationInputs: { source: "test" },
    afterConversationCreated,
    beforeFirstTurn,
    onMessageAdded,
    onSettled,
    dynamicToolFeatureOverrides: { dynamic: true },
    worktreeInit: null,
  },
);
equal(creationResult, {
  status: "created",
  conversationId: "thread-new",
  firstTurn: { status: "not-requested" },
});
equal(creationCalls[0], ["assert-active"]);
equal(creationCalls.find(([kind]) => kind === "deferral"), ["deferral", true]);
equal(creationCalls.find(([kind]) => kind === "create")[1].personality, "friendly");
equal(creationCalls.find(([kind]) => kind === "create")[1].permissionsConfig, {
  sandbox: "default",
});
equal(creationCalls.some(([kind]) => kind === "after-created"), true);
equal(creationCalls.some(([kind]) => kind === "save-assignment"), true);
equal(creationCalls.some(([kind]) => kind === "save-daybreak"), true);
equal(creationCalls.some(([kind]) => kind === "notify"), true);
equal(creationCalls.some(([kind]) => kind === "broadcast"), true);
equal(creationCalls.find(([kind]) => kind === "settled")[1].firstTurn.status, "not-requested");
equal(creationCalls.slice(-4).map(([kind]) => kind), [
  "dispose:before-first-turn",
  "dispose:after-created",
  "dispose:settled",
  "dispose:message-added",
]);

const continuationCalls = [];
const startContinuationTurn = compileFunction("startContinuationTurn", {
  ResumeNotReadyError,
  findLast: (values, predicate) => [...values].reverse().find(predicate),
  mergedConversationTurns: () => [{ turnId: "turn-old", status: "completed" }],
});
const continuationManager = {
  getConversationCwd: () => "/workspace",
  getConversation: () => ({
    latestCollaborationMode: { mode: "default" },
    threadRuntimeStatus: { type: "idle" },
  }),
};
await startContinuationTurn({
  conversationId: "thread-1",
  manager: continuationManager,
  options: {
    turnTrigger: "continuation",
    collaborationMode: null,
    continuationInput: [{ type: "text", text: "continue" }],
    additionalContext: { context: true },
    writingBlockContextPrepared: true,
  },
  resumeConversation: async (request) => {
    continuationCalls.push(["resume", request]);
    return { status: "ready" };
  },
  startTurn: async (request) => continuationCalls.push(["start", request]),
  turnMergePolicy: "merge-policy",
});
equal(continuationCalls.map(([kind]) => kind), ["resume", "start"]);
equal(continuationCalls[1][1].request.input, [
  { type: "text", text: "continue" },
]);
equal(continuationCalls[1][1].context.writingBlockContextPrepared, true);

const writingBlocksTypeScript = fs.readFileSync(
  new URL("src/main/main-app/markdown/writing-blocks.ts", root),
  "utf8",
);
const writingBlocksTranspiled = await transform(writingBlocksTypeScript, {
  loader: "ts",
  format: "cjs",
  target: "es2022",
});
const passthroughSchema = {
  optional() {
    return this;
  },
  catch() {
    return this;
  },
  parse(value) {
    return value;
  },
};
class FakeMarked {
  lexer(message) {
    return message.includes(":::writing")
      ? [
          {
            type: "codexDirective",
            name: "writing",
            attributes: { id: "block-1", recipient: "person@example.com" },
            text: "\noriginal body\n",
          },
        ]
      : [];
  }
}
const writingBlocksModule = { exports: {} };
Function("require", "module", "exports", writingBlocksTranspiled.code)(
  (specifier) => {
    if (specifier === "@chunk/shared")
      return {
        Ef: () => passthroughSchema,
        Of: () => passthroughSchema,
        Mf: () => passthroughSchema,
        jf: () => passthroughSchema,
        bf: () => passthroughSchema,
      };
    if (specifier === "../vendor/marked")
      return {
        AS: FakeMarked,
        NS: (tokens, visitor) => tokens.forEach(visitor),
      };
    if (specifier === "./codex-directives")
      return {
        codexDirectiveExtension: {},
        preprocessDirectiveSource: (value) => value,
        applyDirectiveTokenPostProcessing: () => undefined,
      };
    throw new Error(`unexpected writing-block dependency ${specifier}`);
  },
  writingBlocksModule,
  writingBlocksModule.exports,
);
const {
  extractWritingBlockContext,
  mergeWritingBlockContext,
  isWritingBlockContextKey,
} = writingBlocksModule.exports;
const settings = new Map([
  ["codex-writing-block-content-v1:thread-1\n[\"turn-1\",\"block-1\"]", "edited body"],
]);
const writingContext = extractWritingBlockContext(
  "thread-1",
  [{ turnId: "turn-1", messages: [":::writing"] }],
  (key) => settings.get(key),
  { retained: { kind: "trusted", value: "keep" } },
);
equal(writingContext.retained, { kind: "trusted", value: "keep" });
equal(isWritingBlockContextKey("codex_apps_writing_block_edits"), true);
equal(isWritingBlockContextKey("codex_apps_writing_block_edits_part_1_of_2"), true);
equal(isWritingBlockContextKey("other"), false);
equal(
  writingContext.codex_apps_writing_block_edits.value.includes("edited body"),
  true,
);
equal(
  mergeWritingBlockContext(
    { codex_apps_writing_block_edits: "old", retained: true },
    { codex_apps_writing_block_edits_part_1_of_1: "new" },
  ),
  { retained: true, codex_apps_writing_block_edits_part_1_of_1: "new" },
);

const main = fs.readFileSync(
  new URL(".reference/originals/main/main-C-Mhak1n.ts", root),
  "utf8",
);
const managerSource = fs.readFileSync(
  new URL("src/main/main-app/conversation/app-server-manager.ts", root),
  "utf8",
);
const writingBlocksSource = fs.readFileSync(
  new URL("src/main/main-app/markdown/writing-blocks.ts", root), "utf8",
);
for (const oldDefinition of [
  "function eC(",
  "async function wxe(",
  "async function Txe(",
  "async function Exe(",
  "async function Dxe(",
]) {
  equal(main.includes(oldDefinition), false, `${oldDefinition} must stay removed`);
}
for (const semanticOwner of [
  "retrySafetyBufferedTurn",
  "sendFollowUpMessage",
  "runConversationCreationWithFirstTurn",
  "startContinuationTurn",
]) {
  equal(managerSource.includes(semanticOwner), true, `${semanticOwner} must remain consumed`);
}
equal(writingBlocksSource.includes("export function extractWritingBlockContext"), true);
equal(writingBlocksSource.includes("export function mergeWritingBlockContext"), true);

console.log(`${assertions} main turn-submission runtime assertions passed`);
