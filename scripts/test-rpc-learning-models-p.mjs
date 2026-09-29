import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");

const models = [
  ["model-8b9f3f1fca9b.js", "learning-model-incidence-vs-prevalence", ["a", "i", "n", "r", "t"]],
  ["model-974cd7d1aaf7.js", "learning-model-reaction-quotient-vs-equilibrium-constant", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-a41a580621d5.js", "learning-model-fatty-acid-saturation", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-f98f1fe44a91.js", "learning-model-bank-credit-money-multiplier", ["a", "i", "n", "r", "t"]],
  ["model-1fb3f3c173eb.js", "learning-model-arithmetic-sequence", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-5a0d6a0ec95c.js", "learning-model-python-range-for-loop", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-5a5542c48ccf.js", "learning-model-endocrine-feedback-axis", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-9e677a243050.js", "learning-model-decision-tree-classification-path", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-a088736870ca.js", "learning-model-bond-enthalpy", ["i", "n", "r", "t"]],
  ["model-12f159b04c73.js", "learning-model-even-odd-function-symmetry", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
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

const incidence = loaded.get("learning-model-incidence-vs-prevalence");
assert.deepEqual(incidence.a({ selectedMonth: 99 }), { selectedMonth: 12 });
const monthSix = incidence.r({ selectedMonth: 6 });
assert.deepEqual(monthSix.newCases.map(({ id }) => id), ["P7", "P8"]);
assert.deepEqual(monthSix.currentCases.map(({ id }) => id), ["P5", "P6", "P8"]);
assert.deepEqual({ both: monthSix.both.map(({ id }) => id), newOnly: monthSix.newOnly.map(({ id }) => id), currentOnly: monthSix.currentOnly.map(({ id }) => id) }, { both: ["P8"], newOnly: ["P7"], currentOnly: ["P5", "P6"] });
runtimeAssertions += 4;

const qVsK = loaded.get("learning-model-reaction-quotient-vs-equilibrium-constant");
assert.deepEqual(qVsK.n({ equilibrium_constant: 1, initial_reaction_quotient: 10 }), { values: { equilibrium_constant: 1, initial_reaction_quotient: 10 }, relation: "above" });
assert.deepEqual(qVsK.a({ equilibrium_constant: 2, initial_reaction_quotient: 2 }, -1), { equilibrium_constant: 2, initial_reaction_quotient: 0.2 });
assert.deepEqual(qVsK.a({ equilibrium_constant: 2, initial_reaction_quotient: 0 }, 1), { equilibrium_constant: 2, initial_reaction_quotient: 20 });
assert.equal(qVsK.r("equal").every(({ y }) => y === 1), true);
assert.equal(qVsK.r("below")[0].y, 0.16000000000000003);
runtimeAssertions += 5;

const fattyAcids = loaded.get("learning-model-fatty-acid-saturation");
assert.deepEqual(fattyAcids.s({ doubleBonds: 9, temperatureCelsius: -5 }), { doubleBonds: 3, temperatureCelsius: 0 });
assert.deepEqual(fattyAcids.i({ doubleBonds: 0, temperatureCelsius: 20 }), { safeValues: { doubleBonds: 0, temperatureCelsius: 20 }, saturationClass: "saturated", transitionTemperature: 36, materialState: "solidLike", packingScore: 0.8400000000000001, packingState: "tight" });
assert.equal(fattyAcids.i({ doubleBonds: 2, temperatureCelsius: 20 }).saturationClass, "polyunsaturated");
assert.equal(fattyAcids.a(50).materialState, "liquidLike");
runtimeAssertions += 4;

const money = loaded.get("learning-model-bank-credit-money-multiplier");
assert.deepEqual(money.t, { initialDepositUsd: 1000, reserveRatioPercent: 10 });
const moneyState = money.n({ initialDepositUsd: 1000, reserveRatioPercent: 10 });
assert.deepEqual(moneyState.rounds, [{ deposit: 1000, loan: 900, reserve: 100 }, { deposit: 900, loan: 810, reserve: 90 }, { deposit: 810, loan: 729, reserve: 81 }, { deposit: 729, loan: 656.1, reserve: 72.9 }]);
assert.equal(moneyState.fullChainDepositLimit, 10000);
assert.equal(moneyState.cumulativeDepositsShown, 3439);
assert.equal(moneyState.visibleProgress, 0.3439);
runtimeAssertions += 5;

const arithmetic = loaded.get("learning-model-arithmetic-sequence");
assert.deepEqual(arithmetic.o({ firstTerm: 20, commonDifference: Number.NaN, termNumber: 0 }), { firstTerm: 6, commonDifference: 3, termNumber: 1 });
assert.deepEqual(arithmetic.i({ firstTerm: 2, commonDifference: 3, termNumber: 5 }), { firstTerm: 2, commonDifference: 3, termNumber: 5, hopCount: 4, nthTerm: 14, terms: [2, 5, 8, 11, 14] });
assert.deepEqual(arithmetic.i({ firstTerm: 2, commonDifference: -2, termNumber: 4 }).terms, [2, 0, -2, -4]);
assert.equal(arithmetic.c.canonicalFormula, "a_n = a_1 + (n - 1)d");
runtimeAssertions += 4;

const pythonRange = loaded.get("learning-model-python-range-for-loop");
assert.deepEqual(pythonRange.i(), { start: 2, stop: 10, step: 2, trace: 0 });
assert.deepEqual(pythonRange.r({ start: 2, stop: 10, step: 2, trace: 2 }), { current: 4, emptyReason: null, invalid: false, nextCandidate: 10, sequence: [2, 4, 6, 8], values: { start: 2, stop: 10, step: 2, trace: 2 } });
assert.deepEqual(pythonRange.n({ start: 2, stop: 10, step: 2, trace: 4 }), { start: 2, stop: 10, step: 2, trace: 0 });
assert.equal(pythonRange.r({ start: 2, stop: 10, step: 0 }).invalid, true);
assert.equal(pythonRange.r({ start: 2, stop: 10, step: -1 }).emptyReason, "direction");
runtimeAssertions += 5;

const endocrine = loaded.get("learning-model-endocrine-feedback-axis");
assert.equal(endocrine.a("normal"), 1);
assert.equal(endocrine.i(99), "high");
assert.deepEqual(endocrine.r({ axis: "thyroid", hormoneState: "low" }), { axis: "thyroid", hormoneState: "low", releasingHormone: "TRH", tropicHormone: "TSH", targetGland: "Thyroid gland", finalHormone: "T3/T4", upstreamDirection: "up", feedbackDirection: "weak", upstreamLevel: 3, feedbackLevel: 1 });
assert.deepEqual(endocrine.r({ axis: "adrenal", hormoneState: "high" }), { axis: "adrenal", hormoneState: "high", releasingHormone: "CRH", tropicHormone: "ACTH", targetGland: "Adrenal cortex", finalHormone: "Cortisol", upstreamDirection: "down", feedbackDirection: "strong", upstreamLevel: 1, feedbackLevel: 3 });
runtimeAssertions += 4;

const tree = loaded.get("learning-model-decision-tree-classification-path");
assert.deepEqual(tree.s({ x1: -3, x2: 20 }), { x1: 0, x2: 10 });
assert.deepEqual({ classLabel: tree.i({ x1: 3, x2: 0 }).classLabel, leafId: tree.i({ x1: 3, x2: 0 }).leafId }, { classLabel: "A", leafId: "left-a" });
assert.equal(tree.i({ x1: 5, x2: 7 }).leafId, "upper-a");
assert.equal(tree.i({ x1: 8, x2: 5 }).leafId, "right-a");
assert.deepEqual({ classLabel: tree.i({ x1: 5, x2: 5 }).classLabel, visitedNodeIds: tree.i({ x1: 5, x2: 5 }).visitedNodeIds }, { classLabel: "B", visitedNodeIds: ["x1-low", "x2-high", "x1-high"] });
assert.equal(tree.a(4), "4");
runtimeAssertions += 6;

const bonds = loaded.get("learning-model-bond-enthalpy");
assert.deepEqual({ breakingTotal: bonds.r({ initialReaction: "H2 + Cl2 -> 2 HCl" }).breakingTotal, formingTotal: bonds.r({ initialReaction: "H2 + Cl2 -> 2 HCl" }).formingTotal, deltaH: bonds.r({ initialReaction: "H2 + Cl2 -> 2 HCl" }).deltaH, isExothermic: bonds.r({ initialReaction: "H2 + Cl2 -> 2 HCl" }).isExothermic }, { breakingTotal: 679, formingTotal: 862, deltaH: -183, isExothermic: true });
assert.equal(bonds.r({ initialReaction: "2 HCl -> H2 + Cl2" }).deltaH, 183);
assert.equal(bonds.t, 862);
assert.equal(bonds.r({ initialReaction: "invalid", stage: 8 }).stage, 2);
runtimeAssertions += 4;

const symmetry = loaded.get("learning-model-even-odd-function-symmetry");
assert.deepEqual(symmetry.o({ symmetryType: "invalid", x: 99 }), { symmetryType: "even", x: 4.5 });
assert.equal(symmetry.s(3.13), 3.25);
const evenPoints = symmetry.r({ symmetryType: "even", x: 3 });
assert.equal(evenPoints.point.y, evenPoints.actualOppositeX.y);
const oddPoints = symmetry.r({ symmetryType: "odd", x: 3 });
assert.equal(oddPoints.actualOppositeX.y, -oddPoints.point.y);
assert.notEqual(symmetry.r({ symmetryType: "neither", x: 3 }).actualOppositeX.y, symmetry.r({ symmetryType: "neither", x: 3 }).point.y);
assert.equal(symmetry.i("neither"), 2);
runtimeAssertions += 6;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
