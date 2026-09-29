import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = {
  config: { data: undefined, error: null, isError: false, isLoading: true, refetches: 0 },
  diagnose: { installed: true, problems: [] },
  featureMutations: [],
  features: [{ enabled: true, name: "codex_primary_runtime_dependencies" }, { description: "Try a faster planner", displayName: "Fast planner", enabled: false, name: "fast_planner" }],
  gates: new Map([["2106641128", true], ["3693343337", true], ["3026692602", true], ["agent-model-features", true]]),
  host: { kind: "local" },
  initialized: 0,
  models: { data: { hasModelSupportingUltraReasoningEffort: true, models: [{ supportedReasoningEfforts: [{ reasoningEffort: "max" }, { reasoningEffort: "ultra" }] }] } },
  notices: [],
  opened: [],
  reasoningUpdates: [],
  reset: { bundleVersion: "1.2.3", status: "installed" },
  selectedHostId: "local",
  toast: [],
  writeError: false,
  writes: [],
};
const hooks = [];
let hookIndex = 0;
const React = { __reset() { hookIndex = 0; }, useState(initial) { const index = hookIndex++; if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial; return [hooks[index], (next) => { hooks[index] = typeof next === "function" ? next(hooks[index]) : next; }]; } };
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
const toast = { success: (message) => state.toast.push(["success", message]), warning: (message) => state.toast.push(["warning", message]), danger: (message) => state.toast.push(["danger", message]) };
const writeMutation = { isPending: false, mutate() {}, async mutateAsync(variables) { state.writes.push(variables); if (state.writeError) throw new Error("save failed"); return {}; } };
globalThis.__agentSettings = { React, jsx, state, toast, writeMutation };

const sideEffects = ["rolldown-runtime", "app-primary", "lock", "model-and-reasoning-effort-translations", "settings-loading-row", "experimental-feature-visibility", "plugins-settings-row", "settings-route-state"];
const mocks = Object.fromEntries(sideEffects.map((name) => [name, "export {};"]));
mocks["app-shared"] = [
  "const r=globalThis.__agentSettings;export const $3=()=>{r.state.initialized+=1};export const I3=()=>r.jsx;export const e6=()=>r.React;export const ZI='app-scope';export const pk='toast';",
  "export const LX=()=>({get:(signal)=>signal==='toast'?r.toast:r.writeMutation});export const n4=()=>({formatMessage:d=>d.defaultMessage});",
  "export const BX=(query)=>query==='notices'?{data:r.state.notices,refetch(){}}:{data:r.state.features,isLoading:false,refetch(){}};",
].join("\n");
mocks["app-initial"] = [
  "const r=globalThis.__agentSettings;export const Gv=()=>({selectedHostId:r.state.selectedHostId});export const Vfn=()=>r.state.host;export const Mt='notices';export const ti='fallback-notices';export const Nt='write';export const ucn='write-alt';",
  "export const ofn=gate=>r.state.gates.get(gate)===true;export const acn=()=>({...r.state.config,refetch:()=>{r.state.config.refetches+=1}});export const w8=()=>r.state.models;",
  "export const ont='features';export const cnt=()=>({isPending:false,mutate:variables=>r.state.featureMutations.push(variables),mutateAsync:async()=>({})});export const O8=(_scope,options)=>r.state.reasoningUpdates.push(options);",
  "export const Qut=options=>r.state.opened.push(options);export const Tt={primaryRuntime:{diagnoseDependencies:async()=>r.state.diagnose,resetDependencies:async()=>r.state.reset}};",
].join("\n");

const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer/agent-settings/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "agent-settings-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["AgentSettings"]);
assert.equal(state.initialized, 1);

