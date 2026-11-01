import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__threadChromeOverflow = {
  actions: {}, commands: {}, hookCursor: 0, hookValues: [], calls: [],
};
const jsxRuntime = { Fragment: "Fragment", jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
const reactRuntime = {
  useEffect(effect) { effect(); }, useRef(value) { return { current: value }; },
  useState(initial) { const index = state.hookCursor++; if (!(index in state.hookValues)) state.hookValues[index] = initial; return [state.hookValues[index], next => { state.hookValues[index] = typeof next === "function" ? next(state.hookValues[index]) : next; }]; },
};
const signals = { environment: Symbol("environment"), roots: Symbol("roots"), status: Symbol("status"), sideOpen: Symbol("side-open"), activeSide: Symbol("active-side"), sideTabs: Symbol("side-tabs"), bottomTabs: Symbol("bottom-tabs"), busy: Symbol("busy"), automation: Symbol("automation"), collaboration: Symbol("collaboration") };
const scope = {
  value: { routeKind: "local-thread", conversationId: "thread-1" },
  values: new Map([[signals.environment, { id: "env", kind: "git" }], [signals.roots, ["/workspace"]], [signals.status, "ready"], [signals.sideOpen, false], [signals.activeSide, null], [signals.sideTabs, []], [signals.bottomTabs, []], [signals.busy, false], [signals.automation, false], [signals.collaboration, "default"]]),
  get(signal) { return this.values.get(signal); },
};
globalThis.__threadChromeOverflowJsx = jsxRuntime;
globalThis.__threadChromeOverflowReact = reactRuntime;
globalThis.__threadChromeOverflowScope = scope;
globalThis.__threadChromeOverflowSignals = signals;

async function bundle(directory, mocks) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "thread-chrome-overflow-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({ contents: mocks[moduleName] ?? "export const n=()=>{};", loader: "js" }));
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}
function walk(root) { const nodes=[]; const visit=value=>{ if(value==null||typeof value!=="object")return; if(Array.isArray(value))return value.forEach(visit); if("type" in value&&"props" in value)nodes.push(value); visit(value.props?.children); }; visit(root); return nodes; }
const sharedMock = `
  export const I3=()=>globalThis.__threadChromeOverflowJsx; export const e6=()=>globalThis.__threadChromeOverflowReact;
  export const LX=()=>globalThis.__threadChromeOverflowScope; export const HX=signal=>globalThis.__threadChromeOverflowScope.get(signal);
  export const BX=(signal)=>globalThis.__threadChromeOverflowScope.get(signal);
  export const K3=(name,handler)=>{globalThis.__threadChromeOverflow.commands[name]=handler;};
  export const Df=function Dropdown(){};
`;
const initialMock = `
  export const $en=Symbol('route'); export const mdt=globalThis.__threadChromeOverflowSignals.environment; export const ddt=globalThis.__threadChromeOverflowSignals.roots;
  export const T_t=globalThis.__threadChromeOverflowSignals.status; export const _bt=globalThis.__threadChromeOverflowSignals.sideOpen;
  export const qvt={activeTab$:globalThis.__threadChromeOverflowSignals.activeSide,tabs$:globalThis.__threadChromeOverflowSignals.sideTabs};
  export const Vvt={tabs$:globalThis.__threadChromeOverflowSignals.bottomTabs}; export const Dyt=Symbol('host');
  export const f7={HeaderAction:'HeaderAction',BottomPanelOutlet:'BottomPanelOutlet',BottomPanelTabs:'BottomPanelTabs',RightPanelOutlet:'RightPanelOutlet',RightPanelTabs:'RightPanelTabs'};
  export const pEt=(name,handler,options)=>{globalThis.__threadChromeOverflow.actions[name]={handler,options};};
  export const Ict=()=>globalThis.__threadChromeOverflow.calls.push('toggle-side'); export const Pi=()=>globalThis.__threadChromeOverflow.calls.push('open-review'); export const Ii=()=>globalThis.__threadChromeOverflow.calls.push('toggle-review');
  export const ect=()=>globalThis.__threadChromeOverflow.calls.push('file-tree'); export const pvt=()=>globalThis.__threadChromeOverflow.calls.push('bottom-panel');
  export const JZt=globalThis.__threadChromeOverflowSignals.busy; export const OY=globalThis.__threadChromeOverflowSignals.busy; export const JQt=globalThis.__threadChromeOverflowSignals.automation; export const rQt=globalThis.__threadChromeOverflowSignals.collaboration;
  export const wQt=Symbol('host-by-thread'); export const o_n=()=>((path)=>globalThis.__threadChromeOverflow.calls.push(['navigate',path]));
  export const vlt=()=>({
    archiveThread:input=>globalThis.__threadChromeOverflow.calls.push(['archive',input]), copyAppLink:id=>globalThis.__threadChromeOverflow.calls.push(['copy-link',id]),
    copyConversationMarkdown:input=>globalThis.__threadChromeOverflow.calls.push(['copy-markdown',input]), copyWorkingDirectory:cwd=>globalThis.__threadChromeOverflow.calls.push(['copy-cwd',cwd]),
    markThreadAsUnread:input=>globalThis.__threadChromeOverflow.calls.push(['unread',input]), renameThread:input=>globalThis.__threadChromeOverflow.calls.push(['rename',input]),
  });
  export const _lt=()=>({isPinned:false,togglePin:()=>globalThis.__threadChromeOverflow.calls.push('pin')});
`;

