import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(ROOT, "src/renderer/profile-settings/index.ts"), "utf8");
const identitySignal = { name: "identity" };
const profileQuery = { name: "profile-query" };
const toastManagerSignal = { name: "toasts" };
const toastManager = {
  danger(message, options) { state.toasts.push({ kind: "danger", message, options }); },
  success(message) { state.toasts.push({ kind: "success", message }); },
};
const validProfile = {
  npi: "1234567890",
  degree: "MD",
  medical_license_state: "DE",
  medical_license_number: "MED-1",
  physician_eligible_for_cme: true,
  is_npi_editable: false,
};
const state = {
  identity: null,
  initialized: 0,
  mutationOptions: null,
  mutationShouldFail: false,
  profileResult: null,
  refetches: 0,
  saved: [],
  toasts: [],
};
function profileResult(overrides = {}) {
  return {
    data: undefined,
    isError: false,
    isPending: false,
    refetch: async () => { state.refetches += 1; },
    ...overrides,
  };
}
state.profileResult = profileResult({ data: validProfile });

let hookCursor = 0;
let hookValues = [];
function resetHooks() { hookCursor = 0; hookValues = []; }
const React = {
  useState(initialValue) {
    const index = hookCursor++;
    if (!(index in hookValues)) hookValues[index] = initialValue;
    return [hookValues[index], (next) => { hookValues[index] = typeof next === "function" ? next(hookValues[index]) : next; }];
  },
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
const scope = {
  get(signal) {
    if (signal === identitySignal) return state.identity;
    if (signal === toastManagerSignal) return toastManager;
    return undefined;
  },
};
globalThis.__profileSettings = { React, identitySignal, jsx, profileQuery, scope, state, toastManagerSignal };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const runtime=globalThis.__profileSettings;",
    "const initialize=()=>{runtime.state.initialized+=1};",
    "export const $3=initialize;export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;",
    "export const ZI='app-scope';export const pk=runtime.toastManagerSignal;",
    "export const HX=signal=>signal===runtime.identitySignal?runtime.state.identity:null;",
    "export const BX=(family)=>family===runtime.profileQuery?runtime.state.profileResult:null;",
    "export const LX=()=>runtime.scope;",
    "export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});",
    "export const iL=options=>{runtime.state.mutationOptions=options;return {isPending:false,mutate(){runtime.state.lastMutationPromise=Promise.resolve().then(()=>options.mutationFn()).then(value=>{if(runtime.state.mutationShouldFail)throw Error('save failed');options.onSuccess?.(value);}).catch(error=>options.onError?.(error));}}};",
  ].join("\n"),
  "app-initial": "const s=globalThis.__profileSettings.state;export const Xl=()=>{s.initialized+=1};export const su=()=>{s.initialized+=1};",
  "cme-state": [
    "const runtime=globalThis.__profileSettings;",
    "export const i=runtime.identitySignal;export const t=runtime.profileQuery;export const o=()=>{runtime.state.initialized+=1};",
    "export const l=async(_scope,identity,profile)=>{runtime.state.saved.push({identity,profile});return profile};",
  ].join("\n"),
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/profile-settings/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "profile-settings-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
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
function renderProfile() { hookCursor = 0; return module.CmeProfileSettings(); }
function input(view, placeholder) { return walk(view).find((node) => node.type === "input" && node.props?.placeholder === placeholder); }
function saveButton(view) { return walk(view).find((node) => node.type === "button" && textContent(node) === "Save"); }

assert.deepEqual(Object.keys(module).sort(), ["CmeAccountSettings", "CmeProfileSettings"]);
assert.equal(state.initialized, 4);
assert.deepEqual(
  [...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^\"]+)"/g)].map((match) => match[1]),
  ["rolldown-runtime", "app-shared", "app-initial", "cme-state"],
);
assert.equal(/\b(?:appSharedChunk|appInitialChunk|cmeStateChunk)\s*\./.test(source), false);
assert.equal(/\bany\b/.test(source), false);

assert.equal(renderProfile(), null);
assert.equal(textContent(module.CmeAccountSettings()).includes("Account"), true);

state.identity = { accountId: "acct-1", userId: "user-1" };
state.profileResult = profileResult({ isPending: true });
resetHooks();
assert.equal(walk(renderProfile()).some((node) => node.props?.role === "status"), true);

state.profileResult = profileResult({ isError: true });
resetHooks();
const failedLoad = renderProfile();
assert.equal(textContent(failedLoad).includes("Unable to load medical credentials"), true);
walk(failedLoad).find((node) => node.type === "button" && textContent(node) === "Try again").props.onClick();
await Promise.resolve();
assert.equal(state.refetches, 1);

state.profileResult = profileResult({ data: validProfile });
resetHooks();
let view = renderProfile();
assert.equal(input(view, "Enter your 10-digit NPI").props.value, "1234567890");
assert.equal(input(view, "Enter your degree (e.g. MD)").props.value, "MD");
assert.equal(input(view, "Enter a 2-letter state (e.g. DE)").props.value, "DE");
assert.equal(input(view, "Enter your medical license number").props.value, "MED-1");
assert.equal(input(view, "Enter your 10-digit NPI").props.disabled, true);
assert.equal(saveButton(view).props.disabled, true);

state.profileResult = profileResult({ data: { npi: "12x", degree: "", medical_license_state: "D", medical_license_number: "", physician_eligible_for_cme: false, is_npi_editable: true } });
resetHooks();
view = renderProfile();
input(view, "Enter your degree (e.g. MD)").props.onChange({ currentTarget: { value: " " } });
view = renderProfile();
assert.equal(textContent(view).includes("NPI must be 10 digits"), true);
assert.equal(textContent(view).includes("Degree is required"), true);
assert.equal(textContent(view).includes("Medical license state must be 2 letters"), true);
assert.equal(textContent(view).includes("Medical license number is required"), true);
assert.equal(textContent(view).includes("Physician eligibility confirmation is required"), true);

state.profileResult = profileResult({ data: validProfile });
resetHooks();
view = renderProfile();
input(view, "Enter your degree (e.g. MD)").props.onChange({ currentTarget: { value: "  DO  " } });
view = renderProfile();
input(view, "Enter a 2-letter state (e.g. DE)").props.onChange({ currentTarget: { value: " ca " } });
view = renderProfile();
input(view, "Enter your medical license number").props.onChange({ currentTarget: { value: "  LIC-9  " } });
view = renderProfile();
assert.equal(saveButton(view).props.disabled, false);
walk(view).find((node) => node.type === "form").props.onSubmit({ preventDefault() {} });
await state.lastMutationPromise;
assert.deepEqual(state.saved.at(-1), {
  identity: { accountId: "acct-1", userId: "user-1" },
  profile: { npi: "1234567890", degree: "DO", medical_license_state: "CA", medical_license_number: "LIC-9", physician_eligible_for_cme: true },
});
assert.deepEqual(state.toasts.at(-1), { kind: "success", message: "Medical credentials saved" });

view = renderProfile();
input(view, "Enter your degree (e.g. MD)").props.onChange({ currentTarget: { value: "DO" } });
view = renderProfile();
state.mutationShouldFail = true;
walk(view).find((node) => node.type === "form").props.onSubmit({ preventDefault() {} });
await state.lastMutationPromise;
assert.equal(state.toasts.at(-1).kind, "danger");
assert.equal(state.toasts.at(-1).message, "Unable to save medical credentials. Please try again.");
assert.equal(state.toasts.at(-1).options.errorAnalytics.toastId, "cme.profile.saveFailed");

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " profile settings assertions passed");
