import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(ROOT, "src/renderer/safety-settings/index.ts"), "utf8");
const accessSignal = { name: "access" };
const querySignal = { name: "query" };
const toastSignal = { name: "toast" };
const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const quietSchedule = { enabled: true, blocks: [{ id: "quiet-1", days: weekdays, start_time: "22:00", end_time: "07:00" }] };
const studySchedule = { enabled: false, blocks: [] };
const state = {
  access: { status: "loading" },
  failPatch: false,
  initialized: 0,
  patches: [],
  query: null,
  refetches: 0,
  toasts: [],
};
function settingsData(overrides = {}) {
  return {
    eligibleNowOrBefore: true,
    quietHours: { status: "loaded", schedule: quietSchedule },
    studyHours: { status: "loaded", schedule: studySchedule },
    ...overrides,
  };
}
function settingsQuery(overrides = {}) {
  return {
    data: undefined,
    isError: false,
    isFetching: false,
    isLoading: false,
    refetch: async () => { state.refetches += 1; },
    ...overrides,
  };
}
state.query = settingsQuery({ isLoading: true });

let hookCursor = 0;
let hookValues = [];
function resetHooks() { hookCursor = 0; hookValues = []; }
const React = {
  useState(initialValue) {
    const index = hookCursor++;
    if (!(index in hookValues)) hookValues[index] = typeof initialValue === "function" ? initialValue() : initialValue;
    return [hookValues[index], (next) => { hookValues[index] = typeof next === "function" ? next(hookValues[index]) : next; }];
  },
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
const toastManager = {
  danger(message, options) { state.toasts.push({ kind: "danger", message, options }); },
  success(message) { state.toasts.push({ kind: "success", message }); },
};
const scope = { get(signal) { return signal === toastSignal ? toastManager : undefined; } };
globalThis.__safetySettings = { React, accessSignal, jsx, querySignal, scope, state, toastSignal };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const runtime=globalThis.__safetySettings;",
    "export const $3=()=>{runtime.state.initialized+=1};export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;",
    "export const ZI='scope';export const pk=runtime.toastSignal;export const LX=()=>runtime.scope;",
    "export const HX=signal=>signal===runtime.accessSignal?runtime.state.access:runtime.state.query;",
    "export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});",
  ].join("\n"),
  "app-initial": [
    "const runtime=globalThis.__safetySettings;const state=runtime.state;",
    "export const Xl=()=>{state.initialized+=1};export const su=()=>{state.initialized+=1};",
    "export const bL=runtime.accessSignal;export const bqt=runtime.querySignal;",
    "export const rJt={safePatch:(path,options)=>{state.patches.push({path,options});state.patchPromise=Promise.resolve().then(()=>{if(state.failPatch)throw Error('save failed');return {ok:true};});return state.patchPromise;}};",
  ].join("\n"),
  "settings-loading-row": "const r=globalThis.__safetySettings;export const n=()=>{r.state.initialized+=1};export const t=props=>({type:'loading-row',props});",
  "legacy-study-hours-schedule": [
    "export const r=()=>{globalThis.__safetySettings.state.initialized+=1};",
    "export const n=()=>({enabled:false,blocks:[]});",
    "export const t=(schedule,action)=>{switch(action.type){case 'set_enabled':return {...schedule,enabled:action.enabled,blocks:action.enabled&&schedule.blocks.length===0&&action.initialBlock?[action.initialBlock]:schedule.blocks};case 'add_block':return {...schedule,blocks:[...schedule.blocks,action.block]};case 'remove_block':return {...schedule,blocks:schedule.blocks.filter(block=>block.id!==action.blockId)};case 'update_block':return {...schedule,blocks:schedule.blocks.map(block=>block.id===action.blockId?{...block,...action.update}:block)};default:return schedule;}};",
  ].join("\n"),
  "settings-unsaved-changes-dialog": "const r=globalThis.__safetySettings;export const n=()=>{r.state.initialized+=1};export const t=props=>({type:'unsaved-dialog',props});",
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/safety-settings/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "safety-settings-mocks",
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
function render() { hookCursor = 0; return module.ChatGptSafetySettings(); }
function button(view, label) { return walk(view).find((node) => node.type === "button" && textContent(node) === label); }
function timeInput(view, label) { const fieldset = walk(view).find((node) => node.type === "fieldset" && node.props?.["aria-label"] === "Schedule block 1"); return walk(fieldset).find((node) => node.type === "input" && textContent(node.props?.value) === label); }

