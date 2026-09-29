import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");

const models = [
  ["model-17f916a4e975.js", "learning-model-solubility-curve", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-c2269da17f9b.js", "learning-model-boolean-truth-table", ["a", "i", "n", "o", "r", "t"]],
  ["model-9e207cede0f7.js", "learning-model-reaction-rate-over-time", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-c372f8b17ac7.js", "learning-model-enzyme-inhibition-rate-effects", ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-b1f0f57fbf1c.js", "learning-model-tax-incidence-and-elasticity", ["a", "c", "d", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-cd68a3225de8.js", "learning-model-ionic-bond-formation", ["a", "i", "n", "r", "t"]],
  ["model-9811711de13c.js", "learning-model-halogen-reactivity-trend", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-5ae66660a0d1.js", "learning-model-buffer-ph-strong-acid-base", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-f1afb214c3ce.js", "learning-model-sea-level-rise", ["a", "i", "n", "r", "t"]],
  ["model-5b6dc1b6bd89.js", "learning-model-heteroskedasticity", ["a", "c", "i", "n", "o", "r", "s", "t"]],
];

const staticDependencies = (source, expression) => [...source.matchAll(expression)].map((match) => match[1]);

let sourceAssertions = 0;
for (const [asset, directory] of models) {
  const original = fs.readFileSync(path.join(ASSET_ROOT, asset), "utf8");
  const recovered = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  const originalDependencies = staticDependencies(original, /from "\.\/([^"]+)\.js"/g).map((dependency) => dependency.replace(/-[a-f0-9]{12}$/, ""));
  const recoveredDependencies = staticDependencies(recovered, /(?:from\s+|import\s*)["']@rchunk\/([^"']+)/g);
  assert.deepEqual(recoveredDependencies, originalDependencies, directory + " preserves static dependencies");
  assert.equal((original.match(/import\(/g) ?? []).length, 0, asset + " has no dynamic dependencies");
  assert.equal((recovered.match(/import\(/g) ?? []).length, 0, directory + " adds no dynamic dependencies");
  assert.equal(/\bany\b|@ts-expect-error/.test(recovered), false, directory + " has no escape hatches");
  sourceAssertions += 4;
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
      name: "rpc-learning-model-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath.slice(8), namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "export {};", loader: "js" }));
      },
    }],
  });
  const encoded = Buffer.from(result.outputFiles[0].text).toString("base64");
  return import("data:text/javascript;base64," + encoded + "#" + directory);
}

const loaded = new Map();
let runtimeAssertions = 0;
for (const [_asset, directory, exports] of models) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  assert.deepEqual(Object.keys(module).sort(), [...exports].sort(), directory + " preserves compressed exports");
  runtimeAssertions += 1;
}

const solubility = loaded.get("learning-model-solubility-curve");
assert.equal(solubility.a("potassium nitrate").length, 101);
const potassium = solubility.i({ solute: "potassium nitrate", temperatureC: 40, dissolvedGrams: 80 });
assert.ok(Math.abs(potassium.saturationGrams - 59.7) < 1e-12);
assert.equal(potassium.state, "supersaturated");
assert.ok(potassium.crystallizedGrams > 0);
assert.deepEqual(solubility.i({ solute: "invalid", temperatureC: -2, dissolvedGrams: 999 }).solute, "potassium nitrate");
runtimeAssertions += 5;

const truthTable = loaded.get("learning-model-boolean-truth-table");
assert.deepEqual(truthTable.t, ["AND", "OR", "XOR", "XNOR"]);
assert.equal(truthTable.i({ operator: "OR" }).outputPattern, "0111");
assert.equal(truthTable.i({ operator: "XOR" }).outputPattern, "0110");
assert.deepEqual(truthTable.i({ inputA: false, inputB: true, operator: "AND" }), { inputA: false, inputB: true, operator: "AND", inputABit: 0, inputBBit: 1, output: 0, activeRowIndex: 1, rows: [{ inputA: 0, inputB: 0, output: 0 }, { inputA: 0, inputB: 1, output: 0 }, { inputA: 1, inputB: 0, output: 0 }, { inputA: 1, inputB: 1, output: 1 }], outputPattern: "0001" });
runtimeAssertions += 4;

const reactionRate = loaded.get("learning-model-reaction-rate-over-time");
assert.equal(reactionRate.i("reactant").length, 81);
assert.deepEqual(reactionRate.i("product")[0], { x: 0, y: 0 });
const initialReactant = reactionRate.r({ observed_species: "reactant", selectedTimeMinutes: 0 });
assert.equal(initialReactant.concentration, 1);
assert.equal(initialReactant.signedGradient, -1 / 7);
assert.ok(Math.abs(initialReactant.guideRise - initialReactant.signedGradient * initialReactant.guideRun) < 1e-14);
runtimeAssertions += 5;

const inhibition = loaded.get("learning-model-enzyme-inhibition-rate-effects");
assert.deepEqual(inhibition.c({ relativeSubstrateConcentration: 20, inhibitorLevel: "invalid" }), { relativeSubstrateConcentration: 10, inhibitorLevel: "low" });
assert.equal(inhibition.o("high"), 2);
assert.equal(inhibition.a(2, "none", "uninhibited"), 0.5);
const highInhibition = inhibition.i({ relativeSubstrateConcentration: 2, inhibitorLevel: "high" });
assert.equal(highInhibition.alpha, 1 + 2 / 1.5);
assert.ok(highInhibition.noncompetitiveRate < highInhibition.competitiveRate);
runtimeAssertions += 5;

