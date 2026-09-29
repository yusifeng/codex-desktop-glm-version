import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/pending-request-item-panel/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
let sourceAssertions = 0;
let runtimeAssertions = 0;
const sourceEqual = (actual, expected, message) => { sourceAssertions += 1; assert.deepEqual(actual, expected, message); };
const equal = (actual, expected, message) => { runtimeAssertions += 1; assert.deepEqual(actual, expected, message); };

const dependencies = [...new Set([...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map((match) => match[1]))];
sourceEqual(dependencies, ["rolldown-runtime", "app-shared", "app-initial", "app-primary", "plan-implementation-request", "permission-request-model", "result-values", "side-panel", "editable-plan-tab", "plan-side-panel", "result-card", "patch-diff-stats", "diff-preview-tooltip", "hand", "read-saved-plan-content", "mcp-server-elicitation-request-panel"], "preserves the sixteen published direct dependencies in order");
sourceEqual(/import\s*\(/.test(source), false, "does not add dynamic dependencies");
sourceEqual(/\bany\b/.test(source), false, "does not introduce an unsafe explicit type");
sourceEqual(/import \* as/.test(source), false, "does not consume dependency namespaces");
for (const marker of ["replyWithCommandExecutionApprovalDecision", "replyWithFileChangeApprovalDecision", "replyWithPermissionsRequestApprovalResponse", "replyWithOptionPickerResponse", "replyWithUserInputResponse", "removePlanImplementationRequest"]) sourceEqual(source.includes(marker), true, "preserves " + marker);

const state = globalThis.__pendingRequestPanel = { calls: { init: [], user: [], option: [], exec: [], patch: [], permission: [], removePlan: [], followup: [], interrupt: [] }, cursor: 0, hooks: [] };
const renderNode = (type, props, key) => typeof type === "function" ? type(props) : ({ type, props, key });
state.jsx = { Fragment: "Fragment", jsx: renderNode, jsxs: renderNode };
state.react = { useState(initial) { const index = state.cursor++; if (!(index in state.hooks)) state.hooks[index] = typeof initial === "function" ? initial() : initial; return [state.hooks[index], (value) => { state.hooks[index] = typeof value === "function" ? value(state.hooks[index]) : value; }]; } };
state.scope = { id: "scope" };
state.service = {
  removePlanImplementationRequest: (...values) => state.calls.removePlan.push(values),
  replyWithCommandExecutionApprovalDecision: (...values) => state.calls.exec.push(values),
  replyWithFileChangeApprovalDecision: (...values) => state.calls.patch.push(values),
  replyWithOptionPickerResponse: (...values) => state.calls.option.push(values),
  replyWithPermissionsRequestApprovalResponse: (...values) => state.calls.permission.push(values),
  replyWithUserInputResponse: (...values) => state.calls.user.push(values),
};
const init = (name) => "()=>globalThis.__pendingRequestPanel.calls.init.push('" + name + "')";
const mocks = {
  "app-shared": "const s=globalThis.__pendingRequestPanel;export const I3=()=>s.jsx;export const e6=()=>s.react;export const LX=()=>s.scope;export const Y2='FormattedMessage';export const ZI={};",
  "app-initial": "const s=globalThis.__pendingRequestPanel;export const Ugn=()=>s.service;export const egt=async(...values)=>{s.calls.interrupt.push(values)};",
  "plan-implementation-request": "export const n=" + init("plan-request") + ";export const t='PLEASE IMPLEMENT THIS PLAN:';",
  "permission-request-model": "export const n=" + init("permission-model") + ";export const t=(request)=>{const groups=[];if(request.network!=null)groups.push({kind:'network'});for(const entry of request.fileSystem?.entries??[])groups.push({kind:'fileSystem',access:entry.access,paths:[entry.path.path??entry.path.pattern??':special']});return groups};",
  "result-values": "export const a=" + init("result-values") + ";",
  "side-panel": "export const n=" + init("side-panel") + ";",
  "editable-plan-tab": "export const t=" + init("editable-plan") + ";",
  "plan-side-panel": "export const t=" + init("plan-panel") + ";",
  "result-card": "export const r=" + init("result-card") + ";",
  "patch-diff-stats": "export const n=" + init("patch-stats") + ";export const t=(patch,path)=>({added:(patch.match(/^\\+/gm)||[]).length,deleted:(patch.match(/^-/gm)||[]).length,openLocation:{line:1,path}});",
  "diff-preview-tooltip": "export const n=" + init("diff-tooltip") + ";export const t=(props)=>({type:'diff-tooltip',props});",
  "hand": "export const n=" + init("hand") + ";",
  "read-saved-plan-content": "export const t=" + init("saved-plan") + ";",
  "mcp-server-elicitation-request-panel": "export const n=" + init("mcp") + ";export const t=(props)=>({type:'mcp-panel',props});",
};
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) {
  build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
  build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({ loader: "js", contents: mocks[moduleName] ?? "export {};" }));
} }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
const render = (pendingRequest, extra = {}) => { state.cursor = 0; return module.PendingRequestItemPanel({ conversationId: "conversation-1", hostId: "host-1", onSubmitLocalFollowup: (...values) => state.calls.followup.push(values), pendingRequest, ...extra }); };
const nodeChildren = (node) => Array.isArray(node?.props?.children) ? node.props.children : [node?.props?.children];
const find = (node, predicate) => { if (node == null || typeof node !== "object") return null; if (predicate(node)) return node; for (const child of nodeChildren(node)) { const match = find(child, predicate); if (match != null) return match; } return null; };
const buttons = (node) => { const found = []; const visit = (value) => { if (value == null || typeof value !== "object") return; if (value.type === "button") found.push(value); for (const child of nodeChildren(value)) visit(child); }; visit(node); return found; };

