import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");
const models = [
  ["model-e2e4caeb8a59.js", "learning-model-correlation-matrix", ["a","i","n","o","r","s","t"]],
  ["model-d55f2d6e70df.js", "learning-model-meiosis-nondisjunction", ["a","c","i","l","n","o","r","s","t"]],
  ["model-8c99a3e1e197.js", "learning-model-adsr-envelope", ["a","c","d","f","i","l","n","o","p","r","s","t","u"]],
  ["model-2389f073136d.js", "learning-model-carbon-cycle", ["a","c","i","l","n","o","r","s","t"]],
  ["model-d7299d1f96a7.js", "learning-model-distance-traveled-vs-displacement", ["a","c","i","l","n","o","r","s","t","u"]],
  ["model-55ff7ae3fc50.js", "learning-model-polynomial-multiplicity-intercepts", ["a","c","d","f","i","l","n","o","p","r","s","t","u"]],
  ["model-bc60e7a4d945.js", "learning-model-bubble-sort", ["a","i","n","o","r","t"]],
  ["model-1cc997c09d9b.js", "learning-model-net-ionic-equations", ["a","i","n","o","r","t"]],
  ["model-2519c21474d3.js", "learning-model-t-statistic-p-value", ["a","c","d","f","i","l","n","o","p","r","s","t","u"]],
  ["model-78dd2f7b3a04.js", "learning-model-vector-dot-product", ["a","c","d","f","i","l","n","o","r","s","t","u"]],
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
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "export {};", loader: "js" })); } }] });
  return import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64") + "#" + directory);
}
const loaded = new Map(); let runtimeAssertions = 0;
for (const [_asset, directory, expectedExports] of models) { const module = await bundle(directory); loaded.set(directory, module); assert.deepEqual(Object.keys(module).sort(), [...expectedExports].sort()); runtimeAssertions += 1; }

const correlation = loaded.get("learning-model-correlation-matrix");
const body = correlation.i({ exampleContext: "body-measurements", selectedPair: 0 });
assert.equal(body.matrix.length, 4); assert.deepEqual(body.matrix.map((row) => row.length), [4,4,4,4]); assert.equal(body.matrix[0][0], 1); assert.ok(body.correlation > 0.98); assert.equal(body.points.length, 12); assert.deepEqual(correlation.i({ exampleContext: "bad", selectedPair: 99 }).pair, [2,3]);
runtimeAssertions += 6;

const meiosis = loaded.get("learning-model-meiosis-nondisjunction");
assert.deepEqual(meiosis.s({ errorDivision: "bad", phaseIndex: 99 }), { errorDivision: "meiosis-one", phaseIndex: 8 }); assert.equal(meiosis.r({ errorDivision: "meiosis-one", phaseIndex: 5 }), 8); assert.equal(meiosis.r({ errorDivision: "meiosis-two", phaseIndex: 5 }), 5);
const formatter = { formatMessage: (descriptor, values) => values ? descriptor.defaultMessage.replace(/\{(\w+)\}/g, (_match, key) => values[key]) : descriptor.defaultMessage };
assert.equal(meiosis.i(formatter, "meiosis-two"), "Meiosis II"); assert.equal(meiosis.a(formatter, 4), "Telophase I + Cytokinesis");
runtimeAssertions += 5;

const adsr = loaded.get("learning-model-adsr-envelope");
assert.deepEqual(adsr.d({ attackSeconds: 9, decaySeconds: 0, sustainLevel: 2, releaseSeconds: -2, noteOffSeconds: 99 }).attackSeconds, 1.5); const envelope = adsr.o({}); assert.deepEqual({ attack: envelope.attackEnd, decay: envelope.decayEnd, off: envelope.noteOff }, { attack: 0.45, decay: 1.1, off: 2.35 }); assert.ok(Math.abs(envelope.releaseEnd - 3.15) < 1e-14); assert.equal(envelope.points.length, 5); assert.equal(adsr.c({}, 1000).noteHeld, true); assert.deepEqual(adsr.l({ noteHeld: true, noteOnTimestampMs: 1000 }, 2500).noteOffSeconds, 1.5); assert.equal(adsr.p({ selectedParameter: "sustain" }, 0.25).sustainLevel, 0.25); assert.deepEqual(adsr.u({ plotWidth: 400, noteHeld: false, releaseEnds: [4.5] }), { xMin: -1.2, xMax: 4.8 });
runtimeAssertions += 8;

const carbon = loaded.get("learning-model-carbon-cycle");
assert.deepEqual(carbon.s({ initial_pathway: "bad", burning: "bad" }), { initial_pathway: "biological cycle", burning: "ordinary cycling" }); assert.equal(carbon.a("ocean exchange"), 1); assert.equal(carbon.i(99), "long-term storage and combustion"); const carbonValues = carbon.s({ initial_pathway: "ocean exchange" }); assert.equal(carbon.r(formatter, carbonValues), "Carbon dioxide moves both into and out of the ocean"); assert.ok(carbon.n(formatter, carbonValues, true).includes("Ocean exchange"));
runtimeAssertions += 5;

