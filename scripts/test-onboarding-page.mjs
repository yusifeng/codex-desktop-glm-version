import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(ROOT, "src/renderer/onboarding-page/index.ts"), "utf8");
const signals = { entrypoint: {}, toast: {} };
const state = { completed: [], failComplete: false, importFinishes: 0, initialized: 0, navigations: [], page: { gate: "open", importStatus: "unavailable", firstName: "Avery" }, retries: 0, importRetries: 0, scopeSets: [], settingWrites: [], toasts: [] };
let pendingWrite = null;
let resolveWrite = null;
let hookCursor = 0;
let hookValues = [];
function resetHooks() { hookCursor = 0; hookValues = []; }
const React = { useState(initialValue) { const index = hookCursor++; if (!(index in hookValues)) hookValues[index] = typeof initialValue === "function" ? initialValue() : initialValue; return [hookValues[index], (next) => { hookValues[index] = typeof next === "function" ? next(hookValues[index]) : next; }]; } };
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
const toastManager = { danger(message) { state.toasts.push(message); } };
const scope = { get(signal) { return signal === signals.toast ? toastManager : undefined; }, set(signal, value) { state.scopeSets.push({ signal, value }); } };
globalThis.__onboardingPage = { React, jsx, scope, signals, state };

const init = "const runtime=globalThis.__onboardingPage;const initialize=()=>{runtime.state.initialized+=1};export const n=initialize;export const t=initialize;export const a=initialize;export const i=initialize;export const r=initialize;export const o=initialize;export const A=initialize;export const B=initialize;export const G=initialize;export const M=initialize;export const N=initialize;";
const icon = "export const t=props=>({type:'icon',props});";
const initializedIcon = "const runtime=globalThis.__onboardingPage;export const n=()=>{runtime.state.initialized+=1};export const t=props=>({type:'icon',props});";
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": ["const r=globalThis.__onboardingPage;", "export const $3=()=>{r.state.initialized+=1};export const I3=()=>r.jsx;export const e6=()=>r.React;", "export const ZI='application-scope';export const pk=r.signals.toast;export const LX=()=>r.scope;"].join("\n"),
  "app-initial": ["const r=globalThis.__onboardingPage;", "export const Kcn=()=>r.state.page;export const e8t=()=>path=>r.state.navigations.push(path);", "export const Ucn=async(scope,setting,value)=>{r.state.settingWrites.push({scope,setting,value});if(r.state.failComplete)throw Error('complete failed');if(globalThis.__pendingOnboardingWrite)await globalThis.__pendingOnboardingWrite};"].join("\n"),
  "app-primary": "const r=globalThis.__onboardingPage;export const Ah=()=>{r.state.initialized+=1};",
  "onboarding-entrypoint": "const r=globalThis.__onboardingPage;export const n=r.signals.entrypoint;export const t=()=>{r.state.initialized+=1};",
  "computer-history-plugin-icon": initializedIcon,
  "building": initializedIcon,
  "document-search-icon": initializedIcon,
  "folder-light-icon": initializedIcon,
  "profile-lock": initializedIcon,
  "Icon": icon,
  "NewsPaper": icon,
};
for (const name of ["onboarding-mail-provider","app-connect-modal","country-codes","use-app-connect-flow","conversation-blocks","remote-hosted-pip-anchor-bridge","hooks-settings-route","first-app-connect-ambient-suggestions","computer-use-app-approval-request-card","permissions-mode-visibility","sidebar-onboarding-checklist-task-config","use-external-agent-import-setup-actions","category-plugins-query","use-imported-setup-opportunity","chronicle-service-queries","chronicle-permissions-dialog","rosalind-helix"]) mocks[name] = init;

const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer/onboarding-page/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "onboarding-page-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

function walk(value, output = []) { if (value == null || typeof value !== "object") return output; if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; } output.push(value); walk(value.props?.children, output); return output; }
function textContent(value) { if (value == null || typeof value === "boolean") return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(textContent).join(" " ); return textContent(value.props?.children); }
function render() { hookCursor = 0; return module.OnboardingPage(); }
function button(view, label) { return walk(view).find((node) => node.type === "button" && textContent(node) === label); }
function input(view, label) { return walk(view).find((node) => node.type === "input" && (node.props?.["aria-label"] === label || node.props?.value === label)); }
function advanceToSetup() { let view = render(); button(view, "Continue").props.onClick(); view = render(); input(view, "Finance").props.onChange(); view = render(); button(view, "Continue").props.onClick(); return render(); }
function advanceToComplete() { let view = advanceToSetup(); button(view, "Continue").props.onClick(); return render(); }

