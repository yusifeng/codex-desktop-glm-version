import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__editorWorkbenchTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "editor-workbench-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__editorWorkbenchTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function text(node) { const values = []; const collect = value => { if (typeof value === "string") values.push(value); else if (value != null && typeof value === "object") { const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); } }; collect(node); return values.join(" "); }

// layout: 10
const layout = await bundle("layout");
assert.deepEqual(Object.keys(layout), ["n", "r", "t"]);
assert.deepEqual(layout.n(layout.r("hello", "12px sans"), 10, 20), { height: 20, lineCount: 1 });
assert.deepEqual(layout.n(layout.r("abcdefghijk", "12px sans"), 5, 10), { height: 30, lineCount: 3 });
assert.equal(layout.n(layout.r("a\nb", "12px sans"), 10, 12).lineCount, 2);
assert.equal(layout.r("a\nb", "12px sans").text, "a\nb");
assert.equal(layout.n(layout.r("abcdefgh", "12px sans"), 4, 1).lineCount, 2);
assert.equal(layout.n(layout.r("abcdefgh", "12px sans", { whiteSpace: "pre" }), 4, 1).lineCount, 1);
assert.equal(layout.n(layout.r("\t", "12px sans", { tabSize: 4 }), 2, 1).lineCount, 2);
assert.equal(layout.n(layout.r("", "12px sans"), 10, 14).height, 14);
assert.equal(layout.t(), undefined);

// diff-file-view: 11
const diff = await bundle("diff-file-view");
assert.deepEqual(Object.keys(diff), ["n", "t"]);
let changed, completed;
const diffUi = diff.t({ edit: true, file: { additions: 2, contents: "+new", deletions: 1, path: "src/app.ts" }, lineAnnotations: [{ line: 1, label: "Review" }], onEditChange(value) { changed = value; }, onEditComplete(value) { completed = value; return "accept"; }, selectedLines: [1, 2] });
assert.equal(diffUi.props["data-diff-file"], "src/app.ts");
assert.equal(diffUi.props["data-editable"], true);
assert.match(text(diffUi), /\+2 −1/);
assert.equal(find(diffUi, node => node.type === "pre").props.children, "+new");
assert.equal(find(diffUi, node => node.props?.["data-line"] === 1).props.children, "Review");
assert.equal(find(diffUi, node => node.props?.["data-selected-lines"] != null).props["data-selected-lines"], "1,2");
const diffEditor = find(diffUi, node => node.type === "textarea");
diffEditor.props.onChange({ currentTarget: { value: "edited" } });
assert.equal(changed, "edited");
diffEditor.props.onBlur({ currentTarget: { value: "done" } });
assert.equal(completed, "done");
assert.equal(find(diff.t({ file: { name: "a.ts" } }), node => node.type === "textarea"), undefined);
assert.equal(diff.n(), undefined);

// codex-writing-block-directive-renderer: 11
const writing = await bundle("codex-writing-block-directive-renderer");
assert.deepEqual(Object.keys(writing), ["CodexWritingBlockDirectiveRenderer"]);
const readonly = writing.CodexWritingBlockDirectiveRenderer({ directive: { content: "Draft", id: "block-1", title: "Memo" } });
assert.equal(readonly.props["data-writing-block"], "block-1");
assert.equal(readonly.props["data-variant"], "document");
assert.match(text(readonly), /Memo Draft/);
let content, recipients, subject, blurred = 0;
const email = writing.CodexWritingBlockDirectiveRenderer({ directive: { content: "Hello", metadata: { recipients: ["a@example.com"], subject: "Hi" }, variant: "email" }, editable: true, onBlur() { blurred++; }, onContentChange(value) { content = value; }, onRecipientChange(value) { recipients = value; }, onSubjectChange(value) { subject = value; } });
assert.equal(find(email, node => node.props?.["aria-label"] === "Recipients").props.defaultValue, "a@example.com");
assert.equal(find(email, node => node.props?.["aria-label"] === "Subject").props.defaultValue, "Hi");
find(email, node => node.props?.["aria-label"] === "Recipients").props.onChange({ currentTarget: { value: "a@example.com, b@example.com" } });
assert.deepEqual(recipients, ["a@example.com", "b@example.com"]);
find(email, node => node.props?.["aria-label"] === "Subject").props.onChange({ currentTarget: { value: "News" } });
assert.equal(subject, "News");
const writingEditor = find(email, node => node.type === "textarea"); writingEditor.props.onChange({ currentTarget: { value: "Updated" } }); writingEditor.props.onBlur();
assert.equal(content, "Updated");
assert.equal(blurred, 1);
assert.equal(find(writing.CodexWritingBlockDirectiveRenderer({ directive: { variant: "email" } }), node => node.props?.["aria-label"] === "Subject").props.disabled, true);

// text-file-editor-tab-content: 15
const editor = await bundle("text-file-editor-tab-content");
assert.deepEqual(Object.keys(editor), ["i", "n", "r", "t"]);
assert.equal(editor.r("env-1", "/repo"), "text-editor:env-1:/repo");
let draft, saved, unsaved, prevented = 0;
const editorUi = editor.t({ content: "const a = 1;", editor: { kind: "code" }, filePath: "src/a.ts", language: "typescript", onDraftChange(value) { draft = value; }, onSaveChange(value) { saved = value; }, onUnsavedChangesChange(value) { unsaved = value; }, tabId: "tab-1" });
assert.equal(editorUi.props["data-editor-kind"], "code");
assert.equal(editorUi.props["data-file-path"], "src/a.ts");
assert.equal(editorUi.props["data-tab-id"], "tab-1");
assert.match(text(editorUi), /src\/a\.ts/);
const textarea = find(editorUi, node => node.type === "textarea");
assert.equal(textarea.props["data-language"], "typescript");
textarea.props.onChange({ currentTarget: { value: "const a = 2;" } });
assert.equal(draft, "const a = 2;");
assert.equal(unsaved, true);
textarea.props.onKeyDown({ key: "s", metaKey: true, currentTarget: { value: draft }, preventDefault() { prevented++; } });
assert.equal(prevented, 1);
assert.equal(saved, true);
assert.equal(unsaved, false);
assert.equal(editor.t({ editor: { kind: "pierre" }, filePath: "a", isActive: false, tabId: "t" }).props.hidden, true);
assert.equal(editor.i(), undefined);
assert.equal(editor.n(), undefined);

console.log("47 editor workbench cluster assertions passed");
