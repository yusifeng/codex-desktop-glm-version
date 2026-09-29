import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(ROOT, "src/renderer/chronicle-settings-page/index.ts"), "utf8");
const toastSignal = { name: "toast" };
const state = {
  clears: [],
  failClear: false,
  failLoad: false,
  failPause: false,
  history: [{ id: "history-1", title: "Planning", summary: "Reviewed the launch plan", createdAt: "2026-09-29T09:00:00Z", interval: { startMs: 1, endMs: 2 }, application: { name: "Docs" } }],
  initialized: 0,
  serviceState: { enabled: true, recorderState: "running", activationState: "active" },
  settings: { showMenuBarIndicator: true, applications: [{ name: "Docs", bundleIdentifier: "docs", observed: true }] },
  toasts: [],
  updates: [],
};
const service = {
  async getState() { if (state.failLoad) throw Error("load"); return { ...state.serviceState }; },
  async getSettings() { if (state.failLoad) throw Error("load"); return { ...state.settings }; },
  async listHistory() { if (state.failLoad) throw Error("load"); return [...state.history]; },
  async setEnabled(enabled) { state.serviceState = { enabled, recorderState: enabled ? "running" : "stopped", activationState: enabled ? "active" : "idle" }; return { ...state.serviceState }; },
  async pause() { if (state.failPause) throw Error("pause"); state.serviceState = { ...state.serviceState, recorderState: "paused" }; return { ...state.serviceState }; },
  async resume() { if (state.failPause) throw Error("resume"); state.serviceState = { ...state.serviceState, recorderState: "running" }; return { ...state.serviceState }; },
  async retryActivation() { state.serviceState = { enabled: true, recorderState: "running", activationState: "active" }; return { ...state.serviceState }; },
  async updateSettings(settings) { state.updates.push(settings); state.settings = settings; return settings; },
  async clearHistory(scope, interval) { state.clears.push({ scope, interval }); if (state.failClear) throw Error("clear"); state.history = scope === "all" ? [] : state.history.filter((item) => item.interval !== interval); },
};
const registry = { chronicle: null };

let hookCursor = 0;
let hookValues = [];
function clearHooks() { hookCursor = 0; hookValues = []; }
function beginRender() { hookCursor = 0; }
function dependenciesEqual(left, right) { return left?.length === right?.length && left.every((value, index) => Object.is(value, right[index])); }
const React = {
  useState(initialValue) {
    const index = hookCursor++;
    if (!(index in hookValues)) hookValues[index] = typeof initialValue === "function" ? initialValue() : initialValue;
    return [hookValues[index], (next) => { hookValues[index] = typeof next === "function" ? next(hookValues[index]) : next; }];
  },
  useEffect(effect, dependencies) {
    const index = hookCursor++;
    const previous = hookValues[index];
    if (!previous || !dependenciesEqual(previous.dependencies, dependencies)) {
      hookValues[index] = { dependencies };
      effect();
    }
  },
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
const toast = {
  danger(message, options) { state.toasts.push({ kind: "danger", message, options }); },
  success(message) { state.toasts.push({ kind: "success", message }); },
  warning(message, options) { state.toasts.push({ kind: "warning", message, options }); },
};
globalThis.__chronicleSettings = { React, jsx, registry, state, toast, toastSignal };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const runtime=globalThis.__chronicleSettings;const state=runtime.state;",
    "export const $3=()=>{state.initialized+=1};export const FX=()=>{state.initialized+=1};export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;",
    "export const ZI='scope';export const pk=runtime.toastSignal;export const LX=()=>({get:signal=>signal===runtime.toastSignal?runtime.toast:undefined});",
  ].join("\n"),
  "app-initial": "const runtime=globalThis.__chronicleSettings;const state=runtime.state;export const Xl=()=>{state.initialized+=1};export const su=()=>{state.initialized+=1};export const pnt=runtime.registry;",
  "app-primary": "export const sideEffect=true;",
  "color-icon": "const state=globalThis.__chronicleSettings.state;export const n=()=>{state.initialized+=1};export const t=props=>({type:'color-icon',props});",
  "computer-history-suggestion-prompt": "const state=globalThis.__chronicleSettings.state;export const n=()=>{state.initialized+=1};",
  "computer-history-query": "const state=globalThis.__chronicleSettings.state;export const a=()=>{state.initialized+=1};",
  "chronicle-service-queries": "const state=globalThis.__chronicleSettings.state;export const S=()=>{state.initialized+=1};",
  "chronicle-permissions-dialog": "const state=globalThis.__chronicleSettings.state;export const n=()=>{state.initialized+=1};export const t=props=>({type:'permissions-dialog',props});",
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/chronicle-settings-page/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "chronicle-settings-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({ contents: mocks[moduleName] ?? "export {};", loader: "js" }));
    },
  }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