assert.deepEqual(Object.keys(module), ["OnboardingPage"]);
const expectedDependencies = ["rolldown-runtime","app-shared","app-initial","app-primary","onboarding-mail-provider","computer-history-plugin-icon","building","app-connect-modal","country-codes","use-app-connect-flow","document-search-icon","conversation-blocks","remote-hosted-pip-anchor-bridge","Icon","NewsPaper","hooks-settings-route","first-app-connect-ambient-suggestions","computer-use-app-approval-request-card","folder-light-icon","permissions-mode-visibility","sidebar-onboarding-checklist-task-config","use-external-agent-import-setup-actions","profile-lock","category-plugins-query","use-imported-setup-opportunity","onboarding-entrypoint","chronicle-service-queries","chronicle-permissions-dialog","rosalind-helix"];
assert.deepEqual([...source.matchAll(/import\s+\*\s+as\s+\w+\s+from\s+"@rchunk\/([^"]+)"/g)].map((match) => match[1]), expectedDependencies);
assert.equal(/\b(?:runtimeChunk|appSharedChunk|appInitialChunk|appPrimaryChunk|onboardingMailProviderChunk|computerHistoryIconChunk|buildingChunk|appConnectModalChunk|countryCodesChunk|useAppConnectFlowChunk|documentSearchIconChunk|conversationBlocksChunk|remotePipBridgeChunk|iconChunk|newsPaperChunk|hooksSettingsRouteChunk|firstAppConnectSuggestionsChunk|computerUseApprovalCardChunk|folderLightIconChunk|permissionsVisibilityChunk|onboardingChecklistChunk|externalImportActionsChunk|profileLockChunk|categoryPluginsChunk|importedSetupOpportunityChunk|onboardingEntrypointChunk|chronicleQueriesChunk|chroniclePermissionsChunk|rosalindHelixChunk)\s*\./.test(source), false);
assert.equal(/\bany\b/.test(source), false);
assert.equal(state.initialized, 30);

state.page = { isLoading: true }; resetHooks(); let view = render();
assert.equal(textContent(view).includes("Loading onboarding…"), true);
state.page = { isError: true, retry: () => { state.retries += 1; } }; resetHooks(); view = render();
assert.equal(textContent(view).includes("Onboarding could not be loaded."), true); button(view, "Retry").props.onClick(); assert.equal(state.retries, 1);
state.page = { gate: "complete" }; resetHooks(); assert.equal(render(), null);
state.page = { gate: "locked" }; resetHooks(); view = render(); assert.equal(textContent(view).includes("Onboarding is unavailable for this profile"), true);
state.page = { gate: "unsupported" }; resetHooks(); view = render(); assert.equal(textContent(view).includes("Onboarding is unavailable on this device."), true);

state.page = { gate: "open", firstName: "Avery" }; resetHooks(); view = render();
assert.equal(textContent(view).includes("Hey, Avery!"), true);
assert.equal(textContent(view).includes("a few quick questions"), true);
button(view, "Continue").props.onClick(); view = render();
assert.equal(textContent(view).includes("Which best describes your work?"), true);
assert.equal(button(view, "Continue").props.disabled, true);
assert.equal(textContent(view).includes("People and HR"), true);
button(view, "Back").props.onClick(); view = render(); assert.equal(textContent(view).includes("Hey, Avery!"), true);
button(view, "Continue").props.onClick(); view = render(); input(view, "Finance").props.onChange(); view = render();
assert.equal(button(view, "Continue").props.disabled, false); button(view, "Continue").props.onClick(); view = render();
assert.equal(textContent(view).includes("Suggest personalized tasks"), true);
button(view, "Back").props.onClick(); view = render(); assert.equal(textContent(view).includes("Which best describes your work?"), true);

state.page = { gate: "open", importStatus: "loading" }; resetHooks(); view = advanceToSetup();
assert.equal(textContent(view).includes("Checking for setup to import…"), true); assert.equal(button(view, "Continue").props.disabled, true);
state.page = { gate: "open", importStatus: "error", retryImport: () => { state.importRetries += 1; } }; resetHooks(); view = advanceToSetup();
assert.equal(textContent(view).includes("Couldn't load imported setup."), true); button(view, "Retry").props.onClick(); assert.equal(state.importRetries, 1);
state.page = { gate: "open", importStatus: "available", finishImport: () => { state.importFinishes += 1; } }; resetHooks(); view = advanceToSetup();
assert.equal(input(view, "Import setup from another assistant").props.checked, false); input(view, "Import setup from another assistant").props.onChange({ currentTarget: { checked: true } }); view = render();
assert.equal(input(view, "Import setup from another assistant").props.checked, true);
input(view, "Suggest personalized tasks").props.onChange({ currentTarget: { checked: false } }); view = render(); assert.equal(input(view, "Suggest personalized tasks").props.checked, false);
button(view, "Continue").props.onClick(); view = render(); assert.equal(textContent(view).includes("You're all set"), true);
button(view, "Back").props.onClick(); view = render(); assert.equal(textContent(view).includes("Suggest personalized tasks"), true);
button(view, "Continue").props.onClick(); view = render(); await button(view, "Get Started").props.onClick();
assert.equal(state.importFinishes, 1); assert.equal(state.settingWrites.length, 1); assert.equal(state.settingWrites[0].value.role, "Finance"); assert.equal(state.settingWrites[0].value.personalizedSuggestionsEnabled, false); assert.equal(state.settingWrites[0].value.setupImported, true);
assert.deepEqual(state.scopeSets.at(-1), { signal: signals.entrypoint, value: undefined }); assert.equal(state.navigations.at(-1), "/");

state.page = { gate: "open", importStatus: "unavailable" }; state.failComplete = true; resetHooks(); view = advanceToComplete(); await button(view, "Get Started").props.onClick(); view = render();
assert.equal(textContent(view).includes("Couldn't finish setup — try again"), true); assert.equal(state.toasts.at(-1), "Couldn't finish setup — try again"); assert.equal(button(view, "Get Started").props.disabled, false);
state.failComplete = false; resetHooks(); view = advanceToComplete();
pendingWrite = new Promise((resolve) => { resolveWrite = resolve; }); globalThis.__pendingOnboardingWrite = pendingWrite; const completion = button(view, "Get Started").props.onClick(); view = render(); assert.equal(button(view, "Get Started").props.disabled, true); resolveWrite(); await completion; delete globalThis.__pendingOnboardingWrite;

state.page = { gate: "open", shouldShowRosalindWelcome: true }; resetHooks(); view = render(); assert.equal(textContent(view).includes("Welcome to ChatGPT for Life Sciences"), true);
state.page = { gate: "open", shouldShowFinanceWelcome: true }; resetHooks(); view = render(); assert.equal(textContent(view).includes("Welcome to ChatGPT for Finance"), true);

console.log("onboarding-page tests passed (42 assertions)");
