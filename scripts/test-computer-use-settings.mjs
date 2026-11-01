import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(ROOT, "src/renderer/computer-use-settings/index.ts"), "utf8");
const signals = { appApprovals: {}, availability: {}, locked: {}, read: {}, send: {}, sound: {}, toast: {} };
const state = {
  appApprovalsQuery: null,
  appUpdates: [],
  appUpdating: false,
  availability: { available: false, isLoading: true },
  failAppWrite: false,
  failRemoveApp: false,
  failRemoveRead: false,
  failRemoveSend: false,
  failSaveRead: false,
  failSaveSend: false,
  failSound: false,
  failLocked: false,
  initialized: 0,
  lockedQuery: null,
  navigations: [],
  originPermissions: [],
  pathname: "/settings/computer-use",
  readQuery: null,
  refetches: { apps: 0, read: 0, send: 0 },
  removedApps: [],
  removedRead: [],
  removedSend: [],
  searchCalls: [],
  searchMode: "success",
  sendQuery: null,
  settingWrites: [],
  soundQuery: null,
  toasts: [],
  updatingAppId: null,
};
function query(overrides = {}) { return { data: undefined, isError: false, isLoading: false, refetch: async () => undefined, ...overrides }; }
function available(overrides = {}) { return { available: true, isLoading: false, apps: [{ id: "computer-use", name: "Any App", isEnabled: true }, { id: "chrome", name: "Google Chrome", isEnabled: true }, { id: "messages", name: "Messages", isEnabled: true }, { id: "connector_openai_codex_document_control", name: "Microsoft Excel", isEnabled: false }], browserStatus: { isInstalled: true, isLoading: false }, ...overrides }; }
function approvals() { return { approvedApps: [{ bundleIdentifier: "com.apple.TextEdit", displayName: "TextEdit" }, { bundleIdentifier: "com.apple.Preview", displayName: "Preview" }] }; }
function reads() { return { readAccessPolicy: "askPerChat", chats: [{ chatGUID: "chat-1", displayName: "Family", decision: "alwaysAllow" }] }; }
function sends() { return { allowAllChats: false, approvedChats: [{ chatGUID: "chat-2", displayName: "Team" }] }; }
state.appApprovalsQuery = query({ data: approvals(), refetch: async () => { state.refetches.apps += 1; } });
state.readQuery = query({ data: reads(), refetch: async () => { state.refetches.read += 1; } });
state.sendQuery = query({ data: sends(), refetch: async () => { state.refetches.send += 1; } });
state.soundQuery = query({ data: "foregroundClicks" });
state.lockedQuery = query({ data: { enabled: false } });

