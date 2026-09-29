import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");

const models = [
  ["model-7cc667e32642.js", "learning-model-waveform-anatomy", ["i", "n", "r", "t"]],
  ["model-e1311981a87b.js", "learning-model-electrical-resistance", ["a", "i", "n", "o", "r", "t"]],
  ["model-f80a40d80f01.js", "learning-model-piano-note-staff", ["a", "i", "n", "o", "r", "t"]],
  ["model-c3a40de9815b.js", "learning-model-newtons-third-law", ["a", "i", "n", "r", "t"]],
  ["model-bad65c3e95b0.js", "learning-model-firm-cost-curves", ["i", "n", "r", "t"]],
  ["model-38ab54fedb73.js", "learning-model-addition-polymerization", ["i", "n", "r", "t"]],
  ["model-b1ec25402bfa.js", "learning-model-present-value-discounting", ["a", "i", "n", "o", "r", "t"]],
  ["model-29b9b40f1c67.js", "learning-model-algorithm-complexity", ["a", "i", "n", "r", "t"]],
  ["model-3defe9d7f514.js", "learning-model-peptide-bond-formation", ["n", "r", "t"]],
  ["model-c0b34fe474ad.js", "learning-model-supply-demand-equilibrium", ["a", "i", "n", "o", "r", "t"]],
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

const waveform = loaded.get("learning-model-waveform-anatomy");
assert.deepEqual(waveform.n({ domain: 1, amplitude: 9, repeat: 1 }), { domain: 1, amplitude: 2, repeat: 2, firstCrest: 2, trough: 3, secondCrest: 4, frequency: 0.5 });
const wavePoints = waveform.r(waveform.n({ amplitude: 1.4, repeat: 4 }));
assert.equal(wavePoints.length, 241);
assert.equal(wavePoints[40].y, 1.4);
runtimeAssertions += 3;

const resistance = loaded.get("learning-model-electrical-resistance");
assert.deepEqual(resistance.o({ length: Number.NaN, area: 9, resistivity: 0 }), { length: 3, area: 5, resistivity: 0.2 });
assert.deepEqual(resistance.i({ length: 4, area: 2, resistivity: 0.5 }), { length: 4, area: 2, resistivity: 0.5, resistance: 1 });
runtimeAssertions += 2;

const piano = loaded.get("learning-model-piano-note-staff");
assert.deepEqual(piano.t(7), { index: 7, letter: "C", octave: 4, pitch: "C4", hasBlackKeyAfter: true, staffY: 158 });
assert.equal(piano.n().length, 15);
assert.deepEqual(piano.r(1).map((note) => note.pitch), ["D3", "D4"]);
assert.equal(piano.a(7.4), true);
runtimeAssertions += 4;

const newton = loaded.get("learning-model-newtons-third-law");
assert.deepEqual(newton.a({ example: "unknown" }), { example: "pushingBox" });
assert.equal(newton.r("boxOnTable"), 2);
assert.equal(newton.n(1), "collidingBalls");
runtimeAssertions += 3;

const costs = loaded.get("learning-model-firm-cost-curves");
assert.deepEqual(costs.i({ output: Number.POSITIVE_INFINITY }), { output: 4.5 });
const costState = costs.n({ output: 5 });
assert.equal(costState.marginalCost, 30);
assert.equal(costState.averageVariableCost, 20);
assert.equal(costState.averageFixedCost, 10);
assert.equal(costState.averageTotalCost, 30);
assert.equal(costState.atcDirection, "minimum");
assert.equal(costState.avcDirection, "rising");
runtimeAssertions += 7;

const polymer = loaded.get("learning-model-addition-polymerization");
assert.deepEqual(polymer.r({ monomer: "propene", unitStage: 4 }), { monomer: "propene", unitStage: 4, units: 6, leftTop: "H", leftBottom: "H", rightTop: "CH₃", rightBottom: "H" });
assert.deepEqual(polymer.r({ monomer: "invalid", unitStage: Number.NaN }), { monomer: "ethene", unitStage: 2, units: 3, leftTop: "H", leftBottom: "H", rightTop: "H", rightBottom: "H" });
runtimeAssertions += 2;

const presentValue = loaded.get("learning-model-present-value-discounting");
assert.deepEqual(presentValue.o({ discountRate: -1, years: 20 }), { discountRate: 0, years: 10 });
assert.deepEqual(presentValue.i({ discountRate: 0, years: 10 }), { discountRate: 0, years: 10, discountFactor: 1, presentValue: 100 });
assert.ok(Math.abs(presentValue.i({ discountRate: 10, years: 2 }).presentValue - 82.64462809917354) < 1e-12);
runtimeAssertions += 3;

const complexity = loaded.get("learning-model-algorithm-complexity");
assert.deepEqual(complexity.r({ inputIndex: 2 }), { inputIndex: 2, inputSize: 16, operations: { constant: 1, logarithmic: 4, linear: 16, linearithmic: 64, quadratic: 256, exponential: 65536 } });
assert.deepEqual(complexity.i("quadratic", 10, 10), [{ x: 1, y: 1 }, { x: 2, y: 4 }, { x: 3, y: 9 }, { x: 4, y: 16 }]);
runtimeAssertions += 2;

const peptide = loaded.get("learning-model-peptide-bond-formation");
assert.deepEqual(peptide.n({ aminoAcidExample: "serine and valine", linkageStage: 2 }), { aminoAcidExample: "serine and valine", linkageStage: 2, residueCount: 3, peptideBonds: 2, waterMolecules: 2, sideChains: ["CH₂OH", "CH(CH₃)₂", "CH₂OH"] });
assert.deepEqual(peptide.n({ aminoAcidExample: "invalid", linkageStage: 1.4 }).sideChains, ["R₁", "R₂", "R₁"]);
runtimeAssertions += 2;

const market = loaded.get("learning-model-supply-demand-equilibrium");
assert.deepEqual(market.o({ demandShift: 99, supplyShift: Number.NaN }), { demandShift: 20, supplyShift: 0 });
const baselineMarket = market.i({});
assert.ok(Math.abs(baselineMarket.quantity - 52.307692307692314) < 1e-12);
assert.ok(Math.abs(baselineMarket.price - 47.38461538461538) < 1e-12);
assert.ok(market.i({ demandShift: 20, supplyShift: -20 }).price > baselineMarket.price);
runtimeAssertions += 4;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
