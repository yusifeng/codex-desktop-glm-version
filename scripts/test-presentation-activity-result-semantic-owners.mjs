import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsxRuntime = {
  Fragment: "Fragment",
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
globalThis.__presentationActivityResult = { jsxRuntime, navigations: [] };

async function bundle(directory, mocks) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "presentation-activity-result-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({ contents: mocks[moduleName] ?? "export const n=()=>{};export const r=()=>{};export const t=()=>{};", loader: "js" }));
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${Date.now()}`);
}

function walk(root) {
  const nodes = [];
  const visit = value => {
    if (value == null || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    if ("type" in value && "props" in value) nodes.push(value);
    visit(value.props?.children);
  };
  visit(root);
  return nodes;
}

const appShared = "export const I3=()=>globalThis.__presentationActivityResult.jsxRuntime;export const $3=()=>{};";
const appInitial = `
  export const C=()=>{};
  export const oZt='codex_app'; export const zsn='chrome_extension'; export const vsn='get_tab_context';
  export const Khn='environment_setup'; export const tZt='read_settings'; export const nZt='write_settings';
  export const zXt='create_thread'; export const RXt='read_thread'; export const JXt='handoff_thread'; export const qXt='get_handoff_status';
  export const BXt='create_worktree'; export const VXt='fork_thread'; export const HXt='send_message_to_thread'; export const WXt='wait_threads';
  export const UXt='list_threads'; export const GXt='list_archived_threads'; export const XXt='get_usage_limits'; export const ZXt='list_projects';
  export const rXt=({server,tool,toolResult})=>server==='registered'&&tool==='widget'&&toolResult?{id:'app'}:null;
  export const Ern=({appContext})=>appContext?.connectorId?{id:appContext.connectorId}:null;
  export const dispatchHostMessage=message=>globalThis.__presentationActivityResult.navigations.push(message);
`;

assertReleaseOwner("presentation");

assertReleaseOwner("result-card");

const activity = await bundle("agent-activity-item", {
  "app-shared": appShared,
  "app-initial": appInitial,
  "app-primary": "export const d=()=>{};",
  presentation: "export const a=()=>{};export const o=()=>null;export const r=item=>({key:item.tool,message:{defaultMessage:item.tool},values:{}});",
  "result-card": "export const r=()=>{};",
  "skill-exploration-labels": "export const n=()=>{};export const t=({summary})=>summary;export const c=summary=>(summary.cmd||'').length>10;",
  "tool-activity-disclosure": "export const n=()=>{};export const t=props=>globalThis.__presentationActivityResult.jsxRuntime.jsx('disclosure',props);",
});
activity.s();
assert.equal(activity.o({ namespace: "codex_app", tool: "create_worktree" }).continuesLiveActivityBetweenCalls, true);
assert.equal(activity.o({ namespace: null, tool: "environment_setup" }).standaloneInConversation, true);
assert.equal(activity.o({ namespace: "codex_app", tool: "handoff_thread" }).standaloneInConversation, true);
assert.equal(activity.o({ namespace: "codex_app", tool: "get_handoff_status" }).summaryOnlyInConversationGroup, true);
assert.equal(activity.a({ namespace: "codex_app", tool: "handoff_thread", arguments: { threadId: "thread-1", destinationHostId: "host-1" } }).includes('["thread-1","host-1"]'), true);
assert.equal(activity.m({ item: { type: "mcp-tool-call", completed: false, invocation: { server: "registered", tool: "widget" }, result: { type: "success", raw: { ok: true } } } }), true);
assert.equal(activity.r({ type: "exec", parsedCmd: { type: "read", cmd: "01234567890" }, cwd: "/tmp" }), true);
const created = activity.u({ result: { threadId: "thread-2" } });
assert.equal(created.type, "button");
created.props.onClick();
assert.deepEqual(globalThis.__presentationActivityResult.navigations.at(-1), { type: "navigate-to-route", path: "codex://threads/thread-2" });
const row = activity.f({ item: { type: "dynamic-tool-call", completed: true, success: true, namespace: "codex_app", tool: "create_thread" }, variant: "row" });
assert.equal(row.props["data-status"], "completed");

console.log("presentation, result-card, and agent-activity-item semantic owner assertions passed");
