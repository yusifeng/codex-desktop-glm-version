import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");

const models = [
  ["model-f1935756f5ec.js", "learning-model-cash-vs-accrual-accounting", ["i", "n", "r", "t"]],
  ["model-e86d7d0aa38a.js", "learning-model-fiscal-policy-output-gap", ["i", "n", "r", "t"]],
  ["model-6ab8da229be6.js", "learning-model-mixed-numbers", ["a", "i", "n", "o", "r", "t"]],
  ["model-8e7988200d5b.js", "learning-model-loanable-funds-market", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-7164ede642a6.js", "learning-model-atp-energy-coupling", ["a", "i", "n", "r", "t"]],
  ["model-fc6b1e7ecc32.js", "learning-model-maximum-sustainable-yield", ["a", "i", "n", "o", "r", "t"]],
  ["model-4b01cc6c2e76.js", "learning-model-dichotomous-tree-key", ["a", "i", "n", "r", "t"]],
  ["model-e9d1e1169b7a.js", "learning-model-fermentation", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-9f7763fa34f6.js", "learning-model-alcohol-oxidation-products", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-e1970db810b5.js", "learning-model-michaelis-menten-kinetics", ["a", "i", "n", "o", "r", "t"]],
];

const staticDependencies = (source, expression) =>
  [...source.matchAll(expression)].map((match) => match[1]);

let sourceAssertions = 0;
for (const [asset, directory] of models) {
  const original = fs.readFileSync(path.join(ASSET_ROOT, asset), "utf8");
  const recovered = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  const originalDependencies = staticDependencies(original, /from "\.\/([^"]+)\.js"/g)
    .map((dependency) => dependency.replace(/-[a-f0-9]{12}$/, ""));
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
        build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({
          path: modulePath.slice(8),
          namespace: "mock",
        }));
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

const accounting = loaded.get("learning-model-cash-vs-accrual-accounting");
assert.deepEqual(accounting.i({ transactionKind: "invalid", cashTiming: "samePeriod" }), { transactionKind: "revenue", cashTiming: "samePeriod" });
assert.deepEqual(accounting.n({ transactionKind: "expense", cashTiming: "followingPeriod" }), { values: { transactionKind: "expense", cashTiming: "followingPeriod" }, amount: 600, cashBasis: [0, 600], accrualBasis: [600, 0] });
runtimeAssertions += 2;

const fiscal = loaded.get("learning-model-fiscal-policy-output-gap");
assert.deepEqual(fiscal.r({ startingGap: 0, fiscalAction: 0 }), { startingGap: 0, fiscalAction: 0, expansionary: true, closesGap: true, potentialOutput: 66, initialOutput: 48, finalOutput: 66, initialPrice: 43.8, finalPrice: 54.6, initialAdIntercept: 70.2, finalAdIntercept: 90.9 });
assert.equal(fiscal.r({ startingGap: 1, fiscalAction: 1 }).closesGap, true);
runtimeAssertions += 2;

const mixed = loaded.get("learning-model-mixed-numbers");
assert.deepEqual(mixed.i({ numerator: 23 }), { denominator: 6, numerator: 23, remainder: 5, whole: 3 });
assert.deepEqual(mixed.i({ numerator: 99 }), { denominator: 6, numerator: 35, remainder: 5, whole: 5 });
runtimeAssertions += 2;

const funds = loaded.get("learning-model-loanable-funds-market");
const baselineFunds = funds.i({ scenario: 0 });
assert.deepEqual({ ...baselineFunds, equilibrium: undefined }, { scenario: 0, savingShift: 0, investmentShift: 0, equilibrium: undefined });
assert.ok(Math.abs(baselineFunds.equilibrium.quantity - 50) < 1e-12);
assert.equal(baselineFunds.equilibrium.realRate, 5);
const investmentShiftFunds = funds.i({ scenario: 3 });
assert.deepEqual({ ...investmentShiftFunds, equilibrium: undefined }, { scenario: 3, savingShift: 0, investmentShift: 20, equilibrium: undefined });
assert.ok(Math.abs(investmentShiftFunds.equilibrium.quantity - 60) < 1e-12);
assert.ok(Math.abs(investmentShiftFunds.equilibrium.realRate - 5.7) < 1e-12);
assert.equal(funds.a(50), 5);
assert.equal(funds.o(50), 5);
runtimeAssertions += 9;

const energy = loaded.get("learning-model-atp-energy-coupling");
assert.deepEqual(energy.i({ trace: 0, workCost: 20 }), { trace: 0, workCost: 20, netDeltaG: -10, isFavorable: true, isAtThreshold: false, isWorkFocused: false, workCompletion: 1, workEnergyMarks: 4, hydrolysisEnergyMarks: 6 });
assert.equal(energy.i({ workCost: 40 }).workCompletion, 0.6699999999999999);
runtimeAssertions += 2;

const yieldModel = loaded.get("learning-model-maximum-sustainable-yield");
assert.deepEqual(yieldModel.n({ fishingEffort: 50 }), { fishingEffort: 50, sustainableCatchPercentMsy: 100, biomassPercentK: 50, matchingEffort: 50, matchingBiomassPercentK: 50, state: "msy" });
assert.equal(yieldModel.o(25), 75);
assert.equal(yieldModel.r().length, 101);
runtimeAssertions += 3;

const trees = loaded.get("learning-model-dichotomous-tree-key");
assert.deepEqual(trees.r({ firstChoice: 0, secondChoice: 1 }), ["pine"]);
assert.deepEqual(trees.n({ firstChoice: -1, secondChoice: 1 }, 1), { firstChoice: 1, secondChoice: -1 });
assert.deepEqual(trees.a({ firstChoice: 7, secondChoice: 0 }), { firstChoice: -1, secondChoice: -1 });
runtimeAssertions += 3;

const fermentation = loaded.get("learning-model-fermentation");
assert.deepEqual(fermentation.a({ fermentation_type: "invalid" }), { fermentation_type: "lactic acid" });
assert.equal(fermentation.r("alcohol"), 1);
assert.equal(fermentation.n(0.49), "lactic acid");
assert.equal(fermentation.n(0.5), "alcohol");
runtimeAssertions += 4;

const oxidation = loaded.get("learning-model-alcohol-oxidation-products");
assert.deepEqual(oxidation.a({ oxidationConditions: "invalid" }), { oxidationConditions: "dess_martin" });
assert.deepEqual(oxidation.r({ oxidationConditions: "jones_reagent" }), { primary: "carboxylicAcid", secondary: "ketone", tertiary: "noOxidation" });
runtimeAssertions += 2;

const kinetics = loaded.get("learning-model-michaelis-menten-kinetics");
assert.deepEqual(kinetics.o({ substrateConcentration: Number.NaN, km: 99, vmax: -1 }), { substrateConcentration: 6, km: 8, vmax: 2 });
assert.deepEqual(kinetics.i({ substrateConcentration: 4, km: 4, vmax: 8 }), { substrateConcentration: 4, km: 4, vmax: 8, reactionVelocity: 4, halfVmax: 4, kmVelocity: 4 });
assert.equal(kinetics.i({ substrateConcentration: 0, km: 4, vmax: 8 }).reactionVelocity, 0);
runtimeAssertions += 3;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