const motion = loaded.get("learning-model-distance-traveled-vs-displacement");
assert.deepEqual(motion.c({ route: "bad", progressPercent: -4 }), { route: "detour", progressPercent: 0 }); assert.equal(motion.o({ route: "direct", progressPercent: 0 }).relationship, "bothZero"); const direct = motion.o({ route: "direct", progressPercent: 100 }); assert.equal(direct.relationship, "equal"); assert.ok(Math.abs(direct.distanceMeters - direct.displacementMeters) < 1e-12); const detour = motion.o({ route: "detour", progressPercent: 100 }); assert.equal(detour.relationship, "greater"); const roundTrip = motion.o({ route: "round_trip", progressPercent: 100 }); assert.equal(roundTrip.relationship, "returned"); assert.equal(roundTrip.displacementMeters, 0);
runtimeAssertions += 7;

const polynomial = loaded.get("learning-model-polynomial-multiplicity-intercepts");
assert.deepEqual(polynomial.l({ rootCenter: 9, rootSeparation: 0, leftRootMultiplicity: 9, rightRootMultiplicity: -2 }), { rootCenter: 2, rootSeparation: 1, leftRootMultiplicity: 3, rightRootMultiplicity: 1 }); assert.deepEqual(polynomial.o({}), { leftRoot: -2, rightRoot: 2 }); assert.equal(polynomial.a(2), "touches"); assert.equal(polynomial.a(3), "flatCross"); assert.equal(polynomial.a(1), "crosses"); assert.deepEqual(polynomial.d({}, "leftRoot", 1), { rootCenter: 1.5, rootSeparation: 1, leftRootMultiplicity: 2, rightRootMultiplicity: 3 }); assert.equal(polynomial.r({}), "y = k * (x - a)^2 * (x - b)^3"); assert.ok(polynomial.s({}) > 0);
runtimeAssertions += 8;

const bubble = loaded.get("learning-model-bubble-sort");
const nearly = bubble.n({ initialOrder: "nearly_sorted", step: 999 }); assert.deepEqual(nearly.state.values, [1,2,3,4,5,6,7]); assert.equal(nearly.state.kind, "sorted"); assert.equal(nearly.state.completionReason, "no-swaps"); assert.equal(nearly.safeValues.step, nearly.timeline.length - 1); const reversed = bubble.n({ initialOrder: "reversed", step: 0 }); assert.deepEqual(reversed.state.values, [6,7,5,4,3,2,1]); assert.equal(bubble.r(reversed.timeline, 0), 6); assert.deepEqual(bubble.t, { initialOrder: "mixed", shuffleIndex: 0, step: 0 });
runtimeAssertions += 7;

const ionic = loaded.get("learning-model-net-ionic-equations");
assert.equal(ionic.i("silver-chloride-precipitation"), true); assert.equal(ionic.i("bad"), false); const neutralization = ionic.n({ reaction_example: "strong-acid-base-neutralization", step: 99 }); assert.equal(neutralization.step, 3); assert.equal(neutralization.reaction.outcome, "water"); assert.equal(neutralization.reaction.netPlain, "H⁺(aq) + OH⁻(aq) → H₂O(l)"); assert.deepEqual(neutralization.reaction.spectators, ["Na⁺(aq)", "Cl⁻(aq)"]);
runtimeAssertions += 6;

const ttest = loaded.get("learning-model-t-statistic-p-value");
assert.deepEqual(ttest.u({ tStatistic: 99, degreesOfFreedom: 0, testType: "bad" }), { tStatistic: 5, degreesOfFreedom: 1, testType: "two_sided" }); const twoSidedState = ttest.s({ tStatistic: 2, degreesOfFreedom: 10, testType: "two_sided" }); const oneSidedState = ttest.s({ tStatistic: 2, degreesOfFreedom: 10, testType: "one_sided" }); assert.ok(Math.abs(twoSidedState.pValue - 0.07338803477074037) < 1e-12); assert.ok(Math.abs(oneSidedState.pValue * 2 - twoSidedState.pValue) < 1e-14); assert.ok(Math.abs(ttest.d(0, 10) - 0.389108383966031) < 1e-12); assert.equal(ttest.c(-2, 2, 10).length, 51);
runtimeAssertions += 5;

const vectors = loaded.get("learning-model-vector-dot-product");
const defaultVectors = vectors.s({}); assert.equal(defaultVectors.dotProduct, -1); assert.equal(defaultVectors.alignment, "negative"); assert.ok(Math.abs(defaultVectors.includedAngleDeg - 94.39870535499554) < 1e-12); const perpendicular = vectors.s({ ax: 1, ay: 0, bx: 0, by: 1 }); assert.equal(perpendicular.alignment, "perpendicular"); assert.equal(perpendicular.includedAngleDeg, 90); const clamped = vectors.u({ ax: 9, ay: 0, bx: 0, by: 0 }); assert.deepEqual({ ax: clamped.ax, ay: clamped.ay }, { ax: 6, ay: 0 }); assert.deepEqual(vectors.l({}, "a", { x: 1.12, y: 2.13 }), { ...vectors.u({}), ax: 1, ay: 2.25, aThetaDeg: Math.atan2(2.25, 1) * 180 / Math.PI });
runtimeAssertions += 7;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
