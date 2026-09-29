import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");

const models = [
  ["model-7501d5f703e7.js", "learning-model-water-hydrogen-bonding", ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-d132ad04f855.js", "learning-model-prime-factor-tree", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-ec0b6a77f077.js", "learning-model-set-operations-venn-regions", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-a63f96a401b8.js", "learning-model-rolles-theorem", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-b09af98071e8.js", "learning-model-function-call-stack", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-ffbb570f1ec8.js", "learning-model-electrolytic-cell", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-79d3c05c2f18.js", "learning-model-radiometric-dating", ["a", "c", "d", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-80c56120bdff.js", "learning-model-ir-spectroscopy", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-a89ed6905d41.js", "learning-model-initial-rate-experiment", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-f933cb6f652a.js", "learning-model-binary-search", ["a", "i", "n", "o", "r", "t"]],
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

const water = loaded.get("learning-model-water-hydrogen-bonding");
assert.deepEqual(water.u({ neighborX: 999, neighborY: 0, neighborAngle: 999 }), { neighborX: 620, neighborY: 105, neighborAngle: 180 });
const centralWater = water.l(water.n, 90);
assert.equal(centralWater.hydrogens.length, 2);
assert.ok(Math.abs(Math.hypot(centralWater.hydrogens[0].x - water.n.x, centralWater.hydrogens[0].y - water.n.y) - 90) < 1e-12);
assert.equal(water.o(water.r).alignment, "bonded");
assert.equal(water.o({ neighborX: 620, neighborY: 190, neighborAngle: 0 }).alignment, "too-far");
runtimeAssertions += 5;

const primes = loaded.get("learning-model-prime-factor-tree");
assert.deepEqual(primes.o({ number: 1001 }), { number: 1000 });
assert.deepEqual(primes.r(100), [2, 2, 5, 5]);
assert.deepEqual(primes.r(997), [997]);
const factorTree = primes.a({ number: 100 });
assert.equal(factorTree.nodes.length, 7);
assert.equal(factorTree.edges.length, 6);
assert.deepEqual(factorTree.nodes.filter((node) => node.prime).map((node) => node.value), [2, 2, 5, 5]);
runtimeAssertions += 6;

const sets = loaded.get("learning-model-set-operations-venn-regions");
assert.deepEqual(sets.o({ operation: "invalid" }), { operation: "union" });
assert.deepEqual(sets.i({ operation: "union" }).selectedElements, [2, 3, 4, 5, 6, 7]);
assert.deepEqual(sets.i({ operation: "intersection" }).selectedElements, [4, 5]);
const complementA = sets.i({ operation: "a_complement" });
assert.deepEqual(complementA.selectedElements, [1, 6, 7, 8, 9, 10]);
assert.equal(complementA.resultLatex, "A^{c} = \\{1,6,7,8,9,10\\}");
runtimeAssertions += 5;

const rolle = loaded.get("learning-model-rolles-theorem");
assert.deepEqual(rolle.a({ leftX: 6, rightX: -2, endpointY: -2, vertexOffset: 6 }), { leftX: -2, rightX: 6, endpointY: -2, vertexOffset: 6 });
assert.deepEqual(rolle.a({ leftX: 1, rightX: 1.5 }).leftX, 0.25);
const rolleState = rolle.n({});
assert.deepEqual({ centerX: rolleState.centerX, vertexY: rolleState.vertexY, pointA: rolleState.pointA, pointB: rolleState.pointB }, { centerX: 0, vertexY: 4, pointA: { x: -4, y: -2 }, pointB: { x: 4, y: -2 } });
assert.equal(rolle.r(1.2345), "1.23");
runtimeAssertions += 4;

const stack = loaded.get("learning-model-function-call-stack");
assert.deepEqual(stack.s({ stepIndex: 99 }), { stepIndex: 8 });
const subtotalReturn = stack.i({ stepIndex: 2 });
assert.equal(subtotalReturn.returnedValue, "24");
assert.equal(stack.a(subtotalReturn), "subtotal");
assert.deepEqual(stack.i({ stepIndex: 8 }), { key: "main-uses-result", kind: "resume", currentFunction: "main", frames: ["main"], returnedValue: "$25.92", callTarget: null });
runtimeAssertions += 4;

const electrolytic = loaded.get("learning-model-electrolytic-cell");
assert.deepEqual(electrolytic.s({ electrolyte: "invalid", stage: 99 }), { electrolyte: "molten sodium chloride", stage: 3 });
assert.equal(electrolytic.i("molten lead(II) bromide"), 1);
assert.equal(electrolytic.r(99), "molten lead(II) bromide");
const sodiumChloride = electrolytic.a("molten sodium chloride");
assert.deepEqual({ cationCount: sodiumChloride.cationCount, anionCount: sodiumChloride.anionCount, overallEquation: sodiumChloride.overallEquation }, { cationCount: 2, anionCount: 2, overallEquation: "2NaCl → 2Na + Cl₂" });
const leadBromide = electrolytic.a("molten lead(II) bromide");
assert.deepEqual({ cationCharge: leadBromide.cationCharge, anionCount: leadBromide.anionCount, cathodeHalfEquation: leadBromide.cathodeHalfEquation }, { cationCharge: 2, anionCount: 4, cathodeHalfEquation: "Pb²⁺ + 2e⁻ → Pb" });
runtimeAssertions += 5;

const dating = loaded.get("learning-model-radiometric-dating");
assert.equal(dating.c(2), 25);
assert.equal(dating.o(2), 75);
assert.deepEqual(dating.l({ isotope_system: "invalid", elapsedHalfLives: 99 }), { isotope_system: "carbon-14-to-nitrogen-14", elapsedHalfLives: 4 });
assert.equal(dating.a({ isotope_system: "carbon-14-to-nitrogen-14", elapsedHalfLives: 2 }).ageYears, 11460);
const uranium = dating.a({ isotope_system: "uranium-238-to-lead-206", elapsedHalfLives: 2 });
assert.equal(uranium.ageYears, 8.94e9);
assert.equal(uranium.isBeyondTerrestrialRange, true);
runtimeAssertions += 6;

const infrared = loaded.get("learning-model-ir-spectroscopy");
assert.equal(infrared.i({ initial_molecular_class: "invalid" }).molecularClass, "alcohol");
assert.equal(infrared.i({ initial_molecular_class: "alkane" }).diagnosticBands.length, 0);
assert.equal(infrared.i({ initial_molecular_class: "alcohol" }).diagnosticBands.length, 1);
assert.equal(infrared.i({ initial_molecular_class: "carboxylic acid" }).diagnosticBands.length, 2);
assert.equal(infrared.i({ initial_molecular_class: "alkane" }).bands.length, 15);
const alcoholSpectrum = infrared.i({ initial_molecular_class: "alcohol" });
const alkaneSpectrum = infrared.i({ initial_molecular_class: "alkane" });
assert.ok(alcoholSpectrum.transmittanceAt(3370) < alkaneSpectrum.transmittanceAt(3370));
assert.ok(alcoholSpectrum.transmittanceAt(3370) >= 2 && alcoholSpectrum.transmittanceAt(3370) <= 100);
runtimeAssertions += 7;

const initialRate = loaded.get("learning-model-initial-rate-experiment");
assert.deepEqual(initialRate.s({ order_a: "invalid", order_b: "bad", variedReactant: "Z", concentrationMultiplier: 99 }), { order_a: "first", order_b: "second", variedReactant: "A", concentrationMultiplier: 4 });
const firstOrderA = initialRate.r({ order_a: "first", order_b: "second", variedReactant: "A", concentrationMultiplier: 2 });
assert.deepEqual({ heldReactant: firstOrderA.heldReactant, exponent: firstOrderA.exponent, rateRatio: firstOrderA.rateRatio }, { heldReactant: "B", exponent: 1, rateRatio: 2 });
assert.equal(initialRate.r({ order_a: "first", order_b: "second", variedReactant: "B", concentrationMultiplier: 3 }).rateRatio, 9);
assert.equal(initialRate.r({ order_a: "zero", variedReactant: "A", concentrationMultiplier: 4 }).rateRatio, 1);
const rateCurve = initialRate.i(2);
assert.equal(rateCurve.length, 121);
assert.deepEqual(rateCurve[0], { x: 0, y: 0 });
assert.ok(Math.abs(rateCurve.at(-1).y - initialRate.o(4, 2)) < 1e-14);
runtimeAssertions += 7;

const binary = loaded.get("learning-model-binary-search");
assert.deepEqual(binary.r(), { target: 55, step: 0 });
const found = binary.n({ target: 55, step: 99 });
assert.equal(found.frames.length, 4);
assert.deepEqual(found.frames.map((frame) => frame.comparison), ["greater", "less", "greater", "equal"]);
assert.deepEqual({ step: found.values.step, mid: found.frame.mid, comparison: found.frame.comparison }, { step: 3, mid: 6, comparison: "equal" });
assert.deepEqual(found.candidateHistory, [10, 5, 2, 1]);
const missing = binary.n({ target: 56, step: 99 });
assert.equal(missing.frame.comparison, "empty");
assert.equal(missing.frame.candidateCount, 0);
runtimeAssertions += 7;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
