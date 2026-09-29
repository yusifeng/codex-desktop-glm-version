import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = {
  detection: { detectedItems: [], isDetecting: true, isDetectionError: false, refetches: 0, unsupportedProjects: [] },
  gate: true, history: { data: [], error: null, isLoading: false, refetches: 0 }, imported: [], initialized: 0,
  runningImport: null, settings: new Map([["syncEnabled", false], ["syncItemTypes", ["SESSIONS"]]]), writes: [], writeError: false,
};
const hookState = [];
let hookIndex = 0;
const React = { __reset() { hookIndex = 0; }, useState(initial) { const index = hookIndex++; if (!(index in hookState)) hookState[index] = typeof initial === "function" ? initial() : initial; return [hookState[index], (next) => { hookState[index] = typeof next === "function" ? next(hookState[index]) : next; }]; } };
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
globalThis.__importSettings = { React, jsx, state };

const sideEffects = ["app-primary", "app-connect-modal", "use-external-agent-import-setup-actions", "setup", "settings-loading-row", "settings-row-disclosure", "rolldown-runtime"];
const mocks = Object.fromEntries(sideEffects.map((name) => [name, "export {};" ]));
mocks["app-shared"] = [
  "const runtime=globalThis.__importSettings;export const $3=()=>{runtime.state.initialized+=1};export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;export const ZI='app-scope';",
  "export const LX=()=>({});export const HX=()=>runtime.state.runningImport;export const oz={syncEnabled:{key:'syncEnabled'},syncItemTypes:{key:'syncItemTypes'}};",
  "export const BX=()=>({...runtime.state.history,refetch:()=>{runtime.state.history.refetches+=1}});export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});",
].join("\n");
mocks["app-initial"] = [
  "const state=globalThis.__importSettings.state;export const no='import-page';export const LA='providers';export const ugn='local';export const ZA='history-query';export const dj='running-import';",
  "export const ofn=()=>state.gate;export const zA=enabled=>enabled?['claude-code','cursor']:[];export const CA=()=>({...state.detection,refetchDetectedItems:()=>{state.detection.refetches+=1}});",
  "export const $i=(_scope,options)=>state.imported.push(options);export const Kcn=setting=>state.settings.get(setting.key);export const Ucn=async(_scope,setting,value)=>{if(state.writeError)throw new Error('save failed');state.settings.set(setting.key,value);state.writes.push({key:setting.key,value})};",
].join("\n");
mocks["hooks-settings-route"] = "const state=globalThis.__importSettings.state;export const r=()=>{state.initialized+=1};export const t=({hostId})=>'/settings/hooks-settings?hostId='+hostId;";

const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer/import-settings/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "import-settings-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["ImportSettings"]);
assert.equal(state.initialized, 2);

function render() { React.__reset(); return module.ImportSettings(); }
function walk(value, result = []) { if (value == null || typeof value !== "object") return result; if (Array.isArray(value)) { for (const item of value) walk(item, result); return result; } result.push(value); walk(value.props?.children, result); return result; }
function textContent(value) { if (value == null || typeof value === "boolean") return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(textContent).join(" "); return textContent(value.props?.children); }
function button(view, text) { return walk(view).find((node) => node.type === "button" && textContent(node).includes(text)); }
async function flush() { await Promise.resolve(); await Promise.resolve(); }

state.gate = false;
let view = render();
assert.equal(textContent(view).includes("Import settings are not available"), true);
state.gate = true;
view = render();
assert.equal(walk(view).some((node) => node.props?.role === "status"), true);
assert.equal(textContent(view).includes("Checking for imports"), true);

state.detection.isDetecting = false;
state.detection.isDetectionError = true;
view = render();
assert.equal(textContent(view).includes("Couldn't check for imports"), true);
button(view, "Retry").props.onClick();
assert.equal(state.detection.refetches, 1);

state.detection.isDetectionError = false;
state.detection.detectedItems = [{ itemType: "SESSIONS", providerId: "claude-code", title: "Recent chats" }, { itemType: "HOOKS", providerId: "cursor", title: "Hooks" }];
state.detection.unsupportedProjects = [{ name: "Legacy project" }];
view = render();
assert.equal(textContent(view).includes("Claude Code"), true);
assert.equal(textContent(view).includes("Cursor"), true);
assert.equal(textContent(view).includes("Legacy project"), true);
walk(view).find((node) => node.props?.["aria-label"] === "Import from Cursor").props.onClick();
assert.deepEqual(state.imported.at(-1).preselectedProviderIds, ["cursor"]);
assert.equal(state.imported.at(-1).source, "settings");

state.runningImport = { hostId: "local", items: state.detection.detectedItems, startedAtMs: Date.now() };
view = render();
assert.equal(textContent(view).includes("Import in progress"), true);
assert.equal(textContent(view).includes("Recent chats, Hooks"), true);

state.runningImport = null;
state.history.data = [{ completedAtMs: Date.now(), failures: [{ itemType: "SKILLS", source: "Broken skill", message: "Invalid manifest" }], importId: "import-1", providerId: "cursor", successes: [{ itemType: "HOOKS", source: "Hooks", target: ".codex/hooks.json" }] }];
view = render();
assert.equal(textContent(view).includes("Import history"), true);
assert.equal(textContent(view).includes("1 imported · 1 did not import"), true);
assert.equal(textContent(view).includes("Open hooks settings"), true);
const sync = walk(view).find((node) => node.props?.role === "switch");
assert.equal(sync.props.disabled, false);
sync.props.onClick();
await flush();
assert.deepEqual(state.writes.at(-1), { key: "syncEnabled", value: true });

state.history = { data: undefined, error: new Error("history unavailable"), isLoading: false, refetches: 0 };
view = render();
assert.equal(textContent(view).includes("Couldn't load import history"), true);
button(view, "Retry").props.onClick();
assert.equal(state.history.refetches, 1);

state.history = { data: [], error: null, isLoading: false, refetches: 0 };
state.detection.detectedItems = [];
view = render();
assert.equal(textContent(view).includes("No importable setup found"), true);
assert.equal(button(view, "Import").props.disabled, true);
assert.equal(walk(view).find((node) => node.props?.role === "switch").props.disabled, true);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " import settings assertions passed");
