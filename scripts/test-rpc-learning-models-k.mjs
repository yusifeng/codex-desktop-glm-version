import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");

const models = [
  ["model-9176b81a016b.js", "learning-model-international-trade-world-price", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-3228e752e987.js", "learning-model-price-controls", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-5e953d82d89b.js", "learning-model-parametric-equalizer", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-b09e8c8b101b.js", "learning-model-carbon-budget", ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-d08d16b0a6e8.js", "learning-model-soil-water-retention", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-e9d53ce0f19d.js", "learning-model-blood-pressure-regulation", ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-a5deb44334b8.js", "learning-model-keynesian-expenditure-multiplier", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-124c142a08f6.js", "learning-model-marginal-benefit-opportunity-cost", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-469e05313030.js", "learning-model-enthalpy", ["a", "i", "n", "o", "r", "t"]],
  ["model-77c142ff4062.js", "learning-model-avogadros-law", ["a", "i", "n", "r", "t"]],
];

const dependencies = (source, expression) => [...source.matchAll(expression)].map(match => match[1]);
const approximatelyEqual = (actual, expected, tolerance = 1e-10) =>
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} is approximately ${expected}`);

let sourceAssertions = 0;
for (const [asset, directory] of models) {
  const original = fs.readFileSync(path.join(ASSET_ROOT, asset), "utf8");
  const recovered = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  const originalDependencies = dependencies(original, /from "\.\/([^"]+)\.js"/g)
    .map(dependency => dependency.replace(/-[a-f0-9]{12}$/, ""));
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
    bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
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
for (const [_asset, directory, expectedExports] of models) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  assert.deepEqual(Object.keys(module).sort(), [...expectedExports].sort(), directory + " preserves compressed exports");
  runtimeAssertions += 1;
}

const trade = loaded.get("learning-model-international-trade-world-price");
trade.o();
assert.deepEqual(trade.s({ worldPrice: 100 }), { worldPrice: 80 });
assert.deepEqual(trade.a({ worldPrice: 35 }), { worldPrice: 35, quantitySupplied: 31.25, quantityDemanded: 68.75, tradeQuantity: 37.5, tradeState: "imports" });
assert.deepEqual(trade.a({ worldPrice: 60 }), { worldPrice: 60, quantitySupplied: 62.5, quantityDemanded: 37.5, tradeQuantity: 25, tradeState: "exports" });
assert.equal(trade.a({ worldPrice: 50 }).tradeState, "no-trade");
assert.deepEqual(trade.n.demand.from, { x: 0, y: 90 });
runtimeAssertions += 5;

const controls = loaded.get("learning-model-price-controls");
controls.o();
assert.deepEqual(controls.s({ controlKind: 9, controlledPrice: Number.NaN }), { controlKind: 0, controlledPrice: 30 });
assert.deepEqual(controls.a({ controlKind: 0, controlledPrice: 30 }), { controlKind: 0, controlledPrice: 30, binding: true, equilibriumPrice: 50, equilibriumQuantity: 50, quantityDemandedAtControl: 75, quantitySuppliedAtControl: 25, realizedPrice: 30, quantityDemanded: 75, quantitySupplied: 25, quantityExchanged: 25, gap: 50, imbalance: "shortage" });
assert.equal(controls.a({ controlKind: 1, controlledPrice: 70 }).imbalance, "surplus");
assert.deepEqual(controls.a({ controlKind: 0, controlledPrice: 60 }), { controlKind: 0, controlledPrice: 60, binding: false, equilibriumPrice: 50, equilibriumQuantity: 50, quantityDemandedAtControl: 37.5, quantitySuppliedAtControl: 62.5, realizedPrice: 50, quantityDemanded: 50, quantitySupplied: 50, quantityExchanged: 50, gap: 0, imbalance: "none" });
runtimeAssertions += 4;

const equalizer = loaded.get("learning-model-parametric-equalizer");
equalizer.s();
assert.deepEqual(equalizer.c({ frequencyLog: Number.NaN, gainDb: 99, q: 0 }), { frequencyLog: 3, gainDb: 12, q: 0.5 });
const band = equalizer.o(1000, 1);
approximatelyEqual(band.lowerFrequency * band.upperFrequency, 1_000_000);
const response = equalizer.a({ frequencyLog: 3, gainDb: 6, q: 1 }, 3);
approximatelyEqual(response.find(point => point.x === 3).y, 6);
approximatelyEqual(response.find(point => Math.abs(point.x - Math.log10(band.upperFrequency)) < 1e-12).y, 3);
assert.ok(response.every((point, index) => index === 0 || point.x > response[index - 1].x));
runtimeAssertions += 5;

const carbon = loaded.get("learning-model-carbon-budget");
carbon.u();
const defaultCarbon = carbon.l({ warmingLimitIndex: Number.NaN, futureEmissions: Number.NaN });
assert.deepEqual({ index: defaultCarbon.warmingLimitIndex, emissions: defaultCarbon.futureEmissions, limit: defaultCarbon.warmingLimit, remaining: defaultCarbon.remainingBudget, status: defaultCarbon.status }, { index: 0, emissions: 100, limit: 1.5, remaining: 70, status: "within" });
assert.deepEqual(carbon.l({ warmingLimitIndex: 1, futureEmissions: 1200 }), { warmingLimitIndex: 1, futureEmissions: 1200, warmingLimit: 2, historicalEmissions: 2770, cumulativeEmissions: 3970, impliedWarming: carbon.t + 1200 * carbon.c, allowableCumulativeEmissions: 3825, initialRemainingBudget: 1055, remainingBudget: 0, overshoot: 145, status: "beyond" });
assert.equal(carbon.l({ warmingLimitIndex: 0, futureEmissions: 170 }).status, "at");
assert.deepEqual(carbon.o, [1.5, 2]);
runtimeAssertions += 4;

const soil = loaded.get("learning-model-soil-water-retention");
soil.o();
assert.deepEqual(soil.c({ soil_texture: "silt", suctionLog10: Number.NaN }), { soil_texture: "loam", suctionLog10: 1.52 });
assert.equal(soil.s("clay"), true);
assert.equal(soil.s("silt"), false);
const loam = soil.a({ soil_texture: "loam", suctionLog10: Math.log10(33) });
approximatelyEqual(loam.current, loam.fieldCapacity);
approximatelyEqual(loam.plantAvailable, loam.fieldCapacity - loam.wiltingPoint);
assert.ok(soil.l("sand", 33) > soil.l("sand", 1500));
runtimeAssertions += 6;

const pressure = loaded.get("learning-model-blood-pressure-regulation");
pressure.a();
assert.deepEqual(pressure.o({ initial_pressure_condition: "invalid", stageIndex: 99 }), { initial_pressure_condition: "high", stageIndex: 4 });
assert.deepEqual(pressure.o({ initial_pressure_condition: "low", stageIndex: 1.8 }), { initial_pressure_condition: "low", stageIndex: 2 });
assert.deepEqual(pressure.c({ initial_pressure_condition: "high", stageIndex: 1 }, "normal"), { initial_pressure_condition: "normal", stageIndex: 1 });
assert.deepEqual(pressure.s({ initial_pressure_condition: "low", stageIndex: 0 }, 3), { initial_pressure_condition: "low", stageIndex: 3 });
assert.equal(pressure.u.type, "BLOOD_PRESSURE_REGULATION");
runtimeAssertions += 5;

const expenditure = loaded.get("learning-model-keynesian-expenditure-multiplier");
expenditure.o();
assert.deepEqual(expenditure.s({ autonomousShift: Number.NaN, marginalPropensityToConsume: 4 }), { autonomousShift: 8, marginalPropensityToConsume: 0.75 });
assert.deepEqual(expenditure.a({ autonomousShift: 8, marginalPropensityToConsume: 0.6 }), { autonomousShift: 8, marginalPropensityToConsume: 0.6, baselineEquilibrium: 60, equilibrium: 80, equilibriumChange: 20, multiplier: 2.5, baselineIntercept: 24, shiftedIntercept: 32, belowOutput: 40, belowPlannedExpenditure: 56, aboveOutput: 120, abovePlannedExpenditure: 104 });
assert.deepEqual(expenditure.r, { autonomousShift: 8, marginalPropensityToConsume: 0.6 });
runtimeAssertions += 3;

const marginal = loaded.get("learning-model-marginal-benefit-opportunity-cost");
marginal.s();
assert.deepEqual([marginal.a(2.5), marginal.o(2.5)], [80, 40]);
const expand = marginal.i({ quantity: 2.5 });
assert.deepEqual({ quantity: expand.quantity, marginalNet: expand.marginalNet, decision: expand.decision, intervalStart: expand.intervalStart, intervalEnd: expand.intervalEnd }, { quantity: 2.5, marginalNet: 40, decision: "increase", intervalStart: 2.5, intervalEnd: 3.1 });
approximatelyEqual(expand.localNetContribution, expand.additionalBenefit - expand.additionalOpportunityCost);
assert.equal(marginal.i({ quantity: 5 }).decision, "hold");
assert.equal(marginal.i({ quantity: 8 }).decision, "decrease");
assert.equal(marginal.i({ quantity: Number.NaN }).quantity, 2.5);
runtimeAssertions += 6;

const enthalpy = loaded.get("learning-model-enthalpy");
enthalpy.r();
assert.deepEqual(enthalpy.i({ enthalpyChangeKilojoules: -999 }), { enthalpyChangeKilojoules: -100 });
assert.deepEqual(enthalpy.n({ enthalpyChangeKilojoules: -50 }), { classification: "exothermic", enthalpyChangeKilojoules: -50, heatFlowDirection: "to-surroundings", heatMagnitudeKilojoules: 50, productRelativeEnergyKilojoules: 70, reactantRelativeEnergyKilojoules: 120, transitionStateRelativeEnergyKilojoules: 185 });
assert.equal(enthalpy.n({ enthalpyChangeKilojoules: 100 }).transitionStateRelativeEnergyKilojoules, 285);
assert.equal(enthalpy.n({ enthalpyChangeKilojoules: 0 }).classification, "thermoneutral");
assert.equal(enthalpy.o.canonicalFormula, "\\Delta H = H_{\\mathrm{products}} - H_{\\mathrm{reactants}}");
runtimeAssertions += 5;

const avogadro = loaded.get("learning-model-avogadros-law");
avogadro.r();
assert.deepEqual(avogadro.n({}), { referenceAmount: 1, referenceVolume: 22.4, amountFactor: 2, amount: 2, volume: 44.8, volumePerMole: 22.4, particleCount: 24, pistonFillRatio: 0.8 });
assert.deepEqual(avogadro.n({ reference_amount_mol: 99, reference_volume_l: -1, amountFactor: 9 }), { referenceAmount: 5, referenceVolume: 1, amountFactor: 2.5, amount: 12.5, volume: 2.5, volumePerMole: 0.2, particleCount: 30, pistonFillRatio: 1 });
assert.equal(avogadro.a.canonicalFormula, "\\frac{V_1}{n_1}=\\frac{V_2}{n_2}");
runtimeAssertions += 3;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
