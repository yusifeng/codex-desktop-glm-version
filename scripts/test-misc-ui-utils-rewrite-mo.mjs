import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.join(ROOT, "src/webview/assets");
const modules = [
  ["type-278df50fffd4.js", "learning-model-osmotic-pressure", ["n", "t"]],
  ["type-b20da9986277.js", "learning-model-solution-dilution", ["n", "t"]],
  ["type-4644d5bf838d.js", "learning-model-aromaticity-and-huckels-rule", ["n", "t"]],
  ["type-6531d19cb2c0.js", "learning-model-absorption-variable-costing-inventory-profit", ["n", "t"]],
  ["type-b8020010f7f1.js", "learning-model-mass-spring-shm", ["n", "t"]],
  ["type-d30facd9fda1.js", "learning-model-exponential-population-growth", ["n", "t"]],
  ["type-e695696a56c8.js", "learning-model-pressure", ["n", "t"]],
  ["math-de3a0e0db4e2.js", "math-lazy-runtime", ["a", "c", "d", "f", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u"]],
  ["type-81172b31949f.js", "learning-model-climate-feedback-loops", ["n", "t"]],
  ["type-36d833db1430.js", "learning-model-electric-flux-flat-surface", ["n", "t"]],
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
      name: "mo-rchunk-mock",
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
  "learning-model-osmotic-pressure": { type: "OSMOTIC_PRESSURE", version: 2, thumbnailAssetKey: "osmotic-pressure-v2", canonicalFormula: "\\pi = i c R T", parameters: { solute_concentration_molar: { kind: "number", defaultValue: 0.2, min: 0.05, max: 0.5 }, vant_hoff_factor: { kind: "number", defaultValue: 2, min: 1, max: 3 }, temperature_kelvin: { kind: "number", defaultValue: 298, min: 273, max: 323 } } },
  "learning-model-solution-dilution": { type: "SOLUTION_DILUTION", version: 1, thumbnailAssetKey: "solution-dilution-v2", canonicalFormula: "M_1V_1=M_2V_2", parameters: { initialConcentrationMolesPerLiter: { kind: "number", defaultValue: 1.5, min: 0.1, max: 3 }, initialVolumeLiters: { kind: "number", defaultValue: 2, min: 0.5, max: 5 }, waterAddedLiters: { kind: "number", defaultValue: 3, min: 0, max: 5 } } },
  "learning-model-aromaticity-and-huckels-rule": { type: "AROMATICITY_AND_HUCKELS_RULE", version: 1, thumbnailAssetKey: "aromaticity-and-huckels-rule-v1", parameters: { initial_example: { kind: "enum", defaultValue: "benzene", allowedValues: ["benzene", "cyclobutadiene", "cyclooctatetraene", "cyclopentadienyl-anion", "cyclopropenyl-cation"] } } },
  "learning-model-absorption-variable-costing-inventory-profit": { type: "ABSORPTION_VARIABLE_COSTING_INVENTORY_PROFIT", version: 2, thumbnailAssetKey: "absorption-variable-costing-inventory-profit-v2", canonicalFormula: "\\mathrm{OI}_{A}-\\mathrm{OI}_{V}=\\Delta I\\times \\mathrm{FOH}_{u}", parameters: { unitsProduced: { kind: "integer", defaultValue: 800, min: 100, max: 10_000 }, unitsSold: { kind: "integer", defaultValue: 600, min: 100, max: 10_000 } } },
  "learning-model-mass-spring-shm": { type: "MASS_SPRING_SHM", version: 1, thumbnailAssetKey: "mass-spring-shm-v1", canonicalFormula: "T = 2\\pi\\sqrt{\\frac{m}{k}}", parameters: { massKilograms: { kind: "number", defaultValue: 1.5, min: 0.5, max: 5 }, springConstantNewtonsPerMeter: { kind: "number", defaultValue: 40, min: 10, max: 100 }, amplitudeMeters: { kind: "number", defaultValue: 0.25, min: 0.05, max: 0.5 } } },
  "learning-model-exponential-population-growth": { type: "EXPONENTIAL_POPULATION_GROWTH", version: 1, thumbnailAssetKey: "exponential-population-growth-v1", canonicalFormula: "N(t)=N_0(1+r)^t", parameters: { initial_population: { kind: "integer", defaultValue: 200, min: 20, max: 2_000 }, growth_rate_percent: { kind: "number", defaultValue: 10, min: 4, max: 15 }, elapsed_periods: { kind: "number", defaultValue: 10, min: 0, max: 20 } } },
  "learning-model-pressure": { type: "PRESSURE", version: 1, thumbnailAssetKey: "pressure-v1", canonicalFormula: "P = \\frac{F}{A}", canonicalFormulaAliases: ["P = F/A", "F = PA", "A = F/P"], parameters: { forceNewtons: { kind: "number", defaultValue: 100, min: 0, max: 200 }, areaSquareMeters: { kind: "number", defaultValue: 2, min: 0.25, max: 5 } } },
  "learning-model-climate-feedback-loops": { type: "CLIMATE_FEEDBACK_LOOPS", version: 2, thumbnailAssetKey: "climate-feedback-loops-v2", parameters: { initial_mechanism: { kind: "enum", defaultValue: "ice-albedo", allowedValues: ["ice-albedo", "water-vapor", "radiative-response"] }, initial_change: { kind: "enum", defaultValue: "warming", allowedValues: ["warming", "cooling"] } } },
  "learning-model-electric-flux-flat-surface": { type: "ELECTRIC_FLUX_FLAT_SURFACE", version: 1, thumbnailAssetKey: "electric-flux-flat-surface-v1", canonicalFormula: "\\Phi_E = EA\\cos(\\theta)", parameters: { fieldStrengthNewtonsPerCoulomb: { kind: "number", defaultValue: 6, min: 0, max: 10 }, areaSquareMeters: { kind: "number", defaultValue: 3, min: 0.5, max: 5 }, angleDegrees: { kind: "number", defaultValue: 30, min: 0, max: 90 } } },
};
for (const [directory, expected] of Object.entries(expectedSpecifications)) {
  const module = loaded.get(directory);
  module.t();
  assert.deepEqual(module.n, expected, directory + " preserves manifest semantics");
  runtimeAssertions += 1;
}

const math = loaded.get("math-lazy-runtime");
math.c();
assert.equal(math.a(Math.PI), -1);
assert.equal(math.f(Math.PI / 2), 1);
assert.equal(math.i(1, 0), Math.PI / 2);
assert.equal(math.l(1, 5, 3), 5);
assert.equal(math.u(1, 5, 3), 1);
assert.equal(math.p(81), 9);
assert.equal(math.t(-7), 7);
assert.equal(math.d, Math.PI);
assert.equal(math.s, Math.PI / 2);
assert.equal(math.m, Math.PI * 2);
assert.equal(math.o, 1e-12);
assert.equal(math.n(2), 0);
assert.equal(math.n(-2), Math.PI);
assert.equal(math.r(2), Math.PI / 2);
assert.equal(math.r(-2), -Math.PI / 2);
runtimeAssertions += 15;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
