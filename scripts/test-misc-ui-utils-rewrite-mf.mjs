import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.join(ROOT, "src/webview/assets");
const modules = [
  ["type-6f1a8a4562be.js", "learning-model-proton-nmr-splitting", ["n", "t"]],
  ["type-b2d049022561.js", "learning-model-simplified-fraction", ["n", "t"]],
  ["type-e25b068b7941.js", "learning-model-kinetic-and-potential-energy", ["n", "t"]],
  ["type-2eeac8e139a3.js", "learning-model-compound-pulley-mechanical-advantage", ["n", "t"]],
  ["type-b77b9fb94c5f.js", "learning-model-lagrange-gradient-parallelism", ["n", "t"]],
  ["type-af64de236b87.js", "learning-model-molecular-polarity", ["n", "t"]],
  ["type-44fc1ec684df.js", "learning-model-el-nino-and-la-nina", ["n", "t"]],
  ["type-79fafd7cdcf3.js", "learning-model-critical-angle-sine-relation", ["n", "t"]],
  ["type-aa70f27546d0.js", "learning-model-metric-distance", ["n", "t"]],
  ["pane-layout-da45b15f9a56.js", "pane-layout", ["n", "t"]],
];

const dependencies = (source, expression) => [...source.matchAll(expression)].map((match) => match[1]);
let sourceAssertions = 0;
for (const [asset, directory] of modules) {
  const original = fs.readFileSync(path.join(ASSET_ROOT, asset.replace(/\.js$/, ".ts")), "utf8");
  const recovered = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  const originalDependencies = dependencies(original, /from "\.\/([^"/]+)-[a-f0-9]{12}\.js"/g);
  const recoveredDependencies = dependencies(recovered, /(?:from\s+|import\s*)["']@rchunk\/([^"']+)/g);
  assert.deepEqual(recoveredDependencies, originalDependencies, directory + " preserves static dependencies");
  assert.equal((original.match(/import\(/g) ?? []).length, (recovered.match(/import\(/g) ?? []).length, directory + " preserves dynamic import count");
  assert.equal(/\bany\b|@ts-expect-error|@ts-nocheck/.test(recovered), false, directory + " has no type escape hatch");
  sourceAssertions += 3;
}

const mocks = {
  "@rchunk/rolldown-runtime": "export {};",
  "@rchunk/app-shared": "export const I3=()=>({jsx:(component,props)=>({component,props}),jsxs:(component,props)=>({component,props}),Fragment:Symbol.for('fragment')});",
};
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
      name: "mf-rchunk-mock",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath, namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: modulePath }) => ({ contents: mocks[modulePath] ?? "export {};", loader: "js" }));
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

const expectedSpecifications = {
  "learning-model-proton-nmr-splitting": { type: "PROTON_NMR_SPLITTING", version: 2, thumbnailAssetKey: "proton-nmr-splitting-v1", parameters: { neighbor_count: { kind: "enum", defaultValue: "2", allowedValues: ["0", "1", "2", "3", "4", "6"] } } },
  "learning-model-simplified-fraction": { type: "SIMPLIFIED_FRACTION", version: 2, thumbnailAssetKey: "simplified-fraction-v1", parameters: { numerator: { kind: "integer", defaultValue: 6, min: 1, max: 12 }, denominator: { kind: "integer", defaultValue: 8, min: 4, max: 24 } } },
  "learning-model-kinetic-and-potential-energy": { type: "KINETIC_AND_POTENTIAL_ENERGY", version: 1, thumbnailAssetKey: "kinetic-and-potential-energy-v1", canonicalFormula: "E_{\\text{total}} = PE + KE", parameters: { startHeightMeters: { kind: "number", defaultValue: 6, min: 2, max: 10 } } },
  "learning-model-compound-pulley-mechanical-advantage": { type: "COMPOUND_PULLEY_MECHANICAL_ADVANTAGE", version: 1, thumbnailAssetKey: "compound-pulley-mechanical-advantage-v1", canonicalFormula: "\\mathrm{IMA}=n", parameters: { supportSegments: { kind: "integer", defaultValue: 2, min: 2, max: 6 } } },
  "learning-model-lagrange-gradient-parallelism": { type: "LAGRANGE_GRADIENT_PARALLELISM", version: 1, thumbnailAssetKey: "lagrange-gradient-parallelism-v1", canonicalFormula: "\\nabla f \\parallel \\nabla g", parameters: { angleDegrees: { kind: "number", defaultValue: 30, min: 0, max: 360 } } },
  "learning-model-molecular-polarity": { type: "MOLECULAR_POLARITY", version: 1, thumbnailAssetKey: "molecular-polarity-v1", parameters: { molecule: { kind: "enum", defaultValue: "H2O", allowedValues: ["CO2", "H2O", "BF3", "NH3", "CCl4", "CH3Cl"] } } },
  "learning-model-el-nino-and-la-nina": { type: "EL_NINO_AND_LA_NINA", version: 2, thumbnailAssetKey: "el-nino-and-la-nina-v3", parameters: { initial_phase: { kind: "enum", defaultValue: "Neutral", allowedValues: ["La Niña", "Neutral", "El Niño"] } } },
  "learning-model-critical-angle-sine-relation": { type: "CRITICAL_ANGLE_SINE_RELATION", version: 1, thumbnailAssetKey: "critical-angle-sine-relation-v1", canonicalFormula: "\\sin\\theta_c = \\frac{n_2}{n_1}", parameters: { indexRatio: { kind: "number", defaultValue: 0.67, min: 0.5, max: 0.95 } } },
  "learning-model-metric-distance": { type: "METRIC_DISTANCE", version: 1, thumbnailAssetKey: "metric-distance-v1", parameters: { lengthCm: { kind: "number", defaultValue: 32, min: 10, max: 50 }, unit: { kind: "enum", defaultValue: "cm", allowedValues: ["mm", "cm", "m", "km"] } } },
};
for (const [directory, specification] of Object.entries(expectedSpecifications)) {
  const module = loaded.get(directory);
  module.t();
  assert.deepEqual(module.n, specification, directory + " preserves manifest semantics");
  runtimeAssertions += 1;
}

const pane = loaded.get("pane-layout");
pane.t();
let descriptor;
const result = pane.n((value) => { descriptor = value; return "rendered"; }, { header: "Header", headerPlacement: "top", content: "Body" });
assert.equal(result, "rendered");
assert.deepEqual(descriptor.headerRows, [{ id: "artifact-header", height: "content", placement: "top", content: "Header" }]);
assert.equal(descriptor.content.component, "div");
assert.deepEqual(descriptor.content.props, { className: "flex h-full min-h-0 min-w-0 flex-col", children: "Body" });
runtimeAssertions += 4;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
