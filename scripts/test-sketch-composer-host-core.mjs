import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/sketch-composer-host-core/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const state = globalThis.__sketchHostTest = { stateCursor: 0, stateValues: [], refCursor: 0, refs: [], id: 0, completed: [] };
state.jsx = { Fragment: "Fragment", jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) };
state.react = {
  useEffect(effect) { effect(); },
  useId() { return `id-${++state.id}`; },
  useLayoutEffect(effect) { effect(); },
  useRef(initial) { const index = state.refCursor++; return state.refs[index] ??= { current: initial }; },
  useState(initial) { const index = state.stateCursor++; const value = state.stateValues[index] ?? (typeof initial === "function" ? initial() : initial); return [value, next => { state.stateValues[index] = typeof next === "function" ? next(value) : next; }]; },
  useSyncExternalStore(_subscribe, getSnapshot) { return getSnapshot(); },
};
const mocks = {
  "app-shared": `export const I3 = () => globalThis.__sketchHostTest.jsx; export const e6 = () => globalThis.__sketchHostTest.react; export const P3 = () => ({ createPortal(node, container) { return { portal: true, node, container }; } });`,
  "app-initial": "export {};",
  "drawing-size-slider": "export {};",
  sketch: `export const l = editor => editor.getSnapshot(); export const o = props => ({ type: "SketchCanvas", props }); export const t = () => "not-the-canvas";`,
};
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "sketch-host-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mocks[importPath] ?? "export {};", loader: "js" })); } }] });
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
assert.deepEqual(Object.keys(module).sort(), ["a", "c", "d", "i", "l", "n", "o", "r", "s", "t", "u"]);
for (const initializer of [module.l, module.r, module.s, module.u]) assert.equal(initializer(), undefined);
assert.equal(module.d.title.defaultMessage, "Sketch editor");
assert.equal(module.d.canvas.defaultMessage, "Sketch canvas");

function reset() { state.stateCursor = 0; state.stateValues = []; state.refCursor = 0; state.refs = []; }
function flatten(node, output = []) { if (node == null || typeof node !== "object") return output; output.push(node); const children = node.props?.children; if (Array.isArray(children)) children.forEach(child => flatten(child, output)); else flatten(children, output); return output; }
const actions = [];
const snapshot = { activeTool: "eraser", document: { objects: [{ id: "text-1", kind: "text" }] }, style: { color: "#dc2626", width: 4 }, selectionId: null, drawingWidthPx: 4, eraserSizePx: 24, textSizePx: 20, canUndo: true, canRedo: true };
const editor = { getSnapshot: () => snapshot, setStyle: (style, options) => actions.push(["style", style, options]), setTool: tool => { actions.push(["tool", tool]); snapshot.activeTool = tool; }, setDrawingWidth: value => actions.push(["width", value]), setEraserSize: value => actions.push(["eraser", value]), setTextSize: value => actions.push(["text", value]), commitPendingTextEdit: () => actions.push(["commit"]), undo: () => actions.push(["undo"]), redo: () => actions.push(["redo"]) };

const toolbar = module.a({ label: "Pen", pressed: true, onClick: () => actions.push(["button"]) });
assert.equal(toolbar.type, "button");
assert.equal(toolbar.props["aria-pressed"], true);
toolbar.props.onClick();

reset();
let colors = module.c({ editor, snapshot, isDarkMode: false, open: false, onOpenChange: open => actions.push(["color-open", open]) });
assert.equal(colors.type, "fieldset");
let nodes = flatten(colors);
const green = nodes.find(node => node.props?.style?.backgroundColor === "#16a34a");
green.props.onClick();
assert.deepEqual(actions.at(-2), ["style", { color: "#16a34a" }, { historyGroup: "sketch-color" }]);
assert.deepEqual(actions.at(-1), ["tool", "pen"]);
const customInput = nodes.find(node => node.type === "input" && node.props.type === "color");
customInput.props.onInput({ currentTarget: { value: "#123456" } });
assert.equal(actions.some(action => action[0] === "color-open" && action[1] === true), true);
assert.equal(actions.some(action => action[0] === "style" && action[1].color === "#123456"), true);

reset();
let tools = module.o({ activeTool: "rectangle", open: true, onOpenChange: open => actions.push(["tools-open", open]), onToolChange: tool => actions.push(["choose", tool]) });
nodes = flatten(tools);
assert.equal(nodes.some(node => node.props?.role === "menu"), true);
const heartElement = nodes.find(node => node.type?.name === "SketchToolbarButton" && node.props.label === "Heart");
heartElement.type(heartElement.props).props.onClick();
assert.deepEqual(actions.at(-2), ["choose", "heart"]);
assert.deepEqual(actions.at(-1), ["tools-open", false]);

snapshot.activeTool = "eraser";
let size = module.i({ editor, snapshot });
assert.equal(size.props["data-control-type"], "eraser");
flatten(size).find(node => node.type === "input").props.onChange({ currentTarget: { valueAsNumber: 40 } });
assert.deepEqual(actions.at(-1), ["eraser", 40]);
snapshot.activeTool = "text";
size = module.i({ editor, snapshot });
assert.equal(size.props["data-control-type"], "text");
snapshot.activeTool = "pen";
size = module.i({ editor, snapshot, viewportScale: 2 });
assert.equal(size.props["data-control-type"], "stroke");

let kept = 0; let discarded = 0;
const discardDialog = module.n({ onKeepEditing: () => kept++, onDiscard: () => discarded++ });
nodes = flatten(discardDialog);
nodes.find(node => node.props?.children === "Keep editing").props.onClick();
nodes.find(node => node.props?.children === "Discard changes").props.onClick();
assert.equal(kept, 1); assert.equal(discarded, 1);

const composerSnapshot = { active: { id: "sketch-1", editor, uploadId: "upload-1", saving: null }, confirmingDiscard: true, transition: { targetUploadId: "upload-1", imageUrl: "data:image/png;base64,AA==", source: { backgroundColor: "#fff", borderRadius: 12, height: 100, left: 10, top: 20, width: 120 } } };
const composerState = { subscribe: () => () => {}, getSnapshot: () => composerSnapshot, requestClose: () => actions.push(["close"]), save: () => actions.push(["save"]), discard: () => actions.push(["discard"]), keepEditing: () => actions.push(["keep"]), completeTransition: transition => state.completed.push(transition) };
reset();
const host = module.t({ state: composerState, canOpenSketch: true, canEditSketch: true, isDarkMode: false });
assert.equal(host.type, "Fragment");
assert.equal(host.props.children.length, 3);
const editorElement = host.props.children[0];
assert.equal(editorElement.type.name, "SketchEditorSurface");
const editorTree = editorElement.type(editorElement.props);
assert.equal(editorTree.props.role, "dialog");
assert.equal(JSON.stringify(editorTree).includes("Attach sketch"), true);
const transitionElement = host.props.children[2];
transitionElement.type(transitionElement.props);
assert.equal(state.completed.length, 1);

assert.match(source, /const SketchCanvas = sketch\.o/);
assert.match(source, /ResizeObserver/);
assert.match(source, /data-attachment-transition-target/);
assert.match(source, /commitPendingTextEdit/);
assert.doesNotMatch(source, /kind:\s*["']sketch-composer-host/);

console.log("38 sketch composer host core assertions passed");