function walk(value, result = []) {
  if (value == null || typeof value !== "object") return result;
  if (Array.isArray(value)) { for (const item of value) walk(item, result); return result; }
  result.push(value);
  walk(value.props?.children, result);
  return result;
}
function textContent(value) {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textContent).join(" ");
  return textContent(value.props?.children);
}
function render() { beginRender(); return module.ComputerHistorySettingsPage(); }
function button(view, label) { return walk(view).find((node) => node.type === "button" && textContent(node) === label); }
function byTestId(view, testId) { return walk(view).find((node) => node.props?.["data-testid"] === testId); }
async function flush() { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); }

assert.deepEqual(Object.keys(module), ["ComputerHistorySettingsPage"]);
assert.equal(state.initialized, 9);
assert.deepEqual(
  [...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^\"]+)"/g)].map((match) => match[1]),
  ["rolldown-runtime", "app-shared", "app-initial", "app-primary", "color-icon", "computer-history-suggestion-prompt", "computer-history-query", "chronicle-service-queries", "chronicle-permissions-dialog"],
);
assert.equal(/\b(?:appSharedChunk|appInitialChunk|appPrimaryChunk|colorIconChunk|computerHistorySuggestionPromptChunk|computerHistoryQueryChunk|chronicleServiceQueriesChunk|chroniclePermissionsDialogChunk)\s*\./.test(source), false);
assert.equal(/(?:\bas\s+any\b|:\s*any\b|<any>)/.test(source), false);

let view = render();
assert.equal(textContent(view).includes("Computer history isn’t available"), true);

registry.chronicle = service;
clearHooks();
view = render();
assert.equal(textContent(view).includes("Loading your settings…"), true);
await flush();
view = render();
assert.equal(textContent(view).includes("Recording"), true);
assert.equal(textContent(view).includes("Planning"), true);
assert.equal(walk(view).some((node) => node.type === "color-icon"), true);
assert.equal(walk(view).find((node) => node.props?.role === "switch").props["aria-checked"], true);

button(view, "Pause").props.onClick();
await flush();
view = render();
assert.equal(textContent(view).includes("Paused"), true);
button(view, "Resume").props.onClick();
await flush();
view = render();
assert.equal(textContent(view).includes("Recording"), true);

const indicator = walk(view).find((node) => node.type === "input" && node.props?.type === "checkbox");
indicator.props.onChange({ target: { checked: false } });
await flush();
assert.equal(state.updates.at(-1).showMenuBarIndicator, false);

button(view, "1 selected").props.onClick();
view = render();
const permissions = walk(view).find((node) => node.type === "permissions-dialog");
assert.equal(permissions.props.open, true);
permissions.props.onOpenChange(false);

view = render();
byTestId(view, "chronicle-delete-item").props.onClick();
view = render();
assert.equal(textContent(view).includes("Delete this history item?"), true);
byTestId(view, "chronicle-confirm-clear").props.onClick?.();
walk(view).find((node) => node.type === "form").props.onSubmit({ preventDefault() {} });
await flush();
view = render();
assert.equal(state.clears.at(-1).scope, "interval");
assert.equal(textContent(view).includes("No computer history yet"), true);
assert.equal(state.toasts.at(-1).kind, "success");

walk(view).find((node) => node.props?.role === "switch").props.onClick();
await flush();
view = render();
assert.equal(textContent(view).includes("Turn on"), true);
byTestId(view, "chronicle-turn-on").props.onClick();
view = render();
assert.equal(textContent(view).includes("You're in control."), true);
byTestId(view, "chronicle-customize-apps").props.onClick();
view = render();
const setupPermissions = walk(view).find((node) => node.type === "permissions-dialog");
assert.equal(setupPermissions.props.open, true);
setupPermissions.props.onSaved();
await flush();
view = render();
assert.equal(textContent(view).includes("Recording"), true);

state.serviceState = { enabled: true, recorderState: "stopped", activationState: "failed" };
clearHooks();
view = render();
await flush();
view = render();
assert.equal(textContent(view).includes("temporarily unavailable"), true);
button(view, "Try again").props.onClick();
await flush();
view = render();
assert.equal(textContent(view).includes("Recording"), true);

state.failLoad = true;
clearHooks();
view = render();
await flush();
view = render();
assert.equal(walk(view).some((node) => node.props?.role === "alert"), true);
assert.equal(textContent(view).includes("Your settings couldn’t be loaded"), true);

console.log("27 chronicle settings assertions passed");
