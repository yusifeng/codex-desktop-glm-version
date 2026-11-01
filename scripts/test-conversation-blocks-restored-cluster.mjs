import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const calls = [];
globalThis.__conversationBlocksTest = {
  calls,
  registeredApps: new Set(),
  jsx: {
    Fragment: "Fragment",
    jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
    jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  },
};
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/conversation-blocks/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{ name: "conversation-block-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: name }) => ({ loader: "js", contents:
      name === "app-shared" ? "export const $3=()=>globalThis.__conversationBlocksTest.calls.push('$3');export const I3=()=>globalThis.__conversationBlocksTest.jsx;export const e6=()=>({useState:value=>[typeof value==='function'?value():value,()=>{}]});export const eU=value=>'app:'+value;export const rZ=()=>({kind:'registered-mcp-app'});export const BX=(descriptor,value)=>descriptor?.kind==='registered-mcp-app'&&globalThis.__conversationBlocksTest.registeredApps.has(value);export const lY=value=>String(value).replace(/^thread:/,'');"
      : name === "app-initial" ? "export const $en={};export const cct={};export const gct={};export const Ern=({apps})=>apps?.[0]??null;export const C=()=>globalThis.__conversationBlocksTest.calls.push('initial');"
      : name === "app-primary" ? "export const d=()=>globalThis.__conversationBlocksTest.calls.push('primary');"
      : name === "agent-activity-item" ? "export const n=()=>globalThis.__conversationBlocksTest.calls.push('activity-item');export const t=x=>x;"
      : name === "agent-activity-units" ? "export const n=()=>globalThis.__conversationBlocksTest.calls.push('activity-units');"
      : name === "mcp-tool-item-content" ? "export const n=()=>{};export const t=props=>({type:'mcp-tool-content',props});"
      : name === "plan-summary-item-content" ? "export const n=()=>{};export const t=props=>({type:'plan-summary',props});"
      : name === "scroll-to-match" ? "export const n=()=>globalThis.__conversationBlocksTest.calls.push('scroll');"
      : "export const n=()=>globalThis.__conversationBlocksTest.calls.push('n');export const i=()=>globalThis.__conversationBlocksTest.calls.push('i');export const a=()=>globalThis.__conversationBlocksTest.calls.push('a');export const u=()=>globalThis.__conversationBlocksTest.calls.push('u');",
    }));
  } }],
});
const blocks = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let found; walk(node, value => { if (found == null && predicate(value)) found = value; }); return found; }

for (const name of ["$", "A", "B", "C", "K", "L", "P", "R", "S", "W", "Y", "a", "f", "g", "n", "r", "u", "x"]) assert.ok(name in blocks, `missing export ${name}`);
assert.equal(blocks.L(["completed", "completed"]), "completed");
assert.equal(blocks.L(["done", "completed"]), "completed");
assert.equal(blocks.L(["active", "completed"]), "active");
assert.equal(blocks.L(["completed", "updated"]), "updated");
assert.equal(blocks.L(["interrupted", "updated"]), "interrupted");
assert.deepEqual(blocks.I([{ id: "2", parentTurnKey: "t", displayName: "Beta" }, { id: "1", parentTurnKey: "t", displayName: "Alpha" }, { id: "3", parentTurnKey: "x", displayName: "No" }], "t"), ["Alpha", "Beta"]);

