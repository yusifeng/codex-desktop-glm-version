import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(ROOT, "src/renderer/thread-goal-side-panel-content/index.ts"), "utf8");
const toastSignal = {};
const state = { cleanups: [], initialized: 0, materializations: [], now: new Date(2026, 8, 30, 12, 0, 0), saveCalls: [], saveMode: "success", toasts: [] };
let resolveSave = null;
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
const intl = { formatMessage(descriptor, values) { if (descriptor.id === "updated") return String(values?.minutes); return descriptor.defaultMessage; } };
const scope = { get(signal) { return signal === toastSignal ? { danger(message, options) { state.toasts.push({ message, options }); } } : undefined; } };
globalThis.__threadGoal = { intl, jsx, scope, state, toastSignal };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__threadGoal;const init=()=>{r.state.initialized+=1};",
    "export const $3=init;export const C_=init;export const FX=init;export const K2=init;export const QI=init;export const Zh=init;export const lk=init;export const sO=init;",
    "export const I3=()=>r.jsx;export const LX=()=>r.scope;export const ZI='scope';export const n4=()=>r.intl;export const pk=r.toastSignal;",
    "export const Yh=props=>({type:'button',props});",
  ].join("\n"),
  "app-initial": [
    "const r=globalThis.__threadGoal;const init=()=>{r.state.initialized+=1};",
    "export const Qen=init;export const R5t=init;export const aCt=init;export const eCt=init;export const itn=init;export const sP=init;",
    "export const B5t=text=>text;export const lP=()=>r.state.now;",
    "export const tCt=async input=>{r.state.materializations.push(input);return {objective:`source:${input.draft.objective}`}};",
    "export const oCt=async input=>{r.state.saveCalls.push(input);if(r.state.saveMode==='error')throw Error('save failed');if(r.state.saveMode==='false')return false;if(r.state.saveMode==='pending')await new Promise(resolve=>{globalThis.__resolveGoalSave=resolve});return true};",
    "export const QSt=async input=>{r.state.cleanups.push(input)};",
  ].join("\n"),
  "app-primary": "const r=globalThis.__threadGoal;const init=()=>{r.state.initialized+=1};export const nc=init;export const ni=init;",
};

const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer/thread-goal-side-panel-content/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "thread-goal-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

function walk(value, output = []) { if (value == null || typeof value !== "object") return output; if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; } output.push(value); walk(value.props?.children, output); return output; }
function textContent(value) { if (value == null || typeof value === "boolean") return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(textContent).join(" " ); return textContent(value.props?.children); }
function node(view, type) { return walk(view).find((item) => item.type === type); }
function button(view, label) { return walk(view).find((item) => item.type === "button" && textContent(item) === label); }
let tabState;
function resetTab(overrides = {}) { tabState = { draft: "Ship the dashboard", isSaving: false, pendingSourceObjective: null, savedAtMs: state.now.getTime() - 120_000, savedObjective: "Ship the dashboard", sourceObjective: "source:Ship the dashboard", ...overrides }; }
function setTabState(next) { tabState = typeof next === "function" ? next(tabState) : next; }
function render() { return module.ThreadGoalSidePanelTab({ conversationId: "thread-1", hostId: "local", setTabState, tabState }); }

assert.deepEqual(Object.keys(module), ["ThreadGoalSidePanelTab"]);
assert.deepEqual([...source.matchAll(/import\s+\*\s+as\s+\w+\s+from\s+"@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["rolldown-runtime", "app-shared", "app-initial", "app-primary"]);
assert.equal(/\b(?:runtimeChunk|appSharedChunk|appInitialChunk|appPrimaryChunk)\s*\./.test(source), false);
assert.equal(/\bany\b/.test(source), false);
assert.equal(state.initialized, 16);

resetTab(); let view = render();
assert.equal(node(view, "textarea").props.value, "Ship the dashboard");
assert.equal(node(view, "textarea").props["aria-label"], "Goal");
assert.equal(textContent(view).includes("Updated 2 min ago"), true);
assert.equal(button(view, "Save").props.disabled, true);
assert.equal(button(view, "Revert").props.disabled, true);

node(view, "textarea").props.onChange({ currentTarget: { value: "Ship the dashboard today" } }); view = render();
assert.equal(tabState.draft, "Ship the dashboard today");
assert.equal(button(view, "Save").props.disabled, false);
assert.equal(button(view, "Revert").props.disabled, false);
button(view, "Revert").props.onClick(); view = render();
assert.equal(tabState.draft, "Ship the dashboard");
assert.equal(button(view, "Save").props.disabled, true);

node(view, "textarea").props.onChange({ currentTarget: { value: "  New objective  " } }); view = render();
await button(view, "Save").props.onClick(); view = render();
assert.equal(state.materializations.at(-1).draft.objective, "New objective");
assert.equal(state.saveCalls.at(-1).objective, "source:New objective");
assert.equal(state.saveCalls.at(-1).appendTranscriptItem, false);
assert.equal(tabState.savedObjective, "New objective");
assert.equal(tabState.sourceObjective, "source:New objective");
assert.equal(tabState.pendingSourceObjective, null);
assert.equal(tabState.isSaving, false);
assert.equal(state.cleanups.at(-1).materialized.objective, "source:New objective");
assert.equal(button(view, "Save").props.disabled, true);
assert.equal(textContent(view).includes("Updated just now"), true);

state.saveMode = "false"; resetTab({ draft: "Unsaved objective" }); view = render(); await button(view, "Save").props.onClick();
assert.equal(tabState.savedObjective, "Ship the dashboard");
assert.equal(tabState.pendingSourceObjective, null);
assert.equal(tabState.isSaving, false);

state.saveMode = "error"; resetTab({ draft: "Broken objective" }); view = render(); await button(view, "Save").props.onClick(); view = render();
assert.equal(state.toasts.at(-1).message, "Failed to save goal objective");
assert.equal(state.toasts.at(-1).options.errorAnalytics.toastId, "composer.threadGoal.editSaveError");
assert.equal(tabState.pendingSourceObjective, null);
assert.equal(tabState.isSaving, false);
assert.equal(button(view, "Save").props.disabled, false);

state.saveMode = "success"; resetTab({ draft: "   " }); view = render();
assert.equal(button(view, "Save").props.disabled, true);
const saveCount = state.saveCalls.length; await button(view, "Save").props.onClick(); assert.equal(state.saveCalls.length, saveCount);

resetTab({ draft: "Keyboard objective" }); view = render(); let prevented = false; view.props.onKeyDown({ key: "Enter", metaKey: true, preventDefault() { prevented = true; } });
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(prevented, true);
assert.equal(state.saveCalls.at(-1).objective, "source:Keyboard objective");
resetTab({ draft: "Plain Enter" }); view = render(); prevented = false; view.props.onKeyDown({ key: "Enter", preventDefault() { prevented = true; } });
assert.equal(prevented, false);

state.saveMode = "pending"; resetTab({ draft: "Pending objective" }); view = render(); const pendingSave = button(view, "Save").props.onClick(); view = render();
assert.equal(tabState.isSaving, true);
assert.equal(node(view, "textarea").props.disabled, true);
assert.equal(button(view, "Save").props.disabled, true);
assert.equal(button(view, "Save").props.loading, true);
assert.equal(button(view, "Revert").props.disabled, true);
await Promise.resolve(); resolveSave = globalThis.__resolveGoalSave; resolveSave(); await pendingSave; delete globalThis.__resolveGoalSave; state.saveMode = "success";
assert.equal(tabState.isSaving, false);

console.log("thread-goal-side-panel-content tests passed (44 assertions)");
