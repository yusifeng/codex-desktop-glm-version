import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hookState = { cursor: 0, values: [] };
globalThis.__automationEditorTest = {
  jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } },
  react: {
    useEffect() {},
    useRef(value) { const index = hookState.cursor++; hookState.values[index] ??= { current: value }; return hookState.values[index]; },
    useState(initial) { const index = hookState.cursor++; if (!(index in hookState.values)) hookState.values[index] = typeof initial === "function" ? initial() : initial; return [hookState.values[index], next => { hookState.values[index] = typeof next === "function" ? next(hookState.values[index]) : next; }]; },
  },
  render(component, props) { hookState.cursor = 0; return component(props); },
  reset() { hookState.cursor = 0; hookState.values = []; },
};
async function bundle(directory) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "automation-editor-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => {
      if (importPath === "app-shared") return { contents: "export const I3=()=>globalThis.__automationEditorTest.jsx; export const e6=()=>globalThis.__automationEditorTest.react;", loader: "js" };
      if (importPath === "schedule-draft") return { contents: `export const n=(automation)=>({id:automation.id,kind:"cron",name:automation.title,prompt:automation.prompt,rawRrule:null,scheduleConfig:{mode:"daily",time:"09:00",weekdays:[],customRrule:"",intervalHours:1,intervalMinutes:null,monthDay:1},scheduleDirty:false,status:automation.is_enabled?"ACTIVE":"PAUSED"}); export const s=(automation,draft)=>draft.name!==automation.title||draft.prompt!==automation.prompt||draft.scheduleDirty; export const i=()=>null;`, loader: "js" };
      if (importPath === "schedule-fields") return { contents: "export const t=(props)=>globalThis.__automationEditorTest.jsx.jsx('fieldset',{draft:props.draft});", loader: "js" };
      return { contents: "export {};", loader: "js" };
    });
  } }] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, candidate => { if (result == null && predicate(candidate)) result = candidate; }); return result; }
function all(node, predicate) { const result = []; walk(node, candidate => { if (predicate(candidate)) result.push(candidate); }); return result; }
function text(node) { const parts = []; walk(node, candidate => { const children = candidate.props?.children; if (typeof children === "string") parts.push(children); }); return parts.join(" "); }
const base = { id: "task-1", title: "Daily brief", prompt: "Summarize updates", is_enabled: true, next_run_times: [], schedule: "RRULE:FREQ=DAILY", schedule_components: { frequency: "daily" }, canManage: true, canDelete: true };
const item = { automation: base, teamId: null };

const releaseAssertions = assertReleaseOwner("automation-editor-dialog");

const cloud = await bundle("cloud-automation-detail-panel");
assert.deepEqual(Object.keys(cloud).sort(), ["a", "c", "i", "n", "o", "r", "s", "t"]);
const validDraft = { name: "Cloud task", prompt: "Build report", kind: "cron", projectId: null };
assert.equal(cloud.a({ draft: validDraft }), null);
const requirements = cloud.a({ draft: { ...validDraft, name: "", prompt: "", kind: "heartbeat", threadId: null }, allowNewThread: false, executionLocation: "cloud" });
assert.match(text(requirements), /Add a title/);
assert.match(text(requirements), /Add a prompt/);
assert.match(text(requirements), /Select a chat/);
assert.match(text(requirements), /Choose where to run it/);
assert.match(text(requirements), /Choose a model/);
let changed;
const form = cloud.s({ draft: validDraft, setDraft: updater => { changed = typeof updater === "function" ? updater(validDraft) : updater; }, resolvedProjects: [{ projectId: "empty", title: "Empty", worktreePaths: [] }, { projectId: "repo", title: "Repo", worktreePaths: ["/repo"] }] });
assert.equal(form.type, "form");
assert.equal(all(form, node => node.type === "option").length, 4);
find(form, node => node.type === "input").props.onChange({ currentTarget: { value: "Renamed" } });
assert.equal(changed.name, "Renamed");
assert.equal(find(form, node => node.type === "button" && node.props.children === "Save").props.disabled, false);
const invalidForm = cloud.s({ draft: { ...validDraft, name: "" }, setDraft() {} });
assert.equal(find(invalidForm, node => node.type === "button" && node.props.children === "Save").props.disabled, true);
let renamed, panelClosed = 0;
const panel = cloud.r({ name: "Panel task", statusLabel: "Paused", onNameChange: value => { renamed = value; }, closeAction: { label: "Close", onClose: () => { panelClosed++; } }, children: "Details" });
assert.equal(panel.type, "section");
assert.match(text(panel), /Paused/);
find(panel, node => node.props?.id === "automation-detail-panel-title").props.onChange({ currentTarget: { value: "New" } });
assert.equal(renamed, "New");
find(panel, node => node.props?.["aria-label"] === "Close").props.onClick();
assert.equal(panelClosed, 1);
let openedChat = 0;
globalThis.__automationEditorTest.reset();
const cloudEditor = globalThis.__automationEditorTest.render(cloud.t, { item, onClose: () => {}, onOpenConversation: () => { openedChat++; } });
assert.equal(find(cloudEditor, node => node.props?.id === "automation-detail-panel-title").props.value, "Daily brief");
assert.match(text(cloudEditor), /Summarize updates/);
find(cloudEditor, node => node.type === "button" && node.props.children === "Open chat").props.onClick();
assert.equal(openedChat, 1);
globalThis.__automationEditorTest.reset();
let cloudSaved, cloudClosed = 0, cloudDeleted = 0;
const cloudProps = { item, onClose: () => { cloudClosed++; }, onSave: async draft => { cloudSaved = draft; return { ...base, title: draft.name, name: draft.name, prompt: draft.prompt }; }, onSaved() {}, onDelete: async () => { cloudDeleted++; } };
let cloudState = globalThis.__automationEditorTest.render(cloud.t, cloudProps);
find(cloudState, node => node.type === "button" && node.props.children === "Edit").props.onClick();
cloudState = globalThis.__automationEditorTest.render(cloud.t, cloudProps);
find(cloudState, node => node.props?.id === "automation-detail-panel-title").props.onChange({ currentTarget: { value: "Cloud morning brief" } });
cloudState = globalThis.__automationEditorTest.render(cloud.t, cloudProps);
await find(cloudState, node => node.type === "form").props.onSubmit({ preventDefault() {} });
assert.equal(cloudSaved.name, "Cloud morning brief");
cloudState = globalThis.__automationEditorTest.render(cloud.t, cloudProps);
find(cloudState, node => node.type === "button" && node.props.children === "Delete").props.onClick();
cloudState = globalThis.__automationEditorTest.render(cloud.t, cloudProps);
find(cloudState, node => node.type === "button" && node.props.children === "Delete task").props.onClick();
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(cloudDeleted, 1);
assert.equal(cloudClosed, 1);
cloud.c(); cloud.i(); cloud.n(); cloud.o();
assert.equal(typeof cloud.t, "function");

console.log("automation editor release owner and cloud detail cluster tests passed (" + releaseAssertions + " release assertions)");
