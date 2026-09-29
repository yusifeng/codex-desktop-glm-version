import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");

const models = [
  ["model-6941c5713844.js", "learning-model-drum-grid-notation", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-caf3a6be4af3.js", "learning-model-taxes-and-subsidies", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-13e640ef3d2a.js", "learning-model-business-cycles", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-89a71102ad15.js", "learning-model-binomial-theorem-pascal-triangle", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-a5eccdbf7b42.js", "learning-model-transversal-angle-relationships", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-18e3a40ddc3a.js", "learning-model-enzyme-and-temperature", ["a", "i", "n", "o", "r", "t"]],
  ["model-85aa75328d7c.js", "learning-model-four-to-one-multiplexer", ["a", "i", "n", "r", "t"]],
  ["model-57ce9234be9d.js", "learning-model-rates-and-bonds", ["a", "i", "n", "o", "r", "t"]],
  ["model-a1c2220761f3.js", "learning-model-combined-gas-law", ["a", "c", "d", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-f92e3f01a456.js", "learning-model-raas-and-adh", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
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

const drums = loaded.get("learning-model-drum-grid-notation");
assert.deepEqual(drums.l({ subdivision: 8, hiHat: [4, 2, 2, -1, 16], snare: [3], kick: [0] }), { subdivision: 8, hiHat: [2, 4], snare: [3], kick: [0] });
assert.equal(drums.i(0.99, 8), 14);
assert.equal(drums.r([0, 4, 8], 6, 16), 4);
assert.equal(drums.n(11), "3 a");
assert.deepEqual(drums.c({ subdivision: 16, hiHat: [0, 2], snare: [4], kick: [0] }, "hiHat", 2, 3).hiHat, [0, 3]);
assert.deepEqual(drums.a({ subdivision: 8, hiHat: [1, 2], snare: [3], kick: [0] }), [{ voice: "hiHat", step: 1 }, { voice: "snare", step: 3 }]);
runtimeAssertions += 6;

const taxes = loaded.get("learning-model-taxes-and-subsidies");
assert.deepEqual(taxes.s({ policy: 9, responsiveness: Number.NaN }), { policy: 1, responsiveness: 1 });
assert.deepEqual(taxes.i({ policy: 0, responsiveness: 1 }), { policy: "tax", responsiveness: "similar", demandSlope: 0.65, supplySlope: 0.65, quantity: 34.61538461538461, buyerPrice: 60, sellerPrice: 40, amount: 20 });
assert.equal(taxes.i({ policy: 1, responsiveness: 0 }).quantity, 50 + 20 / 1.55);
assert.deepEqual(taxes.a(50, 1), { from: { x: 0, y: 0 }, to: { x: 100, y: 100 } });
runtimeAssertions += 4;

const cycles = loaded.get("learning-model-business-cycles");
assert.deepEqual(cycles.l({ examinedTime: 200 }), { examinedTime: 100 });
assert.equal(cycles.a(42), 84);
assert.equal(cycles.o(42), "peak");
assert.equal(cycles.o(50), "contraction");
assert.equal(cycles.s(0, 2).length, 5);
assert.equal(cycles.t.length, 201);
runtimeAssertions += 6;

const binomial = loaded.get("learning-model-binomial-theorem-pascal-triangle");
assert.deepEqual(binomial.s({ n: 99 }), { n: 6 });
assert.deepEqual(binomial.i(5)[5], [1, 5, 10, 10, 5, 1]);
assert.deepEqual(binomial.n(3), [{ k: 0, coefficient: 1, aPower: 3, bPower: 0 }, { k: 1, coefficient: 3, aPower: 2, bPower: 1 }, { k: 2, coefficient: 3, aPower: 1, bPower: 2 }, { k: 3, coefficient: 1, aPower: 0, bPower: 3 }]);
assert.equal(binomial.a({ coefficient: 3, aPower: 2, bPower: 1 }), "3a^{2}b");
assert.equal(binomial.r(3), "(a+b)^{3} = a^{3} + 3a^{2}b + 3ab^{2} + b^{3}");
runtimeAssertions += 5;

const transversal = loaded.get("learning-model-transversal-angle-relationships");
assert.deepEqual(transversal.s({ angleDeg: 200, handleX: Number.NaN, handleY: 4, relationshipIndex: -2 }), { angleDeg: 155, handleX: undefined, handleY: 4, relationshipIndex: 0 });
assert.deepEqual(transversal.c({ angleDeg: 62, relationshipIndex: 0 }).pair, [62, 62]);
assert.deepEqual(transversal.c({ angleDeg: 62, relationshipIndex: 1 }).pair, [118, 118]);
assert.deepEqual(transversal.c({ angleDeg: 62, relationshipIndex: 3 }), { angleDeg: 62, handleX: undefined, handleY: undefined, relationshipIndex: 3, relationship: { index: 3, label: "Same-side interior", outcome: "supplementary" }, pair: [118, 62], equation: "118° + 62° = 180°" });
runtimeAssertions += 4;

const enzymes = loaded.get("learning-model-enzyme-and-temperature");
assert.equal(enzymes.r(40), 1);
assert.equal(enzymes.n({ temperatureCelsius: -10 }).temperatureCelsius, 0);
assert.equal(enzymes.n({ temperatureCelsius: 10 }).state, "cold");
assert.equal(enzymes.n({ temperatureCelsius: 70 }).state, "denatured");
assert.ok(enzymes.n({ temperatureCelsius: 50 }).relativeActivity < 1);
runtimeAssertions += 5;

const multiplexer = loaded.get("learning-model-four-to-one-multiplexer");
assert.deepEqual(multiplexer.r({}), { input0: false, input1: true, input2: false, input3: true, select1: false, select0: true, dataBits: [0, 1, 0, 1], select1Bit: 0, select0Bit: 1, selectedIndex: 1, output: 1 });
assert.deepEqual(multiplexer.r({ input0: true, select0: false }), { input0: true, input1: true, input2: false, input3: true, select1: false, select0: false, dataBits: [1, 1, 0, 1], select1Bit: 0, select0Bit: 0, selectedIndex: 0, output: 1 });
assert.equal(multiplexer.r({ input3: false, select1: true, select0: true }).output, 0);
runtimeAssertions += 3;

const bonds = loaded.get("learning-model-rates-and-bonds");
assert.deepEqual(bonds.i({ yieldChangePercentagePoints: 9 }), { yieldChangePercentagePoints: 3 });
const baselineBond = bonds.n({ yieldChangePercentagePoints: 0 });
assert.ok(Math.abs(baselineBond.bondPrice - 1000) < 1e-10);
assert.equal(baselineBond.direction, "unchanged");
assert.ok(bonds.n({ yieldChangePercentagePoints: 1 }).bondPrice < baselineBond.bondPrice);
assert.equal(bonds.n({ yieldChangePercentagePoints: -1 }).direction, "yieldDown");
runtimeAssertions += 5;

const gasLaw = loaded.get("learning-model-combined-gas-law");
assert.deepEqual(gasLaw.i(), { pressure2Atm: 1.3, temperature2Kelvin: 330 });
assert.deepEqual(gasLaw.u({ pressure2Atm: 9, temperature2Kelvin: Number.NaN }), { pressure2Atm: 1.6, temperature2Kelvin: 330 });
const changedGasState = gasLaw.d({ pressure2Atm: 1.5, temperature2Kelvin: 360 });
assert.deepEqual({ pressure2Atm: changedGasState.pressure2Atm, temperature2Kelvin: changedGasState.temperature2Kelvin, volume2Liters: changedGasState.volume2Liters }, { pressure2Atm: 1.5, temperature2Kelvin: 360, volume2Liters: 9.6 });
assert.ok(Math.abs(changedGasState.state1Ratio - changedGasState.state2Ratio) < 1e-14);
assert.equal(gasLaw.o(240), 0.8);
assert.equal(gasLaw.o(420), 6);
assert.equal(gasLaw.s(300), "same");
runtimeAssertions += 7;

const raas = loaded.get("learning-model-raas-and-adh");
assert.equal(raas.a("increased osmolality"), 2);
assert.equal(raas.i(99), "increased osmolality");
assert.deepEqual(raas.s({ initial_condition: "invalid", stage: 8 }), { initial_condition: "volume loss", stage: 3 });
assert.deepEqual(raas.r({ initial_condition: "volume loss", stage: 2 }), { initial_condition: "volume loss", stage: 2, volumeLoss: true, osmotic: false, cascade: true, constriction: true, aldosterone: true, adh: true, pressure: false, volume: false, waterBalance: false, feedback: false });
assert.equal(raas.r({ initial_condition: "increased osmolality", stage: 3 }).waterBalance, true);
runtimeAssertions += 5;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
