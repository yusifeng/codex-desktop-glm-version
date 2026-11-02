import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");
const models = [
  ["model-bc73e06612d8.js", "learning-model-pcr-cycle", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-9aaba6ef3b2a.js", "learning-model-double-entry-transaction-effects", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-c8be72ed6ac0.js", "learning-model-food-web", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-a41dd4bab755.js", "learning-model-one-sample-t-test", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-689c31877cb2.js", "learning-model-sampling-distribution", ["a", "c", "d", "f", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-65944a036c44.js", "learning-model-rational-limits-at-infinity", ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-48fb6d2122d9.js", "learning-model-mean-value-theorem", ["a", "c", "d", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-dabd83a67c23.js", "learning-model-synthetic-division", ["a", "i", "n", "o", "r", "s", "t"]],
];
const dependencies = (source, expression) => [...source.matchAll(expression)].map(match => match[1]);
const approximatelyEqual = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} ≈ ${expected}`);
let sourceAssertions = 0;
for (const [asset, directory] of models) {
  const original = fs.readFileSync(path.join(ASSET_ROOT, asset), "utf8");
  const recovered = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  const originalDependencies = dependencies(original, /from "\.\/([^"]+)\.js"/g).map(dependency => dependency.replace(/-[a-f0-9]{12}$/, ""));
  const recoveredDependencies = dependencies(recovered, /(?:from\s+|import\s*)["']@rchunk\/([^"']+)/g);
  assert.deepEqual(recoveredDependencies, originalDependencies);
  assert.equal((original.match(/import\(/g) ?? []).length, 0);
  assert.equal((recovered.match(/import\(/g) ?? []).length, 0);
  assert.equal(/\bany\b|@ts-expect-error/.test(recovered), false);
  sourceAssertions += 4;
}
async function bundle(directory) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: modulePath }) => ({ contents: modulePath === "app-shared" ? "export const G2 = value => value; export const K2 = () => {};" : "export {};", loader: "js" }));
  } }] });
  return import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64") + "#" + directory);
}
const loaded = new Map(); let runtimeAssertions = 0;
for (const [_asset, directory, expected] of models) { const module = await bundle(directory); loaded.set(directory, module); assert.deepEqual(Object.keys(module).sort(), [...expected].sort()); runtimeAssertions += 1; }


const pcr = loaded.get("learning-model-pcr-cycle"); pcr.c(); assert.deepEqual(pcr.l({ stage: 9 }), { stage: 4 }); assert.deepEqual(pcr.t.map(stage => [stage.id, stage.temperatureCelsius]), [["start", 25], ["denaturing", 95], ["annealing", 55], ["extension", 72]]); assert.equal(pcr.i({ stage: 2 }).activeStage.id, "denaturing"); assert.equal(pcr.a(95), "95 °C"); assert.equal(pcr.o(pcr.t[2]), "Annealing"); assert.equal(pcr.s(pcr.t[3]), "Polymerase builds DNA strands."); assert.deepEqual(pcr.r({ stage: 1 }), { descriptor: "Setup", detail: "PCR ingredients are combined (25 °C)." }); runtimeAssertions += 7;

const entries = loaded.get("learning-model-double-entry-transaction-effects"); entries.i(); assert.equal(entries.a({ transaction_type: "bad" }).transaction_type, entries.t); for (const transaction of entries.n) { const result = entries.r({ transaction_type: transaction }); assert.equal(result.isJournalBalanced, true); assert.equal(result.isEquationBalanced, true); } assert.deepEqual(entries.r({ transaction_type: "equipment purchase for cash" }).equationTotals, { assets: 0, liabilities: 0, equity: 0 }); assert.deepEqual(entries.r({ transaction_type: "owner investment for cash" }).equationTotals, { assets: 10000, liabilities: 0, equity: 10000 }); runtimeAssertions += 11;


const web = loaded.get("learning-model-food-web"); web.i(); assert.deepEqual(web.o({ ecosystem: "bad", pathIndex: 99 }), { ecosystem: "terrestrial", pathIndex: 3 }); assert.equal(web.t.terrestrial.nodes.length, 8); assert.equal(web.t.terrestrial.links.length, 11); const marinePath = web.r({ ecosystem: "marine", pathIndex: 1 }); assert.deepEqual(marinePath, ["producerLeft", "primaryRight", "omnivore", "hunter", "apex"]); assert.equal(web.a(marinePath, "omnivore", "hunter"), true); assert.equal(web.a(marinePath, "hunter", "omnivore"), false); runtimeAssertions += 6;

const ttest = loaded.get("learning-model-one-sample-t-test"); ttest.i(); assert.deepEqual(ttest.a({ sample_size: 1, alternative: "bad" }).sample_size, 3); const twoSided = ttest.r({}); approximatelyEqual(twoSided.standardError, 2.5); approximatelyEqual(twoSided.tStatistic, 1.6); assert.equal(twoSided.degreesOfFreedom, 15); assert.ok(twoSided.pValue > 0.12 && twoSided.pValue < 0.14); assert.equal(twoSided.reject, false); approximatelyEqual(ttest.r({ alternative: "greater" }).pValue * 2, twoSided.pValue); approximatelyEqual(ttest.r({ sample_mean: 50 }).pValue, 1); approximatelyEqual(ttest.o(0, 15), 1); runtimeAssertions += 8;

const sampling = loaded.get("learning-model-sampling-distribution"); sampling.o(); const summary = sampling.i({ latestSample: [1, 3], histogramCounts: [2] }); assert.equal(summary.histogramCounts.length, 96); assert.equal(summary.latestMean, 2); assert.equal(summary.repetitions, 2); assert.deepEqual([sampling.l("normal", 0), sampling.l("right-skewed", -2)], [1, 0]); approximatelyEqual(sampling.u("normal", 0, 10), 1); assert.equal(sampling.a({ density: value => Math.exp(-value * value), populationMean: 50, populationStandardDeviation: 12, baseline: 4, height: 20 }).length, 321); const simulated = sampling.r({}, 3, () => 0.5); assert.equal(simulated.latestSample.length, 10); assert.equal(simulated.histogramCounts.reduce((sum, value) => sum + value, 0), 3); assert.equal(sampling.s(simulated).histogramCounts.reduce((sum, value) => sum + value, 0), 0); runtimeAssertions += 9;

const rational = loaded.get("learning-model-rational-limits-at-infinity"); rational.a(); assert.deepEqual(rational.c({ numeratorDegree: -4, denominatorDegree: 9 }), { numeratorDegree: 0, denominatorDegree: 3, numeratorLeadingCoefficient: 2, denominatorLeadingCoefficient: 1 }); const zero = rational.s({}); assert.deepEqual([zero.numerator, zero.denominator, zero.quotient, zero.limitCase], [[1, 2], [3, 0, 1], [0], "zero"]); const ratio = rational.s({ numeratorDegree: 2, denominatorDegree: 2, numeratorLeadingCoefficient: 2, denominatorLeadingCoefficient: 1 }); assert.deepEqual([ratio.limitCase, ratio.ratio], ["ratio", 2]); assert.equal(rational.s({ numeratorDegree: 3, denominatorDegree: 2 }).limitCase, "slant"); assert.equal(rational.s({ numeratorDegree: 3, denominatorDegree: 1 }).limitCase, "unbounded"); assert.equal(rational.o([1, 0, -2]), "-2x^{2}+1"); runtimeAssertions += 6;

const mvt = loaded.get("learning-model-mean-value-theorem"); mvt.c(); const theorem = mvt.a({}); approximatelyEqual(theorem.c, 5); approximatelyEqual(theorem.tangentSlope, theorem.secantSlope); const linear = mvt.a({ cubicCoefficient: 0, quadraticCoefficient: 0, linearCoefficient: 3, intervalCenter: 2, intervalWidth: 4 }); approximatelyEqual(linear.c, 2); approximatelyEqual(linear.secantSlope, 3); const bounds = mvt.s(mvt.l({}), theorem); assert.ok([bounds.xMin, bounds.xMax, bounds.yMin, bounds.yMax].every(Number.isFinite)); assert.equal(mvt.o(-0.001), "0"); runtimeAssertions += 6;

const synthetic = loaded.get("learning-model-synthetic-division"); synthetic.i(); assert.equal(synthetic.a({ dividendDegree: 9, step: 99 }).dividendDegree, 5); const division = synthetic.n({}); assert.deepEqual(division.dividendCoefficients, [4, 7, -13, 6]); assert.equal(division.syntheticValue, -3); assert.deepEqual(division.syntheticBottom, [4, -5, 2, 0]); assert.deepEqual(division.quotientCoefficients, [4, -5, 2]); assert.equal(division.remainder, 0); assert.equal(division.totalSteps, 9); assert.equal(division.dividendLabel, "4x^3 + 7x^2 - 13x + 6"); assert.equal(synthetic.r(-0), "0"); runtimeAssertions += 9;

sourceAssertions += assertReleaseOwner("learning-model-array-queue-front-rear");
sourceAssertions += assertReleaseOwner("learning-model-binary-heap-operations");

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
