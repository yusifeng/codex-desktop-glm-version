import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.join(ROOT, "src/webview/assets");
const modules = [
  ["type-b02d73c8ed7c.js", "learning-model-musical-interval-chart", ["n", "t"]],
  ["link-layout-678c303b5a32.js", "link-layout", ["TrustedContactLinkLayout"]],
  ["type-ff70f856f345.js", "learning-model-collision-simulation", ["n", "t"]],
  ["type-729304fc6ff2.js", "learning-model-solow-steady-state", ["n", "t"]],
  ["type-1cd86e5f325c.js", "learning-model-stopping-distance-safe-following", ["n", "t"]],
  ["type-dae3a0497d9a.js", "learning-model-difference-in-differences", ["n", "t"]],
  ["type-84ec9bea3a73.js", "learning-model-lewis-dot-symbols", ["n", "t"]],
  ["rtp-transform-worker.client-27691be44d13.js", "rtp-transform-worker-client", []],
  ["type-8f4414a8a97c.js", "learning-model-vector-components", ["n", "t"]],
  ["type-5ab56173322c.js", "learning-model-exponential-decay", ["n", "t"]],
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

function mockModuleContents(modulePath) {
  if (modulePath === "@rchunk/app-shared") {
    return [
      "export const $3 = () => ({ c: () => globalThis.__mrState.cache });",
      "export const I3 = () => ({ jsx: (component, props) => ({ kind: typeof component === 'string' ? component : component.displayName, props }), jsxs: (component, props) => ({ component, props }), Fragment: Symbol.for('fragment') });",
    ].join("\n");
  }
  if (modulePath === "@rchunk/app-initial") {
    return [
      "export const M6t = () => { globalThis.__mrState.initializers.push('resources'); };",
      "export const N6t = () => ({ authMethod: globalThis.__mrState.authMethod });",
      "export const Qgn = () => { globalThis.__mrState.initializers.push('account'); };",
      "export function Xgn() {} Xgn.displayName = 'RouterOutlet';",
    ].join("\n");
  }
  if (modulePath === "@rchunk/app-primary") {
    return [
      "export function fc() {} fc.displayName = 'TrustedContactAuthenticationLayout';",
      "export const mc = () => { globalThis.__mrState.initializers.push('primary'); };",
    ].join("\n");
  }
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
      name: "mr-rchunk-mock",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath, namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: modulePath }) => ({ contents: mockModuleContents(modulePath), loader: "js" }));
      },
    }],
  });
  return import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64") + "#" + directory);
}

globalThis.__mrState = {
  authMethod: null,
  cache: [Symbol.for("react.memo_cache_sentinel"), Symbol.for("react.memo_cache_sentinel")],
  initializers: [],
};

const workerListeners = new Map();
const workerMessages = [];
globalThis.addEventListener = (name, listener) => workerListeners.set(name, listener);
globalThis.self = { postMessage: (message) => workerMessages.push(message) };

const loaded = new Map();
let runtimeAssertions = 0;
for (const [_asset, directory, expectedExports] of modules) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  assert.deepEqual(Object.keys(module).sort(), [...expectedExports].sort(), directory + " preserves compressed exports");
  runtimeAssertions += 1;
}

const expectedSpecifications = {
  "learning-model-musical-interval-chart": { type: "MUSICAL_INTERVAL_CHART", version: 3, thumbnailAssetKey: "musical-interval-chart-v2", parameters: { lower_note: { kind: "enum", defaultValue: "C", allowedValues: ["C", "C-sharp", "D-flat", "D", "E-flat", "E", "F", "F-sharp", "G-flat", "G", "A-flat", "A", "B-flat", "B"] } } },
  "learning-model-collision-simulation": { type: "COLLISION_SIMULATION", version: 3, thumbnailAssetKey: "collision-simulation-v1", canonicalFormula: "m_1v_{1,i} + m_2v_{2,i} = m_1v_{1,f} + m_2v_{2,f}", parameters: { cartAInitialVelocityMps: { kind: "number", defaultValue: 2, min: -3, max: 3 }, cartBInitialVelocityMps: { kind: "number", defaultValue: -1.5, min: -3, max: 3 }, collisionType: { kind: "enum", defaultValue: "elastic", allowedValues: ["elastic", "perfectlyInelastic"] } } },
  "learning-model-solow-steady-state": { type: "SOLOW_STEADY_STATE", version: 1, thumbnailAssetKey: "solow-steady-state-v1", canonicalFormula: "s f(k^*) = (\\delta + n + g)k^*", parameters: { savingRatePercent: { kind: "number", defaultValue: 25, min: 10, max: 40 }, depreciationRatePercent: { kind: "number", defaultValue: 5, min: 3, max: 10 }, populationGrowthRatePercent: { kind: "number", defaultValue: 1.5, min: 0.5, max: 4 }, technologyGrowthRatePercent: { kind: "number", defaultValue: 2, min: 0.5, max: 4 } } },
  "learning-model-stopping-distance-safe-following": { type: "STOPPING_DISTANCE_SAFE_FOLLOWING", version: 2, thumbnailAssetKey: "stopping-distance-safe-following-v2", canonicalFormula: "d_{\\mathrm{stop}}=d_{\\mathrm{reaction}}+d_{\\mathrm{braking}}", parameters: { speedKmh: { kind: "number", defaultValue: 60, min: 30, max: 100 }, reactionTimeSeconds: { kind: "number", defaultValue: 1, min: 0.5, max: 2 }, roadCondition: { kind: "enum", defaultValue: "dry", allowedValues: ["dry", "wet", "snow_ice"] } } },
  "learning-model-difference-in-differences": { type: "DIFFERENCE_IN_DIFFERENCES", version: 2, thumbnailAssetKey: "difference-in-differences-v1", canonicalFormula: "\\widehat{\\tau}_{DiD} = \\Delta Y_T - \\Delta Y_C", parameters: { treated_pre_outcome: { kind: "number", defaultValue: 60, min: 20, max: 80 }, control_pre_outcome: { kind: "number", defaultValue: 40, min: 20, max: 80 }, common_change: { kind: "number", defaultValue: 8, min: -15, max: 15 }, treatment_effect: { kind: "number", defaultValue: 14, min: -20, max: 20 } } },
  "learning-model-lewis-dot-symbols": { type: "LEWIS_DOT_SYMBOLS", version: 2, thumbnailAssetKey: "lewis-dot-symbols-v1", parameters: { element: { kind: "enum", defaultValue: "C", allowedValues: ["H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar"] } } },
  "learning-model-vector-components": { type: "VECTOR_COMPONENTS", version: 1, thumbnailAssetKey: "vector-components-v1", canonicalFormula: "x=r\\cos\\theta,\\qquad y=r\\sin\\theta", canonicalFormulaAliases: ["\\vec v=\\langle r\\cos\\theta,\\ r\\sin\\theta\\rangle", "(x,y)=(r\\cos\\theta,r\\sin\\theta)"], parameters: { magnitude: { kind: "number", defaultValue: 6, min: 0.1, max: 100 }, angleDeg: { kind: "number", defaultValue: 35, min: -180, max: 180 } } },
  "learning-model-exponential-decay": { type: "EXPONENTIAL_DECAY", version: 1, thumbnailAssetKey: "exponential-decay-v1", canonicalFormula: "y = e^{-kt}", canonicalFormulaAliases: ["y = y_0 \\exp(-kt)", "y = e^{-t}", "y = 2e^{-0.5t}", "N = N_0 e^{-\\lambda t}", "A = A_0 e^{-\\lambda t}"], parameters: { initial: { kind: "number", defaultValue: 6, min: 0.01, max: 10_000 }, decay: { kind: "number", defaultValue: 0.6, min: 0.01, max: 10_000 } } },
};