const tax = loaded.get("learning-model-tax-incidence-and-elasticity");
assert.deepEqual(tax.u({ demandResponsiveness: 9, supplyResponsiveness: Number.NaN }), { demandResponsiveness: 2.4, supplyResponsiveness: 1.2 });
const equalTax = tax.i({ demandResponsiveness: 1.2, supplyResponsiveness: 1.2 });
assert.deepEqual({ buyerBurden: equalTax.buyerBurden, sellerBurden: equalTax.sellerBurden, taxedQuantity: equalTax.taxedQuantity }, { buyerBurden: 12, sellerBurden: 12, taxedQuantity: 45.6 });
assert.deepEqual(tax.c({ buyerSharePercent: 33.333 }), { buyerSharePercent: 33.3, sellerSharePercent: 66.7 });
assert.deepEqual(tax.o(1.2), { from: { x: 0, y: 110 }, to: { x: 100, y: 26.666666666666664 } });
assert.deepEqual(tax.s(1.2), { from: { x: 0, y: 10 }, to: { x: 100, y: 93.33333333333334 } });
runtimeAssertions += 5;

const ionic = loaded.get("learning-model-ionic-bond-formation");
assert.deepEqual(ionic.n(), { compound: "sodium chloride", stage: 1 });
assert.deepEqual(ionic.t({ compound: "magnesium chloride", stage: 2 }), { anionCharge: -1, anionCount: 2, cationCharge: 2, cationCount: 1, formula: "MgCl₂", metal: "Mg", metalValence: 2, nonmetal: "Cl", nonmetalValence: 7, transferred: 2, compound: "magnesium chloride", stage: 2 });
assert.deepEqual(ionic.t({ compound: "invalid", stage: -9 }), { anionCharge: -1, anionCount: 1, cationCharge: 1, cationCount: 1, formula: "NaCl", metal: "Na", metalValence: 1, nonmetal: "Cl", nonmetalValence: 7, transferred: 1, compound: "sodium chloride", stage: 0 });
runtimeAssertions += 3;

const halogens = loaded.get("learning-model-halogen-reactivity-trend");
const chlorineBromide = halogens.a({ initial_halogen: "chlorine", initial_halide: "bromide" });
assert.equal(chlorineBromide.selected.reacts, true);
assert.equal(chlorineBromide.selected.liberated, "bromine");
assert.equal(chlorineBromide.selected.equation, "\\mathrm{Cl}_2 + 2\\mathrm{Br}^- \\rightarrow 2\\mathrm{Cl}^- + \\mathrm{Br}_2");
assert.equal(halogens.a({ initial_halogen: "bromine", initial_halide: "chloride" }).selected.reacts, false);
assert.equal(chlorineBromide.cells.length, 9);
runtimeAssertions += 5;

const buffer = loaded.get("learning-model-buffer-ph-strong-acid-base");
assert.deepEqual(buffer.a({ netStrongAcidMinusBaseMoles: 0.012 }), { netStrongAcidMinusBaseMoles: 0.01 });
const neutralBuffer = buffer.r({ netStrongAcidMinusBaseMoles: 0 });
assert.deepEqual({ bufferPh: neutralBuffer.bufferPh, waterPh: neutralBuffer.waterPh, direction: neutralBuffer.direction }, { bufferPh: 4.76, waterPh: 7, direction: "none" });
const acidBuffer = buffer.r({ netStrongAcidMinusBaseMoles: 0.01 });
assert.deepEqual({ bufferHaMoles: acidBuffer.bufferHaMoles, bufferAMinusMoles: acidBuffer.bufferAMinusMoles, waterPh: acidBuffer.waterPh, bufferHaParticleCount: acidBuffer.bufferHaParticleCount, bufferAMinusParticleCount: acidBuffer.bufferAMinusParticleCount }, { bufferHaMoles: 0.060000000000000005, bufferAMinusMoles: 0.04, waterPh: 2, bufferHaParticleCount: 12, bufferAMinusParticleCount: 8 });
assert.ok(Math.abs(acidBuffer.bufferPh - (4.76 + Math.log10(2 / 3))) < 1e-14);
runtimeAssertions += 4;

const seaLevel = loaded.get("learning-model-sea-level-rise");
assert.deepEqual({ first: seaLevel.n[0], last: seaLevel.n.at(-1), length: seaLevel.n.length }, { first: { x: 1993, y: 0 }, last: { x: 2024, y: 107 }, length: 32 });
const laterSeaLevel = seaLevel.i({ interval: "later", selectedYear: 2016 });
assert.deepEqual({ selectedChange: laterSeaLevel.selectedChange, elapsedYears: laterSeaLevel.elapsedYears, intervalYears: laterSeaLevel.intervalYears }, { selectedChange: 68, elapsedYears: 23, intervalYears: 9 });
assert.ok(Math.abs(laterSeaLevel.intervalChange - 42.3) < 1e-12);
assert.equal(seaLevel.i({ interval: "invalid", selectedYear: 9999 }).values.selectedYear, 2024);
runtimeAssertions += 4;

const heteroskedasticity = loaded.get("learning-model-heteroskedasticity");
assert.deepEqual(heteroskedasticity.o({ initial_variance_pattern: "invalid" }), { initial_variance_pattern: "constant" });
const increasingCloud = heteroskedasticity.r("increasing");
assert.equal(increasingCloud.length, 72);
assert.deepEqual(increasingCloud, heteroskedasticity.r("increasing"));
const increasingGuides = heteroskedasticity.i("increasing");
assert.equal(increasingGuides.length, 18);
assert.ok(Math.abs(increasingGuides.at(-1).y) > Math.abs(increasingGuides[1].y));
runtimeAssertions += 5;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
