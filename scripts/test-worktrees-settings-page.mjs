import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(ROOT, "src/renderer/worktrees-settings-page/index.ts"), "utf8");
const configSignal = { name: "worktree-config" };
const toastSignal = { name: "toasts" };
const state = {
  commands: [],
  config: { autoCleanupEnabled: true, keepCount: 7, worktreesRoot: "/tmp/codex-worktrees" },
  failCommand: false,
  hostId: "local",
  initialized: 0,
  newChats: [],
  openedConversations: [],
  query: null,
  refetches: 0,
  toasts: [],
};
function query(overrides = {}) {
  return {
    data: undefined,
    error: null,
    isFetching: false,
    isLoading: false,
    refetch: async () => { state.refetches += 1; },
    ...overrides,
  };
}
state.query = query({ isLoading: true });

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
const toastManager = {
  danger(message, options) { state.toasts.push({ kind: "danger", message, options }); },
  success(message) { state.toasts.push({ kind: "success", message }); },
};
const scope = { get(signal) { return signal === toastSignal ? toastManager : undefined; } };
globalThis.__worktreesSettingsPage = { React, configSignal, jsx, scope, state, toastSignal };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const runtime=globalThis.__worktreesSettingsPage;",
    "export const $3=()=>{runtime.state.initialized+=1};export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;",
    "export const ZI='app-scope';export const pk=runtime.toastSignal;export const LX=()=>runtime.scope;",
    "export const BX=signal=>signal===runtime.configSignal?runtime.state.config:null;",
    "export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});",
  ].join("\n"),
  "app-initial": [
    "const runtime=globalThis.__worktreesSettingsPage;const state=runtime.state;",
    "export const Xl=()=>{state.initialized+=1};export const su=()=>{state.initialized+=1};",
    "export const Gv=()=>({selectedHostId:state.hostId});export const Vfn=hostId=>({hostId,kind:'local'});",
    "export const F$=()=>((conversationId,hostId)=>state.openedConversations.push({conversationId,hostId}));",
    "export const Gp=(_scope,options)=>state.newChats.push(options);",
    "export const Qln=(command,request)=>{state.commands.push({command,request});state.lastCommandPromise=Promise.resolve().then(()=>{if(state.failCommand)throw Error('delete failed');return {ok:true};});return state.lastCommandPromise};",
  ].join("\n"),
  "use-codex-worktrees": [
    "const runtime=globalThis.__worktreesSettingsPage;",
    "export const a=runtime.configSignal;export const n=()=>runtime.state.query;",
    "export const r=()=>{runtime.state.initialized+=1};export const t=()=>{runtime.state.initialized+=1};",
  ].join("\n"),
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/worktrees-settings-page/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "worktrees-settings-page-mocks",
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
function render() { hookCursor = 0; return module.WorktreesSettingsPage(); }
function button(view, label) { return walk(view).find((node) => node.type === "button" && textContent(node) === label); }
function row(view, directory) { return walk(view).find((node) => node.type === "article" && textContent(node).includes(directory)); }

assert.deepEqual(Object.keys(module), ["WorktreesSettingsPage"]);
assert.equal(state.initialized, 5);
assert.deepEqual(
  [...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^\"]+)"/g)].map((match) => match[1]),
  ["rolldown-runtime", "app-shared", "app-initial", "use-codex-worktrees"],
);
assert.equal(/\b(?:appSharedChunk|appInitialChunk|useCodexWorktreesChunk)\s*\./.test(source), false);
assert.equal(/\bany\b/.test(source), false);

let view = render();
assert.equal(walk(view).some((node) => node.props?.role === "status" && textContent(node).includes("Fetching worktree details")), true);
assert.equal(textContent(view).includes("/tmp/codex-worktrees"), true);
assert.equal(textContent(view).includes("Keep count 7"), true);

state.query = query({ error: Error("Git service unavailable") });
resetHooks();
view = render();
assert.equal(walk(view).some((node) => node.props?.role === "alert"), true);
assert.equal(textContent(view).includes("Git service unavailable"), true);
button(view, "Try again").props.onClick();
await Promise.resolve();
assert.equal(state.refetches, 1);

state.query = query({ data: { worktrees: [] } });
resetHooks();
view = render();
assert.equal(textContent(view).includes("No worktrees yet"), true);
assert.equal(textContent(view).includes("Worktrees created by ChatGPT will appear here"), true);

const worktrees = [
  { branch: "codex/ready", dir: "/repo/.codex/worktrees/ready", status: "ready", conversations: [{ id: "thread-1", title: "Ready task" }] },
  { branch: "codex/busy", dir: "/repo/.codex/worktrees/busy", isLocked: true, conversations: [] },
  { branch: "codex/broken", dir: "/repo/.codex/worktrees/broken", status: "failed", conversations: [{ id: "thread-2" }, { id: "thread-3" }] },
];
state.query = query({ data: { worktrees } });
resetHooks();
view = render();
assert.equal(textContent(view).includes("codex/ready"), true);
assert.equal(textContent(row(view, worktrees[0].dir)).includes("Ready"), true);
assert.equal(textContent(row(view, worktrees[1].dir)).includes("In use"), true);
assert.equal(textContent(row(view, worktrees[2].dir)).includes("Needs attention"), true);
assert.equal(textContent(row(view, worktrees[2].dir)).includes("2 linked conversations"), true);

button(row(view, worktrees[0].dir), "Open").props.onClick();
assert.deepEqual(state.openedConversations.at(-1), { conversationId: "thread-1", hostId: "local" });
button(row(view, worktrees[1].dir), "New chat").props.onClick();
assert.deepEqual(state.newChats.at(-1), { workspaceRoot: worktrees[1].dir });

button(row(view, worktrees[0].dir), "Clean up").props.onClick();
await state.lastCommandPromise;
await Promise.resolve();
assert.deepEqual(state.commands.at(-1), {
  command: "worktree-delete",
  request: { params: { hostId: "local", reason: "settings-delete-targeted", worktree: worktrees[0].dir } },
});
assert.equal(state.refetches, 2);
assert.deepEqual(state.toasts.at(-1), { kind: "success", message: "Worktree deleted" });

state.failCommand = true;
button(row(view, worktrees[2].dir), "Clean up").props.onClick();
await state.lastCommandPromise.catch(() => undefined);
await Promise.resolve();
assert.equal(state.toasts.at(-1).kind, "danger");
assert.equal(state.toasts.at(-1).message, "Failed to delete worktree");
assert.equal(state.toasts.at(-1).options.errorAnalytics.toastId, "settings.worktrees.delete.error");

button(view, "Refresh").props.onClick();
await Promise.resolve();
assert.equal(state.refetches, 3);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " worktrees settings page assertions passed");