equal(Object.keys(module), ["PendingRequestItemPanel"], "preserves the sole public export");
equal(state.calls.init, ["plan-request", "permission-model", "result-values", "side-panel", "editable-plan", "plan-panel", "result-card", "patch-stats", "diff-tooltip", "hand", "saved-plan", "mcp"], "initializes every specialized dependency once");

let request = { type: "userInput", item: { requestId: "input-1", questions: [{ id: "role", question: "Role?", options: [{ label: "Engineer" }], isOther: true }] } };
let view = render(request);
find(view, (node) => node.type === "input" && node.props.type === "radio").props.onChange();
view = render(request);
find(view, (node) => node.type === "form").props.onSubmit({ preventDefault() {} });
equal(state.calls.user.at(-1), ["conversation-1", "input-1", { answers: { role: { answers: ["Engineer"] } } }], "submits selected user-input answers");
buttons(view)[0].props.onClick();
equal(state.calls.interrupt.at(-1)[1], { conversationId: "conversation-1", hostId: "host-1", initiatedBy: "user" }, "interrupts a regular request when dismissed");

state.hooks = [];
view = render({ type: "userInput", isOnboardingDynamicInput: true, item: { requestId: "onboard-1", questions: [{ id: "task", question: "Task?", options: [] }] } });
buttons(view)[0].props.onClick();
equal(state.calls.user.at(-1), ["conversation-1", "onboard-1", { answers: {} }], "dismisses onboarding input with an empty response");

state.hooks = [];
request = { type: "optionPicker", requestId: "picker-1", params: { allowMultiple: true, options: [{ id: "one" }, { id: "two" }], showFreeform: true } };
view = render(request); buttons(view)[0].props.onClick(); view = render(request); buttons(view).at(-1).props.onClick();
equal(state.calls.option.at(-1), ["conversation-1", "picker-1", { action: "submit", freeformAnswer: null, selectedOptions: ["one"] }], "submits option-picker selections");

state.hooks = [];
view = render({ type: "userInput", environmentInput: { mode: "review", state: { access: "private", name: "Demo", repositories: ["repo"], secretNames: ["TOKEN"], networkDomains: ["example.com"], networkEnabled: true } }, item: { requestId: "environment-1", questions: [] } });
buttons(view)[0].props.onClick();
equal(state.calls.user.at(-1)[2].answers.networkEnabled.answers, ["enabled"], "submits the complete environment review payload");

state.hooks = [];
view = render({ type: "setupCodexStep", step: "role", requestId: "setup-1" });
equal(find(view, (node) => node.type === "legend").props.children, "What kind of work do you do?", "renders the role setup step");
state.hooks = [];
view = render({ type: "setupCodexStep", step: "task", requestId: "setup-2" });
equal(find(view, (node) => node.type === "legend").props.children, "What's something we can knock off your list today?", "renders the task setup step");

view = render({ type: "approval", item: { type: "exec", approvalRequestId: "exec-1", command: ["pnpm", "test"], proposedExecpolicyAmendment: { command: "pnpm test" }, proposedNetworkPolicyAmendments: [{ host: "npmjs.org" }] } });
let actions = buttons(view); actions[1].props.onClick(); actions[2].props.onClick(); actions[3].props.onClick(); actions[4].props.onClick();
equal(state.calls.exec.slice(-4), [["conversation-1", "exec-1", "accept"], ["conversation-1", "exec-1", "acceptForSession"], ["conversation-1", "exec-1", { acceptWithExecpolicyAmendment: { execpolicy_amendment: { command: "pnpm test" } } }], ["conversation-1", "exec-1", { applyNetworkPolicyAmendment: { network_policy_amendment: { host: "npmjs.org" } } }]], "maps every command approval choice");

view = render({ type: "approval", item: { type: "patch", approvalRequestId: "patch-1", changes: { "src/app.ts": "--- a\n+++ b\n-old\n+new" } } });
equal(find(view, (node) => node.type === "diff-tooltip").props.linesAdded, 2, "shows patch diff statistics");
buttons(view)[0].props.onClick();
equal(state.calls.patch.at(-1), ["conversation-1", "patch-1", "decline"], "sends patch rejection");

view = render({ type: "permissionRequest", item: { requestId: "permission-1", permissions: { network: {}, fileSystem: { entries: [{ access: "read", path: { type: "path", path: "/repo" } }] } } } });
actions = buttons(view); actions[1].props.onClick(); actions[2].props.onClick(); actions[0].props.onClick();
equal(state.calls.permission.slice(-3).map((call) => call[2].scope), ["turn", "session", "turn"], "supports once, session, and deny permission scopes");
equal(state.calls.permission.at(-1)[2].permissions, {}, "denies permissions with an empty permission set");

view = render({ type: "mcpServerElicitation", requestId: "mcp-1" });
equal(view.type, "mcp-panel", "delegates MCP elicitation requests to the specialized panel");
equal(view.props.pendingRequest.requestId, "mcp-1", "passes the complete MCP request through");

state.hooks = [];
view = render({ type: "implementPlan", turnId: "turn-1", plan: "Build the feature" });
buttons(view).at(-1).props.onClick();
equal(state.calls.removePlan.at(-1), ["conversation-1", "turn-1"], "removes the implementation request after acceptance");
equal(state.calls.followup.at(-1), ["PLEASE IMPLEMENT THIS PLAN:\nBuild the feature", "plan_implementation"], "submits the canonical plan implementation follow-up");

console.log("pending-request-item-panel tests passed (" + sourceAssertions + " source assertions, " + runtimeAssertions + " runtime assertions)");
