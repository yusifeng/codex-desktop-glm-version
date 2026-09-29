import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");

const models = [
  ["model-f237c900e681.js", "learning-model-delta-g-k-e-relationship", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-f4dbaa3dfc38.js", "learning-model-sample-space-grid", ["a", "i", "n", "o", "r", "t"]],
  ["model-43a9f02da387.js", "learning-model-density-dependence", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-940064895671.js", "learning-model-bond-polarity", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-83dea67c5a42.js", "learning-model-nernst-equation", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-c57d1e222f54.js", "learning-model-active-vs-passive-immunity", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-e01a7cfd8d48.js", "learning-model-fractions-number-line", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-6bc352ee4868.js", "learning-model-money-market", ["a", "i", "n", "o", "r", "t"]],
  ["model-17b71618727c.js", "learning-model-geometric-distribution", ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-6d7b03cccde0.js", "learning-model-eutrophication", ["a", "i", "n", "o", "r", "t"]],
];

const dependencies = (source, expression) => [...source.matchAll(expression)].map(match => match[1]);
const approximatelyEqual = (actual, expected, tolerance = 1e-10) =>
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} is approximately ${expected}`);

let sourceAssertions = 0;
for (const [asset, directory] of models) {
  const original = fs.readFileSync(path.join(ASSET_ROOT, asset), "utf8");
  const recovered = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  const originalDependencies = dependencies(original, /from "\.\/([^"]+)\.js"/g)
    .map(dependency => dependency.replace(/-[a-f0-9]{12}$/, ""));
  const recoveredDependencies = dependencies(recovered, /(?:from\s+|import\s*)["']@rchunk\/([^"']+)/g);
  assert.deepEqual(recoveredDependencies, originalDependencies, directory + " preserves static dependencies");
  assert.equal((original.match(/import\(/g) ?? []).length, 0, asset + " has no dynamic dependencies");
  assert.equal((recovered.match(/import\(/g) ?? []).length, 0, directory + " adds no dynamic dependencies");
  assert.equal(/\bany\b|@ts-expect-error/.test(recovered), false, directory + " has no escape hatches");
  sourceAssertions += 4;
}

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm",
    platform: "node", target: "node22", write: false, logLevel: "silent",
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
for (const [_asset, directory, expectedExports] of models) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  assert.deepEqual(Object.keys(module).sort(), [...expectedExports].sort(), directory + " preserves compressed exports");
  runtimeAssertions += 1;
}

const electrochemistry = loaded.get("learning-model-delta-g-k-e-relationship");
electrochemistry.a();
const standardElectrochemistry = electrochemistry.i({ standard_cell_potential_volts: 0.12, electrons_transferred: 2, temperature_kelvin: 298.15 });
approximatelyEqual(standardElectrochemistry.deltaGKilojoules, -23.1564797088);
approximatelyEqual(standardElectrochemistry.lnK, 2 * 96_485.33212 * 0.12 / (8.314462618 * 298.15));
approximatelyEqual(standardElectrochemistry.log10K, standardElectrochemistry.lnK / Math.LN10);
assert.equal(standardElectrochemistry.regime, "forward");
assert.deepEqual(electrochemistry.i({ standard_cell_potential_volts: 0, electrons_transferred: 99, temperature_kelvin: 1 }), { standard_cell_potential_volts: 0, electrons_transferred: 6, temperature_kelvin: 250, deltaGKilojoules: 0, lnK: 0, log10K: 0, regime: "balanced" });
assert.equal(electrochemistry.i({ standard_cell_potential_volts: -0.1 }).regime, "reverse");
runtimeAssertions += 6;

const sampleSpace = loaded.get("learning-model-sample-space-grid");
sampleSpace.r();
const sumSeven = sampleSpace.i({ event: "sum equals 7" });
assert.deepEqual({ event: sumSeven.event, favorableCount: sumSeven.favorableCount, totalCount: sumSeven.totalCount, simplifiedNumerator: sumSeven.simplifiedNumerator, simplifiedDenominator: sumSeven.simplifiedDenominator }, { event: "sum equals 7", favorableCount: 6, totalCount: 36, simplifiedNumerator: 1, simplifiedDenominator: 6 });
assert.equal(sumSeven.outcomes.length, 36);
assert.equal(sampleSpace.i({ event: "sum equals 5" }).favorableCount, 4);
assert.equal(sampleSpace.i({ event: "sum at least 10" }).favorableCount, 6);
assert.equal(sampleSpace.i({ event: "matching values" }).favorableCount, 6);
assert.equal(sampleSpace.i({ event: "invalid" }).event, "sum equals 7");
runtimeAssertions += 6;

const density = loaded.get("learning-model-density-dependence");
density.i();
assert.deepEqual(density.a({ carrying_capacity: Number.NaN, intrinsic_growth_rate: Number.NaN, current_density: Number.NaN }), { carrying_capacity: 100, intrinsic_growth_rate: 0.4, current_density: 60 });
assert.deepEqual(density.r({ carrying_capacity: 100, intrinsic_growth_rate: 0.4, current_density: 100 }), { carryingCapacity: 100, intrinsicGrowthRate: 0.4, currentDensity: 100, densityDependentRate: 0, densityIndependentRate: 0.26, state: "stable" });
assert.equal(density.r({ carrying_capacity: 100, intrinsic_growth_rate: 0.4, current_density: 50 }).state, "growing");
assert.equal(density.r({ carrying_capacity: 100, intrinsic_growth_rate: 0.4, current_density: 150 }).state, "declining");
assert.deepEqual(density.a({ carrying_capacity: 999, intrinsic_growth_rate: 3, current_density: 999 }), { carrying_capacity: 200, intrinsic_growth_rate: 0.8, current_density: 400 });
runtimeAssertions += 5;

const polarity = loaded.get("learning-model-bond-polarity");
polarity.a();
const hydrogenChlorine = polarity.i({ atom1: "H", atom2: "Cl" });
assert.deepEqual({ values: hydrogenChlorine.values, difference: hydrogenChlorine.difference, direction: hydrogenChlorine.direction }, { values: { atom1: "H", atom2: "Cl" }, difference: 0.96, direction: "right" });
assert.equal(hydrogenChlorine.strength, 0.539326);
assert.equal(polarity.i({ atom1: "F", atom2: "H" }).direction, "left");
assert.equal(polarity.i({ atom1: "O", atom2: "O" }).direction, "equal");
assert.deepEqual(polarity.o({ atom1: "invalid", atom2: "invalid" }), { atom1: "H", atom2: "Cl" });
assert.equal(polarity.c.canonicalFormula, "\\Delta \\chi = |\\chi_2 - \\chi_1|");
runtimeAssertions += 6;

const nernst = loaded.get("learning-model-nernst-equation");
nernst.o();
const standardNernst = nernst.a({ standard_cell_potential_v: 1.1, transferred_electrons: 2, log10_q: 0 });
assert.deepEqual({ voltsPerDecade: standardNernst.voltsPerDecade, cellPotentialV: standardNernst.cellPotentialV, region: standardNernst.region, atEquilibrium: standardNernst.atEquilibrium }, { voltsPerDecade: 0.0296, cellPotentialV: 1.1, region: "standard", atEquilibrium: false });
approximatelyEqual(standardNernst.log10K, 1.1 / 0.0296);
const equilibriumNernst = nernst.a({ standard_cell_potential_v: 1.1, transferred_electrons: 2, log10_q: 1.1 / 0.0296 });
assert.equal(equilibriumNernst.atEquilibrium, true);
assert.equal(equilibriumNernst.cellPotentialV, 0);
assert.equal(nernst.a({ standard_cell_potential_v: 1.1, transferred_electrons: 2, log10_q: 88 }).beyondEquilibrium, true);
assert.deepEqual(nernst.a({ standard_cell_potential_v: Number.NaN, transferred_electrons: 99, log10_q: -99 }).standard_cell_potential_v, 1.1);
runtimeAssertions += 6;

const immunity = loaded.get("learning-model-active-vs-passive-immunity");
immunity.i();
assert.deepEqual(immunity.a({ initial_example: "vaccination", stage: 0 }), { initial_example: "vaccination", stage: 0, selected: { example: "vaccination", acquisition: "artificial", response: "active" }, activeProtection: 0.12, passiveProtection: 1 });
assert.deepEqual(immunity.a({ initial_example: "maternal-antibodies", stage: 2.2 }), { initial_example: "maternal-antibodies", stage: 2, selected: { example: "maternal-antibodies", acquisition: "natural", response: "passive" }, activeProtection: 0.82, passiveProtection: 0 });
assert.equal(immunity.a({ initial_example: "invalid", stage: 99 }).initial_example, "vaccination");
assert.equal(immunity.a({ initial_example: "immune-globulin", stage: 99 }).stage, 3);
assert.equal(immunity.n.length, 4);
runtimeAssertions += 5;

const fractions = loaded.get("learning-model-fractions-number-line");
fractions.o();
assert.deepEqual(fractions.s({ numerator: 99, denominator: 1 }), { denominator: 2, numerator: 36 });
assert.deepEqual(fractions.r({ numerator: 7, denominator: 4 }), { classification: "improper", denominator: 4, maxNumerator: 36, numerator: 7, positionRatio: 0.875, remainder: 3, value: 1.75, visibleMaxNumerator: 8, visibleUnits: 2, whole: 1 });
assert.equal(fractions.r({ numerator: 0, denominator: 4 }).classification, "zero");
assert.equal(fractions.r({ numerator: 4, denominator: 4 }).classification, "one");
assert.equal(fractions.r({ numerator: 8, denominator: 4 }).classification, "whole");
assert.deepEqual(fractions.i(4, 2), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
assert.deepEqual(fractions.a(7), [0, 2, 4, 6, 7]);
runtimeAssertions += 7;

const money = loaded.get("learning-model-money-market");
money.i();
assert.deepEqual(money.r({ initial_market_change: "baseline", interestRate: 6 }), { initial_market_change: "baseline", interestRate: 6, suppliedQuantity: 60, desiredQuantity: 60, equilibriumRate: 6, demandShift: 0, supplyShift: 0, demandLine: { from: { x: 0, y: 12 }, to: { x: 120, y: 0 } }, imbalance: 0, status: "equilibrium" });
assert.deepEqual(money.r({ initial_market_change: "money supply increases", interestRate: 6 }), { initial_market_change: "money supply increases", interestRate: 6, suppliedQuantity: 80, desiredQuantity: 60, equilibriumRate: 4, demandShift: 0, supplyShift: 20, demandLine: { from: { x: 0, y: 12 }, to: { x: 120, y: 0 } }, imbalance: -20, status: "excess supply" });
assert.equal(money.r({ initial_market_change: "money demand increases", interestRate: 6 }).status, "excess demand");
assert.deepEqual(money.r({ initial_market_change: "money demand decreases", interestRate: 6 }).demandLine, { from: { x: 0, y: 10 }, to: { x: 100, y: 0 } });
assert.equal(money.r({ initial_market_change: "invalid", interestRate: 99 }).interestRate, 10);
runtimeAssertions += 5;

const geometric = loaded.get("learning-model-geometric-distribution");
geometric.s();
assert.deepEqual(geometric.c({ success_probability: 99, selected_trial: -1 }), { success_probability: 0.8, selected_trial: 1 });
const geometricState = geometric.r({ success_probability: 0.25, selected_trial: 4 });
assert.deepEqual({ successProbability: geometricState.successProbability, failureProbability: geometricState.failureProbability, selectedTrial: geometricState.selectedTrial, selectedProbability: geometricState.selectedProbability, expectedTrials: geometricState.expectedTrials }, { successProbability: 0.25, failureProbability: 0.75, selectedTrial: 4, selectedProbability: 0.10546875, expectedTrials: 4 });
assert.equal(geometricState.outcomes.length, 16);
assert.equal(geometric.i(1.23, 3), "1.23");
assert.equal(geometric.a(0.000001), "<0.001%");
assert.equal(geometric.a(0.25), "25%");
assert.equal(geometric.o(0.000001), "\\lt 0.00001");
assert.equal(geometric.o(0.125), "=0.125");
runtimeAssertions += 8;

const eutrophication = loaded.get("learning-model-eutrophication");
eutrophication.i();
assert.deepEqual(eutrophication.r({}), { waterBody: "freshwater lake", nutrientInput: "excess nutrient input", stageIndex: 0, stage: "nutrient input", excess: true, runoffCount: 8, bloomStrength: 0, lightStrength: 0.9, detritusCount: 0, oxygenLevel: "high", fishState: "healthy" });
assert.deepEqual(eutrophication.r({ waterBody: "estuary", nutrientInput: "excess nutrient input", stageIndex: 3 }), { waterBody: "estuary", nutrientInput: "excess nutrient input", stageIndex: 3, stage: "hypoxia", excess: true, runoffCount: 8, bloomStrength: 1, lightStrength: 0.25, detritusCount: 13, oxygenLevel: "low", fishState: "stressed" });
assert.deepEqual(eutrophication.r({ waterBody: "coastal bay", nutrientInput: "typical nutrient input", stageIndex: 3 }), { waterBody: "coastal bay", nutrientInput: "typical nutrient input", stageIndex: 3, stage: "hypoxia", excess: false, runoffCount: 3, bloomStrength: 0.28, lightStrength: 0.9, detritusCount: 4, oxygenLevel: "adequate", fishState: "healthy" });
assert.equal(eutrophication.r({ stageIndex: "2" }).stage, "die-off and decomposition");
assert.equal(eutrophication.r({ waterBody: "invalid", stageIndex: "invalid" }).waterBody, "freshwater lake");
runtimeAssertions += 5;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
