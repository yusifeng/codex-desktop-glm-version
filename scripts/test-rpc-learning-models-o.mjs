import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");

const models = [
  ["model-6d0fe1644e34.js", "learning-model-endomembrane-pathway", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-40afec118948.js", "learning-model-cumulative-frequency-ogive", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-329288b68a29.js", "learning-model-covalent-bond-energy", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-d45c8c7b3dc6.js", "learning-model-big-o-growth-comparison", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-c27d4359f518.js", "learning-model-sql-join", ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-434aeec5110b.js", "learning-model-current-to-magnetic-field", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-a7c5b23f898c.js", "learning-model-tcp-vs-udp", ["a", "c", "d", "f", "i", "l", "n", "o", "p", "r", "s", "t", "u"]],
  ["model-3dc4ab96d69c.js", "learning-model-process-capability-cp-cpk", ["a", "i", "n", "o", "r", "t"]],
  ["model-bded2e8c51b8.js", "learning-model-demand-elasticity", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-8535eecf9273.js", "learning-model-faradays-law-electrolysis", ["a", "i", "n", "o", "r", "s", "t"]],
];

const dependencies = (source, expression) => [...source.matchAll(expression)].map((match) => match[1]);

let sourceAssertions = 0;
for (const [asset, directory] of models) {
  const original = fs.readFileSync(path.join(ASSET_ROOT, asset), "utf8");
  const recovered = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  const originalDependencies = dependencies(original, /from "\.\/([^"]+)\.js"/g).map((dependency) => dependency.replace(/-[a-f0-9]{12}$/, ""));
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
    plugins: [{ name: "rpc-learning-model-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "export {};", loader: "js" }));
    } }],
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

const endomembrane = loaded.get("learning-model-endomembrane-pathway");
assert.deepEqual(endomembrane.o({ cargo_destination: "invalid", stageIndex: Number.NaN }), { cargo_destination: "secretion", stageIndex: 0 });
assert.equal(endomembrane.r("lysosome"), 2);
assert.equal(endomembrane.n(1.6), "lysosome");
assert.equal(endomembrane.i({ cargo_destination: "plasma membrane", stageIndex: 0 }), "roughErMembrane");
assert.equal(endomembrane.i({ cargo_destination: "lysosome", stageIndex: 4 }), "deliveryLysosome");
runtimeAssertions += 5;

const ogive = loaded.get("learning-model-cumulative-frequency-ogive");
assert.deepEqual(ogive.s({ threshold: Number.NaN, percentile: 200 }), { threshold: 1500, percentile: 100 });
assert.deepEqual(ogive.a({ threshold: 979.5, percentile: 50 }), { threshold: 979.5, percentile: 50, thresholdCount: 12, thresholdPercent: 50, percentileCount: 12, percentileValue: 979.5, classFrequency: 8, classLower: 664.5, classUpper: 979.5 });
assert.equal(ogive.a({ threshold: 1500, percentile: 95 }).percentileValue, 1599);
assert.deepEqual(ogive.n, [0, 4, 12, 17, 23, 23, 23, 24]);
runtimeAssertions += 4;

const bonds = loaded.get("learning-model-covalent-bond-energy");
assert.deepEqual(bonds.c({ bond_order: "invalid", distance: Number.NaN }), { bond_order: "single", distance: 1.55 });
assert.equal(bonds.a(1.55, "single"), -0.9);
assert.deepEqual(bonds.i({ bond_order: "single", distance: 1.55 }), { bond_order: "single", distance: 1.55, bond: bonds.t.single, energy: -0.9, regime: "equilibrium", residualFraction: 1 });
assert.equal(bonds.i({ bond_order: "single", distance: 4.2 }).regime, "separated");
assert.deepEqual({ length: bonds.o("triple").length, firstX: bonds.o("triple")[0].x, lastX: bonds.o("triple")[180].x }, { length: 181, firstX: 0.8, lastX: 4.2 });
runtimeAssertions += 5;

const bigO = loaded.get("learning-model-big-o-growth-comparison");
assert.deepEqual(bigO.s({ n: 99 }), { n: 20 });
const growth = bigO.i(10);
assert.deepEqual(growth.map(({ key, referenceValue }) => ({ key, referenceValue })), [{ key: "constant", referenceValue: 1 }, { key: "logarithmic", referenceValue: Math.log2(10) }, { key: "linear", referenceValue: 10 }, { key: "linearithmic", referenceValue: 10 * Math.log2(10) }, { key: "quadratic", referenceValue: 100 }, { key: "exponential", referenceValue: 1024 }]);
assert.equal(bigO.r(bigO.t[5], 30), 2 ** 20);
assert.equal(bigO.o(0), 0);
assert.equal(bigO.o(2 ** 20), 1);
runtimeAssertions += 5;

const joins = loaded.get("learning-model-sql-join");
assert.deepEqual(joins.c({ joinType: "invalid" }), { joinType: "inner" });
assert.deepEqual(joins.s(joins.r, joins.i, "inner"), [{ key: 1, left: joins.r[0], right: joins.i[0], kind: "matched" }, { key: 4, left: joins.r[2], right: joins.i[2], kind: "matched" }]);
assert.deepEqual(joins.s(joins.r, joins.i, "full").map(({ key, kind }) => ({ key, kind })), [{ key: 1, kind: "matched" }, { key: 2, kind: "left-only" }, { key: 3, kind: "right-only" }, { key: 4, kind: "matched" }]);
assert.deepEqual(joins.t, { joinType: "inner" });
runtimeAssertions += 4;