for (const [directory, expected] of Object.entries(expectedSpecifications)) {
  const module = loaded.get(directory);
  module.t();
  assert.deepEqual(module.n, expected, directory + " preserves manifest semantics");
  runtimeAssertions += 1;
}

const linkLayout = loaded.get("link-layout");
assert.deepEqual(globalThis.__mrState.initializers, ["account", "primary", "resources"], "link layout preserves initialization order");
const unauthenticatedLayout = linkLayout.TrustedContactLinkLayout();
assert.equal(unauthenticatedLayout.kind, "main");
assert.equal(unauthenticatedLayout.props.className, "h-full bg-surface");
assert.equal(unauthenticatedLayout.props.children.kind, "RouterOutlet");
assert.equal(linkLayout.TrustedContactLinkLayout(), unauthenticatedLayout, "link layout reuses compiler cache");
globalThis.__mrState.authMethod = "trusted-contact";
const authenticatedLayout = linkLayout.TrustedContactLinkLayout();
assert.equal(authenticatedLayout.kind, "TrustedContactAuthenticationLayout");
runtimeAssertions += 6;

const listener = workerListeners.get("rtctransform");
assert.equal(typeof listener, "function", "worker registers rtctransform listener");
runtimeAssertions += 1;

async function runTransform(name, frame) {
  let output;
  let resolveClosed;
  const closed = new Promise((resolve) => { resolveClosed = resolve; });
  const readable = new ReadableStream({ start(controller) { controller.enqueue(frame); controller.close(); } });
  const writable = new WritableStream({ write(value) { output = value; }, close() { resolveClosed(); } });
  listener({ transformer: { readable, writable, options: name === undefined ? undefined : { name } } });
  await closed;
  return output;
}

const passthroughFrame = { id: "passthrough" };
assert.equal(await runTransform("unknown-transform", passthroughFrame), passthroughFrame, "worker passes unknown transforms through");
assert.equal(workerMessages.length, 0, "worker does not post for unknown transform");

const outboundFrame = { getMetadata: () => ({ rtpTimestamp: 4321 }) };
assert.equal(await runTransform("captureOutboundAudioRtpTimestamp", outboundFrame), outboundFrame, "worker preserves outbound frame");
assert.deepEqual(workerMessages.shift(), { type: "outbound-audio-rtp-timestamp", rtpTimestamp: 4321 });

const inboundFrame = { getMetadata: () => ({ rtpTimestamp: 8765 }) };
assert.equal(await runTransform("captureInboundAudioRtpTimestamp", inboundFrame), inboundFrame, "worker preserves inbound frame");
assert.deepEqual(workerMessages.shift(), { type: "inbound-audio-rtp-timestamp", rtpTimestamp: 8765 });

const invalidTimestampFrame = { getMetadata: () => ({ rtpTimestamp: Number.NaN }) };
assert.equal(await runTransform("captureInboundAudioRtpTimestamp", invalidTimestampFrame), invalidTimestampFrame, "worker preserves frames without finite timestamps");
assert.equal(workerMessages.length, 0, "worker suppresses non-finite timestamp messages");

let lockedPipeCalled = false;
listener({ transformer: { readable: { locked: true, pipeTo() { lockedPipeCalled = true; } }, writable: { locked: false } } });
assert.equal(lockedPipeCalled, false, "worker skips locked streams");
runtimeAssertions += 9;

delete globalThis.__mrState;
delete globalThis.addEventListener;
delete globalThis.self;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
