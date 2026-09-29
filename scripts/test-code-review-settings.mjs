import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const preferences = {
  allow_credits_for_code_reviews: false,
  code_review_preference: "repo_default",
  code_review_trigger_policy: "pr_open",
  exhaustive_code_review: false,
  security_review: {
    manual_severity_threshold: "medium",
    preference: "repo_default",
    severity_threshold: "high",
    trigger_policy: "code_review",
  },
};
const state = {
  canManageCreditSettings: true,
  initialized: 0,
  mutationError: false,
  mutations: [],
  pending: false,
  query: { data: null, isError: false, refetches: 0 },
  smartDetectEnabled: false,
  toasts: [],
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
globalThis.__codeReviewSettings = { jsx, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const runtime=globalThis.__codeReviewSettings;",
    "export const $3=()=>{runtime.state.initialized+=1};",
    "export const I3=()=>runtime.jsx;export const ZI='app-scope';export const pk='toast-manager';",
    "export const LX=()=>({get:()=>({danger:(message,options)=>runtime.state.toasts.push({message,options})})});",
    "export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});",
  ].join("\n"),
  "app-initial": [
    "const state=globalThis.__codeReviewSettings.state;",
    "export const dS=()=>({canManageCreditSettings:state.canManageCreditSettings});",
    "export const ofn=()=>state.smartDetectEnabled;",
  ].join("\n"),
  "cloud-preferences": [
    "const state=globalThis.__codeReviewSettings.state;",
    "export const a=()=>({...state.query,refetch:()=>{state.query.refetches+=1}});",
    "export const o=()=>({isPending:state.pending,mutate:(update,callbacks)=>{state.mutations.push(update);if(state.mutationError)callbacks.onError()}});",
    "export const r=()=>{state.initialized+=1};",
  ].join("\n"),
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/code-review-settings/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "code-review-settings-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
    },
  }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["CodeReviewSettings"]);
assert.equal(state.initialized, 2);

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

let view = module.CodeReviewSettings();
assert.equal(textContent(view).includes("Code review"), true);
assert.equal(walk(view).some((node) => node.props?.role === "status"), true);

state.query.isError = true;
view = module.CodeReviewSettings();
assert.equal(textContent(view).includes("Unable to load code review settings"), true);
control(view, "Unable to load code review settings").props.onClick();
assert.equal(state.query.refetches, 1);

state.query = { data: preferences, isError: false, refetches: 1 };
view = module.CodeReviewSettings();
assert.equal(textContent(view).includes("Personal preferences"), true);
assert.equal(textContent(view).includes("Personal security review preferences"), true);
assert.equal(control(view, "Automatic review").props["aria-checked"], false);
control(view, "Automatic review").props.onClick();
assert.deepEqual(state.mutations.at(-1), { code_review_preference: "always" });
control(view, "Review trigger").props.onChange({ currentTarget: { value: "every_push" } });
assert.deepEqual(state.mutations.at(-1), { code_review_trigger_policy: "every_push" });
control(view, "Exhaustive code review").props.onClick();
assert.deepEqual(state.mutations.at(-1), { exhaustive_code_review: true });
control(view, "Use credits for reviews").props.onClick();
assert.deepEqual(state.mutations.at(-1), { allow_credits_for_code_reviews: true });

const securityTrigger = control(view, "Security review trigger");
assert.equal(textContent(securityTrigger).includes("Smart detect (Experimental)"), false);
securityTrigger.props.onChange({ currentTarget: { value: "pr_open" } });
assert.deepEqual(state.mutations.at(-1), { security_review: { trigger_policy: "pr_open" } });
control(view, "Minimum automatic review reporting severity").props.onChange({ currentTarget: { value: "medium" } });
assert.deepEqual(state.mutations.at(-1), { security_review: { severity_threshold: "medium" } });
control(view, "Minimum manual review reporting severity").props.onChange({ currentTarget: { value: "low" } });
assert.deepEqual(state.mutations.at(-1), { security_review: { manual_severity_threshold: "low" } });

state.smartDetectEnabled = true;
view = module.CodeReviewSettings();
assert.equal(textContent(control(view, "Security review trigger")).includes("Smart detect (Experimental)"), true);
state.pending = true;
view = module.CodeReviewSettings();
assert.equal(control(view, "Automatic review").props.disabled, true);
assert.equal(control(view, "Review trigger").props.disabled, true);

state.pending = false;
state.mutationError = true;
view = module.CodeReviewSettings();
control(view, "Automatic security review").props.onClick();
assert.deepEqual(state.mutations.at(-1), { security_review: { preference: "always" } });
assert.equal(state.toasts.at(-1).message, "Unable to save code review settings");
assert.equal(state.toasts.at(-1).options.errorAnalytics.toastId, "settings.codeReview.save.error");

state.canManageCreditSettings = false;
state.mutationError = false;
view = module.CodeReviewSettings();
assert.equal(textContent(view).includes("Use credits for reviews"), false);
state.query.data = { ...preferences, security_review: null };
view = module.CodeReviewSettings();
assert.equal(textContent(view).includes("Personal security review preferences"), false);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " code review settings assertions passed");
