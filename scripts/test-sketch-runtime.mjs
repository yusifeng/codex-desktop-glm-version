import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return { type, props: props ?? {}, key }; } };
const React = { useSyncExternalStore(subscribe, getSnapshot) { const unsubscribe = subscribe(() => undefined); unsubscribe(); return getSnapshot(); } };
globalThis.__sketchTest = { jsx, React };
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/sketch/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "sketch-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: module === "app-shared" ? "export const I3=()=>globalThis.__sketchTest.jsx; export const e6=()=>globalThis.__sketchTest.React;" : "export {};", loader: "js" }));
  } }],
});
const sketch = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
assert.deepEqual(Object.keys(sketch), ["a", "c", "d", "f", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u"]);

assert.deepEqual(sketch.m({ bounds: { x: 10, y: 20, width: 30, height: 40 } }), { x: 25, y: 40 });
assert.deepEqual(sketch.m({ bounds: { x: 10, y: 20, width: -4, height: -8 } }), { x: 8, y: 16 });
assert.deepEqual(sketch.p({ x: 0, y: 0, width: 10, height: 10 }, 2), { x: -1, y: -1, width: 12, height: 12 });
assert.deepEqual(sketch.p({ x: 0, y: 0, width: 10, height: 10 }, 0), { x: -7, y: -7, width: 24, height: 24 });
const comments = sketch.d({ schemaVersion: 1, objects: [{ id: "c", kind: "comment", text: "One", bounds: { x: 0, y: 0, width: 1, height: 1 } }, { id: "r", kind: "rectangle", bounds: { x: 0, y: 0, width: 1, height: 1 }, style: { color: "red", width: 2 } }] });
assert.equal(comments.length, 1);
assert.equal(comments[0].id, "c");

const editor = sketch.n({ eraserSizePx: 500, drawingWidthPx: 0, textSizePx: 200, style: { color: "#123456", width: 100 } });
assert.equal(editor.getSnapshot().document.schemaVersion, 1);
assert.equal(editor.getSnapshot().document.objects.length, 0);
assert.equal(editor.getSnapshot().activeTool, "pen");
assert.equal(editor.getSnapshot().eraserSizePx, 96);
assert.equal(editor.getSnapshot().drawingWidthPx, 1);
assert.equal(editor.getSnapshot().textSizePx, 128);
assert.deepEqual(editor.getSnapshot().style, { color: "#123456", width: 48 });
assert.equal(editor.getSnapshot().canUndo, false);
assert.equal(editor.getSnapshot().canRedo, false);
let notifications = 0;
const unsubscribe = editor.subscribe(() => notifications++);
editor.setEraserSize(1);
assert.equal(editor.getSnapshot().eraserSizePx, 4);
editor.setDrawingWidth(50);
assert.equal(editor.getSnapshot().drawingWidthPx, 32);
editor.setTextSize(2);
assert.equal(editor.getSnapshot().textSizePx, 8);
assert.equal(notifications, 3);

const commentId = editor.insertComment({ text: "  note  ", bounds: { x: 20, y: 30, width: 10, height: 12 } });
assert.equal(typeof commentId, "string");
assert.equal(editor.getSnapshot().document.objects[0].text, "note");
assert.equal(editor.getSnapshot().selectionId, commentId);
assert.equal(editor.updateComment(commentId, " changed "), true);
assert.equal(editor.getSnapshot().document.objects[0].text, "changed");
assert.equal(editor.updateComment(commentId, "   "), false);
assert.equal(editor.insertComment({ text: "", bounds: { x: 0, y: 0, width: 1, height: 1 } }), null);
assert.equal(editor.insertComment({ text: "bad", bounds: { x: 0, y: 0, width: 0, height: 1 } }), null);

const textId = editor.insertTextBox({ text: "  hello\r\nworld  ", bounds: { x: 50, y: 50, width: -20, height: -10 }, style: { color: "blue" }, format: { bold: true } });
assert.equal(typeof textId, "string");
assert.equal(editor.getSnapshot().activeTool, "select");
assert.equal(editor.getSnapshot().document.objects[1].text, "hello\nworld");
assert.deepEqual(editor.getSnapshot().document.objects[1].bounds, { x: 30, y: 40, width: 20, height: 10 });
assert.equal(editor.getSnapshot().document.objects[1].style.color, "blue");
assert.equal(editor.getSnapshot().document.objects[1].format.bold, true);
assert.equal(editor.updateTextBox(textId, { text: "updated" }), true);
assert.equal(editor.getSnapshot().document.objects[1].text, "updated");
editor.setTextFormat({ italic: true });
assert.equal(editor.getSnapshot().document.objects[1].format.italic, true);
editor.setStyle({ color: "green", width: 20 });
assert.equal(editor.getSnapshot().document.objects[1].style.color, "green");
assert.equal(editor.getSnapshot().document.objects[1].style.width, 20);
assert.equal(editor.nudgeSelection({ x: 5, y: -2 }), true);
assert.deepEqual(editor.getSnapshot().document.objects[1].bounds, { x: 35, y: 38, width: 20, height: 10 });
assert.equal(editor.getObjectAtPoint({ x: 40, y: 40 })?.id, textId);
assert.equal(editor.getObjectAtPoint({ x: 500, y: 500 }), null);

const pastedId = editor.pasteObject(editor.getSnapshot().document.objects[1], { offset: { x: 3, y: 4 } });
assert.equal(typeof pastedId, "string");
assert.notEqual(pastedId, textId);
assert.deepEqual(editor.getSnapshot().document.objects[2].bounds, { x: 38, y: 42, width: 20, height: 10 });
assert.equal(editor.pasteObject({ id: "erase", kind: "eraser", points: [], width: 2 }), null);
assert.equal(editor.selectObject("missing"), false);
assert.equal(editor.selectObject(textId), true);
editor.clearSelection();
assert.equal(editor.getSnapshot().selectionId, null);
assert.equal(editor.deleteSelection(), false);
assert.equal(editor.selectObject(pastedId), true);
assert.equal(editor.deleteSelection(), true);
assert.equal(editor.getSnapshot().document.objects.length, 2);
assert.equal(editor.undo(), true);
assert.equal(editor.getSnapshot().document.objects.length, 3);
assert.equal(editor.getSnapshot().canRedo, true);
assert.equal(editor.redo(), true);
assert.equal(editor.getSnapshot().document.objects.length, 2);

editor.setPendingTextEdit({ text: " draft ", bounds: { x: 1, y: 2, width: 30, height: 20 } });
assert.equal(editor.getSnapshot().hasPendingTextEdit, true);
assert.equal(editor.commitPendingTextEdit(), true);
assert.equal(editor.getSnapshot().hasPendingTextEdit, false);
assert.equal(editor.getSnapshot().document.objects.at(-1).text, "draft");
editor.setPendingTextEdit({ objectId: textId, text: "pending update", bounds: { x: 1, y: 2, width: 5, height: 6 } });
assert.equal(editor.discardPendingTextEdit(), true);
assert.equal(editor.discardPendingTextEdit(), false);

editor.setTool("rectangle");
assert.equal(editor.pointerDown({ pointerId: 1, point: { x: 100, y: 100 } }), true);
assert.equal(editor.getSnapshot().hasActiveGesture, true);
assert.equal(editor.getSnapshot().preview.object.kind, "rectangle");
assert.equal((await editor.export()).kind, "busy");
assert.equal(editor.pointerMove({ pointerId: 2, point: { x: 120, y: 130 } }), false);
assert.equal(editor.pointerMove({ pointerId: 1, point: { x: 120, y: 130 } }), true);
assert.deepEqual(editor.getSnapshot().preview.object.bounds, { x: 100, y: 100, width: 20, height: 30 });
assert.equal(editor.pointerUp({ pointerId: 1, point: { x: 125, y: 135 } }), true);
assert.equal(editor.getSnapshot().hasActiveGesture, false);
assert.equal(editor.getSnapshot().activeTool, "select");
assert.equal(editor.getSnapshot().document.objects.at(-1).kind, "rectangle");

editor.setTool("pen");
assert.equal(editor.pointerDown({ pointerId: 3, point: { x: 0, y: 0 } }), true);
assert.equal(editor.pointerMoves([{ pointerId: 3, point: { x: 2, y: 2 } }, { pointerId: 3, point: { x: 4, y: 4 } }]), true);
assert.equal(editor.pointerCommit(4), false);
assert.equal(editor.pointerCommit(3), true);
assert.equal(editor.getSnapshot().document.objects.at(-1).kind, "stroke");
assert.equal(editor.getSnapshot().document.objects.at(-1).points.length, 3);
editor.setTool("line");
editor.pointerDown({ pointerId: 4, point: { x: 5, y: 5 } });
assert.equal(editor.pointerCancel(5), false);
assert.equal(editor.pointerCancel(4), true);
assert.equal(editor.getSnapshot().hasActiveGesture, false);

editor.setTool("eraser");
editor.setEraserSize(30);
editor.pointerDown({ pointerId: 6, point: { x: 110, y: 110 } });
editor.pointerUp({ pointerId: 6, point: { x: 110, y: 110 } });
assert.equal(editor.getSnapshot().document.objects.some(object => object.kind === "rectangle"), false);
assert.equal(editor.undo(), true);
assert.equal(editor.getSnapshot().document.objects.some(object => object.kind === "rectangle"), true);

const snapshotViaHook = sketch.l(editor);
assert.equal(snapshotViaHook, editor.getSnapshot());
const surface = sketch.o({ editor, surfaceSize: { width: 640, height: 480 }, className: "canvas", "aria-label": "Sketch" });
assert.equal(surface.type, "div");
assert.equal(surface.props.role, "application");
assert.equal(surface.props.className, "canvas");
assert.equal(surface.props.style.width, 640);
assert.equal(surface.props.style.height, 480);
assert.equal(surface.props["data-sketch-tool"], editor.getSnapshot().activeTool);
assert.equal(surface.props.children.length, editor.getSnapshot().document.objects.length);

const exported = await editor.export({ padding: 0, scale: 2, backgroundColor: "#fff", mimeType: "image/svg+xml" });
assert.equal(exported.kind, "success");
assert.equal(exported.blob.type, "image/svg+xml");
assert.ok(exported.width > 0);
assert.ok(exported.height > 0);
assert.match(await exported.blob.text(), /<svg/);
assert.match(await exported.blob.text(), /fill="#fff"/);
const tooLarge = await sketch.i({ schemaVersion: 1, objects: [{ id: "huge", kind: "rectangle", bounds: { x: 0, y: 0, width: 5000, height: 5000 }, style: { color: "black", width: 2 } }] }, { padding: 0 });
assert.equal(tooLarge.kind, "too-large");
const smallDocument = { schemaVersion: 1, objects: [{ id: "small", kind: "rectangle", bounds: { x: 0, y: 0, width: 10, height: 10 }, style: { color: "black", width: 2 } }] };
assert.equal((await sketch.i(smallDocument, { padding: 0 })).kind, "unavailable");
assert.equal((await sketch.i(smallDocument, { clipBounds: { x: 20, y: 20, width: 5, height: 5 }, mimeType: "image/svg+xml" })).kind, "empty");
assert.equal((await sketch.i({ schemaVersion: 1, objects: [] })).kind, "empty");
assert.equal((await sketch.i({ schemaVersion: 1, objects: [{ id: "only-comment", kind: "comment", text: "x", bounds: { x: 0, y: 0, width: 5, height: 5 } }] })).kind, "empty");

const replacement = { schemaVersion: 1, objects: [{ id: "new", kind: "comment", text: "new", bounds: { x: 1, y: 1, width: 2, height: 2 } }] };
editor.replaceDocument(replacement);
assert.equal(editor.getSnapshot().document, replacement);
assert.equal(editor.getSnapshot().canUndo, false);
assert.equal(editor.clear(), true);
assert.equal(editor.getSnapshot().document.objects.length, 0);
assert.equal(editor.clear(), false);
const detach = editor.attachTextLayoutResources({});
assert.equal(typeof detach, "function");
assert.equal(detach(), undefined);
unsubscribe();
assert.ok(notifications > 20);
for (const initializer of ["a", "c", "f", "h", "r", "s", "t", "u"]) assert.equal(sketch[initializer](), undefined);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(`${assertionCount} sketch runtime assertions passed`);
