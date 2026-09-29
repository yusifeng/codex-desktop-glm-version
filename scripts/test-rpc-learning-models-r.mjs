import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");

const models = [
  ["model-405fb8197cad.js", "learning-model-binomial-distribution", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-3afae384a050.js", "learning-model-atomic-composition", ["a", "i", "n", "o", "r", "t"]],
  ["model-5e6e1cc23b29.js", "learning-model-ld50-dose-response-curve", ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-16139428a7b1.js", "learning-model-decompression-melting", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-ac6f56bf9c33.js", "learning-model-presbyopia", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-848a1637af6a.js", "learning-model-two-digit-multiplication", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-3df69373af20.js", "learning-model-matched-pairs-design", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-ba96dde00fb4.js", "learning-model-conjugate-acid-base-pairs", ["n", "r", "t"]],
  ["model-5e45c222a8d6.js", "learning-model-newman-projections", ["a", "i", "n", "o", "r", "t"]],
  ["model-d0cb06603224.js", "learning-model-ecological-succession-stages", ["a", "c", "i", "n", "o", "r", "s", "t"]],
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
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "rpc-learning-model-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "export {};", loader: "js" }));
    } }],
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

const binomial = loaded.get("learning-model-binomial-distribution");
assert.deepEqual(binomial.a({ trials: 99, successPercent: -20 }), { trials: 10, successPercent: 0 });
const twoTrials = binomial.r({ trials: 2, successPercent: 50 });
assert.deepEqual(twoTrials.outcomes, [{ successes: 0, probability: 0.25, probabilityPercent: 25 }, { successes: 1, probability: 0.5, probabilityPercent: 50 }, { successes: 2, probability: 0.25, probabilityPercent: 25 }]);
assert.deepEqual(twoTrials.mostLikelyOutcomes, [twoTrials.outcomes[1]]);
assert.deepEqual(binomial.r({ trials: 1, successPercent: 50 }).mostLikelyOutcomes.map(({ successes }) => successes), [0, 1]);
runtimeAssertions += 4;

const atom = loaded.get("learning-model-atomic-composition");
assert.deepEqual(atom.a({ protons: 20, neutrons: -2, electrons: Number.NaN }), { protons: 10, neutrons: 0, electrons: 6 });
assert.deepEqual(atom.o({ protons: 6, neutrons: 6, electrons: 6 }, "electrons", 4), { protons: 6, neutrons: 6, electrons: 4 });
assert.deepEqual(atom.r({ protons: 6, neutrons: 8, electrons: 4 }), { values: { protons: 6, neutrons: 8, electrons: 4 }, element: { atomicNumber: 6, name: "Carbon", symbol: "C" }, massNumber: 14, netCharge: 2, chargeKind: "positive", chargeValue: "+2" });
assert.equal(atom.r({ protons: 8, neutrons: 8, electrons: 10 }).chargeValue, "-2");
runtimeAssertions += 4;

const ld50 = loaded.get("learning-model-ld50-dose-response-curve");
assert.deepEqual(ld50.c({ reference_ld50_mg_per_kg: 1, comparison_ld50_mg_per_kg: 999, administeredDoseMgPerKg: 0 }), { reference_ld50_mg_per_kg: 3, comparison_ld50_mg_per_kg: 300, administeredDoseMgPerKg: 1 });
const doseState = ld50.a({ reference_ld50_mg_per_kg: 100, comparison_ld50_mg_per_kg: 30, administeredDoseMgPerKg: 100 });
assert.equal(doseState.referenceMortalityPercent, 50);
assert.equal(doseState.moreToxic, "comparison");
assert.deepEqual({ length: ld50.o(100).length, firstX: ld50.o(100)[0].x, lastX: ld50.o(100)[120].x, midpointY: ld50.o(100)[80].y }, { length: 121, firstX: 0, lastX: 3, midpointY: 50 });
runtimeAssertions += 4;

const melting = loaded.get("learning-model-decompression-melting");
assert.deepEqual(melting.c({ depthKm: 999, mantleTemperature: -4 }), { depthKm: 240, mantleTemperature: 0 });
assert.equal(melting.l(0), 1085.7);
assert.equal(melting.o(0), 1780);
assert.equal(melting.r(0, 1), 1353.2204081632653);
const coolMantle = melting.i({ depthKm: 100, mantleTemperature: 0 });
assert.equal(coolMantle.onsetDepthKm, null);
assert.equal(coolMantle.state, "solid");
const typicalMantle = melting.i({ depthKm: 0, mantleTemperature: 1 });
assert.ok(typicalMantle.onsetDepthKm > 0 && typicalMantle.onsetDepthKm < 240);
assert.equal(typicalMantle.state, "partial-melt");
assert.equal(melting.i({ depthKm: typicalMantle.onsetDepthKm, mantleTemperature: 1 }).state, "first-melt");
runtimeAssertions += 8;

