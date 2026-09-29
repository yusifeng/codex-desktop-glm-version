import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.join(ROOT, "src/webview/assets");
const modules = [
  ["type-ea9c53801ecf.js", "learning-model-angular-frequency-relation", ["n", "t"]],
  ["button-6de526bfdc3d.js", "button", ["n", "r", "t"]],
  ["responsive-image-visualization-9fbd0706e5fc.js", "responsive-image-visualization", ["n", "t"]],
  ["open-library-item-f723e5be688a.js", "open-library-item", ["i", "n", "r", "t"]],
  ["tsrx-grammar-schema-39f17e710f9c.js", "tsrx-grammar-schema", ["assembleTsrxGrammar"]],
  ["template-d8d6d1996e0d.js", "learning-model-volume-cube-template", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["template-eafd23e9a003.js", "learning-model-surface-area-cube-template", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["image-edit-size-control-585ada304286.js", "image-edit-size-control", ["n", "t"]],
  ["tab-d6bbb8bc9acd.js", "connected-file-preview-tab", ["ConnectedFilePreview"]],
  ["numerical-integration-e14603542012.js", "numerical-integration", ["n", "t"]],
];

const dependencies = (source, expression) => [...source.matchAll(expression)].map((match) => match[1]);
let sourceAssertions = 0;
for (const [asset, directory] of modules) {
  const original = fs.readFileSync(path.join(ASSET_ROOT, asset.replace(/\.js$/, ".ts")), "utf8");
  const recovered = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  const originalDependencies = dependencies(original, /from "\.\/([^"/]+)-[a-f0-9]{12}\.js"/g);
  const recoveredDependencies = dependencies(recovered, /(?:from\s+|import\s*)["']@rchunk\/([^"']+)/g);
  assert.deepEqual(recoveredDependencies, originalDependencies, directory + " preserves static dependencies");
  assert.equal((original.match(/import\(/g) ?? []).length, (recovered.match(/import\(/g) ?? []).length, directory + " preserves dynamic imports");
  assert.equal(/\bany\b|@ts-expect-error|@ts-nocheck/.test(recovered), false, directory + " has no type escape hatch");
  sourceAssertions += 3;
}

globalThis.__mx = {
  activeCache: Array(20).fill(Symbol.for("react.memo_cache_sentinel")),
  initializers: [],
  libraryEvents: [],
  signalValues: new Map(),
  portals: [],
  adaptiveInitializations: 0,
};

function appSharedMock() {
  return `
    const state = globalThis.__mx;
    const schema = (parse) => ({ parse, optional() { return schema((value) => value === undefined ? undefined : parse(value)); } });
    export const $3 = () => ({ c: () => state.activeCache });
    export const I3 = () => ({
      Fragment: Symbol.for("fragment"),
      jsx: (component, props, key) => ({ kind: typeof component === "string" ? component : component.displayName, props, key }),
      jsxs: (component, props, key) => ({ kind: typeof component === "string" ? component : component.displayName, props, key }),
    });
    export const h4 = () => state.initializers.push("classNames");
    export const m4 = (...values) => values.filter(Boolean).join(" ");
    export const P3 = () => ({ createPortal(children, container) { const portal = { kind: "portal", children, container }; state.portals.push(portal); return portal; } });
    export const FX = () => state.initializers.push("signals");
    export const QI = () => state.initializers.push("query");
    export const ZI = Symbol.for("app-scope");
    export const pZ = (_scope, initialValue) => ({ kind: "signal", initialValue });
    export const oZ = (_scope, initializer) => ({ kind: "family", initializer });
    export const HX = (signal) => state.signalValues.get(signal);
    export const g4 = () => state.initializers.push("schema");
    export const q4 = () => schema((value) => { if (typeof value !== "string") throw new Error("string"); return value; });
    export const k4 = () => schema((value) => { if (typeof value !== "boolean") throw new Error("boolean"); return value; });
    export const L4 = (factory) => schema((value) => factory().parse(value));
    export const E4 = (itemSchema) => schema((value) => { if (!Array.isArray(value)) throw new Error("array"); return value.map((item) => itemSchema.parse(item)); });
    export const G4 = (keySchema, valueSchema) => schema((value) => { if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error("record"); return Object.fromEntries(Object.entries(value).map(([key, item]) => [keySchema.parse(key), valueSchema.parse(item)])); });
    export const z4 = (shape) => schema((value) => { if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error("object"); const output = {}; for (const [key, fieldSchema] of Object.entries(shape)) { const parsed = fieldSchema.parse(value[key]); if (parsed !== undefined) output[key] = parsed; } return output; });
  `;
}

function appInitialMock() {
  return `
    const state = globalThis.__mx;
    export const hK = Symbol.for("breadcrumbs-query");
    export const xK = Symbol.for("current-directory");
    export const UR = Symbol.for("analytics-context");
    export const uK = Symbol.for("api-client");
    export const mun = Symbol.for("account-id");
    export const _un = Symbol.for("user-id");
    export const xun = Symbol.for("connected-ready");
    export const HLt = { CHATGPT_FILE_LIBRARY_FILE_INTERACTION_TYPE_OPENED: "opened" };
    export const AK = (_scope, directoryId, breadcrumbs) => state.libraryEvents.push({ type: "breadcrumbs", directoryId, breadcrumbs });
    export const PK = (node) => node.normalizedId;
    export const WR = (_scope, entry, interactionType) => state.libraryEvents.push({ type: "analytics", entry, interactionType });
    export const _pn = (_scope, route) => state.libraryEvents.push({ type: "navigate", route });
    export const bK = (value) => ({ route: "library", value });
    export const fRt = () => state.initializers.push("library-core");
    export const gpn = () => state.initializers.push("library-signals");
    export const HR = () => state.initializers.push("library-history");
    export const IK = () => state.initializers.push("library-identity");
    export const lK = () => state.initializers.push("library-api");
    export function GB() {} GB.displayName = "ButtonToolbar";
    export const KB = () => state.initializers.push("button-toolbar");
    export const Sun = () => state.initializers.push("connected-signals");
  `;
}

function adaptiveSliderMock() {
  return `
    const state = globalThis.__mx;
    export const n = () => { state.adaptiveInitializations += 1; };
    export const i = (value, allowed) => typeof value === "number" && Number.isFinite(value) ? Math.min(Math.max(value, allowed.min), allowed.max) : allowed.defaultValue;
    export const t = (value, control, allowed) => ({ min: Math.max(allowed.min, Math.min(control.baseMin, value)), max: Math.min(allowed.max, Math.max(control.baseMax, value)), step: control.step });
    export const r = ({ allowed, bounds, control, value }) => bounds && value >= bounds.min && value <= bounds.max ? bounds : t(value, control, allowed);
  `;
}

function mockModuleContents(modulePath) {
  if (modulePath === "@rchunk/app-shared") return appSharedMock();
  if (modulePath === "@rchunk/app-initial") return appInitialMock();
  if (modulePath === "@rchunk/adaptive-slider-field") return adaptiveSliderMock();
  if (modulePath === "@rchunk/library-cloud-file-preview") return "export function n() {} n.displayName = 'LibraryCloudFilePreview';";
  if (modulePath === "@rchunk/cloud-file-preview") return "export const t = () => globalThis.__mx.initializers.push('cloud-preview');";
  return "export {};";
}

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "mx-rchunk-mock",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath, namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: modulePath }) => ({ contents: mockModuleContents(modulePath), loader: "js" }));
      },
    }],
  });
  return import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64") + "#" + directory);
}

