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
const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer/automation-editor-dialog/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "automation-editor-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__automationEditorTest.jsx; export const e6=()=>globalThis.__automationEditorTest.react;" : importPath === "schedule-draft" ? "export const n=a=>({id:a.id,kind:'cron',name:a.title,prompt:a.prompt,rawRrule:null,scheduleConfig:{mode:'daily',time:'09:00',weekdays:[],customRrule:'',intervalHours:1,intervalMinutes:null,monthDay:1},scheduleDirty:false,status:a.is_enabled?'ACTIVE':'PAUSED'}); export const s=(a,d)=>d.name!==a.title||d.prompt!==a.prompt||d.scheduleDirty; export const i=()=>null;" : importPath === "schedule-fields" ? "export const t=p=>globalThis.__automationEditorTest.jsx.jsx('fieldset',{draft:p.draft,onChange:p.onChange});" : "export {};", loader: "js" })); } }] });
const editor = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function text(node) { const parts = []; walk(node, value => { const children = value.props?.children; if (typeof children === "string") parts.push(children); }); return parts.join(" "); }

assert.deepEqual(Object.keys(editor).sort(), ["a", "c", "d", "f", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u"]);
let paused = 0, deleted = 0;
const actions = editor.m({ isPaused: false, pauseAction: { onSelect() { paused++; } }, resumeAction: { onSelect() {} }, deleteAction: { onSelect() { deleted++; } } });
assert.match(text(actions), /Pause.*Delete/);
find(actions, node => node.props?.children === "Pause").props.onClick();
find(actions, node => node.props?.children === "Delete").props.onClick();
assert.equal(paused, 1);
assert.equal(deleted, 1);
assert.match(text(editor.c({ triggers: null })), /Trigger details unavailable/);
let openedTrigger;
const triggers = editor.c({ triggers: [{ id: "trigger-1", connector_type: "Slack", is_enabled: false }], onOpenTrigger(value) { openedTrigger = value.id; } });
assert.match(text(triggers), /Slack.*Disabled.*Open trigger/);
find(triggers, node => node.props?.children === "Open trigger").props.onClick();
assert.equal(openedTrigger, "trigger-1");
let ran = 0;
const item = { automation: { id: "task-1", title: "Daily brief", prompt: "Summarize", is_enabled: true } };
const actionBar = editor.o({ item, onRunNow() { ran++; }, showStatusButton: true });
assert.match(text(actionBar), /Run now.*active/);
find(actionBar, node => node.props?.children === "Run now").props.onClick();
assert.equal(ran, 1);
let shellClosed = 0, shellEdited = 0;
const shell = editor.i({ title: "Daily brief", summary: "Active", onClose() { shellClosed++; }, onEdit() { shellEdited++; } });
find(shell, node => node.props?.["aria-label"] === "Edit task").props.onClick();
find(shell, node => node.props?.["aria-label"] === "Close task details").props.onClick();
assert.equal(shellClosed, 1);
assert.equal(shellEdited, 1);
assert.match(text(editor.r({ item, onClose() {}, onEdit() {} })), /Daily brief.*Summarize/);
let savedDraft, closed = 0;
globalThis.__automationEditorTest.reset();
const editorProps = { initialDraft: { name: "Daily brief", instructions: "Summarize" }, onClose() { closed++; }, onSave(value) { savedDraft = value; } };
let editorUi = globalThis.__automationEditorTest.render(editor.t, editorProps);
assert.match(text(editorUi), /Scheduled task.*Close.*Save/);
find(editorUi, node => node.props?.["aria-label"] === "Task name").props.onChange({ currentTarget: { value: "Morning brief" } });
editorUi = globalThis.__automationEditorTest.render(editor.t, editorProps);
find(editorUi, node => node.props?.children === "Save").props.onClick();
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(savedDraft.name, "Morning brief");
editorUi = globalThis.__automationEditorTest.render(editor.t, editorProps);
assert.equal(closed, 1);
const linked = editor.f({ children(content) { return { wrapped: content }; } });
assert.equal(linked.wrapped.type, "button");

console.log("automation editor dialog cluster tests passed");
