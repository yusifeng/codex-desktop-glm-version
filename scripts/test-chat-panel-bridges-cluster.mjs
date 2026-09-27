import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resetState() {
  globalThis.__chatPanelTest = {
    definitions: [],
    effects: [],
    opens: [],
    sets: [],
    verifyResult: true,
    warnings: [],
    jsx: {
      Fragment: Symbol("Fragment"),
      jsx: (type, props) => ({ type, props: props ?? {} }),
      jsxs: (type, props) => ({ type, props: props ?? {} }),
    },
  };
  return globalThis.__chatPanelTest;
}

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "chat-panel-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({
          path: value.slice(8), namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => {
          if (value === "app-shared") return { contents: `
            const state=globalThis.__chatPanelTest;
            const noop=()=>{};
            export const $3=noop,FX=noop,K2=noop,lw=noop,Z3=noop;
            export const I3=()=>state.jsx; export const Y2=Symbol("FormattedMessage"); export const V_=Symbol("UnarchiveIcon");
            export const e6={useLayoutEffect(effect){state.effects.push(effect);const cleanup=effect();if(cleanup)state.cleanup=cleanup}};
            export const LX=()=>({set(signal,value){state.sets.push({signal,value})}});
            export const Q3={warning(message,details){state.warnings.push({message,details})}};
          `, loader: "js" };
          if (value === "app-initial") return { contents: `
            const state=globalThis.__chatPanelTest; const noop=()=>{};
            export const $en={},Xct={}; export const Lb={delete:{id:"delete"},unarchive:{id:"unarchive"}};
            export const Rb=noop,X7=noop,Yct=noop,itn=noop; export const l9=Symbol("Button");
            export const GZt={},PQt={},kZt={},lQt={},vZt={},wZt={},zZt={},mpn={};
            export const Wgn=noop,HZt=noop,Wvt=noop,cg=noop,ig=noop,ppn=noop;
            export const og="subagents"; export const sg=(id)=>"subagents:"+id;
            export const qvt={tabById$:Symbol("tabs")};
            export const ag=(definition)=>(state.definitions.push(definition),definition);
            export const Gvt=(scope,definition,options)=>{state.opens.push(options);scope.tabs.set(options.id,{props:options.props,renderPanel:"panel"});return options.id};
            export const Ugn=()=>({hydrateBackgroundThreads:async(ids,options)=>{state.hydrated={ids,options}}});
          `, loader: "js" };
          if (value === "verify-descendant") return { contents: `
            export const t=()=>{};
            export const n=()=>globalThis.__chatPanelTest.verifyResult;
          `, loader: "js" };
          return { contents: "export {};", loader: "js" };
        });
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${Math.random()}`);
}

let state = resetState();
const metadata = await bundle("chat-tab-metadata-bridge");
metadata.i();
const preview = metadata.r({
  restored: false, restoring: false, deleting: false,
  onDelete: () => {}, onDone: () => {}, onUnarchive: () => {},
});
assert.equal(preview.type, "div");
assert.equal(preview.props.children[0].type, "span");
assert.equal(preview.props.children[1].props.children.length, 2);
const deleteButton = preview.props.children[1].props.children[0];
assert.equal(deleteButton.props.color, "danger");
assert.equal(deleteButton.props.loading, false);
const primaryButton = preview.props.children[1].props.children[1];
assert.equal(primaryButton.props.color, "primary");
assert.equal(primaryButton.props.loading, false);
const restoring = metadata.r({ restored: false, restoring: true, onDone() {}, onUnarchive() {} });
assert.equal(restoring.props.children[1].props.children[0], null);
assert.equal(restoring.props.children[1].props.children[1].props.loading, true);
const restored = metadata.r({ restored: true, restoring: false, onDone() {}, onUnarchive() {} });
assert.equal(restored.props.children[1].props.children[0], null);
assert.equal(restored.props.children[1].props.children[1].props.onClick.name, "onDone");
metadata.n();
assert.equal(metadata.t({ title: "Chat title" }), null);
assert.equal(state.sets[0].value, "Chat title");
state.cleanup();
assert.equal(state.sets.at(-1).value, null);

state = resetState();
const subagents = await bundle("open-local-conversation-subagents-panel");
subagents.t();
assert.equal(state.definitions.length, 1);
const tabs = new Map();
const scope = {
  tabs,
  get(signal, parameter) {
    if (signal === undefined) return null;
    if (signal === globalThis.__never) return null;
    if (signal && signal === Object(signal) && "tabById$" in (signal ?? {})) return null;
    if (parameter === "parent") return true;
    if (parameter === "child") return true;
    if (parameter === "host") return { getConversation: () => ({ forkedFromId: null }) };
    if (typeof parameter === "string" && parameter.startsWith("subagents:")) return tabs.get(parameter) ?? null;
    if (signal === undefined) return null;
    if (parameter === undefined && signal) return { formatMessage: ({ defaultMessage }) => defaultMessage };
    return tabs.get(parameter) ?? null;
  },
};
// qvt.tabById$ is a symbol in the mock, so handle it explicitly after module initialization.
scope.get = (signal, parameter) => {
  if (typeof signal === "symbol") return tabs.get(parameter) ?? null;
  if (parameter === undefined) return { formatMessage: ({ defaultMessage }) => defaultMessage };
  if (parameter === "host") return { getConversation: () => ({ forkedFromId: null }) };
  if (parameter === "parent" || parameter === "child") return true;
  return null;
};
const overviewId = await subagents.n(scope, { hostId: "host", parentConversationId: "parent" });
assert.equal(overviewId, "subagents:parent");
assert.equal(state.opens.length, 1);
assert.equal(state.opens[0].durableRoute.kind, "subagents");
assert.equal(state.opens[0].props.parentConversationId, "parent");
assert.equal(state.opens[0].props.requestedConversationId, null);
assert.equal(state.opens[0].title, "Subagents");
state.verifyResult = false;
const unavailable = await subagents.n(scope, {
  hostId: "host", parentConversationId: "parent", selectedConversationId: "missing",
});
assert.equal(unavailable, null);
assert.equal(state.opens.length, 1);
const deferred = await subagents.n(scope, {
  deferHydrationUntilActivation: true,
  hostId: "host", parentConversationId: "parent", selectedConversationId: "child",
});
assert.equal(deferred, "subagents:parent");
assert.equal(state.opens.at(-1).props.isLoading, true);
assert.equal(typeof state.opens.at(-1).onActivate, "function");

console.log("26 chat metadata and side-panel bridge assertions passed");