const loaded = new Map();
let runtimeAssertions = 0;
for (const [_asset, directory, expectedExports] of modules) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  assert.deepEqual(Object.keys(module).sort(), [...expectedExports].sort(), directory + " preserves compressed exports");
  runtimeAssertions += 1;
}

const angular = loaded.get("learning-model-angular-frequency-relation");
angular.t();
assert.deepEqual(angular.n, {
  type: "ANGULAR_FREQUENCY_RELATION",
  version: 1,
  thumbnailAssetKey: "angular-frequency-relation-v1",
  canonicalFormula: "\\omega = 2\\pi f",
  canonicalFormulaAliases: ["\\omega = \\frac{2\\pi}{T}", "\\omega = \\frac{d\\theta}{dt}", "\\omega = \\sqrt{\\frac{k}{m}}", "\\omega = \\sqrt{k/m}", "\\omega^2 = \\frac{k}{m}", "f = \\frac{\\omega}{2\\pi}", "T = \\frac{2\\pi}{\\omega}", "\\omega = 2\\pi f = \\frac{2\\pi}{T}", "(\\omega = 2\\pi f)", "2\\pi f = \\omega", "w=2pif", "omega=2pif", "2pif=omega", "2pif=w", "omega = 2 pi f", "w=2pi/t", "omega=2pi/t", "f=w/2pi", "f=omega/2pi", "w=dtheta/dt", "omega=dtheta/dt", "w=sqrt(k/m)", "omega=sqrt(k/m)", "w^2=k/m", "omega^2=k/m"],
  parameters: { frequency: { kind: "number", defaultValue: 1.5, min: 0.01, max: 1_000 } },
});
runtimeAssertions += 1;

