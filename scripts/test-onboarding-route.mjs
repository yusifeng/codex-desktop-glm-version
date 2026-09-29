import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hookState = [];
let hookIndex = 0;
const state = {
  accountId: "acct-1", accounts: [{ id: "acct-1", name: "Care Team", plan_type: "hc" }],
  authLoading: false, authMethod: "chatgpt", calls: [], initialized: 0,
  isFetching: false, navigations: [], onboarding: { status: "allowed", accountId: "acct-1" },
  persistedAccountId: "acct-1", persistedUserId: "user-1", rejectSave: false, userId: "user-1",
};
const scope = { currentIdentity: () => ({ accountId: state.accountId, userId: state.userId }) };
const React = {
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
globalThis.__onboardingRoute = { React, jsx, scope, state };

const dependencyNames = [
  "rolldown-runtime", "app-shared", "app-initial", "app-primary", "thread-scroll-layout",
  "user-message", "turn-bibliography", "writing-block-directive-renderer", "departments",
];
const mocks = Object.fromEntries(dependencyNames.map((name) => [name, "export {};"]));
mocks["app-shared"] = [
  "const runtime=globalThis.__onboardingRoute;",
  "export const $3=()=>{runtime.state.initialized+=1};export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;export const LX=()=>runtime.scope;export const ZI='app-scope';",
  "export const HX=signal=>signal==='onboarding-state'?runtime.state.onboarding:signal==='onboarding-account'?runtime.state.persistedAccountId:runtime.state.persistedUserId;",
].join("\n");
mocks["app-initial"] = [
  "const runtime=globalThis.__onboardingRoute;",
  "export const vun='onboarding-state';export const mun='onboarding-account';export const _un='onboarding-user';",
  "export const N6t=()=>({accountId:runtime.state.accountId,userId:runtime.state.userId,authMethod:runtime.state.authMethod,isLoading:runtime.state.authLoading});",
  "export const iht=()=>({data:{accounts:runtime.state.accounts},isFetching:runtime.state.isFetching});",
  "export const o_n=()=> (path,options)=>runtime.state.navigations.push({path,options});",
].join("\n");
mocks.departments = [
  "const runtime=globalThis.__onboardingRoute;export const n=()=>{};",
  "export const t={physician:['internal_medicine','cardiology'],registered_nurse:['icu_rn'],student:['medical_student']};",
  "export const s=async(_scope,identity,onboarding,systemMessage)=>{runtime.state.calls.push({type:'save',identity,onboarding,systemMessage});if(runtime.state.rejectSave)throw new Error('save failed')};",
  "export const o=async(_scope,identity)=>{runtime.state.calls.push({type:'skip',identity})};",
  "export const r=async(_scope,identity)=>{runtime.state.calls.push({type:'acknowledge',identity})};",
].join("\n");

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/onboarding-route/index.ts")], bundle: true,
  format: "esm", platform: "node", target: "node22", write: false, metafile: true, logLevel: "silent",
  plugins: [{ name: "onboarding-route-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
  } }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["OnboardingRoute"]);
assert.equal(state.initialized, 1);
assert.deepEqual(Object.keys(result.metafile.inputs).filter((input) => input.startsWith("mock:")).map((input) => input.slice(5)).sort(), [...dependencyNames].sort());

const fallback = { type: "fallback", props: {} };
function render(clear = false) { hookIndex = 0; if (clear) hookState.length = 0; return module.OnboardingRoute({ fallback }); }
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

state.authLoading = true;
let view = render(true);
assert.equal(view.props.role, "status");
assert.equal(textContent(view), "Loading your workspace…");
state.authLoading = false; state.authMethod = "api";
assert.equal(render(true), fallback);
state.authMethod = "chatgpt"; state.accounts = [{ id: "acct-1", name: "Personal", plan_type: "plus" }];
assert.equal(render(true), fallback);
state.accounts = [{ id: "acct-1", name: "Care Team", plan_type: "hc" }]; state.onboarding.status = "denied";
view = render(true);
assert.equal(textContent(view).includes("Unable to load your workspace"), true);
assert.ok(button(view, "Try again"));
state.onboarding.status = "loading";
assert.equal(render(true).props.role, "status");
state.onboarding.status = "allowed"; state.persistedUserId = "stale-user";
assert.equal(render(true).props.role, "status");
state.persistedUserId = "user-1";

view = render(true);
assert.equal(view.props["data-onboarding-step"], "intro");
assert.equal(textContent(view).includes("Welcome to Care Team"), true);
button(view, "Get started").props.onClick();
view = render();
assert.equal(view.props["data-onboarding-step"], "role");
button(view, "Physician").props.onClick();
view = render();
assert.equal(button(view, "Next").props.disabled, false);
button(view, "Next").props.onClick();
view = render();
assert.equal(view.props["data-onboarding-step"], "department");
button(view, "Internal Medicine").props.onClick();
view = render();
assert.equal(button(view, "Next").props.disabled, false);
button(view, "Next").props.onClick();
await settle(); view = render();
assert.equal(view.props["data-onboarding-step"], "examples");
assert.equal(state.calls.at(-1).type, "save");
assert.deepEqual(state.calls.at(-1).onboarding, { role: "physician", departments: ["internal_medicine"] });
assert.equal(state.calls.at(-1).systemMessage.role_user_message.includes("Physician"), true);
assert.equal(state.calls.at(-1).systemMessage.role_user_message.includes("Internal Medicine"), true);
assert.equal(textContent(view).includes("Summarize a complex patient history"), true);
button(view, "Next example").props.onClick(); view = render();
assert.equal(find(view, (node) => node.props?.["data-tour-index"] != null).props["data-tour-index"], 1);
button(view, "Skip tour").props.onClick(); view = render();
assert.equal(view.props["data-onboarding-step"], "warning");
button(view, "Finish").props.onClick(); await settle();
assert.equal(state.calls.at(-1).type, "acknowledge");
assert.deepEqual(state.navigations.at(-1), { path: "/", options: { replace: true } });

state.calls.length = 0; state.navigations.length = 0; view = render(true);
button(view, "Get started").props.onClick(); view = render();
button(view, "Skip").props.onClick(); await settle();
assert.deepEqual(state.calls.map((call) => call.type), ["skip", "acknowledge"]);
assert.equal(state.navigations.at(-1).path, "/");

state.accounts = [{ id: "acct-1", name: "Quorum", plan_type: "quorum" }];
view = render(true);
assert.equal(textContent(view).includes("responsible use"), true);

state.accounts = [{ id: "acct-1", name: "Care Team", plan_type: "hc" }]; state.rejectSave = true;
view = render(true); button(view, "Get started").props.onClick(); view = render(); button(view, "Physician").props.onClick(); view = render(); button(view, "Next").props.onClick(); view = render(); button(view, "Cardiology").props.onClick(); view = render(); button(view, "Next").props.onClick(); await settle(); view = render();
assert.equal(find(view, (node) => node.props?.role === "alert").props.children, "save failed");
assert.equal(view.props["data-onboarding-step"], "department");

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " onboarding route assertions passed");
