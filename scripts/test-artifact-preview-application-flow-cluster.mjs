import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__artifactPreviewFlowTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } }, react: { useEffect(effect) { return effect(); }, useState(initial) { return [typeof initial === "function" ? initial() : initial, () => {}]; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "artifact-preview-flow-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => { let contents = "export {};"; if (importPath === "app-shared") contents = "export const I3=()=>globalThis.__artifactPreviewFlowTest.jsx;export const e6=()=>globalThis.__artifactPreviewFlowTest.react;"; else if (importPath === "library-file-download") contents = "export const i=async()=>\"text\";export const r=async()=>new Uint8Array();export const t=async()=>{};"; else if (importPath === "artifact-tab-content-electron") contents = "export const n=props=>({type:'artifact',props});"; else if (importPath === "library-json-preview") contents = "export const LibraryJsonPreview=props=>({type:'json',props});"; return { contents, loader: "js" }; }); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function all(node, predicate) { const result = []; walk(node, value => { if (predicate(value)) result.push(value); }); return result; }
function text(node) { const parts = []; const collect = value => { if (typeof value === "string" || typeof value === "number") parts.push(String(value)); else if (value != null && typeof value === "object") { const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); } }; collect(node); return parts.join(" "); }

// chatgpt-image-lightbox: 9
const lightbox = await bundle("chatgpt-image-lightbox");
assert.deepEqual(Object.keys(lightbox), ["n", "t"]);
let navigated, closed = 0;
const lightboxUi = lightbox.t({ currentIndex: 1, images: [{ src: "one" }, { src: "two", sourceLabel: "Example", sourceUrl: "https://example.test" }], onClose() { closed++; }, onNavigate(index) { navigated = index; } });
assert.equal(lightboxUi.props["aria-label"], "Image 2");
assert.equal(find(lightboxUi, node => node.type === "img").props.src, "two");
assert.match(text(lightboxUi), /2 of 2/);
assert.equal(find(lightboxUi, node => node.type === "a").props.children, "View on Example");
assert.equal(find(lightboxUi, node => node.props?.children === "Next").props.disabled, true);
find(lightboxUi, node => node.props?.children === "Previous").props.onClick();
assert.equal(navigated, 0);
find(lightboxUi, node => node.props?.children === "Close").props.onClick();
assert.equal(closed, 1);
assert.equal(find(lightbox.t({ images: [], onClose() {} }), node => node.props?.role === "alert").props.children, "Couldn't load this image");

// presentation: 10
const presentation = await bundle("presentation");
assert.deepEqual(Object.keys(presentation), ["a", "i", "n", "o", "r", "s", "t"]);
assert.equal(presentation.a(), undefined);
assert.equal(presentation.n({ tool: "create_thread" }).message.defaultMessage, "Creating chat");
assert.equal(presentation.n({ tool: "create_thread", completed: true }).message.defaultMessage, "Created chat");
assert.equal(presentation.n({ tool: "create_worktree", completed: true, failed: true }).message.defaultMessage, "Couldn’t complete worktree setup");
assert.equal(presentation.n({ tool: "unknown" }), null);
assert.equal(presentation.n({ tool: "read_thread" }).values.state, "active");
assert.equal(presentation.o({ className: "icon" }).props["data-agent-mode-icon"], "codex");
assert.equal(presentation.r({ namespace: "codex_app", tool: "read_thread" }).message.defaultMessage, "Reading chat");
assert.equal(presentation.t({ serverName: "codex_app", toolName: "read_thread" }), "read_thread");

// saved-memory-history: 9
const history = await bundle("saved-memory-history");
assert.deepEqual(Object.keys(history), ["SavedMemoryHistoryDialog"]);
assert.equal(find(history.SavedMemoryHistoryDialog({ isLoading: true, onClose() {} }), node => node.props?.role === "status").props.children, "Loading history…");
assert.equal(find(history.SavedMemoryHistoryDialog({ error: "Offline", onClose() {} }), node => node.props?.role === "alert").props.children, "Offline");
assert.match(text(history.SavedMemoryHistoryDialog({ onClose() {} })), /No saved versions/);
const memoryEvents = [];
const historyUi = history.SavedMemoryHistoryDialog({ onClose() { memoryEvents.push("close"); }, onDelete(version) { memoryEvents.push(["delete", version.id]); }, onRestore(version) { memoryEvents.push(["restore", version.id]); }, versions: [{ id: "old", content: "Earlier", createdAt: "2026-01-01" }, { id: "current", content: "Now", isCurrent: true }] });
assert.equal(all(historyUi, node => node.type === "li").length, 2);
assert.match(text(historyUi), /Current version/);
find(historyUi, node => node.props?.children === "Restore this version").props.onClick();
assert.deepEqual(memoryEvents[0], ["restore", "old"]);
find(historyUi, node => node.props?.children === "Delete version").props.onClick();
assert.deepEqual(memoryEvents[1], ["delete", "old"]);
find(historyUi, node => node.props?.children === "Close").props.onClick();
assert.equal(memoryEvents[2], "close");

assertReleaseOwner("artifact-preview-header");

// multiplayer-note: 6
const note = await bundle("multiplayer-note");
assert.deepEqual(Object.keys(note), ["MultiplayerNote"]);
assert.equal(find(note.MultiplayerNote({ isLoading: true, onClose() {} }), node => node.props?.role === "status").props.children, "Loading note");
assert.equal(find(note.MultiplayerNote({ error: "Denied", onClose() {} }), node => node.props?.role === "alert").props.children, "Denied");
let noteClosed = 0;
const noteUi = note.MultiplayerNote({ content: "Shared content", name: "Team note", onClose() { noteClosed++; } });
assert.equal(noteUi.props["aria-label"], "Team note");
assert.match(text(noteUi), /Shared content/);
find(noteUi, node => node.props?.children === "Close").props.onClick();
assert.equal(noteClosed, 1);

assertReleaseOwner("library-cloud-file-preview");

// open-image-preview: 6
const openImage = await bundle("open-image-preview");
assert.deepEqual(Object.keys(openImage), ["openChatGptSearchImagePreview"]);
const imageOne = { id: "one", src: "1" }, imageTwo = { id: "two", src: "2" };
let openPayload;
const imageTarget = openImage.openChatGptSearchImagePreview(imageTwo, [imageOne, imageTwo], { open(input) { openPayload = input; } });
assert.equal(imageTarget.index, 1);
assert.equal(imageTarget.image, imageTwo);
assert.equal(imageTarget.images.length, 2);
assert.equal(openPayload.index, 1);
assert.equal(openImage.openChatGptSearchImagePreview(imageOne).index, 0);

console.log("artifact preview application flow and release owner assertions passed");
