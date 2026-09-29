import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/scheduled-tasks-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const state = [];
let stateIndex = 0;
let effects = [];
const React = {
  Fragment: "Fragment",
  lazy(loader) { return (props) => ({ type: "lazy", props: { ...props, loader } }); },
  useEffect(effect) { effects.push(effect); },
  useMemo(factory) { return factory(); },
  useState(initial) {
    const index = stateIndex++;
    if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial;
    return [state[index], (next) => { state[index] = typeof next === "function" ? next(state[index]) : next; }];
  },
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
globalThis.__scheduledTasks = { React, jsx };

const mocks = {
  "app-shared": "const r=globalThis.__scheduledTasks;export const I3=()=>r.jsx;export const e6=Object.assign(()=>r.React,r.React);",
  "scheduled-shared-task-dialog-entry": "export const ScheduledSharedTaskDialog=props=>({type:'shared-dialog',props});",
  "scheduled-task-share-dialog": "export const ScheduledTaskShareDialog=props=>({type:'share-dialog',props});",
  "automations-page": "export const AutomationsLayoutPage=props=>({type:'automations-layout',props});",
};
const result = await esbuild.build({
  entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "scheduled-tasks-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
  } }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

let assertions = 0;
function equal(actual, expected) { assertions++; assert.equal(actual, expected); }
function deepEqual(actual, expected) { assertions++; assert.deepEqual(actual, expected); }
function ok(value) { assertions++; assert.ok(value); }
function reset() { state.length = 0; stateIndex = 0; effects = []; }
function render(props = {}) { stateIndex = 0; effects = []; return module.ScheduledTasksPage(props); }
function walk(value, output = []) { if (value == null || typeof value !== "object") return output; if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; } output.push(value); walk(value.props?.children, output); return output; }
function text(value) { if (value == null || typeof value === "boolean") return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(text).join(" " ); return text(value.props?.children); }
function find(view, type, label) { return walk(view).find((node) => node.type === type && (label == null || text(node) === label)); }
function buttons(view, label) { return walk(view).filter((node) => node.type === "button" && text(node) === label); }
async function flush() { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); }
async function runEffects() { const pending = effects; effects = []; for (const effect of pending) effect(); await flush(); }

