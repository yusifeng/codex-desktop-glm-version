import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sources = {
  metrics: path.join(ROOT, "src/renderer/binary-classification-metrics/index.ts"),
  video: path.join(ROOT, "src/renderer/chatgpt-video-lightbox/index.ts"),
  mermaid: path.join(ROOT, "src/renderer/chatgpt-mermaid-preview-core/index.ts"),
};

function dependencySurface(sourcePath) {
  const source = fs.readFileSync(sourcePath, "utf8");
  return {
    source,
    staticDependencies: [...new Set([
      ...source.matchAll(/from\s+"@rchunk\/([^"]+)"/g),
      ...source.matchAll(/import\s+"@rchunk\/([^"]+)"/g),
    ].map((match) => match[1]))].sort(),
    dynamicDependencies: [...source.matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map((match) => match[1]).sort(),
  };
}

const metricsSurface = dependencySurface(sources.metrics);
const videoSurface = dependencySurface(sources.video);
const mermaidSurface = dependencySurface(sources.mermaid);
assert.deepEqual(metricsSurface.staticDependencies, ["rolldown-runtime"]);
assert.deepEqual(metricsSurface.dynamicDependencies, []);
assert.deepEqual(videoSurface.staticDependencies, ["app-initial", "app-shared", "rolldown-runtime"]);
assert.deepEqual(videoSurface.dynamicDependencies, []);
assert.deepEqual(mermaidSurface.staticDependencies, ["app-initial", "app-shared", "image", "rolldown-runtime"]);
assert.deepEqual(mermaidSurface.dynamicDependencies, ["mermaid-editable-preview"]);
for (const source of [metricsSurface.source, videoSurface.source, mermaidSurface.source]) {
  assert.equal(/\bany\b/.test(source), false);
  assert.equal(/import\s+\*\s+as\s+/.test(source), false);
}
assert.equal(metricsSurface.source.includes("initializeBinaryClassificationMetrics as n, computeBinaryClassificationMetric as t"), true);
assert.equal(videoSurface.source.includes("export { ChatGptVideoLightbox }"), true);
assert.equal(mermaidSurface.source.includes("initializeChatGptMermaidPreview as n, ChatGptMermaidPreview as t"), true);
for (const dependency of [
  "./editable-preview-8cca22390870.js",
  "./rolldown-runtime-2d059c5e81f4.js",
  "./app-shared-7b9edc1bfb7f.js",
  "./app-shared-fa570b9eb9dd.css",
  "./app-initial-51da50e6c6e3.js",
  "./app-initial-e8ceb32eb626.css",
  "./image-1b6037d6ba79.js",
  "./chunk-ZW26E7AF-c8fea83f7f61.js",
  "./chart-colors-7214911051c2.js",
]) assert.equal(mermaidSurface.source.includes(dependency), true);

async function bundleAndImport(sourcePath, mockModule) {
  const result = await esbuild.build({
    entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "artifact-preview-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mockModule(importPath), loader: "js" }));
    } }],
  });
  return import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
}

const metrics = await bundleAndImport(sources.metrics, () => "export {};");
assert.deepEqual(Object.keys(metrics), ["n", "t"]);
metrics.n();
const matrix = { tp: 30, fp: 10, tn: 50, fn: 5 };
const accuracy = metrics.t("accuracy", matrix);
assert.equal(accuracy.numerator, 80);
assert.equal(accuracy.denominator, 95);
assert.equal(accuracy.value, 80 / 95);
assert.equal(accuracy.symbolicNumerator, "TP + TN");
assert.deepEqual(accuracy.cellRoles, { tp: "numerator-and-denominator", fp: "denominator", tn: "numerator-and-denominator", fn: "denominator" });
assert.equal(metrics.t("precision", matrix).value, 0.75);
assert.equal(metrics.t("recall", matrix).value, 30 / 35);
assert.equal(metrics.t("specificity", matrix).value, 50 / 60);
assert.equal(metrics.t("f1", matrix).value, 60 / 75);
assert.equal(metrics.t("precision", { tp: 0, fp: 0, tn: 1, fn: 1 }).value, null);

function createHookRuntime() {
  const runtime = { cursor: 0, effects: [], imperative: null, refs: [], states: [] };
  return {
    runtime,
    hooks: {
      useCallback(callback) { runtime.cursor += 1; return callback; },
      useImperativeHandle(_ref, create) { runtime.cursor += 1; runtime.imperative = create(); },
      useRef(value) { const index = runtime.cursor++; runtime.refs[index] ??= { current: value }; return runtime.refs[index]; },
      useState(value) {
        const index = runtime.cursor++;
        if (!(index in runtime.states)) runtime.states[index] = typeof value === "function" ? value() : value;
        return [runtime.states[index], (next) => { runtime.states[index] = typeof next === "function" ? next(runtime.states[index]) : next; }];
      },
    },
  };
}
const jsxRuntime = {
  Fragment: Symbol("Fragment"),
  jsx(type, props, key) { return { type, props, key }; },
  jsxs(type, props, key) { return { type, props, key }; },
};
function formatMessage(descriptor, values = {}) {
  return descriptor.defaultMessage.replace(/\{(\w+)(?:, number)?\}/g, (_match, key) => String(values[key]));
}