let hookCursor = 0;
let hookValues = [];
function resetHooks() { hookCursor = 0; hookValues = []; }
const React = { useState(initialValue) { const index = hookCursor++; if (!(index in hookValues)) hookValues[index] = typeof initialValue === "function" ? initialValue() : initialValue; return [hookValues[index], (next) => { hookValues[index] = typeof next === "function" ? next(hookValues[index]) : next; }]; } };
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
const toastManager = { danger(message, options) { state.toasts.push({ kind: "danger", message, options }); }, success(message) { state.toasts.push({ kind: "success", message }); } };
const scope = { get(signal) { return signal === signals.toast ? toastManager : undefined; } };
globalThis.__computerUseSettings = { React, jsx, scope, signals, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__computerUseSettings;",
    "export const $3=()=>{r.state.initialized+=1};export const I3=()=>r.jsx;export const e6=()=>r.React;",
    "export const ZI='scope';export const pk=r.signals.toast;export const LX=()=>r.scope;",
    "export const BX=signal=>signal===r.signals.availability?r.state.availability:undefined;",
    "export const HX=signal=>signal===r.signals.appApprovals?r.state.appApprovalsQuery:signal===r.signals.read?r.state.readQuery:signal===r.signals.send?r.state.sendQuery:signal===r.signals.sound?r.state.soundQuery:r.state.lockedQuery;",
  ].join("\n"),
  "app-initial": [
    "const r=globalThis.__computerUseSettings;const s=r.state;",
    "export const Xl=()=>{s.initialized+=1};export const su=()=>{s.initialized+=1};",
    "export const Gv=()=>({selectedHostId:'local'});export const E6t=()=>({platform:'macOS'});",
    "export const e8t=()=>path=>{s.navigations.push(path);s.pathname=path};export const i_n=()=>({pathname:s.pathname});",
    "export const Kcn=key=>key==='computer-use-origin-permission'?'allow':undefined;",
    "export const Ucn=async(scope,setting,value)=>{s.settingWrites.push({scope,setting,value});if(s.failAppWrite)throw Error('write failed')};",
  ].join("\n"),
  "app-primary": [
    "const r=globalThis.__computerUseSettings;export const ac=()=>{r.state.initialized+=1};",
    "const component=type=>props=>({type,props});export const ic={Root:component('search-root'),List:component('search-list'),Item:component('search-item'),Action:component('search-action')};",
  ].join("\n"),
  "toolbar-breadcrumb": "const r=globalThis.__computerUseSettings;export const n=()=>{r.state.initialized+=1};export const t=props=>({type:'breadcrumb',props});",
  "apps-availability": [
    "const r=globalThis.__computerUseSettings;export const t=()=>{r.state.initialized+=1};",
    "export const n=options=>({get isUpdating(){return r.state.appUpdating},get updatingAppId(){return r.state.updatingAppId},async setAppEnabled(update){r.state.appUpdates.push(update);const previous=options.readApps?.();r.state.appUpdating=true;r.state.updatingAppId=update.appId;options.writeOptimistic?.(previous.map(app=>app.id===update.appId?{...app,isEnabled:update.enabled}:app));try{await options.writeConfig?.({edits:[{keyPath:`apps.${update.appId}.enabled`,mergeStrategy:'upsert',value:update.enabled}],hostId:options.hostId});options.notify?.('success',`${update.appName} app ${update.enabled?'enabled':'disabled'}`)}catch(error){options.writeOptimistic?.(previous);options.notify?.('danger','Failed to update app');throw error}finally{r.state.appUpdating=false;r.state.updatingAppId=null}}});",
  ].join("\n"),
  "computer-use-app-approvals-query": [
    "const runtime=globalThis.__computerUseSettings;const runtimeState=runtime.state;",
    "export const _=()=>{runtimeState.initialized+=1};export const r=()=>{runtimeState.initialized+=1};",
    "export const g=globalThis.__computerUseSettings.signals.availability;export const t=globalThis.__computerUseSettings.signals.appApprovals;export const a=globalThis.__computerUseSettings.signals.read;export const o=globalThis.__computerUseSettings.signals.send;export const n=globalThis.__computerUseSettings.signals.sound;export const i=globalThis.__computerUseSettings.signals.locked;",
    "export const s=async id=>{runtimeState.removedApps.push(id);if(runtimeState.failRemoveApp)throw Error('remove app failed');return {approvedApps:[]}};",
    "export const c=async id=>{runtimeState.removedRead.push(id);if(runtimeState.failRemoveRead)throw Error('remove read failed');return {chats:[],readAccessPolicy:'askPerChat'}};",
    "export const l=async id=>{runtimeState.removedSend.push(id);if(runtimeState.failRemoveSend)throw Error('remove send failed');return {allowAllChats:false,approvedChats:[]}};",
    "export const f=async policy=>{runtimeState.savedReadPolicy=policy;if(runtimeState.failSaveRead)throw Error('read failed');return {chats:[],readAccessPolicy:policy}};",
    "export const p=async(id,decision,metadata)=>{runtimeState.savedReadDecision={id,decision,metadata};if(runtimeState.failSaveRead)throw Error('read failed');return {chats:[],readAccessPolicy:'askPerChat'}};",
    "export const m=async enabled=>{runtimeState.savedSend=enabled;if(runtimeState.failSaveSend)throw Error('send failed');return {allowAllChats:enabled,approvedChats:[]}};",
    "export const h=async mode=>{runtimeState.savedSound=mode;if(runtimeState.failSound)throw Error('sound failed');return mode};",
    "export const d=async enabled=>{runtimeState.savedLocked=enabled;if(runtimeState.failLocked)throw Error('locked failed');return enabled};",
    "export const u=async query=>{runtimeState.searchCalls.push(query);if(runtimeState.searchMode==='error')throw Error('search failed');if(runtimeState.searchMode==='permissions')return {status:'permissions_required'};return {status:'ok',chats:[{chatGUID:'chat-search',displayName:'Project Alpha'}]}};",
  ].join("\n"),
  "use-home-directory": "const r=globalThis.__computerUseSettings;export const t=()=>{r.state.initialized+=1};export const n=()=>'/Users/test';",
  "settings-loading-row": "const r=globalThis.__computerUseSettings;export const n=()=>{r.state.initialized+=1};export const t=props=>({type:'loading-row',props});",
  "browser-extension-connection-status-description": "const r=globalThis.__computerUseSettings;export const n=()=>{r.state.initialized+=1};export const t=({status})=>({type:'browser-status',props:{children:status.isLoading?'Use the browser extension for additional control':status.isInstalled?'Browser extension installed':'Browser extension not installed'}});",
  "settings-plugin-selection": [
    "const runtime=globalThis.__computerUseSettings;export const i=()=>{runtime.state.initialized+=1};export const o=()=>{runtime.state.initialized+=1};export const t=()=>{runtime.state.initialized+=1};",
    "export const n=()=>null;export const a=props=>({type:'browser-settings-section',props});export const r=props=>({type:'plugin-controls',props});",
  ].join("\n"),
};

