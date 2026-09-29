import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hook = { command: "npm test", currentHash: "hash-1", displayOrder: 0, enabled: true, eventName: "preToolUse", handlerType: "command", isManaged: false, key: "hook-1", matcher: "Bash", source: "project", sourcePath: "/repo/.codex/hooks.json", statusMessage: "Checking", timeoutSec: 30, trustStatus: "trusted" };
const untrustedHook = { command: "npm run lint", currentHash: "hash-2", displayOrder: 1, enabled: true, eventName: "preToolUse", handlerType: "command", key: "hook-2", source: "project", trustStatus: "untrusted" };
const state = {
  host: { kind: "local" }, initialized: 0, opened: [], params: new URLSearchParams(), refetches: 0,
  roots: { data: { roots: ["/repo"], labels: { "/repo": "Demo repo" } }, error: null, isFetching: false, isPending: true },
  hooks: { data: undefined, error: null, isFetching: false, isPending: true },
  selectedHostId: "local", toasts: [], updates: [],
};
const hookState = [];
let hookIndex = 0;
const React = { __reset() { hookIndex = 0; }, useEffect(effect) { effect(); }, useState(initial) { const index = hookIndex++; if (!(index in hookState)) hookState[index] = typeof initial === "function" ? initial() : initial; return [hookState[index], (next) => { hookState[index] = typeof next === "function" ? next(hookState[index]) : next; }]; } };
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
globalThis.__hooksSettings = { React, jsx, state };

const sideEffects = ["app-primary", "building", "hooks", "shield-check", "settings-loading-row", "rolldown-runtime"];
const mocks = Object.fromEntries(sideEffects.map((name) => [name, name === "hooks" ? "const s=globalThis.__hooksSettings.state;export const n=()=>{s.initialized+=1};" : "export {};" ]));
mocks["app-shared"] = [
  "const runtime=globalThis.__hooksSettings;export const $3=()=>{runtime.state.initialized+=1};export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;export const ZI='app-scope';export const pk='toast-manager';",
  "export const LX=()=>({get:()=>({success:message=>runtime.state.toasts.push(message)})});export const n4=()=>({formatMessage:(descriptor,values)=>{let message=descriptor.defaultMessage;for(const [key,value] of Object.entries(values||{}))message=message.replace('{'+key+'}',String(value));return message}});",
  "export const BX=(query)=>query==='roots-query'?runtime.state.roots:query==='hooks-query'?{...runtime.state.hooks,refetch:async()=>{runtime.state.refetches+=1;return {isSuccess:runtime.state.hooks.error==null}}}:{data:{isPending:false,mutate:updates=>runtime.state.updates.push(updates)},error:null,isFetching:false,isPending:false,refetch:async()=>({isSuccess:true})};",
].join("\n");
mocks["app-initial"] = [
  "const state=globalThis.__hooksSettings.state;export const Ne='roots-query';export const he='hooks-query';export const Ve='update-query';",
  "export const Gv=()=>({selectedHostId:state.selectedHostId,setSelectedHostId:value=>{state.selectedHostId=value}});export const Ee=()=>state.host;",
  "export const d_n=()=>[state.params,(params)=>{state.params=params}];export const Qut=input=>state.opened.push(input);",
].join("\n");
mocks["hooks-settings-copy"] = [
  "const s=globalThis.__hooksSettings.state;export const a=()=>{s.initialized+=1};export const n=name=>name==='preToolUse'?'PreToolUse':name;export const t=()=> 'Before a tool executes';export const r=index=>'Hook '+(index+1);",
].join("\n");
mocks["hooks-settings-model"] = [
  "const s=globalThis.__hooksSettings.state;export const p=()=>{s.initialized+=1};export const m=hook=>hook.trustStatus==='untrusted'||hook.trustStatus==='modified';export const a=(hooks,event)=>hooks.filter(h=>h.eventName===event).sort((a,b)=>a.displayOrder-b.displayOrder);",
  "export const u=({source,projectRoot,pluginId,projectRoots})=>source==='project'&&projectRoot&&projectRoots.includes(projectRoot)?{source,projectRoot}:source?{source,pluginId}:null;",
].join("\n");
mocks["hooks-settings-route"] = [
  "const s=globalThis.__hooksSettings.state;export const r=()=>{s.initialized+=1};export const i=(params,hostId,selection)=>{for(const key of ['hostId','pluginId','projectRoot','source'])params.delete(key);if(selection){params.set('hostId',hostId);params.set('source',selection.source);if(selection.projectRoot)params.set('projectRoot',selection.projectRoot);if(selection.pluginId!=null)params.set('pluginId',selection.pluginId)}};",
].join("\n");

const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer/hooks-settings/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "hooks-settings-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["HooksSettings"]);
assert.equal(state.initialized, 5);

function render() { React.__reset(); return module.HooksSettings(); }
function walk(value, result = []) { if (value == null || typeof value !== "object") return result; if (Array.isArray(value)) { for (const item of value) walk(item, result); return result; } result.push(value); walk(value.props?.children, result); return result; }
function textContent(value) { if (value == null || typeof value === "boolean") return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(textContent).join(" "); return textContent(value.props?.children); }
function button(view, text) { return walk(view).find((node) => node.type === "button" && textContent(node).includes(text)); }

let view = render();
assert.equal(textContent(view).includes("Hooks"), true);
assert.equal(walk(view).some((node) => node.props?.role === "status"), true);

state.roots.isPending = false;
state.hooks = { data: undefined, error: new Error("daemon unavailable"), isFetching: false, isPending: false };
view = render();
assert.equal(walk(view).some((node) => node.props?.role === "alert"), true);
assert.equal(textContent(view).includes("daemon unavailable"), true);
button(view, "Retry").props.onClick();
await Promise.resolve();
assert.equal(state.refetches, 1);

state.hooks = { data: { data: [{ cwd: "/repo", errors: [], hooks: [hook, untrustedHook], warnings: ["Unknown field"] }] }, error: null, isFetching: false, isPending: false };
view = render();
assert.equal(textContent(view).includes("Demo repo"), true);
button(view, "Demo repo").props.onClick();
assert.equal(state.params.get("source"), "project");
assert.equal(state.params.get("projectRoot"), "/repo");

view = render();
assert.equal(textContent(view).includes("PreToolUse"), true);
assert.equal(textContent(view).includes("Hooks can run outside of the sandbox"), true);
assert.equal(textContent(view).includes("1 issues loading hooks"), true);
const trustedToggle = walk(view).find((node) => node.props?.role === "switch" && node.props?.["aria-label"] === "npm test");
trustedToggle.props.onClick();
assert.deepEqual(state.updates.at(-1), [{ key: "hook-1", enabled: false }]);
button(view, "Trust").props.onClick();
assert.deepEqual(state.updates.at(-1), [{ key: "hook-2", trustedHash: "hash-2" }]);
button(view, "npm test").props.onClick();
view = render();
assert.equal(textContent(view).includes("Checking"), true);
assert.equal(textContent(view).includes("30 sec"), true);
button(view, "Open").props.onClick();
assert.deepEqual(state.opened.at(-1), { cwd: "/repo", hostId: "local", path: "/repo/.codex/hooks.json" });

button(view, "Reload").props.onClick();
await Promise.resolve();
assert.equal(state.toasts.at(-1), "Refreshed hooks");
state.hooks.data = { data: [] };
view = render();
assert.equal(textContent(view).includes("No hooks found"), true);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " hooks settings assertions passed");
