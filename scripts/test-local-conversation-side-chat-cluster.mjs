import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__sideChatTest = { associations: [], completed: [], created: [], discardFails: false, discarded: [], failed: 0, initialized: [], pending: [], related: [], reopened: [], unlinked: [] };
state.jsx = { jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
state.controller = {
  panelId: "right-panel", tabs$: { kind: "tabs" },
  openPendingTab(_scope, definition, options) {
    const record = { definition, options, current: true }; state.pending.push(record);
    return { complete(nextDefinition, nextOptions) { state.completed.push({ definition: nextDefinition, options: nextOptions }); return true; }, fail() { state.failed += 1; }, isCurrent() { return record.current; } };
  },
  openTab(_scope, definition, options) { state.reopened.push({ definition, options }); },
};
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/local-conversation-side-chat/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "side-chat-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: name }) => ({ loader: "js", contents:
      name === "app-shared" ? `export const I3=()=>globalThis.__sideChatTest.jsx;export const e6=()=>({createContext:value=>({kind:'context',value})});export const Qq=()=>"client-1";export const $3=()=>globalThis.__sideChatTest.initialized.push('$3');export const FX=()=>{};export const QI=()=>{};export const wL=()=>{};export const K2=()=>{};`
      : name === "app-primary" ? `export const d=()=>globalThis.__sideChatTest.initialized.push('primary');`
      : name === "loading-page" ? `export const LoadingPage=props=>({type:'loading-page',props});`
      : name === "registered-conversation-thumbnail" ? `export const RegisteredConversationThumbnail=props=>({type:'thumbnail',props});`
      : name === "app-initial" ? `
        export const Ri="sidechat:",zi={kind:'sidechat'},Li={kind:'loading'},JZt={kind:'archived'},OY={kind:'cloud-archived'},gfn={kind:'settings'},iQt={kind:'model'},Icn={kind:'prose'},FDt=()=>{},_vt=()=>{},C=()=>{};
        export const IDt=(kind,component,options)=>({kind,component,...options});export const hvt=()=>globalThis.__sideChatTest.controller;
        export const Usn=(settings,model)=>({settings,model});export const fsn=()=>true;export const Yon=async()=>["/workspace"];export const Qln=async(_name,input)=>{globalThis.__sideChatTest.instructionRequest=input;return{instructions:"Repository instructions"}};export const Xht=async(_scope,hostId,input)=>{globalThis.__sideChatTest.created.push(input);if(hostId==="failure")return Promise.reject(new Error("create failed"));return{conversationId:"side-1",input,synchronization:hostId==="sync-failure"?{status:"failed",message:"sync failed"}:{status:"ok"}}};
        export const Ugn=()=>({discardConversationFromCache:async id=>{if(globalThis.__sideChatTest.discardFails)throw new Error('discard failed');globalThis.__sideChatTest.discarded.push(id)}});
        export const Ttn=(scope,value)=>globalThis.__sideChatTest.associations.push(value);export const GCt=(scope,parent,child)=>globalThis.__sideChatTest.related.push({parent,child});export const JCt=(scope,parent,child)=>globalThis.__sideChatTest.unlinked.push({parent,child});
      ` : `export {};`,
    }));
  } }],
});
const sideChat = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#side-chat`);
const values = new Map([["tabs", [{ tabId: "sidechat:existing" }]], ["settings", { source: "settings" }], ["model", "gpt-test"], ["prose", true]]);
const scope = { value: { pathname: "/threads/main", routeKind: "local-thread", search: "?view=chat" }, get(signal) { return values.get(signal?.kind) ?? false; } };

assert.deepEqual(Object.keys(sideChat), ["i", "n", "r", "t"]);
assert.equal(sideChat.t.kind, "context");
assert.equal(sideChat.i.kind.kind, "sidechat");
assert.equal(sideChat.i.isAvailable(scope), true);
const SideChatTab = props => ({ type: "side-chat-tab", props });
assert.equal(await sideChat.r(scope, SideChatTab, { sourceConversationId: "main", hostId: "local", intl: { formatMessage: (_descriptor, input) => input == null ? "Side chat" : `Side chat ${input.index}` } }), "side-1");
assert.equal(state.pending[0].options.title, "Side chat 2");
assert.equal(state.pending[0].options.props.clientThreadId, "client-1");
assert.equal(state.completed[0].options.id, "sidechat:side-1");
assert.equal(state.completed[0].options.props.conversationId, "side-1");
assert.match(state.created[0].developerInstructions, /^Repository instructions/);
assert.match(state.created[0].developerInstructions, /side conversation, not the main thread/);
assert.deepEqual(state.instructionRequest.params.instructionOverrides, { settings: { source: "settings" }, model: "gpt-test" });
assert.equal(state.instructionRequest.params.hostedAutomationsEnabled, true);
assert.equal(state.instructionRequest.params.includeProseDetailLevelInstructions, true);
assert.match(state.completed[0].options.props.SideChatTab.name, /SideChatTab/);
assert.deepEqual(state.associations, [{ clientThreadId: "client-1", conversationId: "side-1" }]);
assert.deepEqual(state.related, [{ parent: "main", child: "side-1" }]);
await state.completed[0].options.onClose();
assert.deepEqual(state.discarded, ["side-1"]);
assert.deepEqual(state.unlinked, [{ parent: "main", child: "side-1" }]);
state.discardFails = true;
await sideChat.r(scope, SideChatTab, { sourceConversationId: "main", hostId: "local" });
await state.completed.at(-1).options.onClose();
assert.equal(state.reopened.length, 1);
state.discardFails = false;

await assert.rejects(() => sideChat.r(scope, SideChatTab, { sourceConversationId: "main", hostId: "sync-failure" }), /sync failed/);
assert.equal(state.completed.length, 2, "synchronization failure must not complete a tab");

await assert.rejects(() => sideChat.r({ ...scope, get(signal) { return signal?.kind === "archived"; } }, SideChatTab, { sourceConversationId: "main", hostId: "local" }), /archived conversation/);
await assert.rejects(() => sideChat.r(scope, SideChatTab, { sourceConversationId: "main", hostId: "failure" }), /create failed/);
assert.equal(state.failed, 2);
console.log("local conversation side-chat cluster assertions passed");