const presbyopia = loaded.get("learning-model-presbyopia");
assert.deepEqual(presbyopia.s({ condition: "invalid", objectDistanceCentimeters: 999 }), { condition: "presbyopia", objectDistanceCentimeters: 200 });
const typicalVision = presbyopia.a({ condition: "typical", objectDistanceCentimeters: 25 });
assert.deepEqual({ demand: typicalVision.accommodationDemandDiopters, available: typicalVision.availableAccommodationDiopters, focusOffset: typicalVision.focusOffset, isClear: typicalVision.isClear, distanceCategory: typicalVision.distanceCategory }, { demand: 4, available: 4, focusOffset: 0, isClear: true, distanceCategory: "near" });
const agedVision = presbyopia.a({ condition: "presbyopia", objectDistanceCentimeters: 25 });
assert.deepEqual({ available: agedVision.availableAccommodationDiopters, focusOffset: agedVision.focusOffset, blurAmount: agedVision.blurAmount, isClear: agedVision.isClear }, { available: 1.25, focusOffset: 33, blurAmount: 2.4, isClear: false });
assert.equal(presbyopia.a({ condition: "presbyopia", objectDistanceCentimeters: 150 }).distanceCategory, "far");
runtimeAssertions += 4;

const multiplication = loaded.get("learning-model-two-digit-multiplication");
assert.deepEqual(multiplication.o({ factor1: 4, factor2: 120, lessonStep: 20 }), { factor1: 10, factor2: 99, lessonStep: 7 });
const product = multiplication.i({ factor1: 24, factor2: 87, lessonStep: 4 });
assert.deepEqual({ onesPartial: product.onesPartial, tensPartial: product.tensPartial, product: product.product }, { onesPartial: 168, tensPartial: 1920, product: 2088 });
assert.deepEqual(product.terms, [{ id: "ones-ones", left: 4, right: 7, product: 28, stage: 1 }, { id: "tens-ones", left: 20, right: 7, product: 140, stage: 2 }, { id: "ones-tens", left: 4, right: 80, product: 320, stage: 3 }, { id: "tens-tens", left: 20, right: 80, product: 1600, stage: 4 }]);
runtimeAssertions += 3;

const pairs = loaded.get("learning-model-matched-pairs-design");
const selfPaired = pairs.i({ design_variant: "self-paired", matchingQuality: "poor", assignment: 0 });
assert.deepEqual({ variant: selfPaired.variant, quality: selfPaired.quality, assignment: selfPaired.assignment, effect: selfPaired.effect, meanDifference: selfPaired.meanDifference, spread: selfPaired.spread }, { variant: "self-paired", quality: "close", assignment: 3, effect: 6, meanDifference: 6, spread: 0 });
assert.equal(selfPaired.lanes.every((lane) => lane.firstBaseline === lane.secondBaseline), true);
const poorMatch = pairs.i({ design_variant: "separate-units", matchingQuality: "poor", assignment: 5 });
assert.equal(poorMatch.quality, "poor");
assert.ok(poorMatch.spread > 0);
runtimeAssertions += 4;

const conjugates = loaded.get("learning-model-conjugate-acid-base-pairs");
const forward = conjugates.n({ example: "water-and-ammonia", direction: "forward" });
assert.deepEqual({ roles: forward.roles, donor: forward.donor.name, acceptor: forward.acceptor.name, donorIndex: forward.donorIndex, acceptorIndex: forward.acceptorIndex }, { roles: ["acid", "base", "conjugate base", "conjugate acid"], donor: "water", acceptor: "ammonia", donorIndex: 0, acceptorIndex: 1 });
const reverse = conjugates.n({ example: "hydrogen-fluoride-and-water", direction: "reverse" });
assert.deepEqual({ roles: reverse.roles, donor: reverse.donor.name, acceptor: reverse.acceptor.name, donorIndex: reverse.donorIndex, acceptorIndex: reverse.acceptorIndex }, { roles: ["conjugate acid", "conjugate base", "base", "acid"], donor: "hydronium", acceptor: "fluoride", donorIndex: 3, acceptorIndex: 2 });
assert.equal(conjugates.n({ example: "invalid" }).example, "water-and-ammonia");
runtimeAssertions += 3;

const newman = loaded.get("learning-model-newman-projections");
assert.equal(newman.i(300), 5);
assert.deepEqual(newman.n({ molecule: "ethane", rotationStep: 1 }), { molecule: "ethane", rotationStep: 1, rotationDegrees: 60, methylDihedralDegrees: null, kind: "staggered", stabilityRank: 1 });
assert.deepEqual(newman.n({ molecule: "butane", rotationStep: 3 }), { molecule: "butane", rotationStep: 3, rotationDegrees: 180, methylDihedralDegrees: 180, kind: "anti-staggered", stabilityRank: 1 });
assert.equal(newman.n({ molecule: "butane", rotationStep: -1 }).kind, "gauche-staggered");
assert.deepEqual(newman.t, { molecule: "butane", rotationStep: 3 });
runtimeAssertions += 5;

const succession = loaded.get("learning-model-ecological-succession-stages");
assert.deepEqual(succession.o({ successionType: "invalid", stageIndex: 99 }), { successionType: "primary", stageIndex: 4 });
assert.deepEqual(succession.i({ successionType: "primary", stageIndex: 0 }), { values: { successionType: "primary", stageIndex: 0 }, stage: { key: "start", soil: 0, biomass: 0, structure: 0, soilDepth: 0 } });
assert.deepEqual(succession.i({ successionType: "secondary", stageIndex: 0 }).stage, { key: "start", soil: 3, biomass: 1, structure: 1, soilDepth: 30 });
assert.equal(succession.n, 5);
runtimeAssertions += 4;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