const animationFrames = [];
globalThis.window = { requestAnimationFrame: (callback) => animationFrames.push(callback) };
const button = loaded.get("button");
button.r();
let clickCount = 0;
const buttonElement = button.t({ className: "extra", disabled: true, onClick: () => { clickCount += 1; } });
assert.equal(buttonElement.kind, "button");
assert.equal(buttonElement.props.type, "button");
assert.match(buttonElement.props.className, /interactive-button-secondary/);
assert.match(buttonElement.props.className, /extra/);
buttonElement.props.onClick();
assert.equal(clickCount, 0);
animationFrames.shift()();
assert.equal(clickCount, 0);
animationFrames.shift()();
assert.equal(clickCount, 1);
const buttonGroup = button.n({ children: "actions", columns: 2, className: "group" });
assert.match(buttonGroup.props.className, /grid-cols-2/);
assert.equal(buttonGroup.props.children, "actions");
runtimeAssertions += 8;

const responsive = loaded.get("responsive-image-visualization");
responsive.n();
const standardImage = responsive.t({ sources: { oneX: "one.png", twoX: "two.png", threeX: "three.png" }, alt: "diagram", width: 400, height: 240 });
assert.equal(standardImage.kind, "div");
assert.equal(standardImage.props.children.props.srcSet, "one.png 1x,two.png 2x,three.png 3x");
assert.deepEqual(standardImage.props.children.props.style, { objectFit: "contain", width: 400, height: 240, maxWidth: "100%", maxHeight: "100%" });
const thumbnailImage = responsive.t({ sources: { oneX: "thumb.png" }, alt: "thumbnail", presentationMode: "thumbnail" });
assert.equal(thumbnailImage.props.children.props.srcSet, undefined);
assert.equal(thumbnailImage.props.children.props.style.width, "100%");
runtimeAssertions += 5;

const library = loaded.get("open-library-item");
library.t();
assert.equal(library.r.kind, "signal");
assert.equal(library.n.kind, "family");
const directoryScopeValues = new Map([[Symbol.for("current-directory"), { directoryId: "parent", items: [{ id: "fallback", name: "Fallback" }] }]]);
const directoryScope = { value: { directoryId: "parent", search: "old" }, get: (key) => directoryScopeValues.get(key), set: () => {}, query: { getData: () => ({ items: [{ id: "root", name: "Root", is_root: true }, { id: "parent", name: "Parent" }] }) } };
library.i(directoryScope, { node: { id: "dir-1", normalizedId: "normalized-dir", kind: "directory", name: "Child" } });
const breadcrumbEvent = globalThis.__mx.libraryEvents.find((event) => event.type === "breadcrumbs");
assert.deepEqual(breadcrumbEvent, { type: "breadcrumbs", directoryId: "normalized-dir", breadcrumbs: [{ id: "parent", name: "Parent" }, { id: "normalized-dir", name: "Child" }] });
const navigationEvent = globalThis.__mx.libraryEvents.find((event) => event.type === "navigate");
assert.deepEqual(navigationEvent.route, { route: "library", value: { directoryId: "normalized-dir", search: "" } });
const posts = [];
const sets = [];
const fileScopeValues = new Map([[Symbol.for("analytics-context"), { surface: "library" }], [Symbol.for("api-client"), { safePost: async (url, options) => { posts.push({ url, options }); } }]]);
const fileScope = { value: {}, get: (key) => fileScopeValues.get(key), set: (key, value) => sets.push({ key, value }), query: { getData: () => undefined } };
const fileEntry = { node: { id: "file-1", kind: "file", name: "File" } };
library.i(fileScope, fileEntry);
assert.equal(sets[0].key, library.r);
assert.deepEqual(sets[0].value, { entry: fileEntry, analyticsContext: { surface: "library" } });
assert.deepEqual(posts[0], { url: "/files/library/files/{library_file_id}/opened", options: { parameters: { path: { library_file_id: "file-1" } } } });
library.i(fileScope, { node: { id: "external-drive", kind: "file", name: "External" } });
assert.equal(posts.length, 1);
runtimeAssertions += 8;

const grammar = loaded.get("tsrx-grammar-schema");
const assembledGrammar = grammar.assembleTsrxGrammar(
  { name: "base", scopeName: "source.tsrx", patterns: [{ include: "#base" }], repository: { base: { match: "base" } } },
  { declarations: { match: "declare" } },
  { statements: { match: "statement" } },
  { types: { match: "type" } },
);
assert.equal(assembledGrammar.name, "tsrx");
assert.deepEqual(Object.keys(assembledGrammar.repository), ["base", "declarations", "statements", "types"]);
assert.deepEqual(assembledGrammar.embeddedLangs, ["jsx", "tsx", "typescript", "css"]);
runtimeAssertions += 3;

