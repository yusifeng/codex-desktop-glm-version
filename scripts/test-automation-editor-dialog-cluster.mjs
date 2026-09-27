import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__automationEditorTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer/automation-editor-dialog/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "automation-editor-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__automationEditorTest.jsx;" : "export {};", loader: "js" })); } }] });
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
let discarded = 0, kept = 0;
const discard = editor.o({ onDiscard() { discarded++; }, onKeepEditing() { kept++; } });
assert.match(text(discard), /Discard changes.*Your changes will not be saved.*Keep editing/);
find(discard, node => node.props?.children === "Keep editing").props.onClick();
find(discard, node => node.type === "form").props.onSubmit({ preventDefault() {} });
assert.equal(kept, 1);
assert.equal(discarded, 1);
let savedDraft, closed = 0;
const editorUi = editor.t({ initialDraft: { name: "Daily brief", instructions: "Summarize" }, onClose() { closed++; }, onSave(value) { savedDraft = value; } });
assert.match(text(editorUi), /Scheduled task.*Close.*Save/);
find(editorUi, node => node.props?.["aria-label"] === "Task name").props.onChange({ currentTarget: { value: "Morning brief" } });
find(editorUi, node => node.props?.children === "Save").props.onClick();
assert.equal(savedDraft.name, "Morning brief");
find(editorUi, node => node.props?.children === "Close").props.onClick();
assert.equal(closed, 1);
const linked = editor.f({ children(content) { return { wrapped: content }; } });
assert.equal(linked.wrapped.type, "button");
assert.equal(editor.i("value"), "value");
let prevented = 0;
editor.r({ preventDefault() { prevented++; } });
assert.equal(prevented, 1);

console.log("automation editor dialog cluster tests passed");
