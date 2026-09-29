import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");
const models = [
  ["model-21889c1e147f.js", "learning-model-cpu-fetch-decode-execute", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-cc7884047369.js", "learning-model-chord-construction", ["a", "c", "d", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-ee7c309af38a.js", "learning-model-detergent-micelle-grease", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-92f4db76ba27.js", "learning-model-three-set-inclusion-exclusion", ["a", "i", "n", "o", "r", "t"]],
  ["model-4db1a43b78c0.js", "learning-model-population-density", ["a", "c", "d", "f", "g", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u"]],
  ["model-8a1ce53f2bd0.js", "learning-model-hash-table-collisions", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-4298405efab5.js", "learning-model-bacterial-growth-curve", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-253b6086c636.js", "learning-model-poisson-distribution", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-f9b654a51eac.js", "learning-model-consumer-budget-line-comparative-statics", ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-d049b0702e2b.js", "learning-model-arithmetic-vs-geometric-sequences", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
];
const dependencies = (source, expression) => [...source.matchAll(expression)].map(match => match[1]);
const approximatelyEqual = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} is approximately ${expected}`);
let sourceAssertions = 0;
for (const [asset, directory] of models) {
  const original = fs.readFileSync(path.join(ASSET_ROOT, asset), "utf8"); const recovered = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  const originalDependencies = dependencies(original, /from "\.\/([^"]+)\.js"/g).map(dependency => dependency.replace(/-[a-f0-9]{12}$/, "")); const recoveredDependencies = dependencies(recovered, /(?:from\s+|import\s*)["']@rchunk\/([^"']+)/g);
  assert.deepEqual(recoveredDependencies, originalDependencies, directory + " preserves static dependencies");
  assert.equal((original.match(/import\(/g) ?? []).length, 0); assert.equal((recovered.match(/import\(/g) ?? []).length, 0); assert.equal(/\bany\b|@ts-expect-error/.test(recovered), false); sourceAssertions += 4;
}
async function bundle(directory) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "export {};", loader: "js" })); } }] });
  return import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64") + "#" + directory);
}
const loaded = new Map(); let runtimeAssertions = 0;
for (const [_asset, directory, expectedExports] of models) { const module = await bundle(directory); loaded.set(directory, module); assert.deepEqual(Object.keys(module).sort(), [...expectedExports].sort()); runtimeAssertions += 1; }

const cpu = loaded.get("learning-model-cpu-fetch-decode-execute"); cpu.o();
assert.deepEqual(cpu.s({ instructionExample: "bad", step: Infinity }), { instructionExample: "load", step: 0 }); assert.equal(cpu.a("add"), 1); assert.equal(cpu.i(9), "branch");
const load = cpu.r({ instructionExample: "load", step: 7 }); assert.deepEqual({ accumulator: load.accumulator, activePath: load.activePath, activeRegister: load.activeRegister, cir: load.cir, mar: load.mar, mdr: load.mdr, pc: load.pc, phase: load.phase }, { accumulator: 7, activePath: "load", activeRegister: "ACC", cir: "LOAD 42", mar: "42", mdr: "7", pc: 21, phase: "execute" });
assert.deepEqual({ accumulator: cpu.r({ instructionExample: "add", step: 7 }).accumulator, path: cpu.r({ instructionExample: "add", step: 7 }).activePath }, { accumulator: 12, path: "alu" }); assert.deepEqual({ pc: cpu.r({ instructionExample: "branch", step: 7 }).pc, path: cpu.r({ instructionExample: "branch", step: 7 }).activePath }, { pc: 24, path: "branch" }); runtimeAssertions += 6;

const chord = loaded.get("learning-model-chord-construction"); chord.o();
assert.deepEqual(chord.a("C", "minor").notes, ["C", "E♭", "G"]); assert.equal(chord.t.length, 4); assert.deepEqual(chord.u({ root: "x", quality: "x" }), { root: "C", quality: "major" }); assert.deepEqual(chord.d("C", "standard"), { lineGap: 18, lineYs: [30, 48, 66, 84, 102], rootY: 120, memberYs: [120, 102, 84] }); assert.equal(chord.s("minor", 1), "lowered"); runtimeAssertions += 5;

const detergent = loaded.get("learning-model-detergent-micelle-grease"); detergent.i();
assert.deepEqual(detergent.a({ relativeDetergentAmountPercent: -3 }), { relativeDetergentAmountPercent: 0 }); assert.equal(detergent.n({ relativeDetergentAmountPercent: 0 }).stage, "grease"); assert.equal(detergent.n({ relativeDetergentAmountPercent: 40 }).stage, "attaching"); assert.equal(detergent.n({ relativeDetergentAmountPercent: 60 }).stage, "forming"); assert.equal(detergent.n({ relativeDetergentAmountPercent: 80 }).stage, "dispersed"); assert.equal(detergent.n({ relativeDetergentAmountPercent: 100 }).moleculeCount, 16); assert.equal(detergent.r("dispersed", { formatMessage: descriptor => descriptor.defaultMessage }), "A grease-filled micelle is suspended"); runtimeAssertions += 7;

const inclusion = loaded.get("learning-model-three-set-inclusion-exclusion"); inclusion.r();
const defaultInclusion = inclusion.n({}); assert.deepEqual(defaultInclusion.atomicCounts, { aOnly: 12, bOnly: 10, cOnly: 8, abOnly: 4, acOnly: 3, bcOnly: 5, abc: 2 }); assert.deepEqual([inclusion.n({ step: 1 }).runningTotal, inclusion.n({ step: 2 }).runningTotal, inclusion.n({ step: 3 }).runningTotal], [60, 42, 44]); assert.equal(inclusion.n({ step: 3 }).unionCount, 44); assert.deepEqual(defaultInclusion.intersectionCounts, { ab: 6, ac: 5, bc: 7, abc: 2 }); runtimeAssertions += 4;

const population = loaded.get("learning-model-population-density"); population.u();
assert.deepEqual(population.p({ population: -1, landAreaSquareKilometers: Infinity }), { population: 1000, landAreaSquareKilometers: 100 }); assert.equal(population.a({ population: 500000, landAreaSquareKilometers: 100 }), 5000); assert.equal(population.o(49).key, "sparseRural"); assert.equal(population.o(50).key, "village"); assert.equal(population.f(6), 1000000); assert.equal(population.d(2), 100); approximatelyEqual(population.l(1), 0); approximatelyEqual(population.l(200000), 1); runtimeAssertions += 8;

const hash = loaded.get("learning-model-hash-table-collisions"); hash.a();
assert.equal(hash.i(27), 6); assert.deepEqual(hash.r(), { resolution_strategy: "separate chaining", step: 8 }); const chain = hash.n({ resolution_strategy: "separate chaining", step: 9 }); assert.deepEqual({ chainPath: chain.chainPath, comparisons: chain.comparisons, activeKey: chain.activeKey }, { chainPath: [13, 20, 27], comparisons: 3, activeKey: 27 }); const probing = hash.n({ resolution_strategy: "linear probing", step: 7 }); assert.deepEqual(probing.probePath, [6, 0, 1, 2]); assert.deepEqual(probing.slots, [7, 8, 20, null, null, null, 13]); assert.equal(probing.comparisons, 4); assert.deepEqual(hash.n({ resolution_strategy: "linear probing", step: 6 }).probePath, [6]); runtimeAssertions += 7;

const growth = loaded.get("learning-model-bacterial-growth-curve"); growth.o();
assert.deepEqual(growth.t, { generation_time_minutes: 30, selectedTimeHours: 7 }); const lag = growth.i({ generation_time_minutes: 30, selectedTimeHours: 2 }); assert.equal(lag.phase, "lag"); const logarithmic = growth.i({ generation_time_minutes: 30, selectedTimeHours: 5 }); assert.equal(logarithmic.phase, "log"); approximatelyEqual(logarithmic.slope, 2 * Math.log10(2)); const end = growth.i({ generation_time_minutes: 30, selectedTimeHours: 100 }); assert.equal(end.phase, "death"); approximatelyEqual(end.logViableCount, 6); assert.deepEqual(growth.a(30).map(point => point.y), [4, 4, 9, 9, 6]); assert.deepEqual(growth.n, { min: 3.55, max: 11.05 }); runtimeAssertions += 7;

const poisson = loaded.get("learning-model-poisson-distribution"); poisson.o();
assert.deepEqual(poisson.s({ lambda: 99, count: -3, question: 9 }), { lambda: 20, count: 0, question: 2 }); const poissonFive = poisson.i({ lambda: 5, count: 5, question: 0 }); assert.deepEqual(poissonFive.modeCounts, [4, 5]); assert.equal(poissonFive.outcomes.length, 41); approximatelyEqual(poissonFive.exactProbability, Math.exp(-5) * 5 ** 5 / 120); approximatelyEqual(poissonFive.selectedProbability, poissonFive.exactProbability); assert.deepEqual(poisson.i({ lambda: 5.5 }).modeCounts, [5]); assert.deepEqual(poisson.a(1e-10), { relation: "<", value: 1e-8, maximumFractionDigits: 6 }); assert.deepEqual(poisson.a(0.99995), { relation: ">", value: 0.9999, maximumFractionDigits: 2 }); runtimeAssertions += 8;

const budget = loaded.get("learning-model-consumer-budget-line-comparative-statics"); budget.s();
assert.deepEqual({ x: budget.t.xIntercept, y: budget.t.yIntercept, slope: budget.t.slope }, { x: 10, y: 6, slope: -0.6 }); const income = budget.a({ changeScenario: "income_increase", changeMagnitudePercent: 25 }); assert.deepEqual({ income: income.income, x: income.xIntercept, y: income.yIntercept, slope: income.slope }, { income: 75, x: 12.5, y: 7.5, slope: -0.6 }); const price = budget.a({ changeScenario: "price_x_increase", changeMagnitudePercent: 25 }); assert.deepEqual({ priceX: price.priceX, x: price.xIntercept, slope: price.slope }, { priceX: 7.5, x: 8, slope: -0.75 }); assert.deepEqual(budget.o(price), [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 0, y: 6 }]); assert.deepEqual(budget.c({ changeScenario: "bad", changeMagnitudePercent: 99 }), { changeScenario: "income_increase", changeMagnitudePercent: 50 }); runtimeAssertions += 5;

const sequences = loaded.get("learning-model-arithmetic-vs-geometric-sequences"); sequences.s();
const sequence = sequences.a({ initialTerm: 2, commonDifference: 2, commonRatio: 2 }); assert.deepEqual(sequence.arithmeticTerms.map(term => term.value), [2, 4, 6, 8, 10, 12, 14, 16]); assert.deepEqual(sequence.geometricTerms.map(term => term.value), [2, 4, 8, 16, 32, 64, 128, 256]); assert.deepEqual([sequence.arithmeticFinal, sequence.geometricFinal], [16, 256]); assert.equal(sequences.o(100000), "1e5"); assert.equal(sequences.o(0.001), "1e-3"); assert.equal(sequences.o(2.5), "2.5"); assert.deepEqual(sequences.a({ initialTerm: 99, commonDifference: -99, commonRatio: 9 }).arithmeticTerms.slice(0, 2).map(term => term.value), [20, 0]); runtimeAssertions += 7;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
