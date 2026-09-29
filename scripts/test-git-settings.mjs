import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = {
  featureGates: new Map([["git-review-gate", true], ["2764989143", true]]),
  initialized: 0,
  invalidations: [],
  mutationError: false,
  pending: false,
  refreshed: [],
  settings: new Map([
    ["branchPrefix", "codex/"], ["alwaysForcePush", false], ["createPullRequestAsDraft", false],
    ["pullRequestMergeMethod", "merge"], ["reviewMode", "full"], ["reviewDelivery", "inline"],
    ["commitInstructions", "Keep commits focused"], ["pullRequestInstructions", "Summarize tests"],
    ["pullRequestWatchAutoMerge", false], ["pullRequestWatchInstructions", "Fix CI failures"],
  ]),
  toasts: [],
  writes: [],
};
const hookState = [];
let hookIndex = 0;
const React = {
  __reset() { hookIndex = 0; },
  useEffect() {},
  useState(initial) { const index = hookIndex++; if (!(index in hookState)) hookState[index] = typeof initial === "function" ? initial() : initial; return [hookState[index], (next) => { hookState[index] = typeof next === "function" ? next(hookState[index]) : next; }]; },
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
globalThis.__gitSettings = { React, jsx, state };
const descriptorNames = ["branchPrefix", "alwaysForcePush", "createPullRequestAsDraft", "pullRequestMergeMethod", "reviewMode", "commitInstructions", "pullRequestInstructions", "pullRequestWatchAutoMerge", "pullRequestWatchInstructions"];
const descriptors = Object.fromEntries(descriptorNames.map((key) => [key, { key }]));

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const runtime=globalThis.__gitSettings;",
    "export const $3=()=>{runtime.state.initialized+=1};export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;",
    "export const EU=" + JSON.stringify(descriptors) + ";export const iz={reviewDelivery:{key:'reviewDelivery'}};",
    "export const ZI='app-scope';export const pk='toast-manager';",
    "export const LX=()=>({queryClient:'query-client',get:()=>({success:message=>runtime.state.toasts.push({kind:'success',message}),danger:(message,options)=>runtime.state.toasts.push({kind:'danger',message,options})})});",
    "export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});",
    "export const iL=options=>({isPending:runtime.state.pending,mutate:value=>{if(runtime.state.mutationError){options.onError(new Error('save failed'),value);return}Promise.resolve(options.mutationFn(value)).then(result=>options.onSuccess(result,value)).catch(error=>options.onError(error,value))}});",
  ].join("\n"),
  "app-initial": [
    "const state=globalThis.__gitSettings.state;",
    "export const $ln=key=>key;export const O8t='git-review-gate';",
    "export const Kcn=setting=>state.settings.get(setting.key);",
    "export const Ucn=async(_scope,setting,value)=>{state.settings.set(setting.key,value);state.writes.push({key:setting.key,value})};",
    "export const ofn=gate=>state.featureGates.get(gate)===true;",
    "export const oun=async(_client,key)=>{state.invalidations.push(key)};",
  ].join("\n"),
  "pull-request-fix-automation": [
    "const state=globalThis.__gitSettings.state;",
    "export const n=()=>{state.initialized+=1};",
    "export const o=async preferences=>{state.refreshed.push(preferences);return []};",
  ].join("\n"),
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/git-settings/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "git-settings-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
  } }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["GitSettings"]);
assert.equal(state.initialized, 2);

function render() { React.__reset(); return module.GitSettings(); }
function walk(value, result = []) { if (value == null || typeof value !== "object") return result; if (Array.isArray(value)) { for (const item of value) walk(item, result); return result; } result.push(value); walk(value.props?.children, result); return result; }
function textContent(value) { if (value == null || typeof value === "boolean") return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(textContent).join(" "); return textContent(value.props?.children); }
function row(view, label) { return walk(view).find((node) => typeof node.props?.className === "string" && node.props.className.includes("min-h-14") && textContent(node.props.children[0]).includes(label)); }
function control(view, label) { return row(view, label).props.children[1].props.children; }
function byAria(view, label) { return walk(view).find((node) => node.props?.["aria-label"] === label); }
async function flush() { await Promise.resolve(); await Promise.resolve(); }

