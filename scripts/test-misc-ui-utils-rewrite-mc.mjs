import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.join(ROOT, "src/webview/assets");
const modules = [
  ["type-725e1a69e8d4.js", "learning-model-absorbance-spectrum", ["n", "t"]],
  ["type-2451a41f0046.js", "learning-model-qt-prolongation-torsades", ["n", "t"]],
  ["type-358a8002801a.js", "learning-model-classification-threshold", ["n", "t"]],
  ["type-62569be7b3b6.js", "learning-model-if-statement-execution-flow", ["n", "t"]],
  ["type-afd9de5814d9.js", "learning-model-seasons-and-solar-angle", ["n", "t"]],
  ["type-96f57cd357c8.js", "learning-model-surface-area-to-volume-ratio", ["n", "t"]],
  ["type-f31fc951c570.js", "learning-model-solar-photovoltaic-system", ["n", "t"]],
  ["type-eb61c94728f0.js", "learning-model-musical-harmonic-series", ["n", "t"]],
  ["type-e8c4aa2e5b51.js", "learning-model-strong-vs-weak-acid", ["n", "t"]],
  ["template-aa40bbaeb218.js", "template", ["a", "i", "n", "r", "t"]],
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
      name: "mc-rchunk-mock",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath, namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "export {};", loader: "js" }));
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

const specifications = [
  ["learning-model-absorbance-spectrum", "ABSORBANCE_SPECTRUM", 2, "absorbance-spectrum-v1", "lambda_max_nm", { kind: "number", defaultValue: 520, min: 210, max: 740 }],
  ["learning-model-qt-prolongation-torsades", "QT_PROLONGATION_TORSADES", 1, "qt-prolongation-torsades-v1", "qtcMs", { kind: "number", defaultValue: 420, min: 360, max: 560 }],
  ["learning-model-classification-threshold", "CLASSIFICATION_THRESHOLD", 3, "classification-threshold-v1", "threshold", { kind: "number", defaultValue: 0.5, min: 0, max: 1 }],
  ["learning-model-if-statement-execution-flow", "IF_STATEMENT_EXECUTION_FLOW", 1, "if-statement-execution-flow-v1", "score", { kind: "integer", defaultValue: 60, min: 0, max: 100 }],
  ["learning-model-seasons-and-solar-angle", "SEASONS_AND_SOLAR_ANGLE", 3, "seasons-and-solar-angle-v2", "latitude_degrees", { kind: "number", defaultValue: 40, min: -80, max: 80 }],
  ["learning-model-surface-area-to-volume-ratio", "SURFACE_AREA_TO_VOLUME_RATIO", 1, "surface-area-to-volume-ratio-v2", "side_length", { kind: "integer", defaultValue: 3, min: 1, max: 6 }],
  ["learning-model-solar-photovoltaic-system", "SOLAR_PHOTOVOLTAIC_SYSTEM", 2, "solar-photovoltaic-system-v2", "array_capacity_kw", { kind: "number", defaultValue: 6, min: 1, max: 20 }],
  ["learning-model-musical-harmonic-series", "MUSICAL_HARMONIC_SERIES", 2, "musical-harmonic-series-v1", "fundamental_frequency_hz", { kind: "number", defaultValue: 220, min: 20, max: 2_000 }],
  ["learning-model-strong-vs-weak-acid", "STRONG_VS_WEAK_ACID", 2, "strong-vs-weak-acid-v2", "initial_concentration_molar", { kind: "number", defaultValue: 0.15, min: 0.1, max: 0.25 }],
];
for (const [directory, type, version, thumbnailAssetKey, parameterName, parameter] of specifications) {
  const module = loaded.get(directory);
  module.t();
  assert.deepEqual(module.n, { type, version, thumbnailAssetKey, parameters: { [parameterName]: parameter } });
  runtimeAssertions += 1;
}

const template = loaded.get("template");
template.a();
assert.deepEqual(template.t, { min: 4, max: 12, step: 0.1, label: "a", defaultValue: 7 });
assert.deepEqual(template.n, { min: 4, max: 12, step: 0.1, label: "b", defaultValue: 8 });
assert.deepEqual(template.r, { min: 4, max: 12, step: 0.1, label: "c", defaultValue: 9 });
assert.deepEqual(template.i, { properties: { a: template.t, b: template.n, c: template.r } });
runtimeAssertions += 4;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
