import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const source = fs.readFileSync(new URL("../src/main/main-app/requests/item-synthesis.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)(
  (specifier) => {
    if (specifier === "@chunk/shared") return {
      cr: (left, right) => left.id === right.id,
      ed: (id) => id,
      lr: (params) => params.parsed ?? null,
      tu: (serverName) => serverName === "computer-use",
      ur: (_params, response) => response.safe !== false,
    };
    if (specifier === "../turns/canonical-history")
      return { forEachTurn: (conversation, callback) => conversation.turns.forEach(callback) };
    if (specifier === "../tools/dynamic-app-tools")
      return { buildOnboardingToolResponse: (value) => ({ contentItems: [{ type: "inputText", text: JSON.stringify(value) }], success: true }) };
    throw new Error(`unexpected require ${specifier}`);
  },
  module,
  module.exports,
);
const owner = module.exports;
const calls = [];
const logger = { info() {}, error(...args) { calls.push(["error", ...args]); }, warning(...args) { calls.push(["warning", ...args]); } };
const state = {
  requests: [{ id: "request-1", method: "item/commandExecution/requestApproval", params: { turnId: "turn-1" } }],
  turns: [{ turnId: "turn-1", items: [] }],
};
const context = owner.buildApprovalActionContext({
  logger,
  hostId: "host-1",
  approvalResolved: (id, requestId) => calls.push(["resolved", id, requestId]),
  ipcBridge: null,
  parseUrl: () => null,
  dispatchAppServerResponse: (method, response) => calls.push(["dispatch", method, response]),
  getStreamRole: () => null,
  conversations: new Map([["thread-1", state]]),
  updateConversationState: (_id, update) => update(state),
});
owner.replyWithCommandExecutionApprovalDecision(context, "thread-1", "request-1", "accept");
equal(calls[0], ["dispatch", "item/commandExecution/requestApproval", { id: "request-1", result: { decision: "accept" } }]);
equal(calls[1], ["resolved", "thread-1", "request-1"]);
equal(state.requests, []);

state.requests = [{
  id: "request-2",
  method: "item/tool/requestUserInput",
  params: { turnId: "turn-1", questions: [{ id: "q", question: "Question?", options: [{ label: "A" }] }] },
}];
owner.replyWithUserInputResponse(context, "thread-1", "request-2", { answers: { q: { answers: ["A"] } } });
equal(state.turns[0].items[0].type, "userInputResponse");
equal(state.turns[0].items[0].answers, { q: ["A"] });
equal(state.requests, []);

const followerCalls = [];
const followerState = { requests: [], turns: [] };
const follower = owner.buildApprovalActionContext({
  logger,
  hostId: "host-1",
  approvalResolved() {},
  ipcBridge: { request: async (...args) => (followerCalls.push(args), { resultType: "success" }) },
  parseUrl: () => null,
  dispatchAppServerResponse() {},
  getStreamRole: () => ({ role: "follower", ownerClientId: "owner-1" }),
  conversations: new Map([["thread-2", followerState]]),
  updateConversationState() {},
});
owner.replyWithFileChangeApprovalDecision(follower, "thread-2", "request-3", "decline");
await Promise.resolve();
equal(followerCalls[0], [
  "thread-follower-file-approval-decision",
  { conversationId: "thread-2", requestId: "request-3", decision: "decline" },
  { targetClientId: "owner-1" },
]);

const dynamicState = { requests: [{ id: "request-4", method: "item/tool/call", params: { tool: "request_option_picker" } }] };
const dynamicCalls = [];
const manager = {
  getConversation: () => dynamicState,
  updateConversationState: (_id, update) => update(dynamicState),
};
owner.replyWithOptionPickerResponse(manager, (method, response) => dynamicCalls.push([method, response]), "thread-1", "request-4", { action: "dismiss" });
equal(dynamicCalls[0][0], "item/tool/call");
equal(dynamicCalls[0][1].result.success, true);
equal(dynamicState.requests, []);

const unsafe = {
  ...context,
  getConversationRequests: () => [{ id: "request-5", method: "mcpServer/elicitation/request", params: { mode: "form" } }],
  isMcpServerElicitationApprovalSafe: () => false,
};
assert.throws(() => owner.replyWithMcpServerElicitationResponse(unsafe, "thread-1", "request-5", { action: "accept" }), /Unsafe MCP/);
assertions += 1;
equal(owner.buildMcpServerElicitationItem("request-6", { turnId: "turn-1", mode: "openai/userVerification", challenge: "secret" }, false, null).params.challenge, "");
equal(owner.planImplementationItemId("turn-1"), "implement-plan:turn-1");
equal(owner.isSafeAutoElicitation({
  serverName: "computer-use",
  parsed: { kind: "mcpToolCall", approval: { connector_id: "browser-use", tool_name: "access_browser_origin" } },
}, { params: { approvalPolicy: "never", sandboxPolicy: { type: "dangerFullAccess" } }, items: [] }, () => null), true);
const synthesisState = { turns: [{ turnId: "turn-1", items: [] }] };
owner.applyMcpServerElicitationItem(synthesisState, { turnId: "turn-1" }, { id: "elicitation", type: "mcpServerElicitation" }, logger);
owner.applyPermissionRequestItem(synthesisState, "permission-1", { turnId: "turn-1", reason: "Need access", permissions: { network: true } }, false, null, logger);
equal(synthesisState.turns[0].items.map((item) => item.type), ["mcpServerElicitation", "permissionRequest"]);
owner.applyUserInputRequest(synthesisState, "input-1", {
  turnId: "turn-1", questions: [{ id: "q1", header: "Choice", question: "Pick", options: [{ label: "A", description: "First" }] }],
}, {}, false, logger);
equal(synthesisState.turns[0].items.at(-1), {
  id: "user-input-response-input-1", type: "userInputResponse", requestId: "input-1", turnId: "turn-1",
  questions: [{ id: "q1", header: "Choice", question: "Pick", options: [{ label: "A", description: "First" }] }],
  answers: {}, completed: false,
});

const managerSource = fs.readFileSync(new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url), "utf8");
equal(managerSource.includes('createAutoApprovedElicitation as beginUserVerification'), true);
equal(managerSource.includes("getMcpServerElicitationItem(requestId: string, params: any, completed: boolean, action: unknown)"), true);
const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('const { Yv, Xv, L_e, Zv, Qv } = require("./main-app/requests/item-synthesis.js")'), true);
equal(main.includes("var G_e = class extends n.Uf"), false);
equal(main.includes("function K_e({"), false);
for (const name of ["Uv", "Wv", "M_e", "N_e", "P_e", "F_e", "Gv", "Kv", "Jv", "Yv", "Xv", "L_e", "R_e", "Zv", "Qv", "z_e", "B_e", "V_e", "ey", "H_e", "U_e", "W_e"])
  equal(main.includes(`function ${name}(`), false);
equal(main.includes("function $v("), false);

console.log(`${assertions} main item synthesis owner assertions passed`);
