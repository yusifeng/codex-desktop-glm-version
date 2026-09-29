import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "src/renderer/library-note-preview/index.ts");
const source = fs.readFileSync(SOURCE, "utf8");
assert.deepEqual([...new Set([...source.matchAll(/@rchunk\/([^\"]+)/g)].map(match => match[1]))].sort(), ["app-initial", "app-primary", "app-shared", "chatgpt-writing-block-ai-tools", "editable-writing-block", "library-cloud-file-preview", "open-library-item", "preview-layout", "right-panel-composer-overlay", "rolldown-runtime", "writing-block-surface"]);
assert.equal(/import\s*\(/.test(source), false);
assert.equal(/\bany\b/.test(source), false);
assert.equal(/import \* as/.test(source), false);
const runtime = { cursor: 0, effects: [], init: [], refs: [], states: [] };
const React = { useCallback(callback) { runtime.cursor += 1; return callback; }, useEffect(effect) { runtime.cursor += 1; runtime.effects.push(effect); }, useRef(value) { const index = runtime.cursor++; runtime.refs[index] ??= { current: value }; return runtime.refs[index]; }, useState(value) { const index = runtime.cursor++; if (!(index in runtime.states)) runtime.states[index] = typeof value === "function" ? value() : value; return [runtime.states[index], next => { runtime.states[index] = typeof next === "function" ? next(runtime.states[index]) : next; }]; } };
const jsx = { jsx(type, props, key) { return { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return { type, props: props ?? {}, key }; } };
globalThis.__libraryNotePreview = { React, jsx, runtime };
const initMock = (name, component) => "const x=globalThis.__libraryNotePreview;export const n=()=>x.runtime.init.push('" + name + "');export const t='" + component + "';";
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": "const x=globalThis.__libraryNotePreview;export const I3=()=>x.jsx;export const e6=()=>x.React;export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});",
  "app-initial": "export {};", "app-primary": "export {};",
  "right-panel-composer-overlay": initMock("overlay", "RightPanelComposerOverlay"),
  "writing-block-surface": "const x=globalThis.__libraryNotePreview;export const i=()=>x.runtime.init.push('surface');export const t='WritingBlockEditorRegion';",
  "editable-writing-block": initMock("editable", "EditableWritingBlock"),
  "chatgpt-writing-block-ai-tools": "const x=globalThis.__libraryNotePreview;export const t=()=>x.runtime.init.push('ai-tools');",
  "library-cloud-file-preview": "const x=globalThis.__libraryNotePreview;export const r=()=>x.runtime.init.push('cloud-preview');export const t='LibraryFilePreviewComposer';",
  "preview-layout": initMock("layout", "PreviewLayout"),
  "open-library-item": "const x=globalThis.__libraryNotePreview;export const t=()=>x.runtime.init.push('open-item');",
};
const build = await esbuild.build({ entryPoints: [SOURCE], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, args => ({ path: args.path.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, args => ({ contents: mocks[args.path] ?? "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(build.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["LibraryNotePreview"]);
assert.deepEqual(runtime.init, ["overlay", "surface", "editable", "ai-tools", "cloud-preview", "layout", "open-item"]);
function reset() { runtime.cursor = 0; runtime.effects = []; runtime.refs = []; runtime.states = []; }
function render(props) { runtime.cursor = 0; runtime.effects = []; return module.LibraryNotePreview(props); }
function walk(value, output = []) { if (value == null || typeof value !== "object") return output; if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; } output.push(value); walk(value.props?.children, output); return output; }
const base = { accountId: "account", userId: "user", onClose() {}, request: { noteId: "note-1" } };
reset();
let view = render(base);
assert.equal(view.type, "EditableWritingBlock");
assert.equal(view.props.content, "");
assert.equal(view.props.testId, "library-note-editor");
view.props.onContentChange("# Quarterly / Plan\nDetails");
view = render(base);
const frame = view.props.render({ renderView: () => ({ type: "EditorView", props: {} }) });
assert.equal(frame.type, "PreviewLayout");
assert.equal(frame.props.assetName.props.children[2].props.children, "Quarterly - Plan");
assert.equal(frame.props.assetName.props.children[2].props.title, "Quarterly - Plan");

reset();
let resolveLoad;
const existing = { id: "file-1", name: "Saved.md" };
const loadingProps = { ...base, request: { entry: { node: existing }, loadContent: () => new Promise(resolve => { resolveLoad = resolve; }), noteId: "note-2" } };
view = render(loadingProps);
assert.equal(view.type, "PreviewLayout");
assert.equal(view.props.children.props.role, "status");
for (const effect of runtime.effects) effect();
resolveLoad("Loaded note");
await new Promise(resolve => setTimeout(resolve, 0));
view = render(loadingProps);
assert.equal(view.type, "EditableWritingBlock");
assert.equal(view.props.content, "Loaded note");
assert.equal(view.props.libraryFileId, "file-1");
const existingFrame = view.props.render({ renderView: () => ({ type: "EditorView", props: {} }) });
assert.equal(existingFrame.props.bottomContent.type, "RightPanelComposerOverlay");
assert.equal(existingFrame.props.bottomContent.props.children.type, "LibraryFilePreviewComposer");

reset();
let loadAttempts = 0;
const errorProps = { ...base, request: { entry: { node: existing }, async loadContent() { loadAttempts += 1; throw new Error("offline"); }, noteId: "note-3" } };
view = render(errorProps);
for (const effect of runtime.effects) effect();
await new Promise(resolve => setTimeout(resolve, 0));
view = render(errorProps);
assert.equal(view.props.children.props.children, "Retry loading note");
view.props.children.props.onClick();
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(loadAttempts, 2);

reset();
let savedInput; let closed = 0;
const saveProps = { accountId: "account", userId: "user", onClose() { closed += 1; }, request: { noteId: "note-4", async saveNote(input) { savedInput = input; return { content: input.content, file: { id: "created", name: input.fileName } }; } } };
view = render(saveProps);
view.props.onContentChange("New note title");
view = render(saveProps);
view.props.onBlur();
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(savedInput.content, "New note title");
assert.equal(savedInput.fileName, "New note title.md");
view = render(saveProps);
const savedFrame = view.props.render({ renderView: () => ({ type: "EditorView", props: {} }) });
savedFrame.props.onClose();
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(closed, 1);

reset();
const failureProps = { ...base, request: { noteId: "note-5", async saveNote() { throw { status: 413 }; } } };
view = render(failureProps);
view.props.onContentChange("Oversized note");
view = render(failureProps);
view.props.onBlur();
await new Promise(resolve => setTimeout(resolve, 0));
view = render(failureProps);
const failureFrame = view.props.render({ renderView: () => ({ type: "EditorView", props: {} }) });
const alert = walk(failureFrame).find(node => node.props?.role === "alert");
assert.equal(alert.props.children[0], "This note is too large. Shorten it and retry");
assert.equal(alert.props.children[1].props.children, "Retry");
assert.equal(closed, 1);
const count = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(count + " library note preview assertions passed");
