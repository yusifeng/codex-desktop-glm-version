import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__threadShellRuntimeState = {
  active: { bottom: null, right: null },
  closed: [],
  panelOpen: { bottom: true, right: true },
  sessions: [],
  snapshots: new Map(),
  tabs: { bottom: [], right: [] },
};

async function main() {
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/thread-shell-runtime/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{
    name: "thread-shell-runtime-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({ contents: mocks[moduleName] ?? "export {};", loader: "js" }));
    },
  }],
});
const runtime = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);

runtime.n();
assert.notEqual(typeof runtime.c, "function", "bottom-terminal activity is a signal, not a scope function");
assert.notEqual(typeof runtime.l, "function", "default terminal location is a signal, not a scope function");
assert.notEqual(typeof runtime.u, "function", "right-terminal activity is a signal, not a scope function");

const values = new Map([
  [symbols.archived, false], [symbols.bottomOpen, true], [symbols.rightOpen, true], [symbols.defaultEnabled, true],
  [symbols.cwd, "/workspace/project"], [symbols.host, "local"], [symbols.workspaceState, "ready"], [symbols.terminalReady, true],
]);
const scope = {
  value: { routeKind: "local-thread", conversationId: "thread-1" },
  get(signal) {
    if (signal?.kind === "derived") return signal.read({ get: value => this.get(value), scope: this });
    if (signal === controllers.bottom.tabs$) return state.tabs.bottom;
    if (signal === controllers.right.tabs$) return state.tabs.right;
    if (signal === controllers.bottom.activeTab$) return state.active.bottom == null ? null : { tabId: state.active.bottom };
    if (signal === controllers.right.activeTab$) return state.active.right == null ? null : { tabId: state.active.right };
    return values.get(signal);
  },
  set(signal, value) { values.set(signal, value); },
  watch(listener) { state.watch = listener; return () => { state.watch = null; }; },
};

assert.equal(scope.get(runtime.l), "bottom");
assert.equal(runtime.t(scope), true);
const first = runtime.r(scope, undefined, "bottom");
assert.equal(first, "session-1");
assert.equal(state.sessions.length, 1);
assert.equal(state.tabs.bottom[0].tabId, "terminal:session-1");
assert.equal(state.active.bottom, "terminal:session-1");
assert.equal(scope.get(runtime.c), true);
assert.equal(runtime.r(scope, first, "right"), first, "an existing terminal keeps its owning panel");
assert.equal(state.tabs.right.length, 0);

runtime.o(scope, "right");
assert.equal(state.tabs.right[0].tabId, "terminal:session-2");
assert.equal(scope.get(runtime.u), true);
runtime.i(scope, { panel: "bottom", sessionId: "restored", snapshot: { rows: 24 } });
assert(state.sessions.includes("restored"));
assert.equal(state.tabs.bottom.some(tab => tab.tabId === "terminal:restored"), true);

values.set(symbols.bottomOpen, false);
runtime.s(scope);
assert.equal(values.get(symbols.deferred), true);
runtime.m(scope);
values.set(symbols.bottomOpen, true);
state.watch(scope);
assert.equal(values.get(symbols.deferred), false);

const fallback = { context: { conversationId: "fallback", cwd: "/tmp" }, sessions: [], defaultTerminalLocation: "right" };
assert.equal(runtime.r(fallback), "terminal-1");
assert.equal(fallback.sessions[0].panel, "right");

console.log("thread-shell-runtime semantic owner assertions passed");
}

function controller(panel) {
  return {
    activeTab$: Symbol(`${panel}-active`), tabs$: Symbol(`${panel}-tabs`),
    activateTab(_scope, tabId) { state.active[panel] = tabId; },
    closeTab(_scope, tabId) { state.tabs[panel] = state.tabs[panel].filter(tab => tab.tabId !== tabId); state.closed.push(tabId); },
    updateTab(_scope, tabId, patch) { Object.assign(state.tabs[panel].find(tab => tab.tabId === tabId), patch); },
  };
}
const controllers = { bottom: controller("bottom"), right: controller("right") };
const symbols = {
  route: Symbol("route"), archived: Symbol("archived"), bottomOpen: Symbol("bottom-open"), rightOpen: Symbol("right-open"),
  defaultEnabled: Symbol("default-enabled"), cwd: Symbol("cwd"), host: Symbol("host"), workspaceState: Symbol("workspace-state"),
  terminalReady: Symbol("terminal-ready"), deferred: Symbol("deferred"),
};
const initialExports = `
  export const $en=globalThis.__threadShellSymbols.route;
  export const atn=globalThis.__threadShellSymbols.archived; export const mbt=globalThis.__threadShellSymbols.bottomOpen; export const vbt=globalThis.__threadShellSymbols.rightOpen;
  export const pbt=globalThis.__threadShellSymbols.defaultEnabled; export const Syt=globalThis.__threadShellSymbols.cwd; export const Dyt=globalThis.__threadShellSymbols.host;
  export const T_t=globalThis.__threadShellSymbols.workspaceState; export const Lbt=globalThis.__threadShellSymbols.terminalReady; export const wtn=globalThis.__threadShellSymbols.deferred;
  export const Vvt=globalThis.__threadShellControllers.bottom; export const qvt=globalThis.__threadShellControllers.right;
  export const Wst='terminal:'; export const Gst=id=>'terminal:'+id; export const AD=(_scope,id)=>id;
  export const Rgn={
    addSessionForConversation(_conversation,id){ const value=id??'session-'+(globalThis.__threadShellRuntimeState.sessions.length+1); if(!globalThis.__threadShellRuntimeState.sessions.includes(value)) globalThis.__threadShellRuntimeState.sessions.push(value); return value; },
    claimPreloadedSessionForConversation(){}, setActiveSessionForConversation(){},
    getConversationSnapshot(){ return {activeSessionId:globalThis.__threadShellRuntimeState.sessions.at(-1),sessionIds:[...globalThis.__threadShellRuntimeState.sessions],cwdBySessionId:{},tabTitlesBySessionId:{}}; },
    getWorkspaceBinding(){return null;}, subscribeToConversation(){return ()=>{};},
    seedSessionForConversation(_conversation,id,snapshot){ if(!globalThis.__threadShellRuntimeState.sessions.includes(id)) globalThis.__threadShellRuntimeState.sessions.push(id); globalThis.__threadShellRuntimeState.snapshots.set(id,snapshot); },
  };
  export const qst=value=>value;
  export const Gvt=(scope,entity,options)=>{ const props=options.props; const tabId=entity.getId(props); const target=options.target; globalThis.__threadShellRuntimeState.tabs[target].push({tabId,props,title:'Terminal'}); if(options.revealAndFocus) globalThis.__threadShellControllers[target].activateTab(scope,tabId); };
  export const vvt=(scope,panel)=>{ const tabs=globalThis.__threadShellRuntimeState.tabs[panel]; if(tabs.length) globalThis.__threadShellControllers[panel].activateTab(scope,tabs.at(-1).tabId); };
  export const pvt=()=>{};
  ${["qbt","Wvt","Jvt","Ebt","Evt","ppn","LCt","itn","byt","Ftn","Vcn","jD","Lgn","v_t","Kst"].map(name=>`export const ${name}=()=>{};`).join("\n")}
`;
globalThis.__threadShellSymbols = symbols;
globalThis.__threadShellControllers = controllers;
const mocks = {
  "app-shared": "export const sZ=(_root,read)=>({kind:'derived',read});",
  "app-initial": initialExports,
  "terminal-workspace-warning-state": "export const r=Symbol('workspace-warning');",
};

await main();
