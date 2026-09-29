import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");
const models = [
  ["model-1bde8be079ab.js", "learning-model-cross-price-elasticity", ["a", "c", "d", "f", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-9d831e60e68f.js", "learning-model-knn-neighbor-voting", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-30adaa39a8dd.js", "learning-model-sleep-cycle-hypnogram", ["a", "i", "n", "o", "r", "t"]],
  ["model-5fdcbc5a8461.js", "learning-model-rain-shadow", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-6d9c94a4186b.js", "learning-model-menstrual-cycle-fertilization", ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-8a51aa448316.js", "learning-model-bayesian-beta-binomial-updating", ["a", "c", "d", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-5a3880d5e780.js", "learning-model-skewness-direction", ["a", "c", "d", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-365838113234.js", "learning-model-cell-membrane-transport", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-8ce870eed550.js", "learning-model-fifo-lifo-cost-flow", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-7354fd8cc5a6.js", "learning-model-photosynthesis-overview", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
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
for (const [_asset, directory, expectedExports] of models) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  assert.deepEqual(Object.keys(module).sort(), [...expectedExports].sort(), directory + " preserves compressed exports");
  runtimeAssertions += 1;
}

const formatter = { formatMessage: ({ defaultMessage }, values = {}) => Object.entries(values).reduce((message, [key, value]) => message.replace(`{${key}}`, value), defaultMessage) };

const elasticity = loaded.get("learning-model-cross-price-elasticity");
assert.deepEqual(elasticity.u({ relationship: "invalid", priceChangeDirection: null, priceChangeMagnitudePercent: 100 }), { relationship: "substitutes", priceChangeDirection: "increase", priceChangeMagnitudePercent: 30 });
const complementaryDecrease = elasticity.o({ relationship: "complements", priceChangeDirection: "decrease", priceChangeMagnitudePercent: 20 });
assert.deepEqual({ elasticity: complementaryDecrease.elasticity, price: complementaryDecrease.priceChangePercent, quantity: complementaryDecrease.quantityChangePercent, direction: complementaryDecrease.shiftDirection }, { elasticity: -0.8, price: -20, quantity: 16, direction: "right" });
assert.deepEqual([elasticity.c("complements"), elasticity.s(9), elasticity.s(-4)], [1, "complements", "substitutes"]);
assert.ok(Math.abs(complementaryDecrease.shiftedQuantity - complementaryDecrease.baselineQuantity - complementaryDecrease.curveShift) < 1e-12);
runtimeAssertions += 4;

const knn = loaded.get("learning-model-knn-neighbor-voting");
assert.deepEqual(knn.s({ k: 20, queryX: -2, queryY: Number.NaN }), { k: 9, queryX: 0, queryY: 3.3 });
const nearA = knn.a({ x: 2, y: 3 }, 3);
assert.deepEqual({ winner: nearA.winner, votes: nearA.votes, count: nearA.neighbors.length }, { winner: "a", votes: { a: 3, b: 0 }, count: 3 });
assert.equal(nearA.radius, Math.sqrt(4.25));
assert.equal(knn.i.length, 16);
runtimeAssertions += 4;

const sleep = loaded.get("learning-model-sleep-cycle-hypnogram");
const firstCycle = sleep.r({ sleep_duration_hours: 8, selectedTimeHours: 0.3 });
assert.deepEqual({ stage: firstCycle.interval.stage, cycle: firstCycle.interval.cycle, phase: firstCycle.nremPhase }, { stage: "n2", cycle: 1, phase: "toward-deep" });
const shortNight = sleep.r({ sleep_duration_hours: 3, selectedTimeHours: 99 });
assert.deepEqual({ duration: shortNight.sleep_duration_hours, selected: shortNight.selectedTimeHours, final: shortNight.intervals.at(-1) }, { duration: 5, selected: 5, final: { start: 4.9, end: 5, stage: "wake", cycle: 3 } });
assert.equal(sleep.o.version, 2);
assert.deepEqual(sleep.n, { min: 0, max: 10, step: 0.1, defaultValue: 1 });
runtimeAssertions += 4;

const rainShadow = loaded.get("learning-model-rain-shadow");
assert.deepEqual(rainShadow.s({ stageIndex: 2.6 }), { stageIndex: 3 });
assert.equal(rainShadow.r({ stageIndex: 1 }), "clouds-form");
assert.equal(rainShadow.a("rain-falls"), "Rain falls");
assert.match(rainShadow.i({ stageIndex: 3 }, formatter), /rain shadow/);
runtimeAssertions += 4;

const menstrual = loaded.get("learning-model-menstrual-cycle-fertilization");
assert.deepEqual(menstrual.c({ day: 99, outcome: "invalid" }), { day: 28, outcome: "noImplantation" });
const ovulation = menstrual.i({ day: 14, outcome: "noImplantation" });
assert.deepEqual({ phase: ovulation.phase, ovarianState: ovulation.ovarianState, liningState: ovulation.liningState }, { phase: "ovulation", ovarianState: "ovulation", liningState: "rebuilding" });
const implanted = menstrual.i({ day: 28, outcome: "successfulImplantation" });
assert.deepEqual({ ovarianState: implanted.ovarianState, liningState: implanted.liningState, thickness: implanted.liningThickness, hcg: implanted.hormones.hcg }, { ovarianState: "maintainedCorpusLuteum", liningState: "maintained", thickness: 11.25, hcg: 90 });
assert.ok(menstrual.o(14, false).lh > 92);
assert.equal(menstrual.a(28, false), 5.5);
runtimeAssertions += 5;

const bayesian = loaded.get("learning-model-bayesian-beta-binomial-updating");
assert.deepEqual(bayesian.l({ prior_alpha: 20, prior_beta: null, observed_successes: 2.7, observed_failures: -4 }), { prior_alpha: 6, prior_beta: 5, observed_successes: 3, observed_failures: 0 });
const posterior = bayesian.a({ prior_alpha: 5, prior_beta: 5, observed_successes: 6, observed_failures: 2 });
assert.deepEqual({ alpha: posterior.posteriorAlpha, beta: posterior.posteriorBeta, trials: posterior.trials, observedRate: posterior.observedRate }, { alpha: 11, beta: 7, trials: 8, observedRate: 0.75 });
assert.ok(Math.abs(posterior.posteriorMean - 11 / 18) < 1e-12);
const density = bayesian.c(2, 2, 4);
assert.deepEqual({ length: density.length, endpoints: [density[0], density.at(-1)] }, { length: 5, endpoints: [{ x: 0, y: 0 }, { x: 1, y: 0 }] });
assert.ok(Math.abs(density[2].y - 1.5) < 1e-12);
assert.deepEqual([bayesian.o(2), bayesian.o(2.5), bayesian.o(2.345)], ["2", "2.5", "2.35"]);
runtimeAssertions += 6;

const skewness = loaded.get("learning-model-skewness-direction");
assert.deepEqual(skewness.c({ direction: "invalid", skewStrength: 4 }), { direction: "right", skewStrength: 1 });
const symmetric = skewness.o({ direction: "left", skewStrength: 0 });
assert.deepEqual({ symmetric: symmetric.isSymmetric, sigmas: [symmetric.sigmaLeft, symmetric.sigmaRight], mean: symmetric.mean, points: symmetric.points.length }, { symmetric: true, sigmas: [1, 1], mean: 0, points: 161 });
assert.ok(Math.abs(symmetric.median) < 1e-12);
const rightSkew = skewness.o({ direction: "right", skewStrength: 0.6 });
const leftSkew = skewness.o({ direction: "left", skewStrength: 0.6 });
assert.ok(rightSkew.mean > 0 && rightSkew.median > 0);
assert.ok(leftSkew.mean < 0 && leftSkew.median < 0);
assert.equal(skewness.l(0, 1, 2), Math.sqrt(2 / Math.PI) / 3);
runtimeAssertions += 6;

const transport = loaded.get("learning-model-cell-membrane-transport");
assert.deepEqual(transport.s({ mechanism: "invalid" }), { mechanism: "diffusion" });
assert.deepEqual(transport.r, ["diffusion", "facilitatedDiffusion", "activeTransport"]);
assert.equal(transport.a(formatter, "facilitatedDiffusion"), "Facilitated diffusion");
assert.match(transport.i({ mechanism: "activeTransport" }, formatter), /ATP powers a pump/);
assert.deepEqual(transport.n, { min: 0, max: 2, step: 1 });
runtimeAssertions += 5;

const costFlow = loaded.get("learning-model-fifo-lifo-cost-flow");
assert.deepEqual(costFlow.o({ unitsSold: 999, priceTrend: "invalid" }), { unitsSold: 300, priceTrend: "rising" });
const rising = costFlow.i({ unitsSold: 180, priceTrend: "rising" });
assert.deepEqual({ fifo: rising.fifo.cogs, lifo: rising.lifo.cogs, difference: rising.cogsDifference, goods: rising.goodsAvailableCost, remaining: rising.unitsRemaining }, { fifo: 1600, lifo: 2000, difference: 400, goods: 3000, remaining: 120 });
assert.deepEqual(rising.fifo.allocations.map(({ cogsQuantity }) => cogsQuantity), [100, 80, 0]);
assert.deepEqual(rising.lifo.allocations.map(({ cogsQuantity }) => cogsQuantity), [0, 80, 100]);
assert.equal(costFlow.i({ unitsSold: 180, priceTrend: "falling" }).cogsDifference, -400);
runtimeAssertions += 5;

const photosynthesis = loaded.get("learning-model-photosynthesis-overview");
assert.deepEqual(photosynthesis.s({ initial_focus: "invalid" }), { initial_focus: "whole process" });
assert.deepEqual([photosynthesis.r("Calvin cycle"), photosynthesis.n(0.6), photosynthesis.n(99)], [2, "light reactions", "Calvin cycle"]);
assert.match(photosynthesis.a(formatter, "light reactions"), /releasing O₂/);
assert.match(photosynthesis.i(formatter, "Calvin cycle"), /The Calvin cycle is emphasized/);
assert.equal(photosynthesis.l.canonicalFormula, "6CO_2 + 6H_2O + \\text{light energy} \\rightarrow C_6H_{12}O_6 + 6O_2");
runtimeAssertions += 5;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
