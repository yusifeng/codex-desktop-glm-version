import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let activeHooks = [], hookCursor = 0;
const React = { useState(initial) { const hooks = activeHooks, index = hookCursor++; if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial; return [hooks[index], value => { hooks[index] = typeof value === "function" ? value(hooks[index]) : value; }]; } };
globalThis.__editorWorkbenchTest = { React, jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "editor-workbench-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__editorWorkbenchTest.jsx;export const e6=globalThis.__editorWorkbenchTest.React;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function mount(Component, props) { const hooks = []; return { render() { activeHooks = hooks; hookCursor = 0; return Component(props); } }; }
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

assertReleaseOwner("text-file-editor-tab-content", [
  /@rchunk\/text-editor-merge-runtime/,
  /@rchunk\/read-saved-plan-content/,
  /export \{ ga as i, Vd as n, ha as r, Bd as t \}/,
]);

console.log("editor workbench and release owner assertions passed");
