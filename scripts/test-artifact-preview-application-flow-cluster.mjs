import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__artifactPreviewFlowTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "artifact-preview-flow-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__artifactPreviewFlowTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
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
assert.equal(presentation.a("create_chat", "active"), "Creating chat");
assert.equal(presentation.a("create_chat", "completed"), "Created chat");
assert.equal(presentation.a("create_worktree", "failed"), "Couldn’t complete worktree setup");
assert.equal(presentation.a("unknown", "active"), "Working");
assert.equal(presentation.i({ started: 2, total: 5 }), "2 of 5");
assert.equal(presentation.o("failedFollowing"), "danger");
assert.equal(presentation.o("completed"), "success");
assert.equal(presentation.r("send_message"), "Send message");
assert.match(text(presentation.t({ tool: "read_chat", state: "active", progress: { started: 1, total: 3 } })), /Reading chat\s+· 1 of 3/);

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

// artifact-preview-header: 9
const previewHeader = await bundle("artifact-preview-header");
assert.deepEqual(Object.keys(previewHeader), ["n", "r", "t"]);
assert.deepEqual(await previewHeader.r(async () => {}), { ok: true });
assert.deepEqual(await previewHeader.r(async () => { throw new Error("nope"); }), { ok: false, error: "Could not download artifact" });
let headerEvent;
const headerUi = previewHeader.t({ title: "Report", openTargets: [{ id: "drive", label: "Drive" }], onOpen(id) { headerEvent = id; }, onDownload() { headerEvent = "download"; }, onReveal() { headerEvent = "reveal"; } });
assert.match(text(headerUi), /Report/);
find(headerUi, node => node.props?.children === "Open in Drive").props.onClick();
assert.equal(headerEvent, "drive");
find(headerUi, node => node.props?.children === "Open in folder").props.onClick();
assert.equal(headerEvent, "reveal");
await find(headerUi, node => node.props?.children === "Download").props.onClick();
assert.equal(headerEvent, "download");
assert.equal(find(previewHeader.t({ downloading: true }), node => node.props?.children === "Downloading…").props.disabled, true);
assert.equal(find(previewHeader.t({ canDownload: false }), node => node.props?.children === "Download").props.disabled, true);

// artifact-annotation-batch-controls: 9
const annotations = await bundle("artifact-annotation-batch-controls");
assert.deepEqual(Object.keys(annotations), ["a", "i", "n", "o", "r", "s", "t"]);
const annotationEvents = [];
const annotationUi = annotations.t({ annotations: [{ id: "one", selected: false }, { id: "two", selected: true }], currentIndex: 1, onNavigate(index) { annotationEvents.push(index); }, onSend(items) { annotationEvents.push(items.map(item => item.id)); }, onUndo() { annotationEvents.push("undo"); } });
assert.match(text(annotationUi), /2 annotations/);
assert.equal(find(annotationUi, node => node.props?.children === "Next request").props.disabled, true);
find(annotationUi, node => node.props?.children === "Previous request").props.onClick();
assert.equal(annotationEvents[0], 0);
find(annotationUi, node => node.props?.children === "Undo").props.onClick();
assert.equal(annotationEvents[1], "undo");
await find(annotationUi, node => node.props?.children === "Send").props.onClick();
assert.deepEqual(annotationEvents[2], ["two"]);
assert.equal(find(annotations.t({ annotations: [], busy: true }), node => node.props?.children === "Stop").type, "button");
assert.equal(find(annotations.t({ annotations: [] }), node => node.props?.children === "Send").props.disabled, true);
assert.equal(typeof annotations.n, "function");

// artifact-tab-content-electron: 10
const artifactTab = await bundle("artifact-tab-content-electron");
assert.deepEqual(Object.keys(artifactTab), ["a", "i", "n", "o", "r", "s", "t"]);
assert.match(text(artifactTab.t({ isLoading: true })), /Loading artifact/);
let retried = 0;
const artifactError = artifactTab.t({ error: "Broken", onRetry() { retried++; } });
assert.equal(find(artifactError, node => node.props?.role === "alert").type, "div");
find(artifactError, node => node.props?.children === "Try again").props.onClick();
assert.equal(retried, 1);
let editPrompt;
const artifactUi = artifactTab.t({ annotations: [{ id: "a", prompt: "Polish design" }], content: "slide", kind: "presentation", status: "ready", title: "Deck", version: "v2", onRequestEdit(prompt) { editPrompt = prompt; } });
assert.equal(artifactUi.props["data-artifact-kind"], "presentation");
assert.equal(artifactUi.props["aria-label"], "Deck");
assert.match(text(artifactUi), /Deck v2/);
assert.equal(find(artifactUi, node => node.props?.["data-status"] === "ready").props.children, "slide");
find(artifactUi, node => node.props?.children === "Polish design").props.onClick();
assert.equal(editPrompt, "Polish design");
assert.equal(all(artifactUi, node => node.type === "li").length, 1);

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

// multiplayer-writing-block: 5
const writing = await bundle("multiplayer-writing-block");
assert.deepEqual(Object.keys(writing), ["MultiplayerWritingBlock"]);
let opened = 0;
const writingUi = writing.MultiplayerWritingBlock({ content: "Draft", name: "Shared note", onOpen() { opened++; } });
assert.equal(writingUi.props["aria-label"], "Shared note");
assert.match(text(writingUi), /Draft/);
find(writingUi, node => node.props?.children === "Open note").props.onClick();
assert.equal(opened, 1);
assert.equal(find(writing.MultiplayerWritingBlock({}), node => node.props?.children === "Open note").type, "button");

// library-cloud-file-preview: 13
const cloudPreview = await bundle("library-cloud-file-preview");
assert.deepEqual(Object.keys(cloudPreview), ["a", "c", "i", "n", "o", "r", "s", "t"]);
assert.equal(cloudPreview.c(), undefined);
assert.equal(cloudPreview.o(), undefined);
assert.equal(cloudPreview.r(), undefined);
const cloudEvents = [];
const cloudFile = { fileId: "f", fileName: "report.pdf", favorite: false, sizeBytes: 30 };
const cloudUi = cloudPreview.n({ file: cloudFile, maxLocalTaskBytes: 20, preview: "preview", onAsk(file) { cloudEvents.push(["ask", file.fileId]); }, onDownload(file) { cloudEvents.push(["download", file.fileId]); }, onFavoriteChange(value) { cloudEvents.push(["favorite", value]); }, onShare(file) { cloudEvents.push(["share", file.fileId]); } });
assert.equal(cloudUi.props["data-preview-state"], "ready");
assert.match(text(cloudUi), /File too large for a local task/);
find(cloudUi, node => node.props?.children === "Add to Favorites").props.onClick();
assert.deepEqual(cloudEvents[0], ["favorite", true]);
find(cloudUi, node => node.props?.children === "Download file").props.onClick();
assert.deepEqual(cloudEvents[1], ["download", "f"]);
find(cloudUi, node => node.props?.children === "Share file").props.onClick();
assert.deepEqual(cloudEvents[2], ["share", "f"]);
assert.equal(find(cloudPreview.i({ file: cloudFile, isLoading: true }), node => node.props?.role === "status").props.children, "Loading preview");
assert.equal(find(cloudPreview.a({ file: cloudFile, error: "Offline" }), node => node.props?.role === "alert").type, "div");
assert.match(text(cloudPreview.s({ file: cloudFile })), /Preview not available/);
assert.equal(typeof cloudPreview.t, "function");

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

console.log("86 artifact preview application flow cluster assertions passed");
