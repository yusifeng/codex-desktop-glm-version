import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");
const models = [
  ["model-f8f17b609087.js", "learning-model-blood-circulation", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-bea8f9895437.js", "learning-model-blockchain-hash-chain", ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-a050f4969274.js", "learning-model-landslide-risk-and-movement-types", ["a", "c", "d", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-d5f4853cc9bc.js", "learning-model-projectile-motion", ["a", "c", "d", "f", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-8b840e3306b1.js", "learning-model-competition-and-niches", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-5ba45a3a952c.js", "learning-model-primary-vs-secondary-pollutants", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-9a70bfbca159.js", "learning-model-phase-diagram", ["a", "c", "d", "f", "i", "l", "n", "o", "p", "r", "s", "t", "u"]],
  ["model-e5951484f222.js", "learning-model-solubility-equilibrium", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-dc14533cccec.js", "learning-model-dice-roll-frequency", ["a", "i", "n", "r", "t"]],
  ["model-7206de562b9d.js", "learning-model-acid-strength-conjugate-base-stability", ["a", "i", "n", "r", "t"]],
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

const formatter = { formatMessage: ({ defaultMessage }) => defaultMessage };
const circulation = loaded.get("learning-model-blood-circulation");
assert.deepEqual(circulation.s({ circulation: "invalid" }), { circulation: "pulmonary" });
assert.deepEqual([circulation.i("systemic"), circulation.r(0.7)], [1, "systemic"]);
assert.match(circulation.n(formatter, "pulmonary"), /right ventricle/);
assert.match(circulation.a(formatter, "systemic"), /venae cavae/);
runtimeAssertions += 4;

const blockchain = loaded.get("learning-model-blockchain-hash-chain");
const originalChain = blockchain.r({ chainState: "original" });
assert.equal(originalChain.every((block) => block.isValid), true);
assert.equal(blockchain.a(originalChain), -1);
const tamperedChain = blockchain.r({ chainState: "tamper_block_1" });
assert.deepEqual(tamperedChain.map(({ index, isTampered, isValid }) => ({ index, isTampered, isValid })), [{ index: 0, isTampered: false, isValid: true }, { index: 1, isTampered: true, isValid: false }, { index: 2, isTampered: false, isValid: false }, { index: 3, isTampered: false, isValid: false }]);
assert.equal(blockchain.a(tamperedChain), 1);
assert.deepEqual([blockchain.o("tamper_block_2"), blockchain.i(3)], [2, "tamper_block_3"]);
runtimeAssertions += 5;

const landslide = loaded.get("learning-model-landslide-risk-and-movement-types");
assert.deepEqual([landslide.c(4.7), landslide.a(2.6)], ["flow", "strong shaking"]);
assert.deepEqual(landslide.i({ initial_movement_type: "fall", slope_condition: "stable conditions" }), { movement: "fall", condition: "stable conditions", runoutEndX: 476, assetExposed: false, destabilized: false });
assert.deepEqual(landslide.i({ initial_movement_type: "flow", slope_condition: "strong shaking" }), { movement: "flow", condition: "strong shaking", runoutEndX: 608, assetExposed: true, destabilized: true });
assert.equal(landslide.i({ initial_movement_type: "spread", slope_condition: "stable conditions" }).assetExposed, true);
runtimeAssertions += 4;

const projectile = loaded.get("learning-model-projectile-motion");
assert.deepEqual(projectile.l({ initialSpeedMetersPerSecond: 100, launchAngleDegrees: 0 }), { initialSpeedMetersPerSecond: 25, launchAngleDegrees: 25 });
assert.deepEqual(projectile.a, { xMax: 70, yMax: 32 });
const shot = projectile.u({ initialSpeedMetersPerSecond: 18, launchAngleDegrees: 45 });
assert.ok(Math.abs(shot.horizontalVelocity - 18 / Math.sqrt(2)) < 1e-12);
assert.ok(Math.abs(shot.maxHeight - shot.initialVerticalVelocity ** 2 / 19.6) < 1e-12);
const samples = projectile.o(shot, 5);
assert.equal(samples.length, 5);
assert.deepEqual(samples[0], { time: 0, x: 0, y: 0, verticalVelocity: shot.initialVerticalVelocity });
assert.ok(Math.abs(samples[4].x - shot.range) < 1e-12);
assert.equal(samples[4].y, 0);
runtimeAssertions += 7;

const niches = loaded.get("learning-model-competition-and-niches");
assert.deepEqual(niches.s({ resource_dimension: "invalid", resourceSimilarity: 999, competitorPresent: 0.3 }), { resource_dimension: "food size", resourceSimilarity: 100, competitorPresent: 0 });
const withoutCompetitor = niches.a({ resource_dimension: "food size", resourceSimilarity: 58, competitorPresent: 0 });
const withCompetitor = niches.a({ resource_dimension: "food size", resourceSimilarity: 58, competitorPresent: 1 });
assert.deepEqual([withoutCompetitor.speciesA.length, withoutCompetitor.speciesBFundamental.length, withoutCompetitor.speciesBRealized.length, withoutCompetitor.shared.length], [161, 161, 161, 161]);
assert.ok(withCompetitor.sharedArea < withoutCompetitor.sharedArea);
assert.equal(withoutCompetitor.speciesBCenter, 7.35 - 0.58 * 2.9);
runtimeAssertions += 4;

const pollutants = loaded.get("learning-model-primary-vs-secondary-pollutants");
assert.deepEqual(pollutants.s({ initial_pathway: "invalid" }), { initial_pathway: "photochemical-smog" });
assert.deepEqual([pollutants.r("secondary-particles"), pollutants.n(0.6)], [1, "secondary-particles"]);
assert.match(pollutants.i(formatter, "photochemical-smog"), /ground-level ozone/);
assert.match(pollutants.a(formatter, "secondary-particles"), /sulfate, nitrate, and organic particles/);
runtimeAssertions += 4;

const phase = loaded.get("learning-model-phase-diagram");
assert.deepEqual(phase.d({ temperature: -5, pressure: 120 }), { temperature: 0, pressure: 100 });
assert.equal(phase.c({ temperature: 30, pressure: 25 }), "triple");
assert.equal(phase.c({ temperature: 82, pressure: 78 }), "critical");
assert.equal(phase.c({ temperature: 90, pressure: 90 }), "supercritical");
assert.deepEqual([phase.s(1), phase.s(25), phase.s(50), phase.s(78), phase.s(90)], ["gas-only", "triple", "melting-vaporization", "melting-critical", "melting-supercritical"]);
assert.deepEqual([phase.o(10), phase.o(30), phase.o(32), phase.o(50), phase.o(82), phase.o(90)], ["deposition", "triple", "condensation-freezing", "condensation", "critical", "supercritical"]);
assert.deepEqual(phase.u(0, 10, (x) => x * 2, 2), [{ x: 0, y: 0 }, { x: 5, y: 10 }, { x: 10, y: 20 }]);
runtimeAssertions += 7;

const solubility = loaded.get("learning-model-solubility-equilibrium");
assert.deepEqual(solubility.o({ dissolution_stoichiometry: "invalid", ksp: 0, initialIonProductRatio: 9 }), { dissolution_stoichiometry: "MX", ksp: 1e-18, initialIonProductRatio: 2.2 });
assert.deepEqual(solubility.n({ dissolution_stoichiometry: "MX2", ksp: 1e-17, initialIonProductRatio: 1 }), { dissolution_stoichiometry: "MX2", ksp: 1e-17, initialIonProductRatio: 1, state: "saturated", equationLatex: "MX_2(s)\\rightleftharpoons M^{2+}(aq)+2X^{-}(aq)", ionProductLatex: "[M^{2+}][X^-]^2", initialQsp: 1e-17 });
assert.equal(solubility.s(2, 0), 2);
assert.ok(solubility.s(2, 8) > 1 && solubility.s(2, 8) < 1.01);
assert.deepEqual({ length: solubility.r(0.5).length, first: solubility.r(0.5)[0], lastX: solubility.r(0.5)[64].x }, { length: 65, first: { x: 0, y: 0.5 }, lastX: 8 });
assert.equal(solubility.i(8.5e-17), "8.5\\times10^{-17}");
runtimeAssertions += 6;

const dice = loaded.get("learning-model-dice-roll-frequency");
assert.deepEqual(dice.i({ count1: 3, count2: -2, lastRoll: 2 }), { counts: [3, 0, 0, 0, 0, 0], lastRoll: null, maximumCount: 3, totalRolls: 3 });
const randomValues = [0, 0.2, 0.99];
const rolled = dice.r(dice.n, 3, () => randomValues.shift());
assert.deepEqual(rolled, { count1: 1, count2: 1, count3: 0, count4: 0, count5: 0, count6: 1, lastRoll: 6 });
assert.deepEqual(dice.i(rolled), { counts: [1, 1, 0, 0, 0, 1], lastRoll: 6, maximumCount: 1, totalRolls: 3 });
assert.deepEqual(dice.t, [1, 2, 3, 4, 5, 6]);
runtimeAssertions += 4;

const acidStrength = loaded.get("learning-model-acid-strength-conjugate-base-stability");
assert.equal(acidStrength.n({ comparison: "invalid" }).key, "resonance");
assert.deepEqual({ stronger: acidStrength.n({ comparison: "inductive" }).stronger.pKa, weaker: acidStrength.n({ comparison: "inductive" }).weaker.pKa }, { stronger: 2.9, weaker: 4.8 });
assert.equal(acidStrength.n({ comparison: "resonance" }).stronger.baseContributors.length, 2);
assert.deepEqual(acidStrength.t, ["resonance", "inductive", "atom-trend", "hybridization"]);
runtimeAssertions += 4;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
