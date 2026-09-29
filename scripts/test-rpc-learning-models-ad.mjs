import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");
const models = [
  ["model-9c56b533bfd3.js", "learning-model-iupac-hydrocarbon-naming", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-47702d2695d6.js", "learning-model-law-of-reflection", ["a", "c", "d", "f", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u"]],
  ["model-f27f59868f2e.js", "learning-model-linear-inequality-solution-ray", ["a", "c", "d", "f", "g", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u"]],
  ["model-8dcf9b79ed1a.js", "learning-model-correlation", ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-3d95a574c11d.js", "learning-model-electron-orbital-filling", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-dbdb00b115a8.js", "learning-model-histogram", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-adb41ae5837c.js", "learning-model-contour-lines-and-relief", ["a", "i", "n", "r", "t"]],
  ["model-7e5397a87b87.js", "learning-model-bootstrap-distribution", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-4ade1fb3e1f8.js", "learning-model-nitrogen-cycle", ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-3eedc6e81e01.js", "learning-model-velocity-as-slope-graph", ["a", "c", "d", "f", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u"]],
];

const dependencies = (source, expression) => [...source.matchAll(expression)].map((match) => match[1]);
let sourceAssertions = 0;
for (const [asset, directory] of models) {
  const original = fs.readFileSync(path.join(ASSET_ROOT, asset), "utf8");
  const recovered = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  const originalDependencies = dependencies(original, /from "\.\/([^"]+)\.js"/g).map((dependency) => dependency.replace(/-[a-f0-9]{12}$/, ""));
  const recoveredDependencies = dependencies(recovered, /(?:from\s+|import\s*)["']@rchunk\/([^"']+)/g);
  assert.deepEqual(recoveredDependencies, originalDependencies, directory + " preserves static dependencies");
  assert.equal((original.match(/import\(/g) ?? []).length, 0, asset + " has no dynamic dependencies");
  assert.equal((recovered.match(/import\(/g) ?? []).length, 0, directory + " adds no dynamic dependencies");
  assert.equal(/\bany\b|@ts-expect-error/.test(recovered), false, directory + " has no escape hatches");
  sourceAssertions += 4;
}

async function bundle(directory) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "rpc-learning-model-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "export {};", loader: "js" })); } }] });
  const encoded = Buffer.from(result.outputFiles[0].text).toString("base64");
  return import("data:text/javascript;base64," + encoded + "#" + directory);
}
const loaded = new Map();
let runtimeAssertions = 0;
for (const [_asset, directory, expectedExports] of models) { const module = await bundle(directory); loaded.set(directory, module); assert.deepEqual(Object.keys(module).sort(), [...expectedExports].sort(), directory + " preserves compressed exports"); runtimeAssertions += 1; }

const formatter = { formatMessage: ({ defaultMessage }, values = {}) => Object.entries(values).reduce((message, [key, value]) => message.replace(`{${key}}`, value), defaultMessage) };

const iupac = loaded.get("learning-model-iupac-hydrocarbon-naming");
assert.equal(iupac.c("invalid"), "3-ethyl-2,4-dimethylhexane");
assert.equal(iupac.l(8), 3);
const alkane = iupac.n("3-ethyl-2,4-dimethylhexane");
assert.deepEqual(iupac.a(alkane), { prefixes: ["3-ethyl", "2,4-dimethyl"], parent: "hexane", full: "3-ethyl-2,4-dimethylhexane" });
assert.deepEqual(iupac.r(alkane), [{ name: "ethyl", locants: [3] }, { name: "methyl", locants: [2, 4] }]);
assert.deepEqual(iupac.s(alkane), [3, 4, 5]);
assert.equal(iupac.o(iupac.n("2-ethylpent-1-ene")), 4);
assert.equal(iupac.a(iupac.n("4-methylhex-2-yne")).full, "4-methylhex-2-yne");
runtimeAssertions += 7;

const reflection = loaded.get("learning-model-law-of-reflection");
assert.deepEqual(reflection.f({ incidentAngleDeg: -4, incidentRayLength: 999 }), { incidentAngleDeg: 10, incidentRayLength: 176 });
const geometry = reflection.o(40, 144);
assert.ok(Math.abs(geometry.incidentSource.x + geometry.reflectedEnd.x - 448) < 1e-12);
assert.equal(geometry.incidentSource.y, geometry.reflectedEnd.y);
const recoveredReflection = reflection.i(geometry.incidentSource);
assert.ok(Math.abs(recoveredReflection.incidentAngleDeg - 40) < 1e-12 && Math.abs(recoveredReflection.incidentRayLength - 144) < 1e-12);
assert.deepEqual(reflection.c({ bounds: { left: 10, top: 20, width: 896, height: 640 }, clientX: 458, clientY: 340 }), { x: 224, y: 160 });
assert.deepEqual(reflection.a(), { incident: { x: 176, y: 200 }, reflected: { x: 288, y: 176 } });
assert.match(geometry.incidentArcPath, /^M 224\.00 192\.00 A 40 40/);
runtimeAssertions += 7;

const inequality = loaded.get("learning-model-linear-inequality-solution-ray");
const solved = inequality.m({ a: -3, b: 2, c: 11, relation: "greater_than" });
assert.deepEqual({ boundary: solved.solutionBoundary, relation: solved.solutionRelation, flips: solved.signFlips, set: solved.solutionSet }, { boundary: -3, relation: "less_than", flips: true, set: "ray" });
assert.equal(inequality.s(solved), "-3x + 2 > 11");
assert.equal(inequality.c(solved), "-3x > 9");
assert.equal(inequality.u(solved), "x < -3");
assert.equal(inequality.l({ a: 4, b: 0, c: 2, relation: "less_than" }), "1/2");
assert.deepEqual([inequality.u({ a: 0, b: 2, c: 3, relation: "less_than" }), inequality.u({ a: 0, b: 4, c: 3, relation: "less_than" })], ["x ∈ ℝ", "∅"]);
assert.deepEqual(inequality.a([-3, 0, 5]), { min: -6, max: 8, ticks: [-6, -4, -2, 0, 2, 4, 6, 8] });
runtimeAssertions += 7;

const correlation = loaded.get("learning-model-correlation");
assert.ok(correlation.i(correlation.a("positive")) > 0.9);
assert.ok(correlation.i(correlation.a("negative")) < -0.9);
assert.equal(correlation.c({ pattern: "invalid", points: [] }).pattern, "positive");
const negativeLine = [{ x: 0, y: 10 }, { x: 2, y: 8 }, { x: 8, y: 2 }, { x: 10, y: 0 }];
assert.deepEqual(correlation.c({ pattern: "none", points: negativeLine }), { pattern: "negative", points: negativeLine });
assert.ok(Math.abs(correlation.i(negativeLine) + 1) < 1e-12);
assert.deepEqual(correlation.o(negativeLine), [{ x: 0, y: 10 }, { x: 10, y: 0 }]);
assert.deepEqual(correlation.t, { min: 0, max: 10 });
runtimeAssertions += 7;

const orbitals = loaded.get("learning-model-electron-orbital-filling");
assert.deepEqual(orbitals.a(10), { atomicNumber: 10, symbol: "Ne", name: "Neon" });
assert.equal(orbitals.n(10), "1s² 2s² 2p⁶");
assert.equal(orbitals.n(24), "1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁵ 4s¹");
assert.equal(orbitals.n(29), "1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s¹");
assert.equal(orbitals.r(21), "3d");
const nitrogen2p = orbitals.i(7).find(({ id }) => id === "2p");
assert.deepEqual(nitrogen2p.orbitals, [{ up: true, down: false }, { up: true, down: false }, { up: true, down: false }]);
assert.deepEqual([orbitals.s(-2), orbitals.s(99)], [1, 36]);
runtimeAssertions += 7;

const histogram = loaded.get("learning-model-histogram");
const symmetric = histogram.a(histogram.n);
assert.deepEqual({ shape: symmetric.shape, count: symmetric.totalCount, bins: symmetric.bins.length, inspected: symmetric.inspectedBin }, { shape: "roughly symmetric", count: 40, bins: 10, inspected: { start: 50, end: 60, count: 11 } });
const outlier = histogram.a({ distribution_shape: "gap or outlier", binWidth: 12, inspectedValue: 94 });
assert.equal(outlier.binWidth, 10);
assert.deepEqual(outlier.inspectedBin, { start: 90, end: 100, count: 1 });
assert.ok(outlier.separatingGapBinCount >= 3);
assert.deepEqual(histogram.a({ distribution_shape: "bad", binWidth: "bad", inspectedValue: 999 }).inspectedValue, 100);
assert.deepEqual(histogram.t, [5, 10, 20]);
runtimeAssertions += 6;

const contour = loaded.get("learning-model-contour-lines-and-relief");
assert.deepEqual(contour.a({ terrain_example: "bad", ax: -4, ay: 99, bx: 50, by: null }), { terrain_example: "two-hills-and-saddle", ax: 4, ay: 56, bx: 50, by: 30 });
const transect = contour.n({ terrain_example: "two-hills-and-saddle", ax: 8, ay: 30, bx: 92, by: 30 });
assert.equal(transect.samples.length, 181);
assert.ok(transect.maximum > transect.minimum);
assert.equal(transect.crossings.every((crossing, index) => index === 0 || transect.crossings[index - 1].distance <= crossing.distance), true);
const contourLines = contour.r("single-hill");
assert.ok(contourLines.length > 0);
assert.equal(contourLines.every(({ level, points }) => level >= 80 && level <= 260 && points.length > 1), true);
runtimeAssertions += 6;

const bootstrap = loaded.get("learning-model-bootstrap-distribution");
const emptyMean = bootstrap.a("mean");
const emptySummary = bootstrap.i(emptyMean);
assert.deepEqual({ statistic: emptySummary.statistic, observed: emptySummary.observedStatistic, lower: emptySummary.lower, upper: emptySummary.upper, error: emptySummary.standardError }, { statistic: "mean", observed: 9, lower: 9, upper: 9, error: 0 });
const generated = bootstrap.o("median");
assert.deepEqual({ statistic: generated.statistic, confidence: generated.confidenceLevel, count: generated.statistics.length, sample: generated.latestResample.length }, { statistic: "median", confidence: 95, count: 320, sample: 8 });
const added = bootstrap.r(emptyMean, 3, () => 0);
assert.deepEqual(added.statistics, [4, 4, 4]);
const addedSummary = bootstrap.i(added);
assert.equal(addedSummary.binCounts.reduce((sum, count) => sum + count, 0), 3);
assert.equal(addedSummary.lowerTailCount + addedSummary.centralCount + addedSummary.upperTailCount, 3);
assert.equal(bootstrap.n, 5000);
assert.deepEqual(bootstrap.t, [80, 90, 95, 99]);
runtimeAssertions += 7;

const nitrogen = loaded.get("learning-model-nitrogen-cycle");
assert.deepEqual(nitrogen.c({ focus_process: "invalid" }), { focus_process: "whole cycle" });
assert.deepEqual([nitrogen.a("nitrification"), nitrogen.i(2), nitrogen.i(99)], [4, "assimilation and food web", "denitrification"]);
assert.match(nitrogen.r(formatter, "fixation"), /atmospheric N₂/);
assert.equal(nitrogen.o(formatter, "assimilation and food web"), "Assimilation and food web");
assert.match(nitrogen.n(formatter, "denitrification"), /Focus: Denitrification/);
assert.equal(nitrogen.u.version, 2);
runtimeAssertions += 6;

const velocity = loaded.get("learning-model-velocity-as-slope-graph");
assert.deepEqual(velocity.c(velocity.t).map(({ velocity }) => velocity), [2.8, 0, -2.4, 2]);
const midpoint = velocity.s(velocity.t, 1.25);
assert.deepEqual(midpoint, { time: 1.25, position: 0.5, velocity: 2.8, velocityDefined: true, intervalIndex: 0 });
const knot = velocity.s(velocity.t, 2.5);
assert.deepEqual({ position: knot.position, velocity: knot.velocity, defined: knot.velocityDefined, index: knot.intervalIndex }, { position: 4, velocity: 0, defined: false, index: 1 });
assert.deepEqual(velocity.o(), { time: [0, 10], position: [-11, 11], velocity: [-9, 9] });
assert.deepEqual(velocity.f({ positionAt0SecondsMeters: -99, positionAt2_5SecondsMeters: 99 }), [{ t: 0, x: -10 }, { t: 2.5, x: 10 }, { t: 5, x: 4 }, { t: 7.5, x: -2 }, { t: 10, x: 3 }]);
assert.deepEqual(velocity.a(() => 0.5), velocity.t);
assert.deepEqual([velocity.p(-4), velocity.p(3.9), velocity.u(0.01), velocity.u(-0.2)], [0, 3, 0, -0.2]);
runtimeAssertions += 7;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