assert.deepEqual(Object.keys(module), ["ChatGptSafetySettings"]);
assert.equal(state.initialized, 6);
assert.deepEqual(
  [...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^\"]+)"/g)].map((match) => match[1]),
  ["rolldown-runtime", "app-shared", "app-initial", "settings-loading-row", "legacy-study-hours-schedule", "settings-unsaved-changes-dialog"],
);
assert.equal(/\b(?:appSharedChunk|appInitialChunk|settingsLoadingRowChunk|legacyStudyHoursScheduleChunk|settingsUnsavedChangesDialogChunk)\s*\./.test(source), false);
assert.equal(/\bany\b/.test(source), false);

let view = render();
assert.equal(walk(view).some((node) => node.type === "loading-row"), true);

state.access = { status: "allowed", accountId: "acct-1", userId: "user-1" };
state.query = settingsQuery({ isError: true });
resetHooks();
view = render();
assert.equal(walk(view).some((node) => node.props?.role === "alert"), true);
button(view, "Retry").props.onClick();
await Promise.resolve();
assert.equal(state.refetches, 1);

state.query = settingsQuery({ data: settingsData({ eligibleNowOrBefore: false }) });
resetHooks();
view = render();
assert.equal(textContent(view).includes("Time management isn’t available for this account"), true);

state.query = settingsQuery({ data: settingsData() });
resetHooks();
view = render();
assert.equal(textContent(view).includes("Safety and wellbeing"), true);
assert.equal(textContent(view).includes("Quiet hours Schedule hours when ChatGPT can’t be used Scheduled"), true);
assert.equal(textContent(view).includes("Study hours Ask questions and give hints before answering Not scheduled"), true);

button(view, "Quiet hoursSchedule hours when ChatGPT can’t be usedScheduled")?.props.onClick?.();
if (hookValues[0] === "overview") {
  walk(view).find((node) => node.type === "button" && textContent(node).includes("Quiet hours")).props.onClick();
}
view = render();
assert.equal(textContent(view).includes("Quiet hours"), true);
assert.equal(button(view, "Save").props.disabled, true);
const firstStart = walk(view).find((node) => node.type === "input" && node.props?.value === "22:00");
firstStart.props.onChange({ currentTarget: { value: "07:00" } });
view = render();
assert.equal(textContent(view).includes("Select at least one day per block and different start and end times"), true);
assert.equal(button(view, "Save").props.disabled, true);

walk(view).find((node) => node.type === "input" && node.props?.value === "07:00").props.onChange({ currentTarget: { value: "21:30" } });
view = render();
assert.equal(button(view, "Save").props.disabled, false);
button(view, "Back").props.onClick();
view = render();
const unsavedDialog = walk(view).find((node) => node.type === "unsaved-dialog");
assert.equal(typeof unsavedDialog.props.pendingNavigation, "function");
unsavedDialog.props.onClearPendingNavigation();

view = render();
walk(view).find((node) => node.type === "form").props.onSubmit({ preventDefault() {} });
await state.patchPromise;
await Promise.resolve();
assert.equal(state.patches.at(-1).path, "/settings/account_user_setting");
assert.equal(state.patches.at(-1).options.parameters.query.feature, "quiet_hours_schedule");
assert.equal(JSON.parse(state.patches.at(-1).options.parameters.query.value).blocks[0].start_time, "21:30");
assert.deepEqual(state.toasts.at(-1), { kind: "success", message: "Quiet hours saved" });

view = render();
walk(view).find((node) => node.type === "input" && node.props?.value === "21:30").props.onChange({ currentTarget: { value: "20:00" } });
view = render();
state.failPatch = true;
walk(view).find((node) => node.type === "form").props.onSubmit({ preventDefault() {} });
await state.patchPromise.catch(() => undefined);
await Promise.resolve();
view = render();
assert.equal(textContent(view).includes("Couldn’t confirm the updated schedule. Try again."), true);
assert.equal(state.toasts.at(-1).kind, "danger");

state.failPatch = false;
state.query = settingsQuery({ data: settingsData({ quietHours: { status: "loaded", managedByParent: true, schedule: quietSchedule } }) });
resetHooks();
view = render();
walk(view).find((node) => node.type === "button" && textContent(node).includes("Quiet hours")).props.onClick();
view = render();
assert.equal(textContent(view).includes("This setting is managed by your parent"), true);
assert.equal(button(view, "Save").props.disabled, true);
assert.equal(walk(view).find((node) => node.props?.role === "switch").props.disabled, true);

state.query = settingsQuery({ data: settingsData() });
resetHooks();
view = render();
walk(view).find((node) => node.type === "button" && textContent(node).includes("Study hours")).props.onClick();
view = render();
walk(view).find((node) => node.props?.role === "switch").props.onClick();
view = render();
assert.equal(walk(view).filter((node) => node.type === "fieldset").length, 1);
button(view, "Add a new block").props.onClick();
view = render();
assert.equal(walk(view).filter((node) => node.type === "fieldset").length, 2);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " safety settings assertions passed");
