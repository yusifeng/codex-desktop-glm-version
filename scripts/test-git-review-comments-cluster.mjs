import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["pull-request-revision-tab", "registered-pull-request-thumbnail", "pull-request-readonly-comment", "bookmarked-thread-user-message-navigation", "artifact-file-preview-icon"];
const state = globalThis.__gitReviewCommentsTest = {};
state.jsx = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
state.bookmarkWrites = [];
state.react = { useEffect() {}, useState: initial => [initial === false ? true : initial, value => { state.failedImageSource = value; }] };
const imports = new Map();
for (const directory of MODULES) { const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8"); for (const match of source.matchAll(/import\s*{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) { const names = imports.get(match[2]) ?? new Set(); for (const item of match[1].split(",")) { const name = item.trim().split(/\s+as\s+/)[0]; if (name && !name.startsWith("type ")) names.add(name); } imports.set(match[2], names); } }
const overrides = { "app-shared": { $3: `() => { const cache=[]; return { c:size => { while(cache.length<size) cache.push(Symbol.for("react.memo_cache_sentinel")); return cache; } }; }`, BX: "() => new Set(['turn-one'])", FX: "() => undefined", I3: "() => globalThis.__gitReviewCommentsTest.jsx", LX: "() => ({})", __: "callback => callback", e6: "() => globalThis.__gitReviewCommentsTest.react", g_: "() => undefined", gg: "() => undefined", h4: "() => undefined", m4: "(...values) => values.filter(Boolean).join(' ')", mg: "path => 'FileIcon'", qm: "() => undefined" } };
const sideEffects = new Set(["rolldown-runtime", "app-initial", "pull-request-revision-queries-core", "pull-request-code-review-navigation-core", "pull-request-code-review-core", "revision-review-unavailable-message", "pull-request-status-label", "pull-request-checks-summary", "app-primary", "file-diff-alt", "diff-comment-card", "thread-user-message-navigation-rail-app"]);
function mock(name) { if (name === "app-shared") return "export const JX=(scope,factory)=>({scope,factory});export const ZI={};export const rZ=(scope,factory)=>({scope,factory,derived:true});export const FX=()=>{};export const QI=()=>{};"+[...(imports.get(name) ?? [])].filter(key=>!["JX","ZI","rZ","FX","QI"].includes(key)).map(exportName => `export const ${exportName} = ${overrides[name]?.[exportName] ?? "() => undefined"};`).join("\n"); if (name === "app-initial") return "export const $en={};export const pnt={};export const d1t={};export const f1t=()=>{};export const ifn=()=>{};export const itn=()=>{};export const ofn=()=>true;export const p1t=(...args)=>globalThis.__gitReviewCommentsTest.bookmarkWrites.push(args);export const u1t={};export const gmn=()=>{};export const nrn=()=>{};export const Yy=()=>{};export const i5t=()=>{};export const Y6=()=>{};export const Ry=()=>{};export const Hy=()=>{};export const Oy=()=>{};export const $fn=()=>{};export const nun=()=>{};"; if (name === "thread-user-message-navigation-rail-app") return "export const AppThreadUserMessageNavigationRail=props=>globalThis.__gitReviewCommentsTest.jsx.jsx('nav',{children:props.items.map(item=>globalThis.__gitReviewCommentsTest.jsx.jsx('button',{onClick:()=>props.onRevealItem?.(item),onMouseEnter:()=>props.onPreviewItem?.(item),onDoubleClick:()=>props.onBookmarkChange?.(item,false)},item.id))});"; if (sideEffects.has(name)) return "export {};"; return [...(imports.get(name) ?? [])].map(exportName => `export const ${exportName} = ${overrides[name]?.[exportName] ?? "() => undefined"};`).join("\n"); }
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "git-review-comments-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mock(importPath), loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function nodes(root) { const output = []; const visit = value => { if (value == null || typeof value !== "object") return; if (Array.isArray(value)) return value.forEach(visit); if ("type" in value && "props" in value) output.push(value); visit(value.props?.children); }; visit(root); return output; }
const nodeOfType = (tree, type) => nodes(tree).find(node => node.type === type);

assertReleaseOwner("pull-request-actions");

// pull-request-revision-tab
const revisionTab = await bundle("pull-request-revision-tab");
const revisionTree = revisionTab.PullRequestRevisionTab({ request: { number: 7 }, title: "PR #7" });
assert.equal(revisionTree.props["data-testid"], "pull-request-revision-tab");
assert.equal(nodeOfType(revisionTree, "h1").props.children, "PR #7");
assert.equal(nodes(revisionTree).find(node => node.props["data-review-request"]).props.children, "Review changes");
const unavailableTree = revisionTab.PullRequestRevisionTab({ unavailableReason: "Revision unavailable" });
assert.equal(nodes(unavailableTree).find(node => node.props.role === "alert").props.children, "Revision unavailable");
assert.equal(nodeOfType(unavailableTree, "h1").props.children, "Pull request review");

// registered-pull-request-thumbnail
const thumbnail = await bundle("registered-pull-request-thumbnail");
const thumbnailTree = thumbnail.RegisteredPullRequestThumbnail({ props: { request: { number: 4 }, status: "merged", checks: [{ id: 1 }, { id: 2 }] }, title: "Improve tests" });
assert.equal(thumbnailTree.props["data-testid"], "pull-request-thumbnail");
assert.equal(nodeOfType(thumbnailTree, "strong").props.children, "Improve tests");
assert.equal(nodes(thumbnailTree).find(node => node.props.children === "merged").type, "span");
assert.equal(nodes(thumbnailTree).find(node => node.props.children === "2 checks").type, "span");
assert.match(nodeOfType(thumbnailTree, "code").props.children, /"number":4/);
assert.equal(thumbnail.RegisteredPullRequestThumbnail({}).props.children[0].props.children, "Pull request");

assertReleaseOwner("pull-request-readonly-comment");

// bookmarked-thread-user-message-navigation
const bookmarks = await bundle("bookmarked-thread-user-message-navigation"); bookmarks.n();
const disabledBookmarks = bookmarks.t({ enabled: false, getItems: () => [] });
assert.equal(disabledBookmarks.type(disabledBookmarks.props), null);
let previewed = null; let revealed = null;
const bookmarkWrapper = bookmarks.t({ bookmarkKey: "thread-1", getItems: () => [1, 2, 3, 4].map(index => ({ id: `item-${index}`, label: `Item ${index}`, turnKey: index === 1 ? "turn-one:transcript:0" : `turn-${index}` })), onPreviewItem: item => { previewed = item; }, onRevealItem: item => { revealed = item; } });
const bookmarkRail = bookmarkWrapper.type(bookmarkWrapper.props);
const bookmarkTree = bookmarkRail.type(bookmarkRail.props);
assert.equal(bookmarkTree.type, "nav");
assert.equal(bookmarkTree.props.children.length, 4);
const bookmarkButton = bookmarkTree.props.children[0];
bookmarkButton.props.onMouseEnter(); bookmarkButton.props.onClick(); bookmarkButton.props.onDoubleClick();
assert.equal(previewed.id, "item-1");
assert.equal(revealed.id, "item-1");
assert.equal(state.bookmarkWrites.length, 2);
assert.equal(state.bookmarkWrites[0][1], "thread-1");

// artifact-file-preview-icon
const artifactIcon = await bundle("artifact-file-preview-icon"); artifactIcon.n();
const imageIcon = artifactIcon.t({ getImagePreviewSrc: () => "data:image/png;base64,abc", imageClassName: "preview", path: "image.png" });
assert.equal(imageIcon.type, "img");
assert.equal(imageIcon.props.src, "data:image/png;base64,abc");
assert.equal(imageIcon.props.className, "shrink-0 object-cover preview");
const fallbackIcon = artifactIcon.t({ iconClassName: "file", path: "report.pdf" });
assert.equal(fallbackIcon.type, "FileIcon");
assert.equal(fallbackIcon.props.className, "shrink-0 file");

console.log("54 git review comments cluster assertions passed");
