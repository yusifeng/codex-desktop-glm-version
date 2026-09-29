import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");

const models = [
  ["model-6e039b1d844f.js", "learning-model-restriction-enzyme-map", ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-54778b6d513f.js", "learning-model-side-by-side-box-plots", ["a", "c", "d", "f", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-adbf96dad63f.js", "learning-model-z-score-p-value", ["a", "c", "d", "f", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-65fc78301123.js", "learning-model-wilcoxon-rank-sum", ["a", "i", "n", "r", "t"]],
  ["model-379965cd8d4f.js", "learning-model-spreadsheet-if-function", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-7fc37b4d721d.js", "learning-model-codon-chart", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-a3291de53919.js", "learning-model-straight-line-depreciation", ["a", "i", "n", "o", "r", "t"]],
  ["model-4f70c67288f2.js", "learning-model-electric-field", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-276f1b14e837.js", "learning-model-equilibrium-concentration-graph", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-761532c576d5.js", "learning-model-mean-as-balance-point", ["a", "c", "d", "i", "l", "n", "o", "r", "s", "t", "u"]],
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

const restriction = loaded.get("learning-model-restriction-enzyme-map");
restriction.o();
const circularDigest = restriction.a({ molecule_topology: "circular plasmid", digest: 2 });
assert.deepEqual(circularDigest.selectedLane, { digest: 2, fragments: [1500, 1500, 3000], bands: [{ size: 3000, count: 1 }, { size: 1500, count: 2 }] });
assert.deepEqual(circularDigest.activeSites, [{ enzyme: "A", position: 1000 }, { enzyme: "B", position: 2500 }, { enzyme: "A", position: 4000 }]);
assert.deepEqual(restriction.a({ molecule_topology: "linear DNA", digest: 0 }).selectedLane.fragments, [1000, 3000, 2000]);
assert.deepEqual(restriction.a({ molecule_topology: "linear DNA", digest: 2 }).selectedLane.fragments, [1000, 1500, 1500, 2000]);
assert.equal(restriction.c(6000), 0);
assert.equal(restriction.c(1000), 1);
assert.equal(restriction.s("A", 0), true);
assert.equal(restriction.s("B", 0), false);
runtimeAssertions += 8;

const boxes = loaded.get("learning-model-side-by-side-box-plots");
boxes.c();
assert.deepEqual(boxes.a("same-median-different-iqr"), { comparisonMedian: 50, comparisonIqr: 30 });
assert.deepEqual(boxes.u({ initial_comparison: "different-median-same-iqr" }), { initial_comparison: "different-median-same-iqr", comparisonMedian: 62, comparisonIqr: 20 });
assert.deepEqual(boxes.i({ initial_comparison: "different-median-different-iqr", comparisonMedian: 60, comparisonIqr: 24 }), { minimum: 30, q1: 48, median: 60, q3: 72, maximum: 90 });
assert.equal(boxes.o(boxes.r), 20);
assert.equal(boxes.s(boxes.r), 70);
assert.equal(boxes.l("invalid"), "same-median-different-iqr");
runtimeAssertions += 6;

const zScore = loaded.get("learning-model-z-score-p-value");
zScore.l();
assert.deepEqual(zScore.u({ zScore: 1.956, testType: "invalid" }), { zScore: 1.96, testType: "two-sided" });
const twoSided = zScore.o({ zScore: 1.96, testType: "two-sided" });
assert.equal(twoSided.magnitude, 1.96);
assert.ok(twoSided.pValue > 0.049 && twoSided.pValue < 0.051);
approximatelyEqual(zScore.o({ zScore: 1.96, testType: "one-sided" }).pValue * 2, twoSided.pValue);
approximatelyEqual(zScore.c(0), 1 / Math.sqrt(2 * Math.PI));
const area = zScore.s(-1, 1);
assert.equal(area.length, 51);
assert.deepEqual([area[0], area.at(-1)], [{ x: -1, y: 0 }, { x: 1, y: 0 }]);
runtimeAssertions += 7;

const wilcoxon = loaded.get("learning-model-wilcoxon-rank-sum");
wilcoxon.r();
const intermingled = wilcoxon.t({ initial_pattern: "intermingled", stage: 3 });
assert.deepEqual({ ranksA: intermingled.ranksA, ranksB: intermingled.ranksB, sumA: intermingled.sumA, sumB: intermingled.sumB, uA: intermingled.uA, uB: intermingled.uB }, { ranksA: [2, 4, 6, 8, 10], ranksB: [1, 3, 5, 7, 9], sumA: 30, sumB: 25, uA: 15, uB: 10 });
assert.deepEqual(wilcoxon.t({ initial_pattern: "group-a-lower" }), { ...wilcoxon.t({ initial_pattern: "group-a-lower" }), uA: 0, uB: 25 });
const ties = wilcoxon.t({ initial_pattern: "ties" });
assert.deepEqual({ ranksA: ties.ranksA, ranksB: ties.ranksB, sumA: ties.sumA, sumB: ties.sumB, uA: ties.uA, uB: ties.uB }, { ranksA: [1, 4, 4, 7.5, 9], ranksB: [2, 4, 6, 7.5, 10], sumA: 25.5, sumB: 29.5, uA: 10.5, uB: 14.5 });
assert.deepEqual(wilcoxon.t({ initial_pattern: "invalid", stage: 99 }).values, { initial_pattern: "intermingled", stage: 3 });
runtimeAssertions += 4;

const spreadsheet = loaded.get("learning-model-spreadsheet-if-function");
spreadsheet.a();
assert.deepEqual(spreadsheet.i({}), { safeValues: { comparison_operator: ">=", initial_input_value: 8, initial_comparison_value: 10 }, inputRatio: 0.4, comparisonRatio: 0.5, isTrue: false, isEqual: false });
assert.deepEqual(spreadsheet.i({ comparison_operator: "<=", initial_input_value: 10, initial_comparison_value: 10 }), { safeValues: { comparison_operator: "<=", initial_input_value: 10, initial_comparison_value: 10 }, inputRatio: 0.5, comparisonRatio: 0.5, isTrue: true, isEqual: true });
assert.equal(spreadsheet.i({ comparison_operator: ">", initial_input_value: 20, initial_comparison_value: 0 }).isTrue, true);
assert.deepEqual(spreadsheet.i({ comparison_operator: "invalid", initial_input_value: -5, initial_comparison_value: 99 }).safeValues, { comparison_operator: ">=", initial_input_value: 0, initial_comparison_value: 20 });
runtimeAssertions += 4;

const codon = loaded.get("learning-model-codon-chart");
codon.i();
assert.deepEqual(codon.r(), { first_base: "A", second_base: "U", third_base: "G" });
assert.deepEqual(codon.a({}), { firstBase: "A", secondBase: "U", thirdBase: "G", codon: "AUG", outcome: "Met", outcomes: ["Ile", "Ile", "Ile", "Met"], isStart: true, isStop: false });
assert.equal(codon.a({ first_base: "U", second_base: "A", third_base: "A" }).isStop, true);
assert.equal(codon.a({ first_base: "G", second_base: "G", third_base: "C" }).outcome, "Gly");
assert.equal(codon.a({ first_base: "invalid" }).codon, "AUG");
runtimeAssertions += 5;

const depreciation = loaded.get("learning-model-straight-line-depreciation");
depreciation.r();
assert.deepEqual(depreciation.i({ costUsd: 1, salvageFraction: 9, usefulLifeYears: 99, ageFraction: -1 }), { costUsd: 20000, salvageFraction: 0.5, usefulLifeYears: 10, ageFraction: 0 });
const depreciationState = depreciation.n({ costUsd: 60000, salvageFraction: 0.1, usefulLifeYears: 5, ageFraction: 0.4 });
assert.deepEqual({ salvageValue: depreciationState.salvageValue, depreciableAmount: depreciationState.depreciableAmount, annualDepreciationExpense: depreciationState.annualDepreciationExpense, selectedYear: depreciationState.selectedYear, accumulatedDepreciation: depreciationState.accumulatedDepreciation, bookValue: depreciationState.bookValue }, { salvageValue: 6000, depreciableAmount: 54000, annualDepreciationExpense: 10800, selectedYear: 2, accumulatedDepreciation: 21600, bookValue: 38400 });
assert.equal(depreciationState.yearlyBookValues.length, 6);
assert.deepEqual(depreciationState.yearlyBookValues.at(-1), { year: 5, bookValue: 6000 });
assert.equal(depreciation.o.canonicalFormula, "D = \\frac{C-S}{L}");
runtimeAssertions += 5;

const electric = loaded.get("learning-model-electric-field");
electric.a();
assert.deepEqual(electric.s({ polarity: "invalid", testX: 0, testY: 0 }), { polarity: "positive", testX: 0.44, testY: 0 });
assert.deepEqual(electric.i({ bounds: { left: 10, top: 20, width: 352, height: 248 }, clientX: 186, clientY: 148 }), { testX: 0, testY: 0 });
const positiveField = electric.r({ polarity: "positive", testX: 0.6, testY: 0.8 });
const clampedDistance = Math.hypot(0.6, 0.72);
assert.deepEqual(positiveField.safeValues, { polarity: "positive", testX: 0.6, testY: 0.72 });
approximatelyEqual(positiveField.distance, clampedDistance);
approximatelyEqual(positiveField.relativeStrength, 1 / clampedDistance ** 2);
approximatelyEqual(positiveField.fieldUnitX, 0.6 / clampedDistance);
approximatelyEqual(positiveField.fieldUnitY, 0.72 / clampedDistance);
approximatelyEqual(positiveField.arrowLength, 9 / clampedDistance ** 2);
const negativeField = electric.r({ polarity: "negative", testX: 0.6, testY: 0.8 });
approximatelyEqual(negativeField.fieldUnitX, -0.6 / clampedDistance);
approximatelyEqual(negativeField.fieldUnitY, -0.72 / clampedDistance);
assert.deepEqual(electric.o({ polarity: "positive", testX: 0.56, testY: 0.36 }, 0.1, -0.1), { polarity: "positive", testX: 0.66, testY: 0.26 });
runtimeAssertions += 11;

const equilibrium = loaded.get("learning-model-equilibrium-concentration-graph");
equilibrium.i();
assert.deepEqual(equilibrium.a({ equilibrium_constant: 99, initial_total_concentration: -2, addition: 0.6 }), { equilibrium_constant: 4, initial_total_concentration: 0.5, addition: 1 });
const reactantAddition = equilibrium.r({ equilibrium_constant: 2, initial_total_concentration: 1, addition: 0 });
approximatelyEqual(reactantAddition.initialA, 1 / 3);
approximatelyEqual(reactantAddition.initialB, 2 / 3);
approximatelyEqual(reactantAddition.finalA, 0.5);
approximatelyEqual(reactantAddition.finalB, 1);
approximatelyEqual(reactantAddition.immediateA, 5 / 6);
approximatelyEqual(reactantAddition.immediateB, 2 / 3);
assert.deepEqual([reactantAddition.reactantCurve.length, reactantAddition.productCurve.length], [64, 64]);
const productAddition = equilibrium.r({ equilibrium_constant: 2, initial_total_concentration: 1, addition: 1 });
approximatelyEqual(productAddition.immediateA, 1 / 3);
approximatelyEqual(productAddition.immediateB, 7 / 6);
runtimeAssertions += 10;

const balance = loaded.get("learning-model-mean-as-balance-point");
balance.o();
const symmetric = balance.c(0);
assert.deepEqual(symmetric, { example: 0, candidate: 6, value0: 2, value1: 4, value2: 5, value3: 7, value4: 8, value5: 10 });
assert.deepEqual(balance.a(symmetric), [2, 4, 5, 7, 8, 10]);
assert.equal(balance.n([2, 4, 5, 7, 8, 10]), 6);
assert.deepEqual(balance.i([2, 4, 5, 7, 8, 10], 6), { left: 7, right: 7, leftCount: 3, rightCount: 3 });
assert.equal(balance.s([2, 4, 5, 7, 8, 10], 6), true);
assert.deepEqual([balance.r(5, 6), balance.r(6, 6), balance.r(7, 6)], ["left", "center", "right"]);
const moved = balance.d(symmetric, 0, 12);
approximatelyEqual(moved.candidate, 46 / 6);
assert.equal(moved.value0, 12);
assert.equal(balance.u(symmetric, 6.04).candidate, 6);
assert.equal(balance.u(symmetric, 8.2).candidate, 8.2);
runtimeAssertions += 10;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
