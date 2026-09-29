import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");

const models = [
  ["model-bf9f007f736e.js", "learning-model-reorder-point-safety-stock", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-362f6f6503f1.js", "learning-model-stormwater-detention-basin", ["i", "n", "r", "t"]],
  ["model-810bae520b6d.js", "learning-model-monopsony-labor-market", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-1b1a0d17905e.js", "learning-model-simple-division", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-838233d701ed.js", "learning-model-economic-order-quantity", ["a", "i", "n", "o", "r", "t"]],
  ["model-d30b7c46ced0.js", "learning-model-asymmetric-key-roles", ["i", "n", "r", "t"]],
  ["model-f07b2dfecde5.js", "learning-model-crystal-unit-cells", ["i", "n", "r", "t"]],
  ["model-22f6fd6b2321.js", "learning-model-labor-market-comparisons", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-33ec5072ad67.js", "learning-model-agricultural-soil-erosion", ["i", "n", "r", "t"]],
  ["model-3985c0526691.js", "learning-model-arithmetic-sequence-sum", ["a", "i", "n", "o", "r", "t"]],
];

const staticDependencies = (source, expression) => [...source.matchAll(expression)].map((match) => match[1]);

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

const inventory = loaded.get("learning-model-reorder-point-safety-stock");
assert.deepEqual(inventory.s({ initialInventory: 999, demandRate: Number.NaN, leadTime: 3, safetyStock: 10 }), { initialInventory: 300, demandRate: 20, leadTime: 3, safetyStock: 20 });
assert.deepEqual(inventory.a({ initialInventory: 240, demandRate: 20, leadTime: 4, safetyStock: 40 }), { initialInventory: 240, demandRate: 20, leadTime: 4, safetyStock: 40, orderDay: 6, demandDuringLeadTime: 80, reorderPoint: 120, deliveryDay: 10 });
runtimeAssertions += 2;

const basin = loaded.get("learning-model-stormwater-detention-basin");
assert.deepEqual(basin.i({ stormStage: 8, condition: "broken" }), { stormStage: 2, condition: "intact" });
assert.deepEqual(basin.n({ stormStage: 1, condition: "degraded" }), { stormStage: 1, condition: "degraded", waterLevel: 0.9, capacityLevel: 0.62, basinDepth: 0.58, inflow: 0.82, outflow: 1, incomingLoad: 0.82, outgoingLoad: 1, retainedLoad: 0.26, overtopping: true });
runtimeAssertions += 2;

const monopsony = loaded.get("learning-model-monopsony-labor-market");
assert.equal(monopsony.a(60), 52);
const monopsonyState = monopsony.i({ employerPower: 100 });
assert.equal(monopsonyState.supplySlope, 0.8);
assert.equal(monopsonyState.supplyIntercept, 4);
assert.ok(Math.abs(monopsonyState.monopsonyEmployment - 40) < 1e-12);
assert.equal(monopsonyState.monopsonyWage, 36);
assert.equal(monopsonyState.marginalLaborCost, 68);
runtimeAssertions += 6;

const division = loaded.get("learning-model-simple-division");
assert.deepEqual(division.a({ dividend: 29.7, divisor: 3.6 }), { dividend: 30, divisor: 4 });
assert.deepEqual(division.r({ dividend: 14, divisor: 4 }), { dividend: 14, divisor: 4, fullGroups: 3, groupedCount: 12, remainder: 2 });
assert.deepEqual(division.s, { type: "SIMPLE_DIVISION", version: 2, thumbnailAssetKey: "simple-division-v1", parameters: { dividend: { kind: "integer", defaultValue: 14, min: 1, max: 30 }, divisor: { kind: "integer", defaultValue: 4, min: 1, max: 10 } } });
runtimeAssertions += 3;

const eoq = loaded.get("learning-model-economic-order-quantity");
assert.deepEqual(eoq.o({ annualDemand: 10_000, orderCost: 0, holdingCost: Number.NaN }), { annualDemand: 6_000, orderCost: 25, holdingCost: 12 });
const eoqState = eoq.i({ annualDemand: 3_500, orderCost: 120, holdingCost: 12 });
assert.ok(Math.abs(eoqState.eoq - Math.sqrt(70_000)) < 1e-12);
assert.ok(Math.abs(eoqState.orderingCostAtEoq - eoqState.holdingCostAtEoq) < 1e-12);
assert.equal(eoqState.totalCostAtEoq, eoqState.orderingCostAtEoq + eoqState.holdingCostAtEoq);
runtimeAssertions += 4;

const keys = loaded.get("learning-model-asymmetric-key-roles");
assert.deepEqual(keys.i({ initial_goal: "invalid", stepIndex: 9 }), { initial_goal: "confidentiality", stepIndex: 4 });
assert.deepEqual(keys.n("confidentiality"), { senderOperation: "encrypt", senderKeyOwner: "recipient", senderKeyType: "public", artifact: "ciphertext", recipientOperation: "decrypt", recipientKeyOwner: "recipient", recipientKeyType: "private", outcome: "confidentiality" });
assert.equal(keys.n("authenticity").outcome, "authenticity-and-integrity");
runtimeAssertions += 3;

const crystals = loaded.get("learning-model-crystal-unit-cells");
assert.deepEqual(crystals.r({ cell_type: "body-centered cubic", representation: "repeated cells" }), { cellType: "body-centered cubic", representation: "repeated cells", corners: 8, faces: 0, bodies: 1, netAtoms: 2, atomRadiusOverEdge: Math.sqrt(3) / 4 });
assert.equal(crystals.r({ cell_type: "face-centered cubic" }).netAtoms, 4);
assert.equal(crystals.r({ cell_type: "invalid" }).atomRadiusOverEdge, 0.5);
runtimeAssertions += 3;

const labor = loaded.get("learning-model-labor-market-comparisons");
assert.deepEqual(labor.c({ comparison: 99 }), { comparison: 6 });
assert.deepEqual(labor.o({ comparison: 0 }).equilibrium, labor.o({ comparison: 0 }).baseline);
assert.equal(labor.o({ comparison: 1 }).quantityDemanded, 36.9047619047619);
assert.equal(labor.o({ comparison: 2 }).quantitySupplied, 28.333333333333343);
assert.equal(labor.o({ comparison: 3 }).demandIntercept, 104);
assert.equal(labor.o({ comparison: 5 }).supplyIntercept, 6);
runtimeAssertions += 6;

const erosion = loaded.get("learning-model-agricultural-soil-erosion");
assert.deepEqual(erosion.i({ stage: -5, management: "invalid" }), { stage: 0, management: "exposed" });
assert.deepEqual(erosion.n({ stage: 3, management: "contour" }), { stage: 3, management: "contour", channel: "gully", channelWidth: 12, splashCount: 9, runoff: 0.62, sediment: 9 });
assert.deepEqual(erosion.n({ stage: 2, management: "cover" }), { stage: 2, management: "cover", channel: "rill", channelWidth: 2, splashCount: 3, runoff: 0.42, sediment: 3 });
runtimeAssertions += 3;

const sequence = loaded.get("learning-model-arithmetic-sequence-sum");
assert.deepEqual(sequence.o({ termCount: 20, firstTerm: -2, commonDifference: 2.6 }), { termCount: 10, firstTerm: 1, commonDifference: 3 });
assert.deepEqual(sequence.i({ termCount: 4, firstTerm: 2, commonDifference: 3 }), { termCount: 4, firstTerm: 2, commonDifference: 3, terms: [2, 5, 8, 11], reversedTerms: [11, 8, 5, 2], lastTerm: 11, pairTotal: 13, averageTerm: 6.5, doubledSum: 52, sum: 26 });
runtimeAssertions += 2;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
