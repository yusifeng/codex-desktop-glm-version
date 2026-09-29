import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(ROOT, "src/renderer/local-conversation-subagents-panel-tab/index.ts"), "utf8");
const state = {
  config: { model: "gpt-5.4", reasoningEffort: "high" }, enabled: true, initialized: 0, intervals: [], now: new Date(1_000_000),
  subagents: [
    { canInteract: true, conversationId: "running-1", displayName: "Builder", objective: "Investigate the repository and implement a carefully tested semantic renderer module with detailed validation", startedAtMs: 970_000, status: "running" },
    { conversationId: "waiting-1", displayName: "Researcher", status: "waiting", statusSummary: "Awaiting a follow-up task" },
    { conversationId: "done-1", displayName: "Reviewer", lastAssistantMessageAtMs: 900_000, objective: null, recencyAtMs: 900_000, status: "done" },
  ],
};
const hooks = []; let hookIndex = 0;
const React = { __clear() { hooks.length = 0; hookIndex = 0; }, __reset() { hookIndex = 0; }, useState(initial) { const index = hookIndex++; if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial; return [hooks[index], (next) => { hooks[index] = typeof next === "function" ? next(hooks[index]) : next; }]; } };
const jsx = { jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
globalThis.__subagentsPanelTab = { React, jsx, state };

const initExports = ["Dpn", "HZt", "Jit", "M0t", "RS", "Ret", "Vhn", "Zit", "ojt", "sP"].map((name) => `export const ${name}=()=>{r.state.initialized+=1};`).join("\n");
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__subagentsPanelTab;export const $3=()=>{r.state.initialized+=1};export const FX=()=>{r.state.initialized+=1};export const K2=()=>{r.state.initialized+=1};",
    "export const I3=()=>r.jsx;export const e6=()=>r.React;export const n4=()=>({formatMessage:(message,values)=>message.defaultMessage.replace(/\\{(\\w+)\\}/g,(_match,key)=>String(values?.[key]??''))});",
    "export const BX=(query,key)=>query==='subagent-query'?(key==null?[]:r.state.subagents):query==='config-query'?r.state.config:null;",
  ].join("\n"),
  "app-initial": [
    "const r=globalThis.__subagentsPanelTab;", initExports,
    "export const IS=props=>({type:'relative-time',props});export const KQt='config-query';export const Let=props=>({type:'loading-indicator',props});",
    "export const N0t=value=>['none','minimal','low','medium','high','xhigh','max','ultra','persistent'].includes(value);export const Qmn=(value,length)=>value.length>length?value.slice(0,length-1)+'…':value;export const X5=model=>model==='gpt-5.4'?'GPT-5.4':model;",
    "export const Xit=duration=>Math.floor(duration/1000)+'s';export const Yit=(callback,interval)=>r.state.intervals.push({callback,interval});export const lP=()=>r.state.now;export const nN=()=>r.state.enabled;export const sjt=value=>value.trim().replace(/\\s+/g,' ');",
  ].join("\n"),
  "app-primary": "const r=globalThis.__subagentsPanelTab;export const gn=()=>{r.state.initialized+=1};export const mn=()=>{r.state.initialized+=1};export const pn='subagent-query';export const _n=subagents=>[...subagents];",
  "local-conversation-thread": "const r=globalThis.__subagentsPanelTab;export const s=()=>{r.state.initialized+=1};export const t=props=>({type:'local-conversation-thread',props});",
  "subagent-panel": "const runtime=globalThis.__subagentsPanelTab;export const r=()=>{runtime.state.initialized+=1};export const n=props=>({type:'subagent-panel',props});export const t=props=>({type:'subagent-header',props});",
};
const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer/local-conversation-subagents-panel-tab/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "subagents-panel-tab-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

