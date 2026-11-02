import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

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
    build.onResolve({ filter: /^@rchunk\/automation-editor-dialog$/ }, () => ({ path: path.join(ROOT, "src/renderer/automation-editor-dialog/index.ts") }));
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

const editor = await bundle("automation-editor-dialog");
assert.deepEqual(Object.keys(editor).sort(), ["a", "c", "d", "f", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u"]);
let selected = [];
const menu = editor.m({ runNowAction: { label: "Run", onSelect: () => selected.push("run") }, editAction: { label: "Edit", onSelect: () => selected.push("edit") }, deleteAction: { label: "Delete", onSelect: () => selected.push("delete") } });
assert.equal(menu.props.role, "menu");
assert.equal(all(menu, node => node.type === "button").length, 3);
find(menu, node => node.type === "button" && node.props.children === "Run").props.onClick();
assert.deepEqual(selected, ["run"]);
const pausedMenu = editor.m({ isPaused: true, pauseResumeInMenu: true, resumeAction: { label: "Resume" }, pauseAction: { label: "Pause" } });
assert.match(text(pausedMenu), /Resume/);
assert.doesNotMatch(text(pausedMenu), /Pause/);
let openedSite;
const sites = editor.f({ automationId: "task-1", sites: [{ project_id: "p1", title: "Launch" }, { project_id: "p2", title: "Docs" }], presentation: "detail-footer", onOpenSite: id => { openedSite = id; } });
assert.equal(all(sites, node => node.type === "button").length, 2);
assert.match(text(sites), /Automations: Launch/);
find(sites, node => node.type === "button").props.onClick();
assert.equal(openedSite, "p1");
assert.equal(editor.f({ automationId: "task-1", sites: [] }), null);
const emptyTriggers = editor.c({ triggers: null });
assert.equal(emptyTriggers.props.role, "status");
assert.match(text(emptyTriggers), /No trigger conditions/);
let openedTrigger;
const triggers = editor.c({ triggers: [{ id: "a", connector_type: "github", presentation: { display_name: "Issue opened" } }, { id: "b", connector_type: "slack" }], onOpenTrigger: trigger => { openedTrigger = trigger.id; } });
assert.equal(all(triggers, node => node.type === "button").length, 2);
assert.match(text(triggers), /Issue opened/);
assert.match(text(triggers), /Or/);
find(triggers, node => node.type === "button").props.onClick();
assert.equal(openedTrigger, "a");
let mutation;
const actions = editor.u({ item, statusMutation: { mutate: value => { mutation = value; } } });
assert.match(text(actions), /Pause/);
find(actions, node => node.type === "button" && node.props.children === "Pause").props.onClick();
assert.deepEqual(mutation, { automationId: "task-1", isEnabled: false });
assert.equal(editor.u({ item: { automation: { ...base, canManage: false, canDelete: false } } }), null);
let ran = 0;
const bar = editor.o({ item, onRunNow: () => { ran++; }, showStatusButton: true });
assert.match(text(bar), /Run now/);
assert.match(text(bar), /active/);
find(bar, node => node.type === "button" && node.props.children === "Run now").props.onClick();
assert.equal(ran, 1);
const disabledBar = editor.o({ item, hasUnsavedChanges: true });
assert.equal(find(disabledBar, node => node.type === "button" && node.props.children === "Run now").props.disabled, true);
let closed = 0, edited = 0;
const shell = editor.i({ title: "Task", summary: "Active", icon: "⏱", onClose: () => { closed++; }, onEdit: () => { edited++; }, children: "Body" });
assert.equal(shell.type, "section");
assert.match(text(shell), /Task/);
find(shell, node => node.props?.["aria-label"] === "Edit task").props.onClick();
find(shell, node => node.props?.["aria-label"] === "Close task details").props.onClick();
assert.equal(edited, 1);
assert.equal(closed, 1);
const detail = editor.r({ item, onClose: () => {}, onEdit: () => {} });
assert.match(text(detail), /Daily brief/);
assert.match(text(detail), /Summarize updates/);
const completedDetail = editor.r({ item: { automation: { ...base, status: "completed" } }, onClose: () => {}, onEdit: () => {} });
assert.equal(find(completedDetail, node => node.props?.["aria-label"] === "Edit task"), undefined);
globalThis.__automationEditorTest.reset();
const editorUi = globalThis.__automationEditorTest.render(editor.t, { item, onClose: () => {}, presentation: "dialog" });
assert.equal(editorUi.type, "dialog");
assert.equal(find(editorUi, node => node.props?.["aria-label"] === "Name").props.value, "Daily brief");
assert.equal(find(editorUi, node => node.type === "fieldset").props.draft.name, "Daily brief");
assert.equal(find(editorUi, node => node.type === "button" && node.props.children === "Save").props.disabled, true);
globalThis.__automationEditorTest.reset();
let editorClosed = 0, editorSaved, editorDeleted = 0;
const editorProps = { item, mode: "panel", onClose: () => { editorClosed++; }, onSave: async draft => { editorSaved = draft; return { id: "task-1", name: draft.name }; }, onDelete: async () => { editorDeleted++; } };
let statefulEditor = globalThis.__automationEditorTest.render(editor.t, editorProps);
find(statefulEditor, node => node.props?.["aria-label"] === "Name").props.onChange({ currentTarget: { value: "Morning brief" } });
statefulEditor = globalThis.__automationEditorTest.render(editor.t, editorProps);
assert.equal(find(statefulEditor, node => node.type === "button" && node.props.children === "Save").props.disabled, false);
find(statefulEditor, node => node.type === "button" && node.props.children === "Close").props.onClick();
statefulEditor = globalThis.__automationEditorTest.render(editor.t, editorProps);
assert.match(text(statefulEditor), /Discard scheduled task changes/);
find(statefulEditor, node => node.type === "button" && node.props.children === "Keep editing").props.onClick();
statefulEditor = globalThis.__automationEditorTest.render(editor.t, editorProps);
find(statefulEditor, node => node.type === "button" && node.props.children === "Save").props.onClick();
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(editorSaved.name, "Morning brief");
statefulEditor = globalThis.__automationEditorTest.render(editor.t, editorProps);
find(statefulEditor, node => node.type === "button" && node.props.children === "Delete").props.onClick();
statefulEditor = globalThis.__automationEditorTest.render(editor.t, editorProps);
assert.match(text(statefulEditor), /This action can’t be undone/);
find(statefulEditor, node => node.type === "button" && node.props.children === "Delete task").props.onClick();
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(editorDeleted, 1);
assert.equal(editorClosed, 1);
editor.a(); editor.d(); editor.h(); editor.l(); editor.n(); editor.p(); editor.s();
assert.equal(typeof editor.t, "function");

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

console.log("automation editor and cloud detail cluster tests passed");