assert.equal(blocks.x({ conversationId: "c", src: "image.png" }).type, "img");
assert.equal(blocks.S({ conversationId: "c", hostId: "h", srcs: ["a.png", "b.png"] }).props["data-image-stack"], true);
assert.equal(blocks.C({ attachment: { name: "report.txt", path: "/tmp/report.txt" } }).props["data-attachment"], true);
assert.equal(blocks.f({ item: { action: "search", query: "release notes" } }).props["data-web-search"], "search");
assert.equal(blocks.K({ results: [] }), null);
assert.equal(find(blocks.K({ results: ["one"] }), node => node.props?.["data-search-result"] === true).props["data-search-result"], true);
assert.match(find(blocks.K({ results: [1, 2, 3, 4, 5] }), node => node.type === "button").props.children, /2 more/);
assert.doesNotThrow(() => blocks.K({ results: [{ title: "Recovered result" }] }));
const activityRows = blocks.F({ turnKey: "turn", activityItems: [{ agentThreadId: "thread:child", displayName: "Reviewer", displayStatus: "active" }], backgroundAgentById: new Map([["child", { conversationId: "child", displayName: "Reviewer", parentTurnKey: "turn", status: "active" }]]), laterActivityConversationIds: new Set() });
assert.equal(activityRows[0].conversationId, "child");
assert.equal(activityRows[0].canOpen, true);
const activityGroups = blocks.P({ turnKey: "turn", activityItemGroups: [[{ id: "activity", agentThreadId: "child", displayName: "Reviewer", displayStatus: "completed" }]], backgroundAgents: [{ conversationId: "child", displayName: "Reviewer", parentTurnKey: "turn", status: "done" }] });
assert.equal(activityGroups[0].anchorItemId, "activity");
assert.ok(Array.isArray(activityGroups[0].rows));

const unit = (type, extra = {}) => ({ kind: "standalone", item: { item: { type, ...extra } } });
const assembled = blocks.a({ conversationId: "conversation", hostId: "local", renderMcpApps: true, keepMcpAppEntriesPersistent: true, units: [
  unit("realtime-transcript"),
  unit("assistant-message"),
  unit("realtime-transcript"),
  unit("user-message", { steeringStatus: "pending" }),
  unit("mcp-tool-call", { mcpAppResourceUri: "ui://widget", result: { type: "success" } }),
  unit("worked-for", { durationMs: 1000 }),
] });
assert.ok(find(assembled, node => node.props?.["data-turn-blocks"] === true));
assert.ok(find(assembled, node => node.props?.["data-turn-unit-type"] === "assistant-message") ?? find(assembled, node => node.props?.["data-conversation-block"] === "assistant-message"));
assert.equal(find(assembled, node => node.type === "mcp-tool-content").props.conversationId, "conversation");
assert.equal(find(assembled, node => node.type === "mcp-tool-content").props.hostId, "local");
assert.equal(find(assembled, node => node.type === "mcp-tool-content").props.renderMcpApps, true);
assert.doesNotMatch(JSON.stringify(assembled), /worked-for/);
const imageFailure = blocks.r({ units: [unit("generated-image", { failure: { message: "generation failed" }, status: "failed" })] });
assert.ok(find(imageFailure, node => node.props?.["data-image-generation-error"] === true));
const imagePending = blocks.r({ units: [unit("generated-image", { status: "inProgress" })] });
assert.ok(find(imagePending, node => node.props?.["data-image-generation-pending"] === true));
const imageFinishedWithoutSource = blocks.r({ units: [unit("generated-image", { status: "completed" })] });
assert.equal(find(imageFinishedWithoutSource, node => node.props?.["data-image-generation-pending"] === true), undefined);
const persistence = { load() {}, save() {} };
assert.equal(find(blocks.Y({ conversationId: "c", hostId: "h", items: [{ callId: "call", type: "mcp-tool-call", invocation: { server: "s", tool: "t" } }], widgetStatePersistence: persistence }), node => node.type === "mcp-tool-content"), undefined);
globalThis.__conversationBlocksTest.registeredApps.add("app:call");
const registeredWidget = find(blocks.Y({ conversationId: "c", hostId: "h", items: [{ callId: "call", type: "mcp-tool-call", invocation: { server: "s", tool: "t" } }], resolvedApps: [{ id: "app" }], widgetStatePersistence: persistence }), node => node.type === "mcp-tool-content");
assert.equal(registeredWidget.props.widgetStatePersistence, persistence);
assert.equal(registeredWidget.props.matchingApp.id, "app");
assert.doesNotThrow(() => blocks.W({ item: { content: [{ text: "structured" }] } }));
assert.match(JSON.stringify(blocks.W({ item: { content: [{ text: "structured" }] } })), /structured/);

blocks.i(); blocks.i(); blocks.n(); blocks.t();
assert.equal(calls.filter(value => value === "activity-item").length, 1);
console.log("conversation blocks restored cluster assertions passed");
