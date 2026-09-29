import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");

const models = [
  ["model-a922e6cdd48b.js", "learning-model-coin-toss-simulation", ["a", "i", "n", "r", "t"]],
  ["model-f531b58f0936.js", "learning-model-rotation-transformation-coordinate-plane", ["a", "i", "n", "r", "t"]],
  ["model-23fa1b82de8d.js", "learning-model-ecological-tolerance-curve", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-aae321d23dad.js", "learning-model-biomagnification", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-11da4540b9d5.js", "learning-model-tcp-three-way-handshake", ["a", "i", "n", "r", "t"]],
  ["model-20fa5aabbc94.js", "learning-model-abo-rh-blood-typing", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-66d4b6ae060b.js", "learning-model-negative-feedback-loop", ["a", "c", "d", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-fe09a72207e2.js", "learning-model-latitude-longitude", ["a", "c", "d", "f", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-5cfd5db05e74.js", "learning-model-twos-complement", ["a", "i", "n", "r", "t"]],
  ["model-b7e30c22fb74.js", "learning-model-factor-pairs-arrays", ["a", "c", "i", "n", "o", "r", "s", "t"]],
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

const coin = loaded.get("learning-model-coin-toss-simulation");
coin.a();
assert.deepEqual(coin.t, { heads: 0, tails: 0, lastResult: "none" });
assert.deepEqual(coin.i({ heads: 3.9, tails: 1.2, lastResult: "heads" }), { safeValues: { heads: 3, tails: 1, lastResult: "heads" }, total: 4, headsPercent: 75, tailsPercent: 25, headsDisplayPercent: 75, tailsDisplayPercent: 25 });
const randomValues = [0.1, 0.8, 0.4];
assert.deepEqual(coin.r({}, 3, () => randomValues.shift()), { heads: 2, tails: 1, lastResult: "heads" });
assert.deepEqual(coin.r({ heads: coin.n, tails: 0, lastResult: "heads" }, 1, () => 0), { heads: coin.n, tails: 0, lastResult: "heads" });
assert.deepEqual(coin.i({ heads: 0, tails: 2, lastResult: "heads" }).safeValues, { heads: 0, tails: 2, lastResult: "none" });
runtimeAssertions += 5;

const rotation = loaded.get("learning-model-rotation-transformation-coordinate-plane");
rotation.r();
assert.deepEqual(rotation.n({ angleDeg: 90 }).imageVertices, [{ x: -1, y: 2, name: "A" }, { x: -1, y: 5, name: "B" }, { x: -3, y: 4, name: "C" }]);
assert.equal(rotation.n({ angleDeg: 0 }).isOverlap, true);
assert.equal(rotation.n({ angleDeg: 999 }).angleDeg, 180);
approximatelyEqual(rotation.n({ angleDeg: 90 }).guideRadius, Math.sqrt(5));
assert.equal(rotation.a.type, "ROTATION_TRANSFORMATION_COORDINATE_PLANE");
runtimeAssertions += 5;

const tolerance = loaded.get("learning-model-ecological-tolerance-curve");
tolerance.a();
assert.deepEqual(tolerance.i({ environmental_factor: "invalid", condition: 120 }), { environmental_factor: "temperature", condition: 100, zone: "upper-intolerance", relativeAbundance: 0 });
assert.deepEqual(tolerance.i({ environmental_factor: "salinity", condition: 50 }), { environmental_factor: "salinity", condition: 50, zone: "optimum", relativeAbundance: 1 });
assert.equal(tolerance.i({ condition: 20 }).zone, "lower-stress");
assert.equal(tolerance.i({ condition: 80 }).zone, "upper-stress");
assert.deepEqual([tolerance.n.length, tolerance.n[0], tolerance.n[80], tolerance.n[160]], [161, { x: 0, y: 0 }, { x: 50, y: 1 }, { x: 100, y: 0 }]);
runtimeAssertions += 5;

const biomagnification = loaded.get("learning-model-biomagnification");
biomagnification.o();
assert.deepEqual(biomagnification.s({ contaminant: "invalid", stage: Number.NaN }), { contaminant: "DDT", stage: 4 });
assert.deepEqual(biomagnification.s({ contaminant: "PCBs", stage: 1.6 }), { contaminant: "PCBs", stage: 2 });
assert.deepEqual(biomagnification.a(biomagnification.n[0]), { value: 0.003, unit: "ppb" });
assert.deepEqual(biomagnification.a(biomagnification.n[4]), { value: 25, unit: "ppm" });
assert.equal(biomagnification.i(biomagnification.n[0].concentrationPpm), 0);
assert.equal(biomagnification.i(biomagnification.n[4].concentrationPpm), 100);
assert.equal(biomagnification.r(), 8_333_333);
runtimeAssertions += 7;

const tcp = loaded.get("learning-model-tcp-three-way-handshake");
tcp.r();
assert.deepEqual(tcp.n({}), { client_initial_sequence: 100, server_initial_sequence: 400, stageIndex: 0, clientNext: 101, serverNext: 401, clientState: "CLOSED", serverState: "LISTEN" });
assert.deepEqual(tcp.n({ client_initial_sequence: 9.6, server_initial_sequence: 20.2, stageIndex: 1 }), { client_initial_sequence: 10, server_initial_sequence: 20, stageIndex: 1, clientNext: 11, serverNext: 21, clientState: "SYN-SENT", serverState: "SYN-RECEIVED" });
assert.deepEqual(tcp.n({ client_initial_sequence: 99_999, server_initial_sequence: -3, stageIndex: 3 }), { client_initial_sequence: 9998, server_initial_sequence: 0, stageIndex: 3, clientNext: 9999, serverNext: 1, clientState: "ESTABLISHED", serverState: "ESTABLISHED" });
assert.equal(tcp.a.version, 3);
runtimeAssertions += 4;

const blood = loaded.get("learning-model-abo-rh-blood-typing");
blood.a();
const abPositive = blood.o({ initial_blood_type: "AB+" });
assert.deepEqual({ abo: abPositive.abo, rh: abPositive.rh, antiA: abPositive.antiA, antiB: abPositive.antiB, antiD: abPositive.antiD, activeRowIndex: abPositive.activeRowIndex }, { abo: "AB", rh: "+", antiA: true, antiB: true, antiD: true, activeRowIndex: 7 });
assert.equal(abPositive.rows.length, 8);
assert.deepEqual(blood.o({ initial_blood_type: "invalid" }).initial_blood_type, "A+");
assert.equal(blood.i("O", "-"), "O-");
assert.equal(blood.i("AB", "+"), "AB+");
runtimeAssertions += 5;

const feedback = loaded.get("learning-model-negative-feedback-loop");
feedback.o();
assert.deepEqual(feedback.s({ example: "invalid", initial_deviation: "invalid", stageIndex: 99 }), { example: "body_temperature", initial_deviation: "above", stageIndex: 2 });
assert.deepEqual(feedback.c({ example: "blood_glucose", initial_deviation: "above", stageIndex: 2 }, "below"), { example: "blood_glucose", initial_deviation: "below", stageIndex: 0 });
assert.deepEqual(feedback.l({ example: "thermostat", initial_deviation: "below", stageIndex: 0 }, 1), { example: "thermostat", initial_deviation: "below", stageIndex: 1 });
assert.deepEqual(feedback.i, ["sensing", "response", "return"]);
assert.equal(feedback.d.type, "NEGATIVE_FEEDBACK_LOOP");
runtimeAssertions += 5;

const geography = loaded.get("learning-model-latitude-longitude");
geography.s();
assert.deepEqual(geography.u({ latitude: 100.4, longitude: -200.2 }), { latitude: 90, longitude: -180 });
assert.deepEqual(geography.l({ latitude: 0, longitude: 0, viewCenterLongitude: 0 }), { x: 180, y: 130 });
const northPole = geography.l({ latitude: 90, longitude: 45, viewCenterLongitude: 0 });
approximatelyEqual(northPole.x, 180);
approximatelyEqual(northPole.y, 34);
assert.equal(geography.i(45, 0).length, 61);
assert.deepEqual(geography.a(0), [{ x: 84, y: 130 }, { x: 276, y: 130 }]);
assert.equal(geography.c(-90), true);
assert.equal(geography.c(89), false);
assert.equal(geography.o(90), 45);
runtimeAssertions += 8;

const twos = loaded.get("learning-model-twos-complement");
twos.r();
const negativeFour = twos.t({ bit_width: "8", initial_value: -4, stage: 2 });
assert.deepEqual(negativeFour.bits, [1, 1, 1, 1, 1, 1, 0, 0]);
assert.deepEqual(negativeFour.magnitudeBits, [0, 0, 0, 0, 0, 1, 0, 0]);
assert.deepEqual(negativeFour.invertedBits, [1, 1, 1, 1, 1, 0, 1, 1]);
assert.equal(negativeFour.contributions.reduce((sum, value) => sum + value, 0), -4);
assert.deepEqual(twos.t({ bit_width: "4", initial_value: -999, stage: -1 }), { width: 4, value: -8, stage: 0, min: -8, max: 7, weights: [-8, 4, 2, 1], bits: [1, 0, 0, 0], magnitudeBits: null, invertedBits: null, contributions: [-8, 0, 0, 0], isMostNegative: true });
assert.deepEqual(twos.n, { bit_width: "8", initial_value: -4, stage: 2 });
runtimeAssertions += 6;

const factors = loaded.get("learning-model-factor-pairs-arrays");
factors.a();
assert.deepEqual(factors.o({ wholeNumber: 24, divisor: 5 }), { wholeNumber: 24, divisor: 4 });
assert.deepEqual(factors.i({ wholeNumber: 24, divisor: 4 }), { wholeNumber: 24, divisor: 4, quotient: 6, rows: 4, columns: 6, factorPairs: [{ divisor: 1, quotient: 24 }, { divisor: 2, quotient: 12 }, { divisor: 3, quotient: 8 }, { divisor: 4, quotient: 6 }], isPrime: false, isPerfectSquare: false });
assert.equal(factors.i({ wholeNumber: 29, divisor: 9 }).isPrime, true);
assert.equal(factors.i({ wholeNumber: 25, divisor: 5 }).isPerfectSquare, true);
assert.deepEqual(factors.o({ wholeNumber: 99, divisor: Number.NaN }), { wholeNumber: 36, divisor: 4 });
runtimeAssertions += 5;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
