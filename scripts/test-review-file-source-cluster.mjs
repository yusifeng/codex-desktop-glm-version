import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let activeHooks = [], hookCursor = 0;
const React = { useState(initial) { const hooks = activeHooks, index = hookCursor++; if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial; return [hooks[index], value => { hooks[index] = typeof value === "function" ? value(hooks[index]) : value; }]; } };
globalThis.__reviewFileTest = { React, jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
const actual = new Map([["review-file-source-breadcrumb", "review-file-source-breadcrumb"], ["review-file-tree-side-pane", "review-file-tree-side-pane"]]);
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "review-file-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => { const name = importPath.slice(8); return actual.has(name) ? { path: path.join(ROOT, "src/renderer", actual.get(name), "index.ts") } : { path: name, namespace: "mock" }; }); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__reviewFileTest.jsx;export const e6=globalThis.__reviewFileTest.React;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function mount(Component, props) { const hooks = []; return { render() { activeHooks = hooks; hookCursor = 0; return Component(props); } }; }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function all(node, predicate) { const result = []; walk(node, value => { if (predicate(value)) result.push(value); }); return result; }
function text(node) { const parts = []; walk(node, value => { if (typeof value.props?.children === "string") parts.push(value.props.children); }); return parts.join(" "); }

const breadcrumb = await bundle("review-file-source-breadcrumb");
assert.deepEqual(Object.keys(breadcrumb).sort(), ["a", "c", "d", "i", "l", "n", "o", "r", "s", "t", "u"]);
assert.equal(breadcrumb.d(4, 10), 4);
assert.equal(breadcrumb.d(-1, 10), 10);
assert.equal(breadcrumb.d(-2, 10), 9);
assert.equal(breadcrumb.d(99, 10), 10);
assert.equal(breadcrumb.d(0, 0), 1);
assert.equal(breadcrumb.u(" 12 "), 12);
assert.equal(breadcrumb.u("-1", 8), 8);
assert.equal(breadcrumb.u("0", 8), null);
assert.equal(breadcrumb.u("2.5", 8), null);
assert.equal(breadcrumb.u("abc", 8), null);
assert.equal(breadcrumb.l(""), 1);
assert.equal(breadcrumb.l("a\nb\r\nc\rd"), 4);
let selected;
const crumbs = breadcrumb.t({ cwd: "/repo", workspaceRoot: "/repo", path: "/repo/src/components/App.tsx", hostId: "local", onSelectFile: (path, options) => { selected = [path, options]; }, pathActions: "actions", trailingContent: "trail" });
assert.equal(crumbs.type, "nav");
assert.equal(all(crumbs, node => node.type === "li").length, 3);
assert.match(text(crumbs), /src/);
assert.match(text(crumbs), /App.tsx/);
find(crumbs, node => node.type === "button" && node.props.children === "src").props.onClick();
assert.deepEqual(selected, ["src", { preview: true }]);
assert.equal(breadcrumb.t({ path: "/" }), null);
let previewed, committed, cancelled = 0;
const gotoMount = mount(breadcrumb.s, { getLineCount: () => 20, onPreviewLine: line => { previewed = line; }, onGoToLine: line => { committed = line; }, onCancelPreview: () => { cancelled++; } });
let goto = gotoMount.render();
find(goto, node => node.type === "input").props.onChange({ currentTarget: { value: "-1" } });
assert.equal(previewed, 20);
goto = gotoMount.render();
goto.props.onSubmit({ preventDefault() {} });
assert.equal(committed, 20);
find(goto, node => node.type === "button").props.onClick();
assert.equal(cancelled, 1);
const surface = breadcrumb.r({ children: "source", isActive: false, panelId: "right", withContextMenu: true });
assert.equal(surface.props["data-panel-id"], "right");
assert.equal(surface.props["data-context-menu"], true);
const character = { dataset: { char: "1" }, firstChild: { nodeType: 3 } };
const host = { shadowRoot: { querySelector() { return { querySelectorAll() { return [character]; } }; } }, querySelector() { return null; } };
assert.equal(breadcrumb.o(host, 2, 1), true);
breadcrumb.a(); breadcrumb.c(); breadcrumb.i(); breadcrumb.n(); assert.equal(typeof breadcrumb.t, "function");

const tree = await bundle("review-file-tree-side-pane");
assert.deepEqual(Object.keys(tree).sort(), ["a", "c", "i", "n", "o", "r", "s", "t"]);
const commentProps = tree.c({ enableComments: false, comments: [1], modelComments: [2], readonlyComments: [3] });
assert.equal(commentProps.commentProps.enableComments, false);
assert.deepEqual(commentProps.commentProps.comments, [1]);
assert.deepEqual(commentProps.commentProps.modelComments, [2]);
assert.deepEqual(commentProps.commentProps.readonlyComments, [3]);
const badge = tree.r({ children: "file", isActive: true });
assert.equal(badge.props.children[0], "file");
assert.equal(find(badge, node => node.props?.["aria-label"] === "1 comment").props.children, "1");
assert.equal(tree.a({ className: "folder" }).type, "svg");
const files = [{ path: "src/z.ts", additions: 2, deletions: 1 }, { path: ".git/config" }, { path: "src/a.ts", comments: 3 }, { path: "src/a.ts" }];
let previewFile, openedFile;
const treeUi = tree.t({ files, activeFilePath: "src/a.ts", query: "src/", onSelectFile: path => { previewFile = path; }, onOpenFile: path => { openedFile = path; } });
assert.equal(all(treeUi, node => node.type === "li").length, 2);
assert.doesNotMatch(text(treeUi), /.git\/config/);
const firstFile = all(treeUi, node => node.type === "button")[0];
assert.match(firstFile.props.children[0], /src\/a.ts/);
firstFile.props.onClick(); firstFile.props.onDoubleClick();
assert.equal(previewFile, "src/a.ts");
assert.equal(openedFile, "src/a.ts");
assert.equal(firstFile.props["aria-current"], "page");
assert.equal(find(treeUi, node => node.props?.["aria-label"] === "3 comments").props.children, 3);
const hidden = tree.t({ files, includeHidden: true, query: ".git" });
assert.equal(find(hidden, node => node.type === "button").props.children[0], ".git/config");
assert.match(text(tree.t({ files: [], query: "x" })), /No matching files/);
assert.match(text(tree.t({ files: [], query: "" })), /No files in this folder/);
assert.match(text(tree.t({ files: [], isLoading: true })), /Loading directory entries/);
tree.i(); tree.n(); tree.o(); tree.s(); assert.equal(typeof tree.t, "function");

assertReleaseOwner("review-file-source-item", [
  /@rchunk\/review-file-source-breadcrumb/,
  /@rchunk\/code-diff-context-menu/,
  /export \{ Vi as n, gi as t \}/,
]);

const editable = await bundle("editable-review-file-source-tab-content");
assert.deepEqual(Object.keys(editable), ["EditableReviewFileSourceTabContent"]);
let refreshed = 0;
const unavailable = editable.EditableReviewFileSourceTabContent({ refresh: () => { refreshed++; } });
assert.match(text(unavailable), /Files unavailable/);
assert.match(text(unavailable), /Files will be available/);
find(unavailable, node => node.type === "button").props.onClick();
assert.equal(refreshed, 1);
let openedLocation, selectedFile;
const editableUi = editable.EditableReviewFileSourceTabContent({ environmentId: "env", scope: "scope", path: "src/a.ts", contents: "hello", onOpenLocation: (scope, location) => { openedLocation = [scope, location]; }, onSelectFile: (scope, path) => { selectedFile = [scope, path]; }, refresh: () => { refreshed++; } });
assert.equal(editableUi.type, "article");
assert.equal(find(editableUi, node => node.type === "pre").props.children, "hello");
find(editableUi, node => node.type === "button" && node.props.children === "Refresh").props.onClick();
assert.equal(refreshed, 2);
assert.equal(openedLocation, undefined);
assert.equal(selectedFile, undefined);
console.log("review file source cluster tests passed");
