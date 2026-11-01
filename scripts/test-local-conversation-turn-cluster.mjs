import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const opened = [];
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/local-conversation-turn/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{ name: "local-turn-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => {
      if (importPath === "app-shared") return { loader: "js", contents: `
        export const $3=()=>{};export const $h=()=>{};export const $r=()=>{};export const BK=()=>{};export const BX=()=>{};export const Bk=()=>{};
        export const I3=()=>globalThis.__localTurnJsx;export const e6=()=>({memo:value=>value,useState:value=>[value,()=>{}]});
      ` };
      if (importPath === "app-initial") return { loader: "js", contents: "export const C=()=>{};export default {};" };
      if (importPath === "app-primary") return { loader: "js", contents: "export const d=()=>{};export default {};" };
      if (importPath === "rolldown-runtime") return { loader: "js", contents: "export const o=()=>{};export default {};" };
      if (importPath === "conversation-blocks") return { loader: "js", contents: "export const a=props=>({type:'turn-body',props});export const i=()=>{};export const n=()=>{};export const t=()=>{};export default {};" };
      return { loader: "js", contents: "export default {};" };
    });
  } }],
});
globalThis.__localTurnJsx = jsx;
const turn = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#local-turn`);

function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function all(node, predicate) { const result = []; walk(node, value => { if (predicate(value)) result.push(value); }); return result; }

assert.deepEqual(Object.keys(turn), ["a", "c", "i", "n", "o", "r", "s", "t"]);
assert.equal(turn.r({ stage: "creating" }), "Creating setup task");
assert.equal(turn.r({ stage: "connecting" }), "Connecting to setup task");
assert.equal(turn.r({ stage: "starting" }), "Starting thread");

const resources = turn.s({
  conversationId: "conversation",
  hostId: "host",
  turnId: "turn",
  onFileOpen(path, options) { opened.push({ path, options }); },
  resources: [
    { type: "file", path: "/tmp/a.txt" },
    { type: "google-drive", url: "https://drive.example/file", title: "Drive file" },
    { type: "website", target: "https://example.test", title: "Example" },
    { type: "artifact-session", artifactRef: "artifact" },
  ],
});
assert.equal(all(resources, node => node.props?.["data-resource-type"] != null).length, 3, "resources collapse to the first three rows");
find(resources, node => node.type === "button" && node.props?.children === "/tmp/a.txt").props.onClick();
assert.equal(opened[0].path, "/tmp/a.txt");
assert.equal(find(resources, node => node.type === "button" && node.props?.children === "Show 1 more").props["aria-expanded"], false);

const openedSubagents = [];
const subagents = turn.a({ status: "working", rows: [{ conversationId: "child", displayName: "Reviewer", canOpen: true }], shouldAnimateEntrance: () => false, onOpen(id, name) { openedSubagents.push({ id, name }); } });
assert.equal(subagents.props["data-testid"], "subagent-activity-inline-group");
find(subagents, node => node.type === "button").props.onClick();
assert.deepEqual(openedSubagents, [{ id: "child", name: "Reviewer" }]);

const edits = [];
const forks = [];
const rendered = turn.t({
  conversationId: "conversation",
  hostId: "host",
  isMostRecentTurn: true,
  latestLoadedUserTurnId: "turn",
  onEditLastTurnMessage: async (source, message) => edits.push({ source, message }),
  onForkTurnMessage: source => forks.push(source),
  supersededMcpAppWidgetCallIds: new Set(["call"]),
  turn: { turnId: "turn", status: "completed", items: [{ type: "mcp-tool-call", callId: "call" }] },
});
assert.equal(rendered.type, "turn-body");
assert.equal(rendered.props.turn.items[0].isMcpAppWidgetSuperseded, true);
await rendered.props.onEditUserMessage("updated");
rendered.props.onForkTurn();
assert.equal(edits[0].message, "updated");
assert.equal(forks.length, 1);
assert.equal(turn.n(), undefined);

console.log("local conversation turn cluster assertions passed");