const videoHooks = createHookRuntime();
const videoState = { initCalls: [] };
globalThis.__artifactTest = { hooks: videoHooks.hooks, jsxRuntime, state: videoState };
const video = await bundleAndImport(sources.video, (name) => {
  if (name === "app-shared") return [
    "export const $3 = () => globalThis.__artifactTest.state.initCalls.push('shared');",
    "export const I3 = () => globalThis.__artifactTest.jsxRuntime;",
    "export const K2 = () => globalThis.__artifactTest.state.initCalls.push('ui');",
    "export const e6 = () => globalThis.__artifactTest.hooks;",
    "export const n4 = () => ({ formatMessage: globalThis.__artifactTest.formatMessage });",
  ].join("\n");
  if (name === "app-initial") return [
    "export const Trt = () => globalThis.__artifactTest.state.initCalls.push('lightbox');",
    "export const wrt = 'Lightbox';",
  ].join("\n");
  return "export {};";
});
globalThis.__artifactTest.formatMessage = formatMessage;
assert.deepEqual(Object.keys(video), ["ChatGptVideoLightbox"]);
assert.deepEqual(videoState.initCalls, ["shared", "ui", "lightbox"]);
let closed = 0;
const videoProps = {
  request: { selectedIndex: 0, videos: [{ videoId: "first", title: "First" }, { videoId: "second" }] },
  onClose() { closed += 1; },
};
function renderVideo(props = videoProps) { videoHooks.runtime.cursor = 0; return video.ChatGptVideoLightbox(props); }
let videoTree = renderVideo();
assert.equal(videoTree.type, "Lightbox");
assert.equal(videoTree.props.src, "https://www.youtube.com/embed/first?autoplay=1&playsinline=1&rel=0&fs=0");
assert.equal(videoTree.props.caption, "First (1 of 2)");
assert.equal(videoTree.props.onPreviousImage, undefined);
assert.equal(typeof videoTree.props.onNextImage, "function");
assert.equal(videoTree.props.showDownload, false);
assert.equal(videoTree.props.showZoomControls, false);
assert.equal(videoTree.props.previewContent.props.children.props.children.type, "iframe");
videoTree.props.onNextImage();
videoTree = renderVideo();
assert.equal(videoTree.props.src.includes("/second?"), true);
assert.equal(videoTree.props.caption, "Video 2 of 2");
assert.equal(typeof videoTree.props.onPreviousImage, "function");
assert.equal(videoTree.props.onNextImage, undefined);
videoTree.props.onOpenChange(false);
assert.equal(closed, 1);
assert.equal(renderVideo({ ...videoProps, request: { selectedIndex: 8, videos: [] } }), null);

