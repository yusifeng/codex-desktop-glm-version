import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/interactive-chart/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const staticDependencies = [
  ...source.matchAll(/from\s+"@rchunk\/([^"]+)"/g),
  ...source.matchAll(/import\s+"@rchunk\/([^"]+)"/g),
].map((match) => match[1]).sort();
const dynamicDependencies = [...source.matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map((match) => match[1]).sort();
assert.deepEqual(staticDependencies, [
  "app-shared", "build-graph-data", "chartjs-dataset-helpers", "color-roles",
  "format-coordinate", "interactive-sampling", "learning-block-pointer-label",
  "linear", "render-cache-key", "rolldown-runtime",
]);
assert.deepEqual(dynamicDependencies, ["chartjs-plugin-zoom", "hammer-runtime"]);
assert.equal(/\bany\b/.test(source), false);
assert.equal(/import\s+\*\s+as\s+/.test(source), false);
assert.equal(source.includes("./hammer-edb1316c3532.js"), true);
assert.equal(source.includes("./hammer-af276e28ba3d.js"), true);
assert.equal(source.includes("./chartjs-plugin-zoom.esm-de28aa5862dc.js"), true);
assert.equal(source.includes("./helpers.dataset-876f4b17664a.js"), true);
assert.equal(source.includes("React.useMemo"), true);
assert.equal(source.includes("React.useCallback"), true);
assert.equal(source.includes("export { initializeInteractiveChart as n, InteractiveChart as t }"), true);
assert.equal(source.includes("initializeInteractiveChart();"), true);

const runtimeState = { initCalls: [], preloads: [], samples: [], stateSlots: [], refSlots: [], effectSlots: [], hookIndex: 0 };
const jsxRuntime = {
  Fragment: Symbol("Fragment"),
  jsx(type, props, key) { return { type, props, key }; },
  jsxs(type, props, key) { return { type, props, key }; },
};
function sameDependencies(left, right) {
  return left != null && right != null && left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
}
const reactRuntime = {
  useCallback(callback) { runtimeState.hookIndex += 1; return callback; },
  useEffect(effect, dependencies) {
    const index = runtimeState.hookIndex++;
    if (!sameDependencies(runtimeState.effectSlots[index], dependencies)) {
      runtimeState.effectSlots[index] = dependencies;
      effect();
    }
  },
  useMemo(factory) { runtimeState.hookIndex += 1; return factory(); },
  useRef(value) {
    const index = runtimeState.hookIndex++;
    runtimeState.refSlots[index] ??= { current: value };
    return runtimeState.refSlots[index];
  },
  useState(value) {
    const index = runtimeState.hookIndex++;
    if (!(index in runtimeState.stateSlots)) runtimeState.stateSlots[index] = typeof value === "function" ? value() : value;
    return [runtimeState.stateSlots[index], (next) => {
      runtimeState.stateSlots[index] = typeof next === "function" ? next(runtimeState.stateSlots[index]) : next;
    }];
  },
};

function mockModule(name) {
  if (name === "app-shared") return [
    "export const H3 = () => globalThis.__chartTest.initCalls.push('preload');",
    "export const I3 = () => globalThis.__chartTest.jsxRuntime;",
    "export const K2 = () => globalThis.__chartTest.initCalls.push('ui');",
    "export const V3 = async (load, dependencies) => { globalThis.__chartTest.preloads.push(dependencies); return load(); };",
    "export const e6 = () => globalThis.__chartTest.reactRuntime;",
    "export const n4 = () => ({ formatMessage: ({ defaultMessage }) => defaultMessage });",
  ].join("\n");
  if (name === "build-graph-data") return [
    "export const a = () => globalThis.__chartTest.initCalls.push('build-graph-data');",
    "export const n = (_rpn, x, constants) => x * (constants.multiplier ?? 1);",
    "export const o = { width: 360, height: 220, padding: 0 };",
  ].join("\n");
  if (name === "interactive-sampling") return [
    "export const r = () => globalThis.__chartTest.initCalls.push('interactive-sampling');",
    "export const t = (options) => { globalThis.__chartTest.samples.push(options); return { segments: [[{ x: -1, y: -1 }, { x: 1, y: 1 }]] }; };",
  ].join("\n");
  if (name === "render-cache-key") return [
    "export const r = () => globalThis.__chartTest.initCalls.push('render-cache-key');",
    "export const t = (_rpn, constants) => 'definition:' + JSON.stringify(constants);",
  ].join("\n");
  if (name === "format-coordinate") return [
    "export const r = () => globalThis.__chartTest.initCalls.push('format-coordinate');",
    "export const t = (value, precision = 2) => Number(value).toFixed(precision);",
  ].join("\n");
  if (name === "linear") return "export const t = () => globalThis.__chartTest.initCalls.push('linear');";
  if (name === "learning-block-pointer-label") return "export const u = () => globalThis.__chartTest.initCalls.push('pointer-label');";
  if (name === "color-roles") return "export const r = () => globalThis.__chartTest.initCalls.push('color-roles');";
  if (name === "chartjs-plugin-zoom") return "export default { id: 'zoom' };";
  if (name === "hammer-runtime") return "export default { id: 'hammer' };";
  return "export {};";
}

globalThis.__chartTest = { ...runtimeState, jsxRuntime, reactRuntime };
globalThis.window = {};
const result = await esbuild.build({
  entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "interactive-chart-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mockModule(importPath), loader: "js" }));
  } }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
await Promise.resolve();
await Promise.resolve();
assert.deepEqual(Object.keys(module), ["n", "t"]);
assert.deepEqual(runtimeState.initCalls, [
  "linear", "ui", "color-roles", "pointer-label", "build-graph-data",
  "format-coordinate", "render-cache-key", "interactive-sampling", "preload",
]);
assert.equal(runtimeState.preloads.length, 2);
assert.deepEqual(runtimeState.preloads[0], ["./hammer-edb1316c3532.js", "./hammer-af276e28ba3d.js", "./rolldown-runtime-2d059c5e81f4.js"]);
assert.deepEqual(runtimeState.preloads[1], ["./chartjs-plugin-zoom.esm-de28aa5862dc.js", "./rolldown-runtime-2d059c5e81f4.js", "./helpers.dataset-876f4b17664a.js", "./hammer-af276e28ba3d.js"]);
module.n();
assert.equal(runtimeState.initCalls.length, 9);

const dragCalls = [];
let panCalls = 0;
let resetCalls = 0;
const props = {
  viewport: { xDomain: [-10, 10], yDomain: [-5, 5] },
  viewportUpdateMode: "preserve",
  points: [{ x: 0, y: 0, label: "origin" }],
  series: [{ id: "primary", rpn: [{ type: "identifier", value: "x" }], constants: { multiplier: 2 }, stroke: "red" }],
  geometrySegments: [{ from: { x: -1, y: 0 }, to: { x: 1, y: 0 }, label: "segment" }],
  geometryCircles: [{ center: { x: 0, y: 0 }, radius: 2 }],
  rightAngleMarkers: [{ vertex: { x: 1, y: 1 } }],
  pathOverlays: [{ paths: [{ points: [{ x: -2, y: -2 }, { x: 2, y: -2 }], closed: true }] }],
  shadedArea: { seriesId: "primary", xStart: -1, xEnd: 1 },
  showPointLabels: true,
  onDragPoint(index, delta, point) { dragCalls.push({ index, delta, point }); },
  onViewportPan() { panCalls += 1; },
  onViewportReset() { resetCalls += 1; },
};
function render() { runtimeState.hookIndex = 0; return module.t(props); }
function children(node) { return Array.isArray(node?.props?.children) ? node.props.children.flat(Infinity).filter(Boolean) : node?.props?.children == null ? [] : [node.props.children]; }
function find(node, predicate) {
  if (node == null || typeof node !== "object") return null;
  if (predicate(node)) return node;
  for (const child of children(node)) { const match = find(child, predicate); if (match != null) return match; }
  return null;
}
function findAll(node, predicate, found = []) {
  if (node == null || typeof node !== "object") return found;
  if (predicate(node)) found.push(node);
  for (const child of children(node)) findAll(child, predicate, found);
  return found;
}
function eventAt(clientX, clientY, extra = {}) {
  return {
    clientX, clientY, pointerId: 7,
    currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 360, height: 220 }), setPointerCapture() {}, releasePointerCapture() {} },
    preventDefault() {}, stopPropagation() {}, ...extra,
  };
}

