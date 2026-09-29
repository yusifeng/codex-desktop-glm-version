import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");

const models = [
  ["model-c7c82547bc35.js", "learning-model-exponential-distribution", ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-935a8b1b1821.js", "learning-model-bronsted-lowry-acid-base", ["i", "n", "r", "t"]],
  ["model-eed880ff8885.js", "learning-model-flower-pollination", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-c52682da7ea4.js", "learning-model-photosynthetic-pigment-absorption", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-18f5968002b2.js", "learning-model-anova-interaction-plot", ["a", "i", "n", "o", "r", "t"]],
  ["model-2553fb5c0f9e.js", "learning-model-island-biogeography", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-1ff2e69cbdc9.js", "learning-model-adding-integers", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-f6e5e84f2aaf.js", "learning-model-matrix-multiplication", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-bc3894cd0f1f.js", "learning-model-exponent-product-rule", ["a", "i", "n", "o", "r", "t"]],
  ["model-380eb31b2348.js", "learning-model-comparative-advantage-specialization", ["a", "i", "n", "o", "r", "s", "t"]],
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

const exponential = loaded.get("learning-model-exponential-distribution");
assert.deepEqual(exponential.c({ rate: 9, waiting_time: Number.NaN }), { rate: 1, waiting_time: 5 });
const exponentialState = exponential.o({ rate: 0.5, waiting_time: 4 });
assert.equal(exponentialState.meanWaitingTime, 2);
assert.ok(Math.abs(exponentialState.densityAtThreshold - 0.5 * Math.exp(-2)) < 1e-14);
assert.ok(Math.abs(exponentialState.survivalProbability - Math.exp(-2)) < 1e-14);
assert.equal(exponential.r, 20);
runtimeAssertions += 5;

const acidBase = loaded.get("learning-model-bronsted-lowry-acid-base");
assert.deepEqual(acidBase.i({ example: "invalid", stage: 9 }), { example: "generic-ha-b", stage: 2, reaction: { acid: "\\mathrm{A{-}H}", base: "{:}\\mathrm{B}", conjugateBase: "\\mathrm{A^-}", conjugateAcid: "\\mathrm{H{-}B^+}" } });
assert.equal(acidBase.r("water-ammonia"), true);
assert.equal(acidBase.r("unknown"), false);
assert.equal(acidBase.i({ example: "hcl-water", stage: 1 }).reaction.conjugateAcid, "\\mathrm{H_3O^+}");
runtimeAssertions += 4;

const pollination = loaded.get("learning-model-flower-pollination");
assert.deepEqual(pollination.s({ pollination_type: "invalid", stage: 4.7 }), { pollination_type: "cross-pollination", stage: 3 });
assert.equal(pollination.a("cross-pollination"), 1);
assert.equal(pollination.i(-10), "self-pollination");
assert.deepEqual(pollination.r(3), { pollenOnAnther: false, pollenOnPollinator: false, pollenOnStigma: true, pollenTube: true });
runtimeAssertions += 4;

const pigments = loaded.get("learning-model-photosynthetic-pigment-absorption");
assert.deepEqual(pigments.s({ wavelength: 900, focus: -2 }), { wavelength: 700, focus: 0 });
assert.equal(pigments.i(449), "violet-blue");
assert.equal(pigments.i(630), "red");
assert.equal(pigments.o("chlorophyllA").length, 151);
assert.equal(pigments.o("chlorophyllA")[0].x, 400);
assert.ok(pigments.r(430).chlorophyllA > pigments.r(550).chlorophyllA);
runtimeAssertions += 6;

const anova = loaded.get("learning-model-anova-interaction-plot");
assert.deepEqual(anova.n, ["no-interaction", "non-crossover-interaction", "crossover-interaction"]);
assert.deepEqual(anova.r({ initial_pattern: "invalid" }), { pattern: "no-interaction", b1: [28, 52], b2: [52, 76], simpleEffectB1: 24, simpleEffectB2: 24 });
assert.deepEqual(anova.r({ initial_pattern: "crossover-interaction" }), { pattern: "crossover-interaction", b1: [28, 76], b2: [72, 36], simpleEffectB1: 48, simpleEffectB2: -36 });
runtimeAssertions += 3;

const islands = loaded.get("learning-model-island-biogeography");
assert.deepEqual(islands.i({ island_area: "invalid", isolation: "invalid" }), { island_area: "large", isolation: "near", immigrationMax: 90, extinctionMax: 40, richness: 9000 / 130, turnover: 3600 / 130 });
assert.deepEqual(islands.a("small", "far"), { island_area: "small", isolation: "far", immigrationMax: 50, extinctionMax: 90, richness: 5000 / 140, turnover: 4500 / 140 });
runtimeAssertions += 2;

const addition = loaded.get("learning-model-adding-integers");
assert.deepEqual(addition.o({ firstAddend: 0, secondAddend: 20 }), { firstAddend: 1, secondAddend: 12 });
assert.deepEqual(addition.i({ firstAddend: 3, secondAddend: 4 }), { firstAddend: 3, secondAddend: 4, sum: 7, positions: [3, 4, 5, 6, 7] });
assert.equal(addition.n, 25);
runtimeAssertions += 3;

const matrices = loaded.get("learning-model-matrix-multiplication");
assert.deepEqual(matrices.s({ selectedRow: -1, selectedColumn: 8 }), { selectedRow: 1, selectedColumn: 2 });
assert.deepEqual(matrices.a({ selectedRow: 2, selectedColumn: 1 }), { selectedRow: 2, selectedColumn: 1, rowIndex: 1, columnIndex: 0, selectedRowValues: [4, 0, 2], selectedColumnValues: [5, 1, 3], terms: [{ left: 4, right: 5, product: 20 }, { left: 0, right: 1, product: 0 }, { left: 2, right: 3, product: 6 }], result: 26, productMatrix: [[20, 29], [26, 22]] });
runtimeAssertions += 2;

const exponents = loaded.get("learning-model-exponent-product-rule");
assert.deepEqual(exponents.o({ leftExponent: 9, rightExponent: Number.NaN }), { leftExponent: 5, rightExponent: 3 });
assert.equal(exponents.i({ leftExponent: 2, rightExponent: 3 }).mergedFactors.length, 5);
assert.equal(exponents.r({ leftExponent: 2, rightExponent: 3 }), "x^{2} \\cdot x^{3} = x^{2+3} = x^{5}");
runtimeAssertions += 3;

const advantage = loaded.get("learning-model-comparative-advantage-specialization");
assert.deepEqual(advantage.s({ producerAXShare: 150, producerBXShare: Number.NaN }), { producerAXShare: 100, producerBXShare: 0 });
assert.deepEqual(advantage.a({ producerAXShare: 100, producerBXShare: 0 }), { producerAXShare: 100, producerBXShare: 0, producerA: { x: 12, y: 0 }, producerB: { x: 0, y: 10 }, total: { x: 12, y: 10 }, mixedBaseline: { x: 9, y: 8 }, xGainOverMixed: 3, yGainOverMixed: 2, isComparativeAdvantageSpecialization: true });
assert.equal(advantage.a({ producerAXShare: 50, producerBXShare: 50 }).isComparativeAdvantageSpecialization, false);
runtimeAssertions += 3;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