deepEqual(Object.keys(module), ["ScheduledTasksPage"]);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
deepEqual([...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), [
  "rolldown-runtime", "app-shared", "app-initial", "app-primary", "automation-editor-dialog", "chatgpt-tasks-runtime", "schedule-fields", "conversation-summary", "home-composer-mode-toggle-core", "use-chatgpt-composer-controller", "automations-page",
]);
deepEqual([...source.matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map((match) => match[1]), ["scheduled-shared-task-dialog-entry", "scheduled-task-share-dialog"]);
equal(source.includes("/suggested_automations"), true);
equal(source.includes("X-OpenAI-Task-Suggestions-Surface"), true);

const active = { id: "a1", title: "Morning brief", status: "active", prompt: "Summarize news", canManage: true, isWork: true, unread: true };
const paused = { id: "p1", title: "Weekly report", status: "paused", schedule: "Mondays", canManage: true };
const completed = { id: "c1", title: "One-time reminder", status: "completed", canManage: true };
const readOnly = { id: "r1", title: "Shared monitor", status: "active", canManage: false };
let navigated = [];
let paramsUpdates = [];
let enabled = [];
let selectedSuggestions = [];
let dismissed = [];
const service = {
  loadTasks: async () => ({ items: [active, paused, completed, readOnly], nextCursor: "next" }),
  loadDetail: async (id) => [active, paused, completed].find((task) => task.id === id) ?? readOnly,
  setEnabled: async (id, value) => { enabled.push([id, value]); },
  runNow: async (task) => { navigated.push(`run:${task.id}`); },
  selectSuggestion: async (suggestion) => { selectedSuggestions.push(suggestion.id); },
  dismissSuggestion: (suggestion) => { dismissed.push(suggestion.id); },
};

reset();
equal(render({ accountId: null }), null);

reset();
let view = render({ initialTasks: [active, paused, completed, readOnly], initialSuggestions: [{ id: "s1", title: "Track prices", prompt: "Watch fares" }], onNavigate: (value) => navigated.push(value), onSearchParamsChange: (value, replace) => paramsUpdates.push([value.toString(), replace]), service });
equal(text(view).includes("Scheduled"), true);
equal(text(view).includes("Ask ChatGPT to schedule tasks"), true);
ok(find(view, "textarea"));
ok(find(view, "select"));
equal(text(view).includes("Morning brief · Work · unread result"), true);
equal(text(view).includes("Shared monitor"), true);
equal(text(view).includes("Weekly report"), false);
ok(find(view, "button", "Pause Morning brief"));
equal(find(view, "button", "Pause Shared monitor"), undefined);
equal(find(view, "button", "Edit Shared monitor"), undefined);
ok(find(view, "button", "Suggested tasks"));
ok(find(view, "button", "Try it"));
ok(find(view, "button", "Dismiss"));

find(view, "button", "Pause Morning brief").props.onClick();
await flush();
deepEqual(enabled, [["a1", false]]);

find(view, "button", "Morning brief · Work · unread result").props.onClick();
await flush();
equal(paramsUpdates.at(-1)[0].includes("automationId=a1"), true);
equal(paramsUpdates.at(-1)[0].includes("automationSource=cloud"), true);
view = render({ initialTasks: [active], searchParams: "automationId=a1&automationSource=cloud", onSearchParamsChange: (value, replace) => paramsUpdates.push([value.toString(), replace]), service });
await runEffects();
view = render({ initialTasks: [active], searchParams: "automationId=a1&automationSource=cloud", onSearchParamsChange: (value, replace) => paramsUpdates.push([value.toString(), replace]), service });
ok(walk(view).find((node) => node.props?.["data-task-detail"] === "a1"));
equal(text(view).includes("Morning brief"), true);
ok(find(view, "button", "Edit"));
ok(find(view, "button", "Run now"));
ok(find(view, "button", "Share"));
find(view, "button", "Run now").props.onClick();
await flush();
equal(navigated.includes("run:a1"), true);
find(view, "button", "Close task details").props.onClick();
equal(paramsUpdates.at(-1)[0], "");
equal(paramsUpdates.at(-1)[1], true);

reset();
view = render({ initialTasks: [active], searchParams: "automationId=a1&edit=true", service });
equal(walk(view).some((node) => node.type === "dialog"), true);

reset();
view = render({ initialTasks: [completed], searchParams: "automationId=c1", service });
await runEffects();
view = render({ initialTasks: [completed], searchParams: "automationId=c1", service });
equal(find(view, "button", "Run now"), undefined);
equal(find(view, "button", "Share"), undefined);

reset();
view = render({ initialTasks: [], service });
equal(text(view).includes("No tasks"), true);

reset();
view = render({ service });
await runEffects();
view = render({ service });
equal(text(view).includes("Morning brief"), true);
ok(find(view, "button", "Load more"));

reset();
const failing = { ...service, loadTasks: async () => { throw Error("offline"); } };
view = render({ service: failing });
await runEffects();
view = render({ service: failing });
equal(text(view).includes("Couldn’t load scheduled tasks"), true);
ok(find(view, "button", "Retry"));

reset();
const detailFailing = { ...service, loadDetail: async () => { throw Error("gone"); } };
view = render({ initialTasks: [active], searchParams: "automationId=a1", service: detailFailing });
await runEffects();
view = render({ initialTasks: [active], searchParams: "automationId=a1", service: detailFailing });
equal(text(view).includes("Couldn’t load this task"), true);
ok(find(view, "button", "Retry"));

reset();
view = render({ initialTasks: [active], initialSuggestions: [{ id: "s1", title: "Track prices", prompt: "Watch fares" }], onNavigate: (value) => navigated.push(value), service });
find(view, "button", "Try it").props.onClick();
await flush();
deepEqual(selectedSuggestions, ["s1"]);
equal(navigated.at(-1), "/c/new?scheduledSuggestion=s1");
find(view, "button", "Dismiss").props.onClick();
deepEqual(dismissed, ["s1"]);
view = render({ initialTasks: [active], initialSuggestions: [{ id: "s1", title: "Track prices", prompt: "Watch fares" }], service });
equal(text(view).includes("Track prices"), false);

reset();
view = render({ initialTasks: [active], searchParams: "shared_task=post-1", service });
const shared = find(view, "lazy");
ok(shared);
equal(shared.props.postId, "post-1");

reset();
view = render({ initialTasks: [active], showWorkMode: false, service });
equal(find(view, "button", "Work mode"), undefined);
equal(text(view).includes(" · Work"), false);

equal(buttons(view, "Close task details").length, 0);
console.log(`scheduled-tasks-page tests passed (${assertions} assertions)`);
