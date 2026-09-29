import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");

const models = [
  ["model-2050d7dfdf59.js", "learning-model-set-cardinality-overlap", ["a", "i", "n", "o", "r", "t"]],
  ["model-1d942a9d7c86.js", "learning-model-aggregate-demand-supply", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-870d28c04213.js", "learning-model-consumer-producer-surplus", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-6157f9be0476.js", "learning-model-two-dimensional-array-indexing", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-d908b4b52347.js", "learning-model-mhc-antigen-presentation", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-caf19a86c5d2.js", "learning-model-radioactive-half-life", ["a", "i", "n", "o", "r", "t"]],
  ["model-3c197e2ac9a2.js", "learning-model-ocean-acidification", ["n", "t"]],
  ["model-70d42efdc777.js", "learning-model-monopoly-pricing", ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-5b5c3055d254.js", "learning-model-adding-negative-integer", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-b26f29efe99c.js", "learning-model-sql-transaction-commit-rollback", ["a", "i", "n", "r", "t"]],
];

const dependencies = (source, expression) => [...source.matchAll(expression)].map((match) => match[1]);

let sourceAssertions = 0;
for (const [asset, directory] of models) {
  const original = fs.readFileSync(path.join(ASSET_ROOT, asset), "utf8");
  const recovered = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  const originalDependencies = dependencies(original, /from "\.\/([^"]+)\.js"/g)
    .map((dependency) => dependency.replace(/-[a-f0-9]{12}$/, ""));
  const recoveredDependencies = dependencies(recovered, /(?:from\s+|import\s*)["']@rchunk\/([^"']+)/g);
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
for (const [_asset, directory, expectedExports] of models) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  assert.deepEqual(Object.keys(module).sort(), [...expectedExports].sort(), directory + " preserves compressed exports");
  runtimeAssertions += 1;
}

const sets = loaded.get("learning-model-set-cardinality-overlap");
assert.deepEqual(sets.o({ setACount: 15, setBCount: -3, overlapCount: 99 }), { setACount: 12, setBCount: 1, overlapCount: 1 });
assert.deepEqual(sets.i({ setACount: 8, setBCount: 7, overlapCount: 3 }), { setACount: 8, setBCount: 7, overlapCount: 3, onlyACount: 5, onlyBCount: 4, unionCount: 12 });
assert.deepEqual([sets.n.defaultValue, sets.r.defaultValue, sets.t.defaultValue], [8, 7, 3]);
runtimeAssertions += 3;

const aggregate = loaded.get("learning-model-aggregate-demand-supply");
assert.equal(aggregate.a(100, 24), 124);
assert.equal(aggregate.o(100, 24), 76);
assert.deepEqual(aggregate.r({ shock: 3 }), { shock: 3, demandShift: 0, supplyShift: 24, realGdp: 112, priceLevel: 88.576 });
assert.deepEqual(aggregate.r({ shock: -5 }), { shock: 0, demandShift: 0, supplyShift: 0, realGdp: 100, priceLevel: 100 });
assert.deepEqual(aggregate.i(() => 100), Array.from({ length: 41 }, (_unused, index) => ({ x: 60 + index * 2, y: 100 })));
runtimeAssertions += 5;

const surplus = loaded.get("learning-model-consumer-producer-surplus");
assert.deepEqual(surplus.c({ tradedQuantity: 999 }), { tradedQuantity: 100 });
assert.deepEqual([surplus.a(60), surplus.o(60)], [52, 52]);
assert.deepEqual(surplus.i({ tradedQuantity: 50 }), { tradedQuantity: 50, positiveQuantity: 50, equilibriumQuantity: 60, equilibriumPrice: 52, consumerSurplus: 1400, producerSurplus: 1050, totalSurplus: 2450, maximumTotalSurplus: 2520, omittedGains: 70, negativeGains: 0, state: "below" });
assert.deepEqual(surplus.i({ tradedQuantity: 70 }), { tradedQuantity: 70, positiveQuantity: 60, equilibriumQuantity: 60, equilibriumPrice: 52, consumerSurplus: 1440, producerSurplus: 1080, totalSurplus: 2450, maximumTotalSurplus: 2520, omittedGains: 0, negativeGains: 70, state: "above" });
runtimeAssertions += 4;

const arrayIndex = loaded.get("learning-model-two-dimensional-array-indexing");
assert.deepEqual(arrayIndex.i({ rows: 1, columns: 99, rowIndex: 99, columnIndex: -4 }), { rows: 2, columns: 6, rowIndex: 1, columnIndex: 0 });
assert.equal(arrayIndex.a(2, 3), 34);
assert.deepEqual(arrayIndex.n({ rows: 2, columns: 6, rowIndex: 1, columnIndex: 0 }), { rows: 2, columns: 6, rowIndex: 1, columnIndex: 0, selectedValue: 21 });
assert.deepEqual(arrayIndex.s.parameters.rows, { kind: "integer", defaultValue: 3, min: 2, max: 5 });
runtimeAssertions += 4;

const mhc = loaded.get("learning-model-mhc-antigen-presentation");
assert.deepEqual(mhc.o({ initial_pathway: "invalid", stage: 99 }), { initial_pathway: "MHC I (endogenous)", stage: 3 });
assert.equal(mhc.r(1.8), "MHC II (exogenous)");
assert.equal(mhc.i("invalid"), 0);
assert.equal(mhc.i("MHC II (exogenous)"), 1);
assert.equal(mhc.c.type, "MHC_I_VS_MHC_II_PRESENTATION");
runtimeAssertions += 5;

const halfLife = loaded.get("learning-model-radioactive-half-life");
assert.deepEqual(halfLife.o({ elapsedHalfLives: Number.NaN }), { elapsedHalfLives: 2 });
assert.deepEqual(halfLife.r({ elapsedHalfLives: 3 }), { elapsedHalfLives: 3, remainingFraction: 1 / 8, fractionLabel: "1/8", fractionLatex: "\\frac{1}{8}" });
assert.equal(halfLife.a(2.5), 2 ** -2.5);
assert.equal(halfLife.n.length, 5);
runtimeAssertions += 4;

const ocean = loaded.get("learning-model-ocean-acidification");
const baselineOcean = ocean.t({ co2Ppm: 280 });
const currentOcean = ocean.t({ co2Ppm: 420 });
const highOcean = ocean.t({ co2Ppm: 999 });
assert.equal(baselineOcean.fraction, 0);
assert.equal(baselineOcean.dissolvedFactor, 1);
assert.equal(baselineOcean.hydrogenFactor, 1);
assert.ok(Math.abs(currentOcean.dissolvedFactor - 1.5) < 1e-12);
assert.ok(currentOcean.ph < baselineOcean.ph);
assert.ok(currentOcean.hydrogenFactor > 1);
assert.ok(currentOcean.carbonateFactor < 1);
assert.equal(highOcean.co2Ppm, 840);
runtimeAssertions += 8;

const monopoly = loaded.get("learning-model-monopoly-pricing");
assert.deepEqual(monopoly.u({ quantity: 1 }), { quantity: 5 });
assert.deepEqual(monopoly.i({ quantity: 30 }), { quantity: 30, price: 70, marginalRevenue: 40, marginalCost: 40, optimumQuantity: 30, optimumPrice: 70, direction: "stop" });
assert.equal(monopoly.i({ quantity: 20 }).direction, "expand");
assert.equal(monopoly.i({ quantity: 40 }).direction, "reduce");
assert.equal(monopoly.c({ marginalRevenue: 40, marginalCost: 40, direction: "stop" }), 1);
assert.equal(monopoly.c({ marginalRevenue: 1.234, marginalCost: 1.235, direction: "expand" }), 2);
assert.deepEqual([monopoly.a(30), monopoly.s(30), monopoly.o(30)], [70, 40, 40]);
runtimeAssertions += 7;

const negative = loaded.get("learning-model-adding-negative-integer");
assert.deepEqual(negative.i({ positiveInteger: 20, negativeInteger: -0.2 }), { positiveInteger: 12, negativeInteger: -1 });
assert.deepEqual(negative.a({ positiveInteger: 7, negativeInteger: -4 }), { positiveInteger: 7, negativeInteger: -4, result: 3, stepCount: 4, positions: [7, 6, 5, 4, 3], domainMin: -12, domainMax: 13 });
assert.equal(negative.s.type, "ADDING_NEGATIVE_INTEGER");
runtimeAssertions += 3;

const sql = loaded.get("learning-model-sql-transaction-commit-rollback");
assert.deepEqual(sql.n(), { ending: 0, step: 2, transfer_amount: 150 });
assert.deepEqual(sql.t({ transfer_amount: 150, step: 1, ending: 0 }), { amount: 150, current: [650, 200], ending: 0, final: [650, 350], start: [800, 200], step: 1, transactionActive: true });
assert.deepEqual(sql.t({ transfer_amount: 150, step: 3, ending: 1 }), { amount: 150, current: [800, 200], ending: 1, final: [800, 200], start: [800, 200], step: 3, transactionActive: false });
assert.deepEqual(sql.t({ transfer_amount: 999, step: -9, ending: 2 }), { amount: 500, current: [800, 200], ending: 0, final: [300, 700], start: [800, 200], step: 0, transactionActive: true });
assert.equal(sql.a.type, "SQL_TRANSACTION_COMMIT_ROLLBACK");
runtimeAssertions += 5;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
