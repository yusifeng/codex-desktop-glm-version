import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_PATH = path.join(ROOT, "src/renderer/image-markup-editor/index.ts");
const source = fs.readFileSync(SOURCE_PATH, "utf8");
const dependencies = [...new Set([...source.matchAll(/@rchunk\/([^"]+)/g)].map((match) => match[1]))].sort();
assert.deepEqual(dependencies, [
  "app-initial",
  "app-primary",
  "app-shared",
  "composer-host",
  "image-edit-size-control",
  "image-export",
  "rolldown-runtime",
  "sketch",
]);
assert.equal(/import\s*\(/.test(source), false);
assert.equal(/\bany\b/.test(source), false);
assert.equal(/import\s+\*\s+as\s+/.test(source), false);
assert.equal(source.includes("export { ImageMarkupEditor }"), true);

const state = {
  createOptions: null,
  effects: [],
  imperative: null,
  initCalls: [],
  refs: [],
  states: [],
};
let cursor = 0;
const React = {
  useCallback(callback) { cursor += 1; return callback; },
  useEffect(effect) { cursor += 1; state.effects.push(effect); },
  useImperativeHandle(_ref, create) { cursor += 1; state.imperative = create(); },
  useRef(value) { const index = cursor++; state.refs[index] ??= { current: value }; return state.refs[index]; },
  useState(initial) {
    const index = cursor++;
    if (!(index in state.states)) state.states[index] = typeof initial === "function" ? initial() : initial;
    return [state.states[index], (next) => { state.states[index] = typeof next === "function" ? next(state.states[index]) : next; }];
  },
};
const jsx = {
  Fragment: Symbol("Fragment"),
  jsx(type, props, key) { return { key, props: props ?? {}, type }; },
  jsxs(type, props, key) { return { key, props: props ?? {}, type }; },
};
const editorState = {
  activeTool: "pen",
  canRedo: false,
  canUndo: false,
  document: { objects: [] },
  effectiveDocument: { objects: [] },
  hasActiveGesture: false,
  hasPendingTextEdit: false,
  style: { color: "#dc2626", width: 8 },
};
const editorCalls = [];
const editor = {
  commitPendingTextEdit() { editorCalls.push(["commitText"]); return false; },
  deleteObject(id) { editorCalls.push(["deleteComment", id]); return true; },
  getSnapshot() { return editorState; },
  insertComment(value) { editorCalls.push(["insertComment", value]); return "comment-new"; },
  redo() { editorCalls.push(["redo"]); return true; },
  setStyle(value) { editorCalls.push(["style", value]); },
  setTool(value) { editorState.activeTool = value; editorCalls.push(["tool", value]); },
  subscribe() { return () => undefined; },
  undo() { editorCalls.push(["undo"]); return true; },
  updateComment(id, text) { editorCalls.push(["updateComment", id, text]); return true; },
};
globalThis.__imageMarkupEditorTest = { React, editor, editorState, jsx, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const t=globalThis.__imageMarkupEditorTest;",
    "export const I3=()=>t.jsx;",
    "export const e6=()=>t.React;",
  ].join("\n"),
  "app-initial": "export {};",
  "app-primary": "export {};",
  "image-edit-size-control": [
    "const ctx=globalThis.__imageMarkupEditorTest;",
    "export const n=()=>ctx.state.initCalls.push('size-control');",
    "export const t='ImageEditSizeControl';",
  ].join("\n"),
  "composer-host": [
    "const t=globalThis.__imageMarkupEditorTest;",
    "export const n='UnsavedChangesDialog';",
    "export const r=()=>t.state.initCalls.push('composer-host');",
  ].join("\n"),
  sketch: [
    "const ctx=globalThis.__imageMarkupEditorTest;",
    "export const d=document=>document.objects.filter(object=>object.kind==='comment');",
    "export const l=()=>ctx.editorState;",
    "export const n=options=>{ctx.state.createOptions=options;return ctx.editor};",
    "export const o='SketchSurface';",
    "export const t=()=>ctx.state.initCalls.push('sketch');",
  ].join("\n"),
  "image-export": [
    "const t=globalThis.__imageMarkupEditorTest;",
    "export const i=()=>t.state.initCalls.push('image-export');",
    "export const r=size=>{const scale=1024/Math.max(size.width,size.height);return {width:size.width*scale,height:size.height*scale}};",
  ].join("\n"),
};
const result = await esbuild.build({
  entryPoints: [SOURCE_PATH],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "image-markup-editor-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
    },
  }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["ImageMarkupEditor"]);
assert.deepEqual(state.initCalls, ["size-control", "composer-host", "sketch", "image-export"]);

let cancelled = 0;
const nativeSessions = [];
const props = {
  alt: "A marked-up chart",
  clipboardScope: { id: "clipboard" },
  imageSize: { height: 600, width: 1200 },
  onCancel() { cancelled += 1; },
  prepareNativeMarkup(session) { nativeSessions.push(session); return () => undefined; },
  showCommentTool: true,
  sizeControlContainer: { id: "controls" },
  sourceImage: { id: "source" },
  src: "image.png",
  tabId: "tab-1",
  viewport: { zoom: 2 },
};
function render(overrides = {}) { cursor = 0; state.effects = []; return module.ImageMarkupEditor({ ...props, ...overrides }); }
function walk(value, output = []) {
  if (value == null || typeof value !== "object") return output;
  if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; }
  output.push(value);
  walk(value.props?.children, output);
  return output;
}
function byLabel(tree, label) { return walk(tree).find((node) => node.props?.["aria-label"] === label); }

let tree = render();
assert.equal(tree.type, "div");
assert.equal(tree.props.role, "presentation");
assert.equal(tree.props["aria-busy"], false);
assert.deepEqual(state.createOptions, { drawingWidthPx: 4, style: { color: "#dc2626", width: 8 }, textSizePx: 24, tool: "pen" });
assert.equal(state.imperative.editor, editor);
assert.equal(state.imperative.isReadOnly, false);
let nodes = walk(tree);
const surface = nodes.find((node) => node.type === "SketchSurface");
assert.deepEqual(surface.props.surfaceSize, { height: 512, width: 1024 });
assert.deepEqual(surface.props.clipboardScope, props.clipboardScope);
assert.deepEqual(surface.props.viewport, props.viewport);
assert.equal(surface.props.readOnly, false);
assert.equal(byLabel(tree, "Add comment").props.disabled, false);
for (const effect of state.effects) effect();
assert.equal(nativeSessions.length, 1);
let session = nativeSessions.at(-1);
assert.equal(session.tabId, "tab-1");
assert.equal(session.src, "image.png");
assert.deepEqual(session.readDocument(), editorState.effectiveDocument);
byLabel(tree, "Add comment").props.onClick();
assert.deepEqual(editorCalls.at(-1), ["tool", "comment"]);
byLabel(tree, "Color").props.onChange({ target: { value: "#123456" } });
assert.deepEqual(editorCalls.at(-1), ["style", { color: "#123456" }]);
state.imperative.requestClose();
assert.equal(cancelled, 1);

editorState.activeTool = "comment";
surface.props.onCommentPlace({ height: 20, width: 20, x: 10, y: 12 });
tree = render();
let textarea = byLabel(tree, "Comment");
assert.equal(textarea.props.value, "");
textarea.props.onChange({ target: { value: "  inspect this  " } });
tree = render();
textarea = byLabel(tree, "Comment");
assert.equal(textarea.props.value, "  inspect this  ");
const save = walk(tree).find((node) => node.type === "button" && node.props?.type === "submit");
assert.equal(save.props.disabled, false);
walk(tree).find((node) => node.type === "form").props.onSubmit({ preventDefault() {} });
assert.deepEqual(editorCalls.at(-1), ["insertComment", { bounds: { height: 20, width: 20, x: 10, y: 12 }, text: "inspect this" }]);

editorState.document = { objects: [{ bounds: { height: 16, width: 16, x: 2, y: 3 }, id: "comment-1", kind: "comment", text: "Existing" }] };
editorState.effectiveDocument = editorState.document;
tree = render();
const pin = byLabel(tree, "Edit comment comment-1");
pin.props.onClick();
tree = render();
textarea = byLabel(tree, "Comment");
assert.equal(textarea.props.value, "Existing");
textarea.props.onChange({ target: { value: "Updated" } });
tree = render();
state.imperative.commitComment();
assert.deepEqual(editorCalls.at(-1), ["updateComment", "comment-1", "Updated"]);

tree = render();
state.imperative.requestClose("tab");
tree = render();
const dialog = walk(tree).find((node) => node.type === "UnsavedChangesDialog");
assert.equal(typeof dialog.props.onKeepEditing, "function");
dialog.props.onKeepEditing();
tree = render();
assert.equal(walk(tree).some((node) => node.type === "UnsavedChangesDialog"), false);
state.imperative.requestClose();
tree = render();
walk(tree).find((node) => node.type === "UnsavedChangesDialog").props.onDiscard();
assert.equal(cancelled, 2);

tree = render({ isSubmitting: true });
assert.equal(tree.props["aria-busy"], true);
assert.equal(state.imperative.isReadOnly, true);
assert.equal(byLabel(tree, "Draw").props.disabled, true);
const beforeBlockedClose = cancelled;
state.imperative.requestClose();
assert.equal(cancelled, beforeBlockedClose);

let customToolbar = null;
tree = render({ renderToolbar(toolbar) { customToolbar = toolbar; return { type: "custom-toolbar", props: { toolbar } }; } });
assert.equal(customToolbar.props.role, "toolbar");
assert.equal(walk(tree).some((node) => node.type === "custom-toolbar"), true);
session.onAccepted();
assert.equal(cancelled, 3);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " image markup editor assertions passed");