const magnetic = loaded.get("learning-model-current-to-magnetic-field");
assert.deepEqual(magnetic.o({ currentDirection: "invalid", currentStrengthAmperes: 50 }), { currentDirection: "up", currentStrengthAmperes: 10 });
assert.equal(magnetic.n("up"), "counterclockwise");
assert.equal(magnetic.n("down"), "clockwise");
const directionVector = magnetic.r("up", Math.PI / 2, 2, 3);
assert.ok(Math.abs(directionVector.x - 1) < 1e-12);
assert.ok(Math.abs(directionVector.y) < 1e-12);
assert.equal(magnetic.i(7.5), 0.75);
runtimeAssertions += 6;

const tcpUdp = loaded.get("learning-model-tcp-vs-udp");
assert.deepEqual(tcpUdp.d({ protocol: "invalid", lossMode: "invalid" }), { protocol: "tcp", lossMode: "drop_packet_3" });
assert.deepEqual(tcpUdp.l({ protocol: "udp", lossMode: "drop_packet_3" }), { deliveredPacketIds: [1, 2, 4, 5], missingPacketIds: [3], retransmittedPacketIds: [], usesAcknowledgments: false, establishesConnection: false });
assert.deepEqual(tcpUdp.l({ protocol: "tcp", lossMode: "drop_packet_3" }), { deliveredPacketIds: [1, 2, 3, 4, 5], missingPacketIds: [], retransmittedPacketIds: [3], usesAcknowledgments: true, establishesConnection: true });
assert.deepEqual([tcpUdp.c({ protocol: "tcp", lossMode: "none" }), tcpUdp.c({ protocol: "tcp", lossMode: "drop_packet_3" }), tcpUdp.c({ protocol: "udp", lossMode: "none" })], [4300, 5700, 3400]);
assert.deepEqual([tcpUdp.a("tcp", 3), tcpUdp.a("udp", 3), tcpUdp.o(150, 100, 100), tcpUdp.s()], [1710, 1160, 0.5, 3650]);
runtimeAssertions += 5;

const capability = loaded.get("learning-model-process-capability-cp-cpk");
const centered = capability.n({ lower_specification_limit: 90, upper_specification_limit: 110, process_mean: 100, process_standard_deviation: 2.5 });
assert.deepEqual({ cp: centered.cp, cpk: centered.cpk, cpl: centered.cpl, cpu: centered.cpu, naturalLower: centered.naturalLower, naturalUpper: centered.naturalUpper, toleranceWidth: centered.toleranceWidth, midpoint: centered.midpoint, nearerSide: centered.nearerSide }, { cp: 4 / 3, cpk: 4 / 3, cpl: 4 / 3, cpu: 4 / 3, naturalLower: 92.5, naturalUpper: 107.5, toleranceWidth: 20, midpoint: 100, nearerSide: "equal" });
assert.equal(capability.n({ process_mean: 105 }).nearerSide, "upper");
assert.equal(capability.n({ process_mean: 95 }).nearerSide, "lower");
assert.ok(Math.abs(capability.i(100, 100, 2.5) - 1 / (2.5 * Math.sqrt(2 * Math.PI))) < 1e-14);
runtimeAssertions += 4;

const elasticity = loaded.get("learning-model-demand-elasticity");
assert.deepEqual(elasticity.o({ priceElasticityOfDemand: 9, price: 20 }), { priceElasticityOfDemand: 3, price: 40 });
assert.deepEqual(elasticity.i({ priceElasticityOfDemand: 0, price: 50 }), { priceElasticityOfDemand: 0, category: "perfectly-inelastic", demandSegment: { from: { x: 50, y: 80 }, to: { x: 50, y: 20 } }, operatingPoint: { quantity: 50, price: 50 }, totalRevenue: 2500 });
assert.deepEqual(elasticity.i({ priceElasticityOfDemand: 1, price: 60 }), { priceElasticityOfDemand: 1, category: "unit-elastic", demandSegment: { from: { x: 20, y: 80 }, to: { x: 80, y: 20 } }, operatingPoint: { quantity: 40, price: 60 }, totalRevenue: 2400 });
assert.equal(elasticity.i({ priceElasticityOfDemand: 2, price: 40 }).category, "elastic");
runtimeAssertions += 4;

const electrolysis = loaded.get("learning-model-faradays-law-electrolysis");
assert.equal(electrolysis.i("copper(II) sulfate"), 1);
assert.equal(electrolysis.r(0.7), "copper(II) sulfate");
const silver = electrolysis.n({ electrolyte: "silver nitrate", charge_kc: 100 });
assert.equal(silver.chargeC, 100000);
assert.ok(Math.abs(silver.electronMoles - 100000 / 96485) < 1e-14);
assert.equal(silver.selectedMassG, silver.silverMassG);
assert.equal(silver.selectedElectronCount, 1);
const copper = electrolysis.n({ electrolyte: "copper(II) sulfate", charge_kc: 100 });
assert.equal(copper.selectedMassG, copper.copperMassG);
assert.equal(copper.selectedElectronCount, 2);
assert.equal(copper.selectedMetalMoles, copper.electronMoles / 2);
runtimeAssertions += 9;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
