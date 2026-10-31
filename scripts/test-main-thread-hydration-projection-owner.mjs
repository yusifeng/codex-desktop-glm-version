import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const source = fs.readFileSync(
  new URL("../src/main/main-app/threads/hydration.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const schema = {
  int: () => schema,
  nonnegative: () => schema,
  optional: () => schema,
  min: () => schema,
  safeParse: (data) => ({ success: true, data }),
};
const shared = {
  wf: () => schema,
  Of: () => schema,
  Cf: () => schema,
  $u: (id) => id,
  vl: (value) => path.posix.isAbsolute(value) || /^[A-Za-z]:[\\/]/u.test(value),
  wl: (value) => value,
  Tl: (value) => value.replaceAll("\\", "/"),
  Ol: (value) => value,
  kd: (roots) => ({ approvalPolicy: "never", sandboxPolicy: { type: "workspaceWrite" }, runtimeWorkspaceRoots: roots }),
  Od: () => ({ approvalPolicy: "never" }),
  Nd: (permissions) => ({ sandboxPolicy: permissions.sandboxPolicy }),
  jd: (permissions) => permissions.runtimeWorkspaceRoots,
  fd: () => null,
  lr: () => false,
  ed: (id) => id,
  Ji: () => false,
  pa: new Set(),
  _s: "durable",
};
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)(
  (specifier) => {
    if (specifier === "@chunk/shared") return shared;
    if (specifier === "./automation-detector") return { hasCanonicalVoiceHistory: () => false, AUTOMATION_DETECTOR: {} };
    if (specifier === "../vendor/immer") return { produce: (value, fn) => (fn(value), value), produceWithPatches: () => [], original: (value) => value };
    if (specifier === "../util/lodash-interop") return { deepEqual: isDeepStrictEqual, findLast: (items, predicate) => items.findLast(predicate) };
    if (specifier === "../turns/canonical-history")
      return {
        conversationTurns: (conversation) => conversation.turnHistory?.history?.entities ?? conversation.turns,
        mergedConversationTurns: (conversation) => conversation.turnHistory?.history?.entities ?? conversation.turns,
        historyTurnCount: (conversation) => (conversation.turnHistory?.history?.entities ?? conversation.turns).length,
        lastTurn: (conversation) => (conversation.turnHistory?.history?.entities ?? conversation.turns).at(-1) ?? null,
        hasCompleteHistory: () => true,
        forEachTurn: (conversation, callback) =>
          (conversation.turnHistory?.history?.entities ?? conversation.turns).forEach(callback),
      };
    if (specifier === "./projection")
      return {
        cleanThreadTitle: (value) => value,
        threadTimestamps: () => ({ createdAt: 0, updatedAt: 0, recencyAt: null }),
        mergedRecencyAt: () => 0,
        environmentSelection: () => ({}),
        subAgentMetadata: () => null,
        subAgentNickname: () => null,
      };
    if (specifier === "./timeline-index")
      return {
        isTerminalTransientItem: () => false,
        isUserMessageItem: () => false,
        isAgentMessageItem: () => false,
        isActivityItem: () => false,
        isCreateThreadCall: () => false,
        isReasoningItem: () => false,
        isAutomationItem: () => false,
      };
    if (specifier === "../misc/delegation") return { parseCodexDelegation: () => null };
    if (specifier === "../prompts/section-markers")
      return {
        takeLastRequestSection: (value) => value,
        FILES_MENTIONED_SECTION: "# Files mentioned by the user:",
        FILES_PASTED_SECTION: "# Files pasted by the user:",
      };
    if (specifier === "../markdown/plain-text") return { plainTextFromMarkdown: (value) => value };
    throw new Error(`unexpected require ${specifier}`);
  },
  module,
  module.exports,
);
const owner = module.exports;

const attachments = owner.attachmentsFromInput([{ type: "text", text: [
  "# Files mentioned by the user:",
  "## Source: /work/source.ts (lines 1-2)",
].join("\n") }]);
equal(attachments, [{ label: "Source", path: "/work/source.ts", fsPath: "/work/source.ts" }]);
equal(owner.normalizeImageGenerationItem({ result: "YWJj" }), {
  result: "YWJj",
  src: "data:image/png;base64,YWJj",
});
equal(owner.normalizeImageGenerationItem({ savedPath: "C:\\work\\image.png", result: "ignored" }), {
  savedPath: "C:\\work\\image.png",
  result: "ignored",
  src: "C:/work/image.png",
});
equal(owner.turnParamsFromReadResponse(
  { thread: { id: "thread-1", cwd: "", turns: [] }, sessionMeta: { cwd: "/session" }, model: "gpt", reasoningEffort: "high" },
  { resolvedPermissions: { approvalPolicy: "never" } },
), {
  threadId: "thread-1",
  turns: [],
  model: "gpt",
  reasoningEffort: "high",
  cwd: "/session",
  permissions: { approvalPolicy: "never" },
});
const projected = owner.projectTurns({
  threadId: "thread-1",
  turns: [{
    id: "turn-1",
    startedAt: 2,
    completedAt: 3,
    status: "completed",
    items: [
      { type: "contextCompaction", id: "compact" },
      { type: "userMessage", id: "user", clientId: "client", content: [{ type: "text", text: "hello" }] },
      { type: "collabAgentToolCall", id: "call", receiverThreadIds: ["child"] },
    ],
  }],
  model: "gpt",
  reasoningEffort: "high",
  cwd: "/work",
  permissions: { approvalPolicy: "never", sandboxPolicy: { type: "workspaceWrite" }, runtimeWorkspaceRoots: ["/work"] },
});
equal(projected[0].turnStartedAtMs, 2000);
equal(projected[0].finalAssistantStartedAtMs, 3000);
equal(projected[0].params.clientUserMessageId, "client");
equal(projected[0].items[2].receiverThreads, [{ threadId: "child", thread: null }]);
const turn = {};
equal(owner.ensureTurnFields(turn, "inProgress"), { status: "inProgress", items: [], hookRuns: [] });
equal(turn, { status: "inProgress", items: [], hookRuns: [] });