const selections = [];
const baseProps = { hostId: "local", isLoading: false, onSelect: (conversationId, displayName) => selections.push([conversationId, displayName]), parentConversationId: "parent-1" };
function render(props = baseProps, { clear = false } = {}) { if (clear) React.__clear(); else React.__reset(); return module.LocalConversationSubagentsPanelTab(props); }
function walk(value, output = []) { if (value == null || typeof value !== "object") return output; if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; } output.push(value); walk(value.props?.children, output); return output; }
function textContent(value) { if (value == null || typeof value === "boolean") return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(textContent).join(" " ); return textContent(value.props?.children); }

assert.deepEqual(Object.keys(module), ["LocalConversationSubagentsPanelTab"]);
assert.deepEqual([...source.matchAll(/@rchunk\/([^"]+)/g)].map((match) => match[1]), ["rolldown-runtime", "app-shared", "app-initial", "app-primary", "local-conversation-thread", "subagent-panel"]);
assert.equal(/\b(?:appSharedChunk|appInitialChunk|appPrimaryChunk|localConversationThreadChunk|subagentPanelChunk)\s*\./.test(source), false);
assert.equal(/\bany\b/.test(source), false);
assert.equal(state.initialized, 17);

let view = render(baseProps, { clear: true });
assert.equal(view.type, "subagent-panel");
assert.equal(view.props.sections.length, 2);
assert.equal(view.props.sections[0].title, "Active · 2");
assert.equal(view.props.sections[0].titleTrailing, "1 waiting");
assert.equal(view.props.sections[0].visibleItemLimit, 4);
assert.equal(view.props.sections[1].title, "Done · 1");
assert.equal(view.props.sections[1].visibleItemLimit, 10);
assert.equal(view.props.sections[0].items[0].preview.length <= 60, true);
assert.equal(textContent(view.props.sections[0].items[0].trailing), "30s");
assert.equal(textContent(view.props.sections[0].items[1].trailing), "Waiting");
assert.equal(walk(view.props.sections[1].items[0].trailing).some((node) => node.type === "relative-time"), true);
view.props.onSelect("waiting-1");
assert.deepEqual(selections.at(-1), ["waiting-1", "Researcher"]);
view.props.onSelect("missing");
assert.equal(selections.length, 1);

state.enabled = false;
view = render(baseProps, { clear: true });
assert.equal(view.props.sections[0].items.length, 0);
assert.equal(view.props.sections[0].emptyState, "No active subagents");
state.enabled = true;

view = render({ ...baseProps, requestedConversationId: "running-1" }, { clear: true });
assert.equal(view.type, "local-conversation-thread");
assert.equal(view.props.conversationId, "running-1");
assert.equal(view.props.canInteract, true);
assert.equal(view.props.header.type, "subagent-header");
assert.equal(view.props.header.props.label, "Builder");
assert.equal(view.props.header.props.trailing, "GPT-5.4 · high");
assert.equal(view.props.header.props.backAriaLabel, "Back to subagents");
view.props.header.props.onBack();
assert.deepEqual(selections.at(-1), [null, null]);
view.props.onClose();
assert.deepEqual(selections.at(-1), [null, null]);
view.props.onOpenBackgroundAgent({ conversationId: "child-2", displayName: "Child" });
assert.deepEqual(selections.at(-1), ["child-2", "Child"]);

state.config = { model: "gpt-5.4", reasoningEffort: "unknown" };
view = render({ ...baseProps, requestedConversationId: "missing", requestedDisplayName: "Fallback agent" }, { clear: true });
assert.equal(view.props.header.props.label, "Fallback agent");
assert.equal(view.props.header.props.trailing, "GPT-5.4");
assert.equal(view.props.canInteract, false);

view = render({ ...baseProps, isLoading: true, requestedConversationId: "running-1" }, { clear: true });
assert.equal(view.type, "div");
assert.equal(walk(view).some((node) => node.type === "subagent-header"), true);
const loading = walk(view).find((node) => node.type === "loading-indicator");
assert.equal(loading.props.debugName, "Subagent transcript");
assert.equal(loading.props.fillParent, true);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " local conversation subagents panel tab assertions passed");