function render() { React.__reset(); return module.AgentSettings(); }
function walk(value, result = []) { if (value == null || typeof value !== "object") return result; if (Array.isArray(value)) { for (const item of value) walk(item, result); return result; } result.push(value); walk(value.props?.children, result); return result; }
function textContent(value) { if (value == null || typeof value === "boolean") return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(textContent).join(" " ); return textContent(value.props?.children); }
function button(view, label) { return walk(view).find((node) => node.type === "button" && textContent(node).includes(label)); }
function select(view, label) { return walk(view).find((node) => node.type === "select" && node.props?.["aria-label"] === label); }
async function flush() { await Promise.resolve(); await Promise.resolve(); }

let view = render();
assert.equal(textContent(view).includes("Agent"), true);
assert.equal(textContent(view).includes("Loading agent configuration"), true);

state.config = { data: undefined, error: new Error("config unavailable"), isError: true, isLoading: false, refetches: 0 };
view = render();
assert.equal(textContent(view).includes("Couldn't load agent configuration"), true);
button(view, "Retry").props.onClick();
assert.equal(state.config.refetches, 1);

state.config = { data: { config: { approval_policy: "on-request", sandbox_mode: "workspace-write", sandbox_workspace_write: { network_access: false }, web_search: "cached" }, layers: [
  { config: {}, expectedVersion: "v1", filePath: "/Users/test/.codex/config.toml", kind: "user", label: "User config" },
  { config: { sandbox_mode: "read-only" }, expectedVersion: "v2", filePath: "/repo/.codex/config.toml", kind: "project", label: "demo", workspaceRoot: "/repo" },
  { config: { approval_policy: "never" }, filePath: "/managed/config.toml", kind: "managed", label: "Admin config" },
] }, error: null, isError: false, isLoading: false, refetches: 0 };
state.notices = [{ kind: "invalid-config", path: "/bad/config.toml", summary: "Invalid configuration" }];
view = render();
assert.equal(textContent(view).includes("Approval policy"), true);
assert.equal(textContent(view).includes("Network access"), true);
assert.equal(textContent(view).includes("Model features"), true);
assert.equal(textContent(view).includes("Experimental features (Beta)"), true);
assert.equal(textContent(view).includes("Workspace dependencies"), true);
assert.equal(textContent(view).includes("Invalid configuration"), true);

select(view, "Approval policy").props.onChange({ currentTarget: { value: "never" } });
await flush();
assert.equal(state.writes.at(-1).keyPath, "approval_policy");
assert.equal(state.writes.at(-1).value, "never");
button(view, "Open config.toml").props.onClick();
assert.equal(state.opened.at(-1).path, "/Users/test/.codex/config.toml");
button(view, "Open file").props.onClick();
assert.equal(state.opened.at(-1).path, "/bad/config.toml");

select(view, "Configuration scope").props.onChange({ currentTarget: { value: "/managed/config.toml" } });
view = render();
assert.equal(select(view, "Approval policy").props.disabled, true);

select(view, "Configuration scope").props.onChange({ currentTarget: { value: "/Users/test/.codex/config.toml" } });
view = render();
state.writeError = true;
select(view, "Web search").props.onChange({ currentTarget: { value: "live" } });
await flush();
view = render();
assert.equal(textContent(view).includes("Couldn't update this setting"), true);
state.writeError = false;

walk(view).find((node) => node.props?.["aria-label"] === "Toggle Fast planner").props.onClick();
assert.deepEqual(state.featureMutations.at(-1), { enabled: true, featureName: "fast_planner" });
walk(view).find((node) => node.props?.["aria-label"] === "Toggle ultra").props.onClick();
assert.equal(state.reasoningUpdates.at(-1).reasoningEffort, "ultra");

button(view, "Diagnose").props.onClick();
await flush();
assert.deepEqual(state.toast.at(-1), ["success", "Codex dependencies look healthy"]);
button(view, "Reinstall").props.onClick();
await flush();
assert.deepEqual(state.toast.at(-1), ["success", "Codex dependencies were reinstalled"]);

state.host = { kind: "remote" };
state.selectedHostId = "remote-1";
view = render();
assert.equal(textContent(view).includes("Workspace dependencies"), false);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " agent settings assertions passed");
