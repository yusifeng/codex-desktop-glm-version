import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function resetState() {
  globalThis.__panelHelpers = {
    commands: [
      { id: "newTask", kind: "webview", platforms: ["electron"], label: "New task" },
      { id: "webOnly", kind: "webview", platforms: ["web"] },
      { id: "native", kind: "electron-only" },
    ],
    opened: [], panelUpdates: [], sets: [], hydrated: [], targets: new Map(),
    jsx: { jsx: (type, props) => ({ type, props: props ?? {} }) },
  };
  return globalThis.__panelHelpers;
}

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true,
    format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "panel-helper-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({ path: value.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => {
        if (value === "app-shared") return { contents: `
          const s=globalThis.__panelHelpers; const noop=()=>{};
          export const Ep=noop,FX=noop,QI=noop,C_=noop,Nu=noop,Yi=noop;
          export const Xp=s.commands,qp=(command,platform)=>command.platforms?.includes(platform)??false;
          export const I3=()=>s.jsx,S_=Symbol("Icon"),Xi={name:"sources"},Pu={name:"plan"},ZI={};
          export const oZ=(_scope,factory)=>({factory}),pZ=(_scope,value)=>({value});
          export const rZ=(_scope,factory)=>({factory});
        `, loader: "js" };
        if (value === "app-initial") return { contents: `
          const s=globalThis.__panelHelpers; const noop=()=>{};
          export const hEt=noop,mEt=(id)=>id==="native",M5t=(skill)=>skill.displayName,P5t=noop;
          export const Gvt=(_scope,_definition,options)=>s.opened.push(options),Qen=noop,Wvt=noop,_vt=noop;
          export const Zen={SOURCES:"sources",PLAN:"plan"},gvt=(_scope,id)=>s.targets.get(id)??null;
          export const HZt=noop,Wgn=noop,PQt={name:"parent"},RQt={name:"pending"},VZt={name:"host"},zZt={name:"exists"};
          export const Ugn=()=>({hydrateBackgroundThreads:async(ids,options)=>{s.hydrated.push({ids,options})}});
          export const $en={},itn=noop,hvt=()=>({updateTab:(...args)=>s.panelUpdates.push(args)});
        `, loader: "js" };
        if (value === "codex-micro-commands") return { contents: `
          export const i=()=>{}; export const n=(id)=>globalThis.__panelHelpers.commandLookup?.(id)??null;
        `, loader: "js" };
        if (value === "command-messages") return { contents: `
          export const r=()=>{}; export const n=(command)=>command.label;
        `, loader: "js" };
        if (value === "app-primary") return { contents: "export const hn={}; export const mn=()=>{};", loader: "js" };
        return { contents: "export {};", loader: "js" };
      });
    }}],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${Math.random()}`);
}

let state = resetState();
const commands = await bundle("codex-micro-commands");
commands.i();
assert.equal(commands.t.length, 2);
assert.equal(commands.n("newThread").id, "newTask");
assert.equal(commands.n("native").id, "native");
assert.equal(commands.n("webOnly"), null);
assert.equal(commands.r("recentThread1"), 0);
assert.equal(commands.r("recentThread6"), 5);
assert.equal(commands.r("recentThread7"), null);
assert.equal(commands.r("other"), null);

state.commandLookup = (id) => id === "newTask" ? { id, label: "New task" } : null;
const titles = await bundle("codex-micro-analog-action-title");
titles.n();
assert.equal(titles.t({ type: "command", commandId: "newTask" }, [], {}), "New task");
assert.equal(titles.t({ type: "command", commandId: "missing" }, [], {}), "missing");
assert.equal(titles.t({ type: "skill", skillName: "review", skillPath: "/review" }, [
  { name: "review", path: "/review", displayName: "Code review" },
], {}), "$Code review");
assert.equal(titles.t({ type: "skill", skillName: "review", skillPath: "/other" }, [], {}), "$review");

state = resetState();
const sources = await bundle("open-sources-side-panel-tab");
sources.t();
state.targets.set("opener", "bottom");
sources.n({}, { kind: "definition" }, { conversationId: "c1" }, "Sources", "opener", "tail");
assert.equal(state.opened.length, 1);
assert.equal(state.opened[0].id, "sources");
assert.equal(state.opened[0].target, "bottom");
assert.equal(state.opened[0].title, "Sources");
assert.equal(state.opened[0].trailingContent, "tail");
assert.equal(state.opened[0].icon.props.asset.name, "sources");

state = resetState();
const descendants = await bundle("verify-descendant");
descendants.t();
assert.equal(descendants.n({ get: () => null }, { hostId: "host", parentConversationId: "same", selectedConversationId: "same" }), false);
const happyScope = { get(signal, parameter) {
  if (signal.name === "pending") return [];
  if (signal.name === "host") return "host";
  if (signal.name === "exists") return true;
  if (signal.name === "parent") return parameter === "child" ? "parent" : null;
  return null;
} };
assert.equal(descendants.n(happyScope, { hostId: "host", parentConversationId: "parent", selectedConversationId: "child" }), true);

state = resetState();
const plans = await bundle("editable-plan-tab");
plans.t();
const planScope = { set(signal, parameter, value) { state.sets.push({ signal, parameter, value }); } };
let openOptions;
const opened = plans.n(planScope, {
  content: "draft", conversationId: "c1", hostId: "h1", key: "plan-1",
  path: "/tmp/plan.md", title: "Plan", revealAndFocus: true,
}, (_scope, _path, options) => { openOptions = options; return true; });
assert.equal(opened, true);
assert.equal(state.sets[0].parameter, "h1:c1:plan-1");
assert.equal(state.sets[0].value.content, "draft");
assert.equal(openOptions.tabId, "plan");
assert.deepEqual(openOptions.plan, { conversationId: "c1", key: "plan-1", title: "Plan" });
assert.equal(state.panelUpdates.length, 1);
assert.equal(state.panelUpdates[0][2].title, "Plan");
assert.equal(state.sets.at(-1).parameter.key, "plan-1");
assert.equal(plans.n(planScope, {
  content: "x", conversationId: "c1", hostId: "h1", key: "p2", path: "/x", title: "X",
}, () => false), false);

console.log("29 panel helper utility assertions passed");