const mermaidHooks = createHookRuntime();
const mermaidState = { initCalls: [], preloads: [], toast: [], clone: null, rasterized: [], lazyComponent: null };
globalThis.__artifactTest = { hooks: mermaidHooks.hooks, jsxRuntime, state: mermaidState, formatMessage };
globalThis.document = { fonts: { ready: Promise.resolve() } };
const mermaid = await bundleAndImport(sources.mermaid, (name) => {
  if (name === "app-shared") return [
    "export const $3 = () => globalThis.__artifactTest.state.initCalls.push('shared');",
    "export const H3 = () => globalThis.__artifactTest.state.initCalls.push('preload-runtime');",
    "export const I3 = () => globalThis.__artifactTest.jsxRuntime;",
    "export const Jm = (load) => { let component; return (props) => { if (component == null) { load().then((loaded) => { component = loaded; globalThis.__artifactTest.state.lazyComponent = loaded; }); return { type: 'LazyLoading', props }; } return component(props); }; };",
    "export const K2 = () => globalThis.__artifactTest.state.initCalls.push('ui');",
    "export const V3 = async (load, dependencies) => { globalThis.__artifactTest.state.preloads.push(dependencies); return load(); };",
    "export const ck = () => ({ danger: (message, options) => globalThis.__artifactTest.state.toast.push({ message, options }) });",
    "export const e6 = () => globalThis.__artifactTest.hooks;",
    "export const g_ = () => globalThis.__artifactTest.state.initCalls.push('toast-runtime');",
    "export const h4 = () => globalThis.__artifactTest.state.initCalls.push('class-names');",
    "export const lk = () => globalThis.__artifactTest.state.initCalls.push('imperative');",
    "export const m4 = (...values) => values.filter(Boolean).join(' ');",
    "export const n4 = () => ({ formatMessage: globalThis.__artifactTest.formatMessage });",
    "export const qm = () => globalThis.__artifactTest.state.initCalls.push('query');",
  ].join("\n");
  if (name === "app-initial") return [
    "export const Nat = 'LoadingRow';",
    "export const Pat = () => globalThis.__artifactTest.state.initCalls.push('loading-row');",
  ].join("\n");
  if (name === "image") return [
    "export const a = () => globalThis.__artifactTest.state.initCalls.push('image');",
    "export const i = 'MermaidSvgRenderer';",
    "export const n = (svg) => svg == null ? null : globalThis.__artifactTest.state.clone;",
    "export const r = () => globalThis.__artifactTest.state.initCalls.push('rasterizer');",
    "export const t = async (source) => { globalThis.__artifactTest.state.rasterized.push(source); return 'png:' + source; };",
  ].join("\n");
  if (name === "mermaid-editable-preview") return "export const MermaidEditablePreview = (props) => ({ type: 'MermaidEditablePreview', props });";
  return "export {};";
});
assert.deepEqual(Object.keys(mermaid), ["n", "t"]);
mermaid.n();
assert.deepEqual(mermaidState.initCalls, ["shared", "class-names", "ui", "query", "imperative", "toast-runtime", "image", "rasterizer", "loading-row", "preload-runtime"]);
mermaid.n();
assert.equal(mermaidState.initCalls.length, 10);
const mermaidProps = {
  ref: {}, actions: { type: "actions" }, chatTheme: "dark", code: "  graph TD; A-->B  ", diagramId: "diagram-1",
  errorFallback: { type: "fallback" }, isStreaming: false, onCodeChange() {}, onCodeBlur() {},
};
function renderMermaid(props = mermaidProps) { mermaidHooks.runtime.cursor = 0; return mermaid.t(props); }
function children(node) { return Array.isArray(node?.props?.children) ? node.props.children.flat(Infinity).filter(Boolean) : node?.props?.children == null ? [] : [node.props.children]; }
function find(node, predicate) {
  if (node == null || typeof node !== "object") return null;
  if (predicate(node)) return node;
  for (const child of children(node)) { const match = find(child, predicate); if (match != null) return match; }
  return null;
}

let mermaidTree = renderMermaid();
assert.equal(find(mermaidTree, (node) => node.type === "LoadingRow") != null, true);
let renderer = find(mermaidTree, (node) => node.type === "MermaidSvgRenderer");
assert.equal(renderer.props.code, "graph TD; A-->B");
assert.equal(renderer.props.diagramId, "diagram-1");
assert.equal(find(mermaidTree, (node) => node.type === "actions"), null);
const fakeSvg = { nodeName: "svg" };
mermaidState.clone = { src: "svg:data", width: 100, height: 80 };
renderer.props.svgRef(fakeSvg);
mermaidTree = renderMermaid();
assert.equal(find(mermaidTree, (node) => node.type === "LoadingRow"), null);
assert.equal(find(mermaidTree, (node) => node.type === "actions") != null, true);
assert.equal(await mermaidHooks.runtime.imperative.captureScreenshotDataUrl(), "png:svg:data");
assert.deepEqual(mermaidState.rasterized, ["svg:data"]);
await mermaidHooks.runtime.imperative.openFullscreen();
mermaidTree = renderMermaid();
let lazyNode = find(mermaidTree, (node) => typeof node.type === "function" && node.props?.image?.src === "svg:data");
assert.equal(lazyNode.type(lazyNode.props).type, "LazyLoading");
await Promise.resolve();
await Promise.resolve();
assert.equal(mermaidState.preloads.length, 1);
assert.equal(mermaidState.preloads[0].length, 9);
mermaidTree = renderMermaid();
lazyNode = find(mermaidTree, (node) => typeof node.type === "function" && node.props?.image?.src === "svg:data");
const editable = lazyNode.type(lazyNode.props);
assert.equal(editable.props.image.src, "svg:data");
assert.equal(editable.props.code, mermaidProps.code);
editable.props.onOpenChange(false);
mermaidTree = renderMermaid();
assert.equal(find(mermaidTree, (node) => node.type === "MermaidEditablePreview"), null);

renderer = find(renderMermaid(), (node) => node.type === "MermaidSvgRenderer");
renderer.props.onError();
mermaidTree = renderMermaid();
assert.equal(find(mermaidTree, (node) => node.type === "LoadingRow"), null);
assert.equal(find(renderMermaid({ ...mermaidProps, isStreaming: true }), (node) => node.type === "MermaidSvgRenderer"), null);
globalThis.document.fonts.ready = Promise.reject(new Error("font failure"));
await mermaidHooks.runtime.imperative.openFullscreen();
assert.equal(mermaidState.toast.length, 1);
assert.equal(mermaidState.toast[0].options.errorAnalytics.toastId, "mermaidDiagram.openPreviewFailed");

console.log("artifact-preview tests passed (72 runtime assertions; 60 assertion sites)");
