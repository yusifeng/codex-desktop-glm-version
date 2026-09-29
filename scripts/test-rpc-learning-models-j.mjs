import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");

const models = [
  ["model-69c39ccdb2ba.js", "learning-model-crowding-out-loanable-funds", ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-307f3d994796.js", "learning-model-operant-conditioning", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-75b9f873ec1d.js", "learning-model-rational-inequality-sign-chart", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-e94bf9953de3.js", "learning-model-turnstile-finite-state-machine", ["i", "n", "r", "t"]],
  ["model-f9237046088a.js", "learning-model-zero-based-array-indexing", ["a", "i", "n", "o", "r", "t"]],
  ["model-fd2977478028.js", "learning-model-subtracting-negative-integers", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-12db92e98e26.js", "learning-model-hardy-weinberg-equilibrium", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-a538838ccb34.js", "learning-model-cathodic-protection", ["a", "i", "n", "o", "r", "t"]],
  ["model-ee92fe7d6857.js", "learning-model-c-array-pointer-arithmetic", ["a", "i", "n", "o", "r", "t"]],
  ["model-3fdea9ffafb6.js", "learning-model-gas-solubility", ["a", "i", "n", "o", "r", "s", "t"]],
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

const crowdingOut = loaded.get("learning-model-crowding-out-loanable-funds");
assert.deepEqual(crowdingOut.u({ governmentBorrowing: 99, fundSupplyElasticity: "invalid" }), { governmentBorrowing: 30, fundSupplyElasticity: "less" });
const crowdingState = crowdingOut.a({ governmentBorrowing: 18, fundSupplyElasticity: "less" });
assert.ok(Math.abs(crowdingState.totalQuantity - (50 + 0.08 * 18 / 0.21)) < 1e-12);
assert.ok(Math.abs(crowdingState.privateInvestmentDecline - crowdingState.rateIncrease / crowdingOut.i) < 1e-12);
assert.equal(crowdingOut.s(60), 3.2);
assert.equal(crowdingOut.c(60, 10), 4);
assert.equal(crowdingOut.o(60, 0.13), 5.3);
runtimeAssertions += 6;

const operant = loaded.get("learning-model-operant-conditioning");
assert.deepEqual(operant.o({ behaviorEffect: "invalid", stimulusChange: "removed" }), { behaviorEffect: "more_likely", stimulusChange: "removed" });
assert.equal(operant.i({ behaviorEffect: "more_likely", stimulusChange: "added" }), "positive-reinforcement");
assert.equal(operant.i({ behaviorEffect: "more_likely", stimulusChange: "removed" }), "negative-reinforcement");
assert.equal(operant.i({ behaviorEffect: "less_likely", stimulusChange: "added" }), "positive-punishment");
assert.equal(operant.i({ behaviorEffect: "less_likely", stimulusChange: "removed" }), "negative-punishment");
runtimeAssertions += 5;

const inequality = loaded.get("learning-model-rational-inequality-sign-chart");
assert.deepEqual(inequality.s({ step: 8.7 }), { step: 4 });
assert.deepEqual(inequality.i().map((interval) => interval.quotient), [-1, 1, -1, 1]);
assert.deepEqual(inequality.a(), [
  { from: null, to: -1, includeFrom: false, includeTo: false, notation: "(-∞, -1)" },
  { from: 2, to: 4, includeFrom: true, includeTo: false, notation: "[2, 4)" },
]);
runtimeAssertions += 3;

const turnstile = loaded.get("learning-model-turnstile-finite-state-machine");
assert.deepEqual(turnstile.r(), { history: [], priorState: "locked", processedCount: 0 });
assert.deepEqual(turnstile.t({ history: ["coin", "bad", "push"] }), { history: ["coin", "push"], state: "locked", previousState: "unlocked", latestInput: "push", processedCount: 2, omittedCount: 0, priorState: "locked" });
assert.deepEqual(turnstile.n({ history: ["coin"] }, "coin"), { history: ["coin", "coin"], priorState: "locked", processedCount: 2 });
runtimeAssertions += 3;

const zeroBased = loaded.get("learning-model-zero-based-array-indexing");
assert.deepEqual(zeroBased.n, { initial_length: 6, selected_index: 2 });
assert.deepEqual(zeroBased.r({ initial_length: 3, selected_index: 3 }), { safeValues: { initial_length: 3, selected_index: 3 }, isValid: false, lastValidIndex: 2, selectedColumn: 4, selectedValue: null, values: [42, 7, 19] });
assert.equal(zeroBased.r({ initial_length: 8, selected_index: 6 }).selectedValue, 31);
runtimeAssertions += 3;

const subtracting = loaded.get("learning-model-subtracting-negative-integers");
assert.deepEqual(subtracting.i({ positiveInteger: 99, negativeInteger: Number.NaN }), { positiveInteger: 12, negativeInteger: -4 });
assert.deepEqual(subtracting.a({ positiveInteger: 7, negativeInteger: -4 }), { positiveInteger: 7, negativeInteger: -4, result: 11, stepCount: 4, positions: [7, 8, 9, 10, 11], domainMin: 0, domainMax: 25 });
assert.equal(subtracting.s.canonicalFormula, "a - n = a + |n|, \\quad n < 0");
runtimeAssertions += 3;

const hardyWeinberg = loaded.get("learning-model-hardy-weinberg-equilibrium");
assert.deepEqual(hardyWeinberg.a({ allele_frequency_p: 2 }), { allele_frequency_p: 1 });
assert.deepEqual(hardyWeinberg.n({ allele_frequency_p: 0.7 }), { allele_frequency_p: 0.7, q: 0.30000000000000004, aaDominant: 0.48999999999999994, heterozygous: 0.42000000000000004, aaRecessive: 0.09000000000000002, pq: 0.21000000000000002, total: 1 });
assert.equal(hardyWeinberg.r("AA").length, 101);
assert.deepEqual(hardyWeinberg.r("Aa")[50], { x: 0.5, y: 0.5 });
runtimeAssertions += 4;

const cathodic = loaded.get("learning-model-cathodic-protection");
assert.equal(cathodic.i("zinc"), true);
assert.equal(cathodic.i("iron"), false);
assert.deepEqual(cathodic.n({ anode_material: "invalid", stage: -4 }), { anode_material: "magnesium", stage: 0, symbol: "Mg", connected: false, afterUse: false, anodeHeight: 124, ionCount: 0, oxidation: "\\mathrm{Mg(s)\\rightarrow Mg^{2+}(aq)+2e^-}", reduction: "\\mathrm{O_2+2H_2O+4e^-\\rightarrow4OH^-}" });
assert.equal(cathodic.n({ anode_material: "zinc", stage: 2 }).ionCount, 6);
runtimeAssertions += 4;

const pointers = loaded.get("learning-model-c-array-pointer-arithmetic");
assert.deepEqual(pointers.i({ index: 99 }), { index: 7 });
const pointerState = pointers.n({ index: 3 });
assert.deepEqual({ baseAddressLabel: pointerState.baseAddressLabel, byteOffset: pointerState.byteOffset, selectedAddressLabel: pointerState.selectedAddressLabel, selectedValue: pointerState.selectedValue }, { baseAddressLabel: "0xA0", byteOffset: 12, selectedAddressLabel: "0xAC", selectedValue: 40 });
assert.equal(pointerState.cells.filter((cell) => cell.isSelected).length, 1);
runtimeAssertions += 3;

const gasSolubility = loaded.get("learning-model-gas-solubility");
assert.deepEqual(gasSolubility.o({ focus_gas: "invalid", temperature_c: -5, partial_pressure_atm: 9 }), { focus_gas: "oxygen", temperature_c: 0, partial_pressure_atm: 2 });
assert.ok(Math.abs(gasSolubility.s("oxygen", 10, 1) - 1.8) < 1e-12);
assert.ok(Math.abs(gasSolubility.s("oxygen", 30, 2) - 2.42) < 1e-12);
assert.equal(gasSolubility.i({ focus_gas: "helium", temperature_c: 20, partial_pressure_atm: 1 }).results.length, 5);
runtimeAssertions += 4;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