let view = render();
assert.equal(textContent(view).includes("Git"), true);
for (const label of ["Disable Git-Based Review", "Branch prefix", "Pull request merge method", "Always force push", "Create draft pull requests", "Review delivery", "Watch and fix pull requests", "Commit instructions", "Pull request instructions"]) assert.equal(textContent(view).includes(label), true);

control(view, "Disable Git-Based Review").props.onClick();
await flush();
assert.deepEqual(state.writes.at(-1), { key: "reviewMode", value: "last-turn-only" });
control(view, "Always force push").props.onClick();
await flush();
assert.deepEqual(state.writes.at(-1), { key: "alwaysForcePush", value: true });
assert.equal(state.toasts.at(-1).message, "Always force push enabled");
control(view, "Create draft pull requests").props.onClick();
await flush();
assert.deepEqual(state.writes.at(-1), { key: "createPullRequestAsDraft", value: true });
control(view, "Pull request merge method").props.onChange({ currentTarget: { value: "squash" } });
await flush();
assert.deepEqual(state.writes.at(-1), { key: "pullRequestMergeMethod", value: "squash" });
control(view, "Review delivery").props.onChange({ currentTarget: { value: "detached" } });
await flush();
assert.deepEqual(state.writes.at(-1), { key: "reviewDelivery", value: "detached" });

byAria(view, "Branch prefix").props.onChange({ currentTarget: { value: "feature/" } });
view = render();
assert.equal(byAria(view, "Branch prefix").props.value, "feature/");
walk(row(view, "Branch prefix")).find((node) => node.type === "button").props.onClick();
await flush();
assert.deepEqual(state.writes.at(-1), { key: "branchPrefix", value: "feature/" });
assert.equal(state.toasts.at(-1).message, "Saved branch prefix");

state.mutationError = true;
view = render();
control(view, "Always force push").props.onClick();
assert.equal(state.toasts.at(-1).kind, "danger");
assert.equal(state.toasts.at(-1).message, "Failed to save force push setting");
state.mutationError = false;

byAria(view, "Commit instructions").props.onChange({ currentTarget: { value: "Use conventional commits" } });
view = render();
walk(view).find((node) => node.type === "section" && textContent(node).includes("Commit instructions")).props.children[0].props.children[1].props.onClick();
await flush();
assert.deepEqual(state.writes.at(-1), { key: "commitInstructions", value: "Use conventional commits" });

byAria(view, "Pull request watch instructions").props.onChange({ currentTarget: { value: "Fix CI and conflicts" } });
view = render();
walk(view).find((node) => node.type === "section" && textContent(node).includes("Watch and fix pull requests")).props.children[0].props.children[1].props.onClick();
await flush();
assert.deepEqual(state.refreshed.at(-1), { autoMerge: false, instructions: "Fix CI and conflicts" });
assert.equal(state.invalidations.at(-1), "list-automations");
byAria(view, "Auto-merge when ready").props.onClick();
await flush();
assert.deepEqual(state.writes.at(-1), { key: "pullRequestWatchAutoMerge", value: true });
assert.deepEqual(state.refreshed.at(-1), { autoMerge: true, instructions: "Fix CI failures" });

state.pending = true;
view = render();
assert.equal(control(view, "Always force push").props.disabled, true);
assert.equal(byAria(view, "Commit instructions").props.disabled, true);
state.featureGates.set("2764989143", false);
state.featureGates.set("git-review-gate", false);
state.pending = false;
view = render();
assert.equal(textContent(view).includes("Pull request merge method"), false);
assert.equal(textContent(view).includes("Disable Git-Based Review"), false);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " git settings assertions passed");
