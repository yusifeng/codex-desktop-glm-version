import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const variables = [
  { value: "{feature}", example: "dark-mode", char_count: 20 },
  { value: "{date}", example: "2026-09-29", char_count: 10 },
];
const state = {
  configQuery: { data: { branch_format_max_length: 80, branch_format_special_values: variables }, isError: false, refetches: 0 },
  initialized: 0,
  mutationError: false,
  mutations: [],
  pending: false,
  preferencesQuery: { data: { branch_format: "codex/{feature}", git_diff_mode: "unified" }, isError: false, refetches: 0 },
  toasts: [],
};
const hookState = [];
let hookIndex = 0;
const React = {
  Fragment: "Fragment",
  __reset() { hookIndex = 0; },
  useState(initial) {
    const index = hookIndex++;
    if (!(index in hookState)) hookState[index] = typeof initial === "function" ? initial() : initial;
    return [hookState[index], (next) => { hookState[index] = typeof next === "function" ? next(hookState[index]) : next; }];
  },
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
globalThis.__cloudPreferencesSettings = { React, jsx, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-initial": "export {};",
  "app-shared": [
    "const runtime=globalThis.__cloudPreferencesSettings;",
    "export const $3=()=>{runtime.state.initialized+=1};",
    "export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;",
    "export const ZI='app-scope';export const pk='toast-manager';",
    "export const LX=()=>({get:()=>({success:message=>runtime.state.toasts.push({kind:'success',message}),danger:(message,options)=>runtime.state.toasts.push({kind:'danger',message,options})})});",
    "export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});",
  ].join("\n"),
  "cloud-preferences": [
    "const state=globalThis.__cloudPreferencesSettings.state;",
    "export const a=()=>({...state.preferencesQuery,refetch:()=>{state.preferencesQuery.refetches+=1}});",
    "export const i=()=>({...state.configQuery,refetch:()=>{state.configQuery.refetches+=1}});",
    "export const o=()=>({isPending:state.pending,mutate:(update,callbacks)=>{state.mutations.push(update);state.mutationError?callbacks.onError():callbacks.onSuccess()}});",
    "export const r=()=>{state.initialized+=1};",
    "export const n=(template,maxLength,variables)=>{const opens=(template.match(/{/g)||[]).length;const closes=(template.match(/}/g)||[]).length;if(opens!==closes)return 'bracket-mismatch';if(opens===0)return 'missing-pattern';const allowed=variables.map(v=>v.value);for(const match of template.match(/{[^}]+}/g)||[])if(!allowed.includes(match))return 'invalid-pattern';let expanded=template;for(const variable of variables)expanded=expanded.replaceAll(variable.value,'x'.repeat(variable.char_count));if(expanded.length>maxLength)return 'too-long';if(expanded.startsWith('/'))return 'leading-slash';return /^[a-zA-Z0-9./\\-_]+$/.test(expanded)?null:'invalid-characters'};",
    "export const t=(template,variables)=>{let result=template;for(const variable of variables)result=result.replaceAll(variable.value,variable.example);return result};",
  ].join("\n"),
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/cloud-preferences-settings/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "cloud-preferences-settings-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
    },
  }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["CloudPreferencesSettings"]);
assert.equal(state.initialized, 2);

function render() { React.__reset(); return module.CloudPreferencesSettings(); }
function walk(value, result = []) {
  if (value == null || typeof value !== "object") return result;
  if (Array.isArray(value)) { for (const item of value) walk(item, result); return result; }
  result.push(value); walk(value.props?.children, result); return result;
}
function textContent(value) {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textContent).join(" ");
  return textContent(value.props?.children);
}
function row(view, label) {
  return walk(view).find((node) => typeof node.props?.className === "string"
    && node.props.className.includes("min-h-14")
    && textContent(node.props.children[0]).includes(label));
}
function control(view, label) { return row(view, label).props.children[1].props.children; }

state.preferencesQuery.data = null;
let view = render();
assert.equal(walk(view).some((node) => node.props?.role === "status"), true);
state.preferencesQuery.data = { branch_format: "codex/{feature}", git_diff_mode: "unified" };
state.configQuery.isError = true;
view = render();
assert.equal(textContent(view).includes("Unable to load cloud preferences"), true);
control(view, "Unable to load cloud preferences").props.onClick();
assert.equal(state.preferencesQuery.refetches, 1);
assert.equal(state.configQuery.refetches, 1);

state.configQuery.isError = false;
view = render();
assert.equal(textContent(view).includes("Cloud preferences"), true);
assert.equal(textContent(row(view, "Branch format")).includes("Example: codex/dark-mode"), true);
assert.equal(textContent(row(view, "Available placeholders")).includes("{feature}, {date}"), true);
control(view, "Diff view").props.onChange({ currentTarget: { value: "split" } });
assert.deepEqual(state.mutations.at(-1), { git_diff_mode: "split" });
assert.deepEqual(state.toasts.at(-1), { kind: "success", message: "Saved diff view" });

state.mutationError = true;
control(view, "Diff view").props.onChange({ currentTarget: { value: "unified" } });
assert.equal(state.toasts.at(-1).kind, "danger");
state.mutationError = false;

control(view, "Branch format").props.onChange({ currentTarget: { value: "/{feature}" } });
view = render();
assert.equal(textContent(row(view, "Branch format")).includes("cannot start with '/'"), true);
assert.equal(control(view, "Available placeholders").props.disabled, true);
control(view, "Branch format").props.onChange({ currentTarget: { value: "work/{date}/{feature}" } });
view = render();
assert.equal(textContent(row(view, "Branch format")).includes("Example: work/2026-09-29/dark-mode"), true);
assert.equal(control(view, "Available placeholders").props.disabled, false);
control(view, "Available placeholders").props.onClick();
assert.deepEqual(state.mutations.at(-1), { branch_format: "work/{date}/{feature}" });

state.pending = true;
view = render();
assert.equal(control(view, "Diff view").props.disabled, true);
assert.equal(control(view, "Branch format").props.disabled, true);
assert.equal(textContent(control(view, "Available placeholders")), "Saving…");

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " cloud preferences settings assertions passed");