const volume = loaded.get("learning-model-volume-cube-template");
volume.a();
assert.deepEqual(volume.c, { type: "VOLUME_CUBE", version: 2, thumbnailAssetKey: "volume-cube-v2", canonicalFormula: "V = s^3", canonicalFormulaAliases: ["V = a^3", "s^3"], parameters: { sideLength: { kind: "number", defaultValue: 3, min: 0.01, max: 10_000 } } });
assert.deepEqual(volume.n, { label: "s", min: 1, max: 10, step: 1, defaultValue: 3, thumbnailDefaultValue: 3 });
assert.deepEqual(volume.i.properties.sideLengthBounds.defaultValue, { min: 1, max: 10, step: 1 });
assert.deepEqual(volume.o({ sideLength: 20 }), { sideLength: 20, sideLengthBounds: { min: 1, max: 20, step: 1 } });
const surface = loaded.get("learning-model-surface-area-cube-template");
surface.a();
assert.deepEqual(surface.c, { type: "SURFACE_AREA_CUBE", version: 2, thumbnailAssetKey: "surface-area-cube-v1", canonicalFormula: "SA = 6s^2", canonicalFormulaAliases: ["A = 6a^2", "6s^2"], parameters: { sideLength: { kind: "number", defaultValue: 3, min: 0.01, max: 10_000 } } });
assert.equal(surface.n.thumbnailDefaultValue, 10);
assert.deepEqual(surface.i.properties.sideLengthBounds.thumbnailDefaultValue, { min: 1, max: 10, step: 1 });
assert.deepEqual(surface.o({ sideLength: Number.NaN }), { sideLength: 3, sideLengthBounds: { min: 1, max: 10, step: 1 } });
assert.equal(globalThis.__mx.adaptiveInitializations, 2);
runtimeAssertions += 9;

const imageControl = loaded.get("image-edit-size-control");
globalThis.__mx.activeCache = Array(15).fill(Symbol.for("react.memo_cache_sentinel"));
imageControl.n();
const inlineControl = imageControl.t({ children: "slider", ref: "control-ref", zoom: 1.5 });
assert.equal(inlineControl.kind, "div");
assert.deepEqual(inlineControl.props.style, { zoom: 1.5 });
assert.equal(inlineControl.props.children.kind, "ButtonToolbar");
assert.equal(imageControl.t({ children: "slider", ref: "control-ref", zoom: 1.5 }), inlineControl);
const portalContainer = { id: "overlay" };
const portalControl = imageControl.t({ children: "slider", container: portalContainer, ref: "control-ref", zoom: 2 });
assert.equal(portalControl.kind, "portal");
assert.equal(portalControl.container, portalContainer);
assert.equal(portalControl.children.props.style, undefined);
runtimeAssertions += 7;

const connected = loaded.get("connected-file-preview-tab");
globalThis.__mx.activeCache = Array(11).fill(Symbol.for("react.memo_cache_sentinel"));
globalThis.__mx.signalValues.set(Symbol.for("account-id"), "account-1");
globalThis.__mx.signalValues.set(Symbol.for("user-id"), "user-1");
globalThis.__mx.signalValues.set(Symbol.for("connected-ready"), true);
const connectedFile = { id: "item-1", fileId: "file-1", currentVersion: 3, modifiedAt: "today", category: "document" };
const identity = { accountId: "account-1", userId: "user-1" };
const onClose = () => {};
const connectedPreview = connected.ConnectedFilePreview({ file: connectedFile, identity, onClose });
assert.equal(connectedPreview.kind, "LibraryCloudFilePreview");
assert.equal(connectedPreview.props.showComposer, false);
assert.equal(connectedPreview.props.item.cloudFile, connectedFile);
assert.equal(connected.ConnectedFilePreview({ file: connectedFile, identity, onClose }), connectedPreview);
assert.equal(connected.ConnectedFilePreview({ file: connectedFile, identity: { accountId: "wrong", userId: "user-1" }, onClose }), null);
runtimeAssertions += 5;

const numerical = loaded.get("numerical-integration");
numerical.t();
assert.deepEqual(numerical.n("\\frac{2x}{3} + \\pi x"), { integrand: "((2x)/(3))+pi*x", hasUnsupportedLetter: false });
assert.deepEqual(numerical.n("2πx + 3×x − 1"), { integrand: "2*pi*x+3*x-1", hasUnsupportedLetter: false });
assert.deepEqual(numerical.n("sin(x)+e^x"), { integrand: "(x)+e^x", hasUnsupportedLetter: true });
assert.deepEqual(numerical.n("\\left( x \\right) \\div 2"), { integrand: "(x)/2", hasUnsupportedLetter: false });
assert.deepEqual(numerical.n(null), { integrand: "", hasUnsupportedLetter: false });
runtimeAssertions += 5;

delete globalThis.window;
delete globalThis.__mx;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
