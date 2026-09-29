import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");

const models = [
  ["model-5109996801ed.js", "learning-model-vapor-pressure-lowering", ["a", "i", "n", "o", "r", "t"]],
  ["model-fc99fbfc09c1.js", "learning-model-binary-place-value", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-daf7badaab95.js", "learning-model-subtracting-integers", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-cf824d6bcceb.js", "learning-model-calcium-pth-calcitonin-feedback", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-47d542dd6d67.js", "learning-model-dot-plot", ["n", "t"]],
  ["model-6b56e43ed230.js", "learning-model-law-of-cosines", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-af8c2c2496fb.js", "learning-model-common-normal-intervals", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-d2117f3b9ac5.js", "learning-model-dose-response-curve", ["a", "i", "n", "o", "r", "t"]],
  ["model-9badbb3726c5.js", "learning-model-plant-life-cycle", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-106204ffd60a.js", "learning-model-blood-glucose-regulation", ["a", "i", "n", "o", "r", "s", "t"]],
];

const staticDependencies = (source, expression) => [...source.matchAll(expression)].map(match => match[1]);

let sourceAssertions = 0;
for (const [asset, directory] of models) {
  const original = fs.readFileSync(path.join(ASSET_ROOT, asset), "utf8");
  const recovered = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  const originalDependencies = staticDependencies(original, /from "\.\/([^"]+)\.js"/g).map(dependency => dependency.replace(/-[a-f0-9]{12}$/, ""));
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

const vapor = loaded.get("learning-model-vapor-pressure-lowering");
vapor.i();
assert.deepEqual(vapor.r({ pure_solvent_vapor_pressure_kpa: 250, soluteMoleFraction: -1 }), { purePressureKpa: 200, soluteFraction: 0, solventFraction: 1, solutionPressureKpa: 200, loweringKpa: 0 });
assert.deepEqual(vapor.r({ pure_solvent_vapor_pressure_kpa: 80, soluteMoleFraction: 0.25 }), { purePressureKpa: 80, soluteFraction: 0.25, solventFraction: 0.75, solutionPressureKpa: 60, loweringKpa: 20 });
assert.equal(vapor.o.canonicalFormula, "P_{\\mathrm{solution}}=X_{\\mathrm{solvent}}P^\\circ_{\\mathrm{solvent}}");
runtimeAssertions += 3;

const binary = loaded.get("learning-model-binary-place-value");
binary.a();
assert.deepEqual(binary.r(45), { value: 45, bits: [0, 0, 1, 0, 1, 1, 0, 1], binary: "00101101", activePlaces: [32, 8, 4, 1] });
assert.equal(binary.s(45, 8), 37);
assert.equal(binary.o(Number.NaN), 45);
assert.equal(binary.i(binary.r(5)), "00000101_{2} = 4 + 1 = 5_{10}");
runtimeAssertions += 4;

const subtraction = loaded.get("learning-model-subtracting-integers");
subtraction.r();
assert.deepEqual(subtraction.i({ minuend: 99, subtrahend: Number.NaN }), { minuend: 12, subtrahend: 4 });
assert.deepEqual(subtraction.a({ minuend: 7, subtrahend: 4 }), { minuend: 7, subtrahend: 4, result: 3, stepCount: 4, positions: [7, 6, 5, 4, 3], domainMin: -12, domainMax: 13 });
runtimeAssertions += 2;

const calcium = loaded.get("learning-model-calcium-pth-calcitonin-feedback");
calcium.a();
assert.deepEqual(calcium.o({ calciumCondition: "invalid", stageIndex: 9 }), { calciumCondition: "low", stageIndex: 3 });
assert.deepEqual(calcium.n, ["sensing", "hormones", "targets", "feedback"]);
assert.equal(calcium.c.type, "CALCIUM_PTH_CALCITONIN_FEEDBACK");
runtimeAssertions += 3;

const dotPlot = loaded.get("learning-model-dot-plot");
dotPlot.n();
const clustered = dotPlot.t({ example: "clustered", revealed: 4 });
assert.deepEqual(clustered.points, [{ observation: 0, value: 6, lane: 0 }, { observation: 1, value: 5, lane: 0 }, { observation: 2, value: 7, lane: 0 }, { observation: 3, value: 6, lane: 1 }]);
assert.deepEqual({ latestValue: clustered.latestValue, latestFrequency: clustered.latestFrequency, intervalCount: clustered.intervalCount, minimum: clustered.minimum, maximum: clustered.maximum }, { latestValue: 6, latestFrequency: 2, intervalCount: 4, minimum: 5, maximum: 7 });
assert.equal(dotPlot.t({ example: "spread-out", revealed: 99 }).revealed, 16);
runtimeAssertions += 3;

const cosine = loaded.get("learning-model-law-of-cosines");
cosine.i();
assert.deepEqual(cosine.o({ sideA: 2.24, sideB: 9, angleDeg: 19 }), { sideA: 2, sideB: 7, angleDeg: 20 });
const triangle = cosine.s({ sideA: 5, sideB: 6, angleDeg: 120 });
assert.ok(Math.abs(triangle.sideCSquared - 91) < 1e-12);
assert.ok(Math.abs(triangle.sideC - Math.sqrt(91)) < 1e-12);
assert.ok(Math.abs(triangle.endpointB.x + 3) < 1e-12);
assert.ok(Math.abs(cosine.a(Math.PI / 2) - 90) < 1e-12);
runtimeAssertions += 5;

const normal = loaded.get("learning-model-common-normal-intervals");
normal.a();
assert.equal(normal.r(0), 0);
assert.ok(Math.abs(normal.r(1) - 0.6826894723352726) < 1e-7);
assert.ok(Math.abs(normal.r(2) - 0.9544998742254873) < 1e-7);
assert.equal(normal.i(0), 0);
assert.equal(normal.i(0.9996), 2);
assert.equal(normal.i(0.68), 1);
runtimeAssertions += 6;

const dose = loaded.get("learning-model-dose-response-curve");
dose.a();
assert.deepEqual(dose.o({ logConcentration: -20, comparison: 9 }), { logConcentration: -11, comparison: 2 });
const potency = dose.r({ logConcentration: -8, comparison: 0 });
assert.equal(potency.drugA.response, 50);
assert.ok(Math.abs(potency.drugB.response - 9.090909090909092) < 1e-12);
const efficacy = dose.r({ logConcentration: -8, comparison: 1 });
assert.equal(efficacy.drugB.response, 30);
const curve = dose.i(-8, 100);
assert.equal(curve.length, 121);
assert.equal(curve[60].x, -8);
assert.equal(curve[60].y, 50);
runtimeAssertions += 7;

const plant = loaded.get("learning-model-plant-life-cycle");
plant.a();
assert.deepEqual(plant.o({ initial_stage: "invalid" }), { initial_stage: "germination" });
assert.equal(plant.i("pollination"), 3);
assert.equal(plant.r(1), "germination");
assert.equal(plant.r(99), "seed dispersal");
assert.equal(plant.c.version, 2);
runtimeAssertions += 5;

const glucose = loaded.get("learning-model-blood-glucose-regulation");
glucose.i();
assert.deepEqual(glucose.a({ initial_condition: "invalid", stageIndex: Number.NaN }), { initial_condition: "high", stageIndex: 0 });
assert.deepEqual(glucose.a({ initial_condition: "low", stageIndex: 2.7 }), { initial_condition: "low", stageIndex: 3 });
assert.deepEqual(glucose.n, ["high", "low"]);
assert.equal(glucose.s.type, "BLOOD_GLUCOSE_REGULATION");
runtimeAssertions += 4;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
