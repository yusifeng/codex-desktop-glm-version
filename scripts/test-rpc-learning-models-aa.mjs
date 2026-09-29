import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");
const models = [
  ["model-e47d7e4cfcac.js", "learning-model-selection-process", ["a", "i", "n", "r", "t"]],
  ["model-15af4e81d3df.js", "learning-model-wastewater-treatment", ["a", "i", "n", "r", "t"]],
  ["model-d9ab7382d7d3.js", "learning-model-common-ion-effect", ["a", "i", "n", "o", "r", "t"]],
  ["model-e535a6efec39.js", "learning-model-normal-approximation-to-binomial", ["a", "c", "d", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-aad91beb6420.js", "learning-model-freezing-point-depression", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-2921ad175a74.js", "learning-model-piano-roll-note-editing", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-dc171645f526.js", "learning-model-stress-strain-material-limits", ["a", "c", "d", "f", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u"]],
  ["model-916bb0f1566f.js", "learning-model-particle-diffusion", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-554288d91497.js", "learning-model-predator-prey-dynamics", ["a", "i", "n", "o", "r", "t"]],
  ["model-5fdbc0dfab74.js", "learning-model-round-robin-cpu-scheduling", ["a", "i", "n", "o", "r", "t"]],
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

const selection = loaded.get("learning-model-selection-process");
const ordered = selection.t({ mode: "ordered-without-replacement", optionCount: 5, selectionCount: 3 });
assert.deepEqual(selection.t({ mode: "ordered-without-replacement", optionCount: 5, selectionCount: 3 }), ordered);
assert.equal(new Set(ordered.selectionOrderTokenIds).size, 3);
assert.equal(ordered.durationSeconds, 3.75);
assert.deepEqual([selection.n(5, 3, true), selection.n(5, 3, false), selection.r(5, 3)], [125, 60, 10]);
assert.deepEqual({ phase: selection.i(ordered, 0).phase, settled: selection.i(ordered, 0).settledDrawCount }, { phase: "available", settled: 0 });
assert.deepEqual({ phase: selection.i(ordered, ordered.durationSeconds).phase, settled: selection.i(ordered, ordered.durationSeconds).settledDrawCount }, { phase: "placed", settled: 3 });
const unordered = selection.t({ mode: "unordered-without-replacement", optionCount: 6, selectionCount: 4 });
assert.deepEqual(unordered.resultTokenIds, [...unordered.resultTokenIds].sort((left, right) => left - right));
runtimeAssertions += 7;

const wastewater = loaded.get("learning-model-wastewater-treatment");
assert.deepEqual(wastewater.a({ stageIndex: 99 }), { stageIndex: 5 });
assert.deepEqual(wastewater.a({ stageIndex: Number.NaN }), { stageIndex: 0 });
assert.equal(wastewater.r(formatter, 2), "Biological aeration");
assert.match(wastewater.n(formatter, 3), /return to aeration/);
assert.equal(wastewater.r(formatter, 99), "Effluent and sludge outcomes");
runtimeAssertions += 5;

const commonIon = loaded.get("learning-model-common-ion-effect");
assert.deepEqual(commonIon.n({ salt_example: "invalid", addedCommonIonMilliMolar: 3 }).salt_example, "AgCl with NaCl");
const silver = commonIon.n({ salt_example: "AgCl with NaCl", addedCommonIonMilliMolar: 0.2 });
assert.ok(silver.molarSolubility < silver.pureWaterSolubility);
assert.ok(Math.abs(silver.molarSolubility * silver.commonIonMolar - silver.salt.ksp) < 1e-22);
const calciumPure = commonIon.i("CaF2 with NaF", 0);
assert.ok(Math.abs(4 * calciumPure ** 3 - 39e-12) < 1e-24);
assert.deepEqual(commonIon.t, { min: 0, max: 1, step: 0.01, defaultValue: 0.2 });
runtimeAssertions += 5;

const normal = loaded.get("learning-model-normal-approximation-to-binomial");
assert.deepEqual(normal.l({ trials: 1, success_probability: 2, success_count: -5, event: "invalid" }), { trials: 10, success_probability: 0.98, success_count: 0, event: "at_most" });
const approximation = normal.a({ trials: 40, success_probability: 0.5, success_count: 20, event: "at_most" });
assert.deepEqual({ bars: approximation.bars.length, expectedSuccesses: approximation.expectedSuccesses, expectedFailures: approximation.expectedFailures, boundary: approximation.upperBoundary, ruleTen: approximation.meetsRuleOfTen }, { bars: 41, expectedSuccesses: 20, expectedFailures: 20, boundary: 20.5, ruleTen: true });
assert.ok(Math.abs(approximation.exactProbability - 0.5626853438097896) < 1e-12);
assert.ok(Math.abs(approximation.approximateProbability - 0.5628164562349496) < 1e-6);
assert.ok(Math.abs(normal.c(0, 0, 1) - 1 / Math.sqrt(2 * Math.PI)) < 1e-12);
const normalCurve = normal.o(-2, 2, 0, 1);
assert.deepEqual({ length: normalCurve.length, first: normalCurve[0], last: normalCurve.at(-1) }, { length: 99, first: { x: -2, y: 0 }, last: { x: 2, y: 0 } });
runtimeAssertions += 6;

const freezing = loaded.get("learning-model-freezing-point-depression");
assert.deepEqual(freezing.o({ solvent: "invalid", molality: 9, particles: -2 }), { solvent: "water", molality: 0.5, particles: 1 });
const water = freezing.r({ solvent: "water", molality: 0.25, particles: 2 });
assert.deepEqual({ particleMolality: water.particleMolality, depression: water.depressionC, solution: water.solutionFreezingC, maximum: water.maxDepressionC }, { particleMolality: 0.5, depression: 0.93, solution: -0.93, maximum: 2.79 });
const phaseDiagram = freezing.i(water);
assert.deepEqual([phaseDiagram.sublimation.length, phaseDiagram.pureVapor.length, phaseDiagram.solutionVapor.length], [42, 42, 42]);
assert.ok(phaseDiagram.solutionTriple.x < phaseDiagram.pureTriple.x);
assert.equal(freezing.c.canonicalFormula, "\\Delta T_f = iK_fm");
runtimeAssertions += 5;

const piano = loaded.get("learning-model-piano-roll-note-editing");
assert.deepEqual(piano.n, ["C5", "B4", "A4", "G4", "F4", "E4"]);
assert.equal(piano.s(1.13), 1.25);
const relationship = piano.a(piano.t);
assert.deepEqual({ relation: relationship.relationship, overlap: relationship.overlapBeats, gap: relationship.separatedGap }, { relation: "overlap", overlap: 0.5, gap: null });
const durationEdit = piano.r(piano.t, "duration", 20);
assert.equal(durationEdit.durationBeats, 3.5);
const retuned = piano.r(piano.t, "retune", -4);
assert.equal(retuned.pitchIndex, 0);
const editStart = piano.i(piano.t, "retune");
assert.deepEqual([editStart.beforePitchIndex, editStart.beforeOnsetBeats, editStart.beforeDurationBeats, editStart.lastEdit], [piano.t.pitchIndex, piano.t.onsetBeats, piano.t.durationBeats, "retune"]);
runtimeAssertions += 6;

const stress = loaded.get("learning-model-stress-strain-material-limits");
assert.deepEqual(stress.d({ material: "invalid", loadProgress: 5 }), { material: "steel", loadProgress: 1 });
const steel = stress.a("steel");
assert.equal(stress.o(steel, steel.yieldStrain), steel.yieldStressMPa);
assert.equal(stress.o(steel, steel.ultimateStrain), steel.tensileStrengthMPa);
assert.equal(stress.o(steel, steel.fractureStrain), steel.fractureStressMPa);
assert.ok(Math.abs(stress.u(steel, 0.28) - steel.yieldStrain) < 1e-15);
assert.ok(Math.abs(stress.l(steel, 1) - 1) < 1e-15);
assert.deepEqual([stress.s(steel, 0), stress.s(steel, steel.yieldStrain * 2), stress.s(steel, 0.2), stress.s(steel, steel.fractureStrain)], ["elastic", "plastic", "necking", "fracture"]);
assert.equal(stress.f(steel, steel.fractureStrain / 2), 0.5);
runtimeAssertions += 8;

const diffusion = loaded.get("learning-model-particle-diffusion");
assert.deepEqual(diffusion.l({ initialLeftCount: 99, phase: "invalid" }), { initialLeftCount: 30, phase: "start" });
assert.deepEqual([diffusion.s(0), diffusion.s(4), diffusion.s(14)], ["start", "middle", "equilibrium"]);
const diffusionRun = diffusion.i(diffusion.r, 27);
assert.deepEqual({ seed: diffusionRun.seed, initial: diffusionRun.initialLeftCount, frames: diffusionRun.frames.length, firstLeft: diffusionRun.frames[0].leftCount, lastLeft: diffusionRun.frames.at(-1).leftCount }, { seed: diffusion.r, initial: 27, frames: 321, firstLeft: 27, lastLeft: 16 });
assert.equal(diffusion.o(diffusionRun, 0), diffusionRun.frames[0]);
assert.equal(diffusion.o(diffusionRun, 16), diffusionRun.frames.at(-1));
assert.deepEqual(diffusion.t, { left: 24, right: 360, top: 24, bottom: 258, midpoint: 192 });
runtimeAssertions += 6;

const predatorPrey = loaded.get("learning-model-predator-prey-dynamics");
const normalizedPredatorPrey = predatorPrey.r({ initial_prey_abundance: 9, initial_predator_abundance: 0, startingBalance: "invalid", selectedTime: 99 });
assert.deepEqual(normalizedPredatorPrey.values, { initial_prey_abundance: 1.4, initial_predator_abundance: 0.65, startingBalance: "balanced", selectedTime: 20 });
assert.deepEqual([normalizedPredatorPrey.preyPoints.length, normalizedPredatorPrey.predatorPoints.length], [501, 501]);
const equilibrium = predatorPrey.r({ initial_prey_abundance: 1, initial_predator_abundance: 1, startingBalance: "balanced", selectedTime: 4 });
assert.deepEqual({ prey: equilibrium.prey, predator: equilibrium.predator, preyDirection: equilibrium.preyDirection, predatorDirection: equilibrium.predatorDirection, equilibrium: equilibrium.isEquilibrium }, { prey: 1, predator: 1, preyDirection: "steady", predatorDirection: "steady", equilibrium: true });
assert.deepEqual(predatorPrey.n, { min: 0, max: 20, step: 0.25, defaultValue: 4 });
assert.equal(predatorPrey.o.version, 3);
runtimeAssertions += 5;

const roundRobin = loaded.get("learning-model-round-robin-cpu-scheduling");
assert.deepEqual(roundRobin.r(), { time_quantum: 3, workload: "mixed-bursts", step: 0 });
const schedule = roundRobin.n({ time_quantum: 3, workload: "mixed-bursts", step: 4 });
assert.deepEqual({ maxStep: schedule.maxStep, totalBurst: schedule.totalBurst, totalPreemptions: schedule.totalPreemptions, totalContextSwitches: schedule.totalContextSwitches, elapsed: schedule.elapsed }, { maxStep: 8, totalBurst: 21, totalPreemptions: 4, totalContextSwitches: 7, elapsed: 11 });
assert.deepEqual(schedule.queue, ["P1", "P2", "P4"]);
assert.deepEqual(schedule.remaining, { P1: 5, P2: 2, P3: 0, P4: 3 });
assert.deepEqual(schedule.completed, ["P3"]);
assert.deepEqual(schedule.visibleSlices.map(({ processId, duration, outcome }) => ({ processId, duration, outcome })), [{ processId: "P1", duration: 3, outcome: "preempted" }, { processId: "P2", duration: 3, outcome: "preempted" }, { processId: "P3", duration: 2, outcome: "completed" }, { processId: "P4", duration: 3, outcome: "preempted" }]);
const longQuantum = roundRobin.n({ time_quantum: 8, workload: "mixed-bursts", step: 99 });
assert.deepEqual({ slices: longQuantum.maxStep, preemptions: longQuantum.totalPreemptions, completed: longQuantum.completed }, { slices: 4, preemptions: 0, completed: ["P1", "P2", "P3", "P4"] });
runtimeAssertions += 7;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