const receiverCall = {
  type: "collabAgentToolCall",
  receiverThreadIds: ["child"],
  receiverThreads: [{ threadId: "child", thread: null }],
};
const parent = {
  id: "parent",
  turns: [],
  turnHistory: { kind: "canonical", history: { entities: [{ items: [receiverCall] }] } },
};
const conversations = new Map([["parent", parent]]);
const threadsById = new Map();
owner.registerThreadMetadata({
  thread: { id: "child", agentNickname: "worker" },
  threadsById,
  conversations,
  updateConversationState: (id, update) => update(conversations.get(id)),
});
equal(threadsById.get("child"), { id: "child", agentNickname: "worker", turns: [] });
equal(receiverCall.receiverThreads, [{
  threadId: "child",
  thread: { id: "child", agentNickname: "worker", turns: [] },
}]);
equal(owner.parentThreadIdOf({ parentThreadId: "parent" }), "parent");
equal(owner.isSubagentThread({ parentThreadId: "parent" }), true);
equal(owner.isDescendantOf(
  { parentThreadId: "child" },
  "root",
  new Map([["child", { parentThreadId: "root" }]]),
), true);
equal(owner.isSurfaceableThread({ ephemeral: false, threadSource: "user" }), true);
equal(owner.isSurfaceableThread({ ephemeral: true, threadSource: "user" }), false);

equal(owner.environmentInputResult({
  tool: "request_environment_input",
  arguments: { mode: "network", domains: ["example.com"] },
}), { status: "pending", notifyUserInput: true });
equal(owner.environmentInputResult({
  tool: "request_environment_input",
  arguments: { mode: "network", secrets: [{ name: "TOKEN", unexpected: true }] },
}), {
  status: "invalid",
  response: {
    contentItems: [{ type: "inputText", text: "request_environment_input received invalid arguments." }],
    success: false,
  },
});
const pendingConversation = (tool, args) => ({
  requests: [{
    method: "item/tool/call",
    id: "request-1",
    params: { turnId: "turn-1", tool, arguments: args },
  }],
  turns: [{ turnId: "turn-1", items: [] }],
});
equal(owner.pendingInteraction(pendingConversation("request_onboarding_input", {
  questions: [{
    id: "role",
    question: "Which role?",
    options: [{ label: "Developer" }, { label: "Reviewer" }],
  }],
}), () => null), { kind: "userInput", userInputRequestId: "request-1" });
equal(owner.pendingInteraction(pendingConversation("request_onboarding_input", {
  questions: [{ id: "role", question: "Which role?", options: [{ label: "Only one" }] }],
}), () => null), null);
equal(owner.pendingInteractionKind(pendingConversation("setup_codex_step", {
  step: "role",
}), () => null), "setupCodexStep");
equal(owner.pendingInteractionKind(pendingConversation("setup_codex_step", {
  step: "complete",
}), () => null), null);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('attachmentsFromInput: X_, normalizeImageGenerationItem: Z_, turnParamsFromReadResponse: $_'), true);
for (const name of ["c_e", "l_e", "X_", "Z_", "Q_", "$_", "ev", "tv", "nv", "d_e", "rv", "iv"])
  equal(main.includes(`function ${name}(`), false);
equal(main.includes("var o_e ="), false);
equal(main.includes("var u_e ="), false);
equal(main.includes("registerThreadMetadata: av, activeAncestryIds: ov"), true);
equal(main.includes("environmentInputResult: fv, pendingInteractionKind: pv, pendingInteraction: mv"), true);
for (const name of ["f_e", "av", "p_e", "m_e", "ov", "sv", "cv", "lv", "uv", "dv"])
  equal(main.includes(`function ${name}(`), false);
for (const name of ["fv", "pv", "mv", "hv", "gv", "h_e"])
  equal(main.includes(`function ${name}(`), false);
equal(source.includes("forEachTurn(draft as never"), true);

console.log(`${assertions} main thread hydration projection owner assertions passed`);