const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer/computer-use-settings/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "computer-use-settings-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

function walk(value, result = []) { if (value == null || typeof value !== "object") return result; if (Array.isArray(value)) { for (const item of value) walk(item, result); return result; } result.push(value); walk(value.props?.children, result); return result; }
function textContent(value) { if (value == null || typeof value === "boolean") return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(textContent).join(" "); return textContent(value.props?.children); }
function render() { hookCursor = 0; return module.ComputerUseSettings(); }
function button(view, label) { return walk(view).find((node) => node.type === "button" && textContent(node) === label); }
function input(view, label) { return walk(view).find((node) => node.type === "input" && node.props?.["aria-label"] === label); }
function select(view, label) { return walk(view).find((node) => node.type === "select" && node.props?.["aria-label"] === label); }

assert.deepEqual(Object.keys(module), ["ComputerUseSettings"]);
assert.equal(state.initialized, 14);
assert.deepEqual([...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["rolldown-runtime", "app-shared", "app-initial", "app-primary", "toolbar-breadcrumb", "apps-availability", "computer-use-app-approvals-query", "use-home-directory", "settings-loading-row", "browser-extension-connection-status-description", "settings-plugin-selection"]);
assert.equal(/\b(?:appSharedChunk|appInitialChunk|appPrimaryChunk|toolbarBreadcrumbChunk|appsAvailabilityChunk|computerUseApprovalsChunk|useHomeDirectoryChunk|settingsLoadingRowChunk|browserStatusChunk|settingsPluginSelectionChunk)\s*\./.test(source), false);
assert.equal(/\bany\b/.test(source), false);

let view = render();
assert.equal(textContent(view).includes("Loading Computer Use settings…"), true);
assert.equal(textContent(view).includes("Always-allowed apps"), false);

state.availability = { available: false, isLoading: false, errorMessage: "Unable to load Computer Use settings", retry: () => { state.availabilityRetries = (state.availabilityRetries ?? 0) + 1; } };
resetHooks();
view = render();
assert.equal(textContent(view).includes("Unable to load Computer Use settings"), true);
button(view, "Retry").props.onClick();
assert.equal(state.availabilityRetries, 1);

state.availability = { available: false, isLoading: false };
resetHooks();
view = render();
assert.equal(textContent(view).includes("Computer Use is unavailable for this host"), true);

state.availability = available();
resetHooks();
view = render();
assert.equal(textContent(view).includes("Manage how ChatGPT uses other applications on your computer"), true);
assert.equal(textContent(view).includes("Browser extension installed"), true);
assert.equal(walk(view).some((node) => node.type === "browser-settings-section"), true);
assert.equal(state.originPermissions.length, 0);
assert.equal(walk(view).find((node) => node.props?.["data-home-directory"] === "/Users/test") != null, true);

await input(view, "Toggle Google Chrome").props.onChange({ currentTarget: { checked: false } });
assert.deepEqual(state.appUpdates.at(-1), { appId: "chrome", appName: "Google Chrome", enabled: false });
assert.deepEqual(state.settingWrites.at(-1), { scope, setting: { key: "apps.chrome.enabled" }, value: false });
assert.deepEqual(state.toasts.at(-1), { kind: "success", message: "Google Chrome app disabled" });

resetHooks();
state.failAppWrite = true;
view = render();
await input(view, "Toggle Microsoft Excel").props.onChange({ currentTarget: { checked: true } });
assert.deepEqual(state.toasts.at(-1), { kind: "danger", message: "Failed to update app", options: undefined });
state.failAppWrite = false;
state.appUpdating = true;
state.updatingAppId = "chrome";
resetHooks();
view = render();
assert.equal(input(view, "Toggle Google Chrome").props.disabled, true);
state.appUpdating = false;
state.updatingAppId = null;

button(view, "Manage").props.onClick();
assert.equal(state.navigations.at(-1), "/settings/computer-use/messages");
state.pathname = "/settings/computer-use";

state.appApprovalsQuery = query({ isLoading: true, refetch: async () => { state.refetches.apps += 1; } });
resetHooks();
view = render();
assert.equal(textContent(view).includes("Loading allowed apps…"), true);
state.appApprovalsQuery = query({ isError: true, refetch: async () => { state.refetches.apps += 1; } });
resetHooks();
view = render();
assert.equal(textContent(view).includes("Unable to load allowed apps."), true);
button(view, "Retry").props.onClick();
await Promise.resolve();
assert.equal(state.refetches.apps, 1);

state.appApprovalsQuery = query({ data: approvals(), refetch: async () => { state.refetches.apps += 1; } });
resetHooks();
view = render();
input(view, "Search allowed apps").props.onChange({ currentTarget: { value: "preview" } });
view = render();
assert.equal(textContent(view).includes("Preview"), true);
assert.equal(textContent(view).includes("TextEdit"), false);
await walk(view).find((node) => node.props?.["aria-label"] === "Remove Preview").props.onClick();
assert.equal(state.removedApps.at(-1), "com.apple.Preview");
assert.deepEqual(state.toasts.at(-1), { kind: "success", message: "Allowed app removed" });
view = render();
assert.equal(textContent(view).includes("No allowed apps match your search"), true);

resetHooks();
state.failRemoveApp = true;
view = render();
await walk(view).find((node) => node.props?.["aria-label"] === "Remove TextEdit").props.onClick();
assert.equal(state.toasts.at(-1).kind, "danger");
state.failRemoveApp = false;

resetHooks();
view = render();
await select(view, "Click sounds").props.onChange({ currentTarget: { value: "off" } });
assert.equal(state.savedSound, "off");
assert.deepEqual(state.toasts.at(-1), { kind: "success", message: "Click sounds saved" });
await input(view, "Enable Locked use").props.onChange({ currentTarget: { checked: true } });
assert.equal(state.savedLocked, true);
assert.deepEqual(state.toasts.at(-1), { kind: "success", message: "Locked use enabled" });

state.pathname = "/settings/computer-use/messages";
state.readQuery = query({ isLoading: true, refetch: async () => { state.refetches.read += 1; } });
state.sendQuery = query({ isLoading: true, refetch: async () => { state.refetches.send += 1; } });
resetHooks();
view = render();
assert.equal(textContent(view).includes("Loading Messages settings…"), true);
assert.equal(walk(view).some((node) => node.type === "breadcrumb"), true);

state.readQuery = query({ isError: true, refetch: async () => { state.refetches.read += 1; } });
state.sendQuery = query({ isError: true, refetch: async () => { state.refetches.send += 1; } });
resetHooks();
view = render();
assert.equal(textContent(view).includes("Unable to load read permissions"), true);
assert.equal(textContent(view).includes("Unable to load allowed chats"), true);
const retryButtons = walk(view).filter((node) => node.type === "button" && textContent(node) === "Retry");
retryButtons[0].props.onClick();
retryButtons[1].props.onClick();
await Promise.resolve();
assert.equal(state.refetches.read, 1);
assert.equal(state.refetches.send, 1);

state.readQuery = query({ data: reads(), refetch: async () => { state.refetches.read += 1; } });
state.sendQuery = query({ data: sends(), refetch: async () => { state.refetches.send += 1; } });
resetHooks();
view = render();
assert.equal(textContent(view).includes("Read access"), true);
assert.equal(textContent(view).includes("Send access"), true);
assert.equal(button(view, "Search").props.disabled, true);
input(view, "Search chats").props.onChange({ currentTarget: { value: "project" } });
view = render();
await button(view, "Search").props.onClick();
view = render();
assert.equal(textContent(view).includes("Project Alpha"), true);
assert.deepEqual(state.searchCalls, ["project"]);
await walk(view).find((node) => node.type === "search-action" && textContent(node) === "Add").props.onClick();
assert.deepEqual(state.savedReadDecision, { id: "chat-search", decision: "alwaysAllow", metadata: "Project Alpha" });

resetHooks();
view = render();
await select(view, "Reading behavior").props.onChange({ currentTarget: { value: "allowUnconfiguredChats" } });
assert.equal(state.savedReadPolicy, "allowUnconfiguredChats");
await input(view, "Always allow sending to all chats").props.onChange({ currentTarget: { checked: true } });
assert.equal(state.savedSend, true);

resetHooks();
view = render();
await walk(view).find((node) => node.props?.["aria-label"] === "Remove read permission for Family").props.onClick();
assert.equal(state.removedRead.at(-1), "chat-1");
view = render();
assert.equal(textContent(view).includes("Family"), false);

resetHooks();
view = render();
await walk(view).find((node) => node.props?.["aria-label"] === "Remove Team").props.onClick();
assert.equal(state.removedSend.at(-1), "chat-2");

resetHooks();
state.searchMode = "permissions";
view = render();
input(view, "Search chats").props.onChange({ currentTarget: { value: "blocked" } });
view = render();
await button(view, "Search").props.onClick();
view = render();
assert.equal(textContent(view).includes("Allow Messages permissions to search chats"), true);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " computer use settings assertions passed");