const chrome = await bundle("thread-app-shell-chrome", {
  "app-shared": sharedMock, "app-initial": initialMock,
  "thread-shell-runtime": "export const n=()=>{};export const f=()=>globalThis.__threadChromeOverflow.calls.push('ensure-terminal');",
  "thread-panel-toggle-button": "export const n=()=>{};export const t='PanelToggle';export const y='BottomChrome';export const r='RightChrome';",
});
chrome.n();
const chromeTree = chrome.t({ conversationId: "thread-1", showReviewTab: true, showSidePanelToggle: true, threadType: "local" });
const chromeNodes = walk(chromeTree);
assert(chromeNodes.some(node => node.type === "BottomPanelOutlet"));
assert(chromeNodes.some(node => node.type === "RightPanelOutlet"));
assert(chromeNodes.some(node => node.type === "HeaderAction" && node.props.actionId === "thread-local-panel-toggles"));
assert.equal(state.actions.openReviewTab.options.enabled, true);
state.actions.openReviewTab.handler();
assert(state.calls.includes("open-review"));
chromeNodes.find(node => node.props?.["aria-label"] === "Toggle side panel").props.onClick();
assert(state.calls.includes("toggle-side"));

const overflow = await bundle("thread-overflow-menu", {
  "app-shared": sharedMock, "app-initial": initialMock,
  "open-automation-side-panel-tab": "export const n=()=>{};export const r=input=>globalThis.__threadChromeOverflow.calls.push(['schedule',input]);",
  "use-target-apps": "export const n=()=>{};", "local-conversation-side-chat": "export const n=()=>{};export const r=()=>globalThis.__threadChromeOverflow.calls.push('side-chat');",
  "thread-pin-shortcut-bridge": "export const n=()=>{};",
});
overflow.n();
function renderOverflow() { state.hookCursor=0; return overflow.t({ conversationId:"thread-1", cwd:"/workspace", getConversationMarkdown:()=>"markdown", hostId:"local", sideChatTab:{id:"side"}, title:"Thread" }); }
let overflowTree = renderOverflow();
let items = walk(overflowTree).filter(node => node.props?.role === "menuitem");
const item = label => items.find(node => node.props?.children === label);
item("Pin").props.onClick(); item("Copy link").props.onClick(); item("Copy conversation").props.onClick(); item("Copy working directory").props.onClick(); item("Mark as unread").props.onClick();
assert(state.calls.includes("pin"));
assert(state.calls.some(call => Array.isArray(call) && call[0] === "copy-link"));
assert(state.calls.some(call => Array.isArray(call) && call[0] === "copy-markdown"));
item("Open side chat").props.onClick();
await Promise.resolve();
assert(state.calls.includes("side-chat"));
item("Rename").props.onClick();
overflowTree = renderOverflow();
const dialog = walk(overflowTree).find(node => node.props?.role === "dialog");
assert(dialog, "rename action opens a real dialog");
walk(dialog).find(node => node.type === "input").props.onChange({currentTarget:{value:"Renamed"}});
walk(dialog).find(node => node.props?.children === "Save").props.onClick();
assert(state.calls.some(call => Array.isArray(call) && call[0] === "rename" && call[1].title === "Renamed"));

console.log("thread app-shell chrome and overflow semantic owner assertions passed");
