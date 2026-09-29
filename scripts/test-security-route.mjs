import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hookState = [];
const effectDeps = [];
let hookIndex = 0;
const state = {
  availability: "ready", calls: [], capability: true, gate: true,
  initialized: 0, navigations: [], path: "/security", remote: false,
  responses: {
    list_codex_security_scans: { scans: [{ scanId: "scan-1", targetPath: "/repo", findingCount: 2, mode: "full", progress: { status: "complete" } }] },
    list_codex_security_global_findings: { findings: [{ occurrenceId: "finding-1", title: "Unsafe command", severity: "high", status: "open" }] },
    list_codex_security_repositories: { repositories: [{ targetId: "repo-1", displayName: "codex", targetPath: "/repo", openFindingsCount: 2 }] },
    start_codex_security_scan: { scanId: "scan-new" },
  },
};
function depsChanged(previous, next) {
  return previous == null || previous.length !== next.length || next.some((value, index) => !Object.is(value, previous[index]));
}
const React = {
  useState(initial) {
    const index = hookIndex++;
    if (!(index in hookState)) hookState[index] = typeof initial === "function" ? initial() : initial;
    return [hookState[index], (next) => { hookState[index] = typeof next === "function" ? next(hookState[index]) : next; }];
  },
  useEffect(effect, deps) {
    const index = hookIndex++;
    if (depsChanged(effectDeps[index], deps)) { effectDeps[index] = deps; effect(); }
  },
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
globalThis.__securityRoute = { React, jsx, state };

const dependencyNames = [
  "rolldown-runtime", "app-shared", "app-initial", "app-primary", "tabs", "filter-alt",
  "model-and-reasoning-effort-translations", "commit", "useForm", "conversation-blocks",
  "local-conversation-turn", "use-resume-conversation-if-needed", "bar-chart", "detail-page",
  "plus-sm", "detail-section-state", "filter-alt-badged", "settings-host-dropdown", "settings-row-disclosure",
];
const mocks = Object.fromEntries(dependencyNames.map((name) => [name, "export {};"]));
mocks["app-shared"] = [
  "const runtime=globalThis.__securityRoute;",
  "const scope={scope:true};",
  "export const $3=()=>{runtime.state.initialized+=1};export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;",
  "export const LX=()=>scope;export const ZI='app-scope';",
].join("\n");
mocks["app-initial"] = [
  "const runtime=globalThis.__securityRoute;",
  "export const nv='security-gate';export const ugn='local';export const ofn=()=>runtime.state.gate;export const _N=()=>runtime.state.remote;",
  "export const b6t=()=>runtime.state.capability;export const c4t=()=>({data:['codex-security'],isLoading:runtime.state.availability==='loading'});",
  "export const ev=()=>runtime.state.availability;export const o_n=()=>path=>runtime.state.navigations.push(path);",
  "export const a_n=pattern=>{const current=runtime.state.path;const escaped=pattern.replace(/:[^/]+/g,'([^/]+)');const names=[...pattern.matchAll(/:([^/]+)/g)].map(match=>match[1]);const match=current.match(new RegExp('^'+escaped+'$'));if(!match)return null;return {params:Object.fromEntries(names.map((name,index)=>[name,match[index+1]]))}};",
  "export const Rdt=async(_scope,hostId,server,tool,args)=>{runtime.state.calls.push({hostId,server,tool,args});const response=runtime.state.responses[tool];if(response instanceof Error)throw response;return {structuredContent:response}};",
].join("\n");

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/security-route/index.ts")], bundle: true,
  format: "esm", platform: "node", target: "node22", write: false, metafile: true, logLevel: "silent",
  plugins: [{ name: "security-route-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
  } }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["SecurityRoute"]);
assert.equal(state.initialized, 1);
assert.deepEqual(Object.keys(result.metafile.inputs).filter((input) => input.startsWith("mock:")).map((input) => input.slice(5)).sort(), [...dependencyNames].sort());

function resetHooks(clear = false) { hookIndex = 0; if (clear) { hookState.length = 0; effectDeps.length = 0; } }
function render(clear = false) { resetHooks(clear); return module.SecurityRoute(); }
function walk(value, output = []) {
  if (value == null || typeof value !== "object") return output;
  if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; }
  output.push(value); walk(value.props?.children, output); return output;
}
function textContent(value) {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textContent).join(" ");
  return textContent(value.props?.children);
}
function find(view, predicate) { return walk(view).find(predicate); }
function button(view, label) { return find(view, (node) => node.type === "button" && textContent(node) === label); }
async function settle() { for (let index = 0; index < 6; index += 1) await Promise.resolve(); }

let view = render(true);
assert.equal(view.props["data-security-state"], "ready");
assert.equal(textContent(view).includes("Loading Security scans"), true);
await settle(); view = render();
assert.equal(textContent(view).includes("/repo · 2 findings · complete"), true);
button(view, "New scan").props.onClick();
assert.equal(state.navigations.at(-1), "/security/new");
find(view, (node) => node.type === "button" && textContent(node).includes("/repo")).props.onClick();
assert.equal(state.navigations.at(-1), "/security/scans/scan-1");
assert.equal(state.calls.at(-1).tool, "list_codex_security_scans");

state.path = "/security/new"; view = render(true);
assert.equal(view.props.children[1].props["data-security-page"], "new-scan");
find(view, (node) => node.props?.["aria-label"] === "Target path").props.onChange({ target: { value: " /workspace/app " } });
view = render();
find(view, (node) => node.props?.["aria-label"] === "Scan mode").props.onChange({ target: { value: "diff" } });
view = render();
assert.equal(button(view, "Start scan").props.disabled, false);
view.props.children[1].props.onSubmit({ preventDefault() {} });
await settle();
assert.deepEqual(state.calls.at(-1), { hostId: "local", server: "codex-security", tool: "start_codex_security_scan", args: { mode: "diff", scope: "workspace", targetPath: "/workspace/app" } });
assert.equal(state.navigations.at(-1), "/security/scans/scan-new");

state.path = "/security/findings"; view = render(true); await settle(); view = render();
assert.equal(textContent(view).includes("Unsafe command · high · open"), true);
assert.equal(find(view, (node) => node.props?.["aria-current"] === "page").props.children, "Findings");
state.path = "/security/repositories/repo-1"; view = render(true); await settle(); view = render();
assert.equal(textContent(view).includes("codex · 2 open findings · /repo"), true);
assert.equal(find(view, (node) => node.props?.["aria-current"] === "page").props.children, "Repositories");

for (const [availability, expected] of [
  ["gate-disabled", "not enabled for this build"], ["disabled-by-admin", "administrator has disabled"],
  ["plugin-unavailable", "Install and enable"], ["host-disconnected", "selected remote host is disconnected"],
  ["loading", "Loading Codex Security"],
]) {
  state.availability = availability; state.remote = false; view = render(true);
  assert.equal(view.props["data-security-state"], availability);
  assert.equal(textContent(view).includes(expected), true);
}
state.availability = "remote-host"; state.remote = true; view = render(true);
assert.equal(textContent(view).includes("available when working on a local host"), true);
button(view, "Use local").props.onClick();
assert.equal(state.navigations.at(-1), "/security");

state.availability = "ready"; state.remote = false; state.path = "/security";
state.responses.list_codex_security_scans = new Error("plugin offline");
view = render(true); await settle(); view = render();
assert.equal(find(view, (node) => node.props?.role === "alert").props.children, "plugin offline");

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " security route assertions passed");
