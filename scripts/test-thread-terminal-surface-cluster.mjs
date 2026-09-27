import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__threadSurfaceTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "thread-surface-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__threadSurfaceTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function text(node) { const values = []; walk(node, value => { if (typeof value?.props?.children === "string") values.push(value.props.children); }); return values.join(" "); }

// surface: 16
const surface = await bundle("surface");
assert.deepEqual(Object.keys(surface), ["i", "n", "r", "t"]);
assert.match(surface.n({}).props.className, /bg-text\/5/);
assert.match(surface.n({ background: "normal" }).props.className, /bg-surface/);
assert.match(surface.n({ overflow: "auto" }).props.className, /overflow-auto/);
assert.match(surface.n({ className: "custom" }).props.className, /custom/);
assert.equal(surface.n({ children: "body" }).props.children, "body");
const plainMarkdown = surface.r({ markdown: "# Hello" });
assert.equal(find(plainMarkdown, node => node.props?.["data-markdown"] === true).props.children, "# Hello");
assert.equal(find(plainMarkdown, node => node.props?.["data-metadata-preview"] === true), undefined);
const richMarkdown = surface.r({ conversationId: "c1", enableMetadataPreview: true, hostId: "h1", isStreaming: true, markdown: "---\ntitle: Notes\ntags: [one, two]\nempty:\n---\nBody" });
assert.equal(richMarkdown.props["data-conversation-id"], "c1");
assert.equal(richMarkdown.props["data-host-id"], "h1");
assert.equal(find(richMarkdown, node => node.props?.["data-markdown"] === true).props.children, "Body");
assert.equal(find(richMarkdown, node => node.props?.["data-streaming"] === true).props["data-streaming"], true);
assert.match(text(richMarkdown), /Metadata title Notes tags one two empty ""/);
const manyEntries = surface.t({ entries: Array.from({ length: 10 }, (_, index) => ({ key: `key${index}`, value: `${index}` })) });
assert.equal(manyEntries.props.children[1].props.children.length, 8);
assert.equal(find(surface.r({ enableMetadataPreview: false, markdown: "---\ntitle: Hidden\n---\nBody" }), node => node.props?.["data-metadata-preview"] === true), undefined);
assert.equal(surface.i(), undefined);

// thread-shell-runtime: 21
const thread = await bundle("thread-shell-runtime");
assert.deepEqual(Object.keys(thread), ["a", "c", "d", "f", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u"]);
const emptyScope = { sessions: [] };
assert.equal(thread.r(emptyScope), null);
assert.equal(thread.t(emptyScope), false);
const scope = { context: { conversationId: "c1", conversationTitle: "Conversation", cwd: "/tmp/project" }, sessions: [] };
assert.equal(thread.t(scope), true);
assert.equal(thread.r(scope, "term-a"), "term-a");
assert.equal(scope.sessions.length, 1);
assert.equal(scope.activePanel, "bottom");
assert.equal(thread.r(scope, "term-a", "right"), "term-a");
assert.equal(scope.sessions.length, 1);
assert.equal(thread.u(scope), true);
thread.i(scope, { panel: "bottom", sessionId: "seeded", snapshot: { lines: 2 } });
assert.deepEqual(scope.sessions.find(session => session.id === "seeded").snapshot, { lines: 2 });
assert.equal(thread.c(scope), true);
assert.equal(thread.l({ sessions: [] }), "bottom");
assert.equal(thread.d.getId(scope.sessions[0]), "terminal:term-a");
assert.equal(thread.d.getTitle(scope.sessions[0]), "Conversation");
assert.equal(thread.d.getTitle({ context: { conversationId: "c2", cwd: "/tmp/worktree" }, id: "cwd", panel: "bottom" }), "worktree");
thread.o(scope, "right", "terminal:term-a");
assert.equal(scope.sessions.some(session => session.id === "term-a"), false);
const deferred = { context: { conversationId: "c3" }, sessions: [] };
thread.s(deferred);
assert.equal(deferred.sessions.length, 1);
assert.equal(typeof thread.m(deferred), "function");
assert.equal(await thread.d.preloadExisting(deferred, "preloaded", { ready: true }), true);
assert.equal(thread.n(), undefined);

console.log("37 thread terminal and surface cluster assertions passed");