let tree = render();
const svg = find(tree, (node) => node.type === "svg");
assert.equal(svg.props.role, "img");
assert.equal(svg.props["data-definition-key"], 'primary:0=definition:{"multiplier":2}');
assert.equal(runtimeState.samples.length, 1);
assert.deepEqual(runtimeState.samples[0].forcedXs, [0]);
assert.deepEqual(runtimeState.samples[0].viewport, props.viewport);
assert.equal(findAll(tree, (node) => node.props?.["data-series-id"] === "primary").length, 1);
assert.equal(findAll(tree, (node) => node.props?.["data-layer"] === "geometry-segment").length, 1);
assert.equal(findAll(tree, (node) => node.props?.["data-layer"] === "geometry-circle").length, 1);
assert.equal(findAll(tree, (node) => node.props?.["data-layer"] === "right-angle-marker").length, 1);
assert.equal(findAll(tree, (node) => node.props?.["data-layer"] === "path-overlay").length, 1);
assert.equal(findAll(tree, (node) => node.props?.["data-layer"] === "shaded-area").length, 1);
assert.equal(find(tree, (node) => node.type === "text" && node.props?.children === "origin") != null, true);

svg.props.onPointerMove(eventAt(180, 110));
tree = render();
assert.equal(find(tree, (node) => node.props?.role === "status") != null, true);
assert.equal(find(tree, (node) => node.props?.["data-layer"] === "hover-point") != null, true);

let activeSvg = find(tree, (node) => node.type === "svg");
activeSvg.props.onPointerDown(eventAt(180, 110));
activeSvg.props.onPointerMove(eventAt(198, 88));
assert.equal(dragCalls.length, 1);
assert.equal(dragCalls[0].index, 0);
assert.deepEqual(dragCalls[0].delta, { dx: 1, dy: 1 });
assert.deepEqual(dragCalls[0].point, { x: 1, y: 1 });
activeSvg.props.onPointerUp(eventAt(198, 88));

activeSvg.props.onWheel(eventAt(180, 110, { deltaY: -1 }));
assert.equal(panCalls, 1);
tree = render();
const resetButton = find(tree, (node) => node.type === "button");
assert.equal(resetButton.props.disabled, false);
resetButton.props.onClick();
assert.equal(resetCalls, 1);
tree = render();
assert.equal(find(tree, (node) => node.type === "button").props.disabled, true);

console.log("interactive-chart tests passed (40 assertions)");
