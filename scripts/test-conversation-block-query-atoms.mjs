import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__queryAtomsTest = { calls: 0, cacheSignal: { kind: "cache" } };

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/conversation-blocks/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{ name: "query-atom-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: name }) => ({ loader: "js", contents:
      name === "app-shared"
        ? "export const $3=()=>{};export const I3=()=>({Fragment:'Fragment',jsx:(type,props,key)=>({type,props,key}),jsxs:(type,props,key)=>({type,props,key})});export const e6=()=>({useState:value=>[value,()=>{}]});export const lY=String;export const ZI={kind:'scope'};export const $O={FIVE_MINUTES:300000};export const sZ=(_scope,read)=>({kind:'derived',read});export const QX=(_scope,build,options)=>({kind:'query-family',build,options});export const rZ=(_scope,read,options)=>({kind:'signal-family',read,options});"
        : name === "app-initial"
          ? "export const C=()=>{};export const Q0t=url=>url.includes('drive.google.com')?{appId:'google-drive'}:null;export const R9t=url=>url.searchParams.get('link_id');export const dun=()=>globalThis.__queryAtomsTest.cacheSignal;export const Rdt=async(_scope,hostId,server,tool,args)=>{globalThis.__queryAtomsTest.calls++;return {structuredContent:{title:`${hostId}:${server}:${tool}:${args.fileId}`}}};export const sXt=({toolResult})=>toolResult;export const F9t=value=>value;export const I_t={kind:'sources'};export const V_t={kind:'source-watch'};export const A_t={kind:'item-projection'};export const j_t=(_scope,source)=>({items:source.items});export const w$t=items=>items;"
          : name === "app-primary" ? "export const d=()=>{};"
          : name === "agent-activity-item" ? "export const n=()=>{};export const t=value=>value;"
          : "export const n=()=>{};export const i=()=>{};export const a=()=>{};export const u=()=>{};",
    }));
  } }],
});

const blocks = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
blocks.et();
assert.equal(blocks.$.kind, "query-family");

let cache = {};
const scope = {
  get(signal) { return signal === globalThis.__queryAtomsTest.cacheSignal ? cache : null; },
  set(signal, value) { assert.equal(signal, globalThis.__queryAtomsTest.cacheSignal); cache = value; },
};
const helpers = { get(signal) { return signal.kind === "derived" ? true : scope.get(signal); }, scope };
const input = { hostId: "local", url: "https://drive.google.com/file/d/file-123/view?link_id=link-456" };
const options = blocks.$.build(input, helpers);
assert.equal(options.enabled, true);
assert.equal(options.retry, false);
assert.equal(options.staleTime, 300_000);
assert.equal(await options.queryFn(), "local:codex_apps:google_drive.get_file_metadata:file-123");
assert.equal(await options.queryFn(), "local:codex_apps:google_drive.get_file_metadata:file-123");
assert.equal(globalThis.__queryAtomsTest.calls, 1, "second query should use the one-day asset title cache");

const unsupported = blocks.$.build({ hostId: "local", url: "https://example.test/file" }, helpers);
assert.equal(unsupported.enabled, false);
assert.equal(await unsupported.queryFn(), null);

blocks.Z();
assert.equal(blocks.Q.kind, "signal-family");
const rawItem = { id: "call-1", type: "mcpToolCall" };
const projectedItem = { id: "call-1", type: "mcpToolCall", projected: true };
const familyValue = blocks.Q.read({ threadId: "thread-1" }, {
  scope: {},
  get(signal, parameter) {
    if (signal.kind === "sources") return [{ threadId: "thread-1", items: [rawItem] }];
    if (signal.kind === "source-watch") return null;
    if (signal.kind === "item-projection" && parameter.itemId === "call-1") return projectedItem;
    return null;
  },
});
assert.equal(familyValue.get("call-1"), projectedItem);
assert.equal(blocks.Q.options.owner({ threadId: "thread-1" }), "thread-1");
console.log("conversation block query atom assertions passed");
