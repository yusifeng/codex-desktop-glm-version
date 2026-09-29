import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.join(ROOT, "src/webview/assets");
const modules = [
  ["type-b11bc1c3afbb.js", "learning-model-production-possibilities-frontier", ["n", "t"]],
  ["type-d83a95defdf3.js", "learning-model-dna-gel-fragment-migration", ["n", "t"]],
  ["type-1f93f10ec695.js", "learning-model-denial-of-service-overload", ["n", "t"]],
  ["type-35ea69d98390.js", "learning-model-isotope-atomic-mass", ["n", "t"]],
  ["type-60f4e9362b4d.js", "learning-model-degree-of-unsaturation", ["n", "t"]],
  ["type-505786a161fa.js", "learning-model-maxwell-boltzmann-distribution", ["n", "t"]],
  ["type-4140aed3b047.js", "learning-model-dc-circuit-power", ["n", "t"]],
  ["type-8b31d5042d39.js", "learning-model-outlier-leverage-influence", ["n", "t"]],
  ["type-7a83abf1c6c4.js", "learning-model-radiation-penetration", ["n", "t"]],
  ["type-62dc7c323bbd.js", "learning-model-activation-energy-distribution", ["n", "t"]],
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
      name: "mi-rchunk-mock",
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

const expectedSpecifications = {
  "learning-model-production-possibilities-frontier": { type: "PRODUCTION_POSSIBILITIES_FRONTIER", version: 1, thumbnailAssetKey: "production-possibilities-frontier-v1", parameters: { consumerGoods: { kind: "number", defaultValue: 50, min: 0, max: 100 }, capitalGoods: { kind: "number", defaultValue: 75, min: 0, max: 100 } } },
  "learning-model-dna-gel-fragment-migration": { type: "DNA_GEL_FRAGMENT_MIGRATION", version: 1, thumbnailAssetKey: "dna-gel-fragment-migration-v1", parameters: { runTimeMinutes: { kind: "integer", defaultValue: 18, min: 1, max: 40 }, fragmentSizeBasePairs: { kind: "integer", defaultValue: 700, min: 100, max: 2_000 } } },
  "learning-model-denial-of-service-overload": { type: "DENIAL_OF_SERVICE_OVERLOAD", version: 3, thumbnailAssetKey: "denial-of-service-overload-v1", parameters: { server_capacity: { kind: "integer", defaultValue: 120, min: 100, max: 300 }, legitimate_request_rate: { kind: "integer", defaultValue: 40, min: 10, max: 80 } } },
  "learning-model-isotope-atomic-mass": { type: "ISOTOPE_ATOMIC_MASS", version: 1, thumbnailAssetKey: "isotope-atomic-mass-v2", parameters: { element: { kind: "enum", defaultValue: "chlorine", allowedValues: ["boron", "carbon", "neon", "magnesium", "sulfur", "chlorine", "copper"] } } },
  "learning-model-degree-of-unsaturation": { type: "DEGREE_OF_UNSATURATION", version: 2, thumbnailAssetKey: "degree-of-unsaturation-v1", parameters: { example_formula: { kind: "enum", defaultValue: "C6H10", allowedValues: ["C2H6", "C4H8", "C6H10", "C6H6", "C4H6Br2", "C5H8O", "C5H9N"] } } },
  "learning-model-maxwell-boltzmann-distribution": { type: "MAXWELL_BOLTZMANN_DISTRIBUTION", version: 2, thumbnailAssetKey: "maxwell-boltzmann-distribution-v1", parameters: { temperature_kelvin: { kind: "number", defaultValue: 300, min: 200, max: 800 }, molar_mass_g_per_mol: { kind: "number", defaultValue: 28, min: 4, max: 80 } } },
  "learning-model-dc-circuit-power": { type: "DC_CIRCUIT_POWER", version: 1, thumbnailAssetKey: "dc-circuit-power-v1", canonicalFormula: "P = VI", parameters: { voltageVolts: { kind: "number", defaultValue: 12, min: 1, max: 24 }, resistanceOhms: { kind: "number", defaultValue: 6, min: 1, max: 24 } } },
  "learning-model-outlier-leverage-influence": { type: "OUTLIER_LEVERAGE_INFLUENCE", version: 2, thumbnailAssetKey: "outlier-leverage-influence-v1", parameters: { initial_case: { kind: "enum", defaultValue: "influential", allowedValues: ["central-outlier", "aligned-high-leverage", "influential"] } } },
  "learning-model-radiation-penetration": { type: "RADIATION_PENETRATION", version: 2, thumbnailAssetKey: "radiation-penetration-v1", parameters: { initial_shielding: { kind: "enum", defaultValue: "lead-or-concrete", allowedValues: ["none", "paper", "aluminium-or-plastic", "lead-or-concrete"] } } },
  "learning-model-activation-energy-distribution": { type: "ACTIVATION_ENERGY_DISTRIBUTION", version: 2, thumbnailAssetKey: "activation-energy-distribution-v1", parameters: { initial_temperature_k: { kind: "number", defaultValue: 600, min: 300, max: 900 }, activation_energy_kj_mol: { kind: "number", defaultValue: 16, min: 8, max: 28 } } },
};
for (const [directory, expected] of Object.entries(expectedSpecifications)) {
  const module = loaded.get(directory);
  module.t();
  assert.deepEqual(module.n, expected, directory + " preserves manifest semantics");
  runtimeAssertions += 1;
}

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
