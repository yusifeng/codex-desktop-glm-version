import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");
const models = [
  ["model-2219d04986cb.js", "learning-model-absolute-value-distance", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-3beba148e294.js", "learning-model-fixed-perimeter-rectangle-area", ["a", "i", "n", "o", "r", "t"]],
  ["model-ec3f9e09db1f.js", "learning-model-survivorship-curves", ["a", "i", "n", "r", "t"]],
  ["model-8fbbd3b034e1.js", "learning-model-cyclohexane-chair-flips", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-1d9447e10398.js", "learning-model-positive-feedback-loop", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-456e3b59f525.js", "learning-model-box-plot", ["a", "i", "n", "o", "r", "t"]],
  ["model-a0d2b57a7427.js", "learning-model-alkene-stereochemical-additions", ["n", "r", "t"]],
  ["model-eeab59a705d6.js", "learning-model-recrystallization", ["a", "i", "n", "r", "t"]],
  ["model-bd1ef1923f57.js", "learning-model-magnet-induced-current", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-75fbe3dbe692.js", "learning-model-break-even-analysis", ["a", "i", "n", "o", "r", "t"]],
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
    plugins: [{
      name: "rpc-learning-model-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath.slice(8), namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "export {};", loader: "js" }));
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}

const loaded = new Map();
let runtimeAssertions = 0;
for (const [_asset, directory, expectedExports] of models) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  assert.deepEqual(Object.keys(module).sort(), [...expectedExports].sort(), directory + " preserves compressed exports");
  runtimeAssertions += 1;
}

const absolute = loaded.get("learning-model-absolute-value-distance");
assert.deepEqual(absolute.i({ x: -4.5 }), { x: -4.5, distance: 4.5, isNegative: true });
assert.equal(absolute.o(Number.POSITIVE_INFINITY), -3);
assert.equal(Object.is(absolute.o(-0), -0), false);
assert.equal(absolute.r(2.04), "2");
runtimeAssertions += 4;

const rectangle = loaded.get("learning-model-fixed-perimeter-rectangle-area");
assert.deepEqual(rectangle.n(6), { width: 6, height: 6, area: 36, isMaximum: true });
assert.deepEqual(rectangle.n(20), { width: 11, height: 1, area: 11, isMaximum: false });
assert.equal(rectangle.i(Number.NaN), 4);
runtimeAssertions += 3;

const survivorship = loaded.get("learning-model-survivorship-curves");
assert.deepEqual(survivorship.n({ relativeAge: 100, highlightedType: 9 }), { relativeAge: 100, highlightedType: 2, typeI: 1, typeII: 1, typeIII: 1 });
assert.equal(survivorship.a(2, 50), 1.5);
assert.equal(survivorship.r(1).length, 101);
assert.equal(survivorship.r(3)[0].y, 3);
runtimeAssertions += 4;

const chair = loaded.get("learning-model-cyclohexane-chair-flips");
assert.deepEqual(chair.s({ example: "invalid", flipped: 1 }), { example: "methylcyclohexane", flipped: false });
assert.equal(chair.i(1, "A"), "up");
assert.deepEqual(chair.n("cis-1,2-dimethylcyclohexane", "A").map(({ position }) => position), ["axial", "equatorial"]);
assert.equal(chair.r(chair.n("trans-1,2-dimethylcyclohexane", "A")), 2);
assert.equal(chair.o("trans-1,2-dimethylcyclohexane"), "trans");
runtimeAssertions += 5;

const feedback = loaded.get("learning-model-positive-feedback-loop");
assert.deepEqual(feedback.o({ example: "unknown", step: 9 }), { example: "childbirth", step: 3 });
assert.equal(feedback.r(1), "ice-albedo");
assert.equal(feedback.r(-3), "childbirth");
assert.equal(feedback.i("ice-albedo"), 1);
runtimeAssertions += 4;

const boxPlot = loaded.get("learning-model-box-plot");
assert.equal(boxPlot.o("unknown"), "similar spread");
assert.deepEqual(boxPlot.i({ low: 20, q1: 40, median: 50, q3: 60, high: 78, outliers: [96] }), { low: 20, q1: 40, median: 50, q3: 60, high: 78, outliers: [96], iqr: 20, lowerFence: 10, upperFence: 90 });
assert.deepEqual(boxPlot.t["possible outlier"].outliers, [96]);
runtimeAssertions += 3;

const alkene = loaded.get("learning-model-alkene-stereochemical-additions");
assert.deepEqual(alkene.r({ initial_addition: "anti-halogenation", stage: 1.6 }), { addition: "anti-halogenation", stage: 2, leftGroup: "Br", rightGroup: "Br", reagent: "Br₂", relation: "trans" });
assert.deepEqual(alkene.r({ initial_addition: "invalid", stage: Number.NaN }), { addition: "syn-hydroboration-oxidation", stage: 0, leftGroup: "H", rightGroup: "OH", reagent: "1. BH₃   2. H₂O₂, OH⁻", relation: "cis" });
runtimeAssertions += 2;

const recrystallization = loaded.get("learning-model-recrystallization");
assert.deepEqual(recrystallization.r({ coolingTemperature: 0, solventProfile: 0 }), { coolingTemperature: 0, solventProfile: 0, hotDissolved: 100, dissolved: 8, crystals: 92, crystalCount: 11 });
assert.deepEqual(recrystallization.r({ coolingTemperature: 80, solventProfile: 1 }), { coolingTemperature: 80, solventProfile: 1, hotDissolved: 100, dissolved: 100, crystals: 0, crystalCount: 0 });
assert.equal(recrystallization.i(0).length, 41);
assert.deepEqual(recrystallization.i(0)[40], { x: 80, y: 100 });
runtimeAssertions += 4;

const magnet = loaded.get("learning-model-magnet-induced-current");
assert.deepEqual(magnet.o({ magnetPosition: 500, motionMode: "automatic", playbackRevision: -2 }), { magnetPosition: 304, motionMode: "automatic", playbackRevision: 0 });
assert.equal(magnet.n(230, 10), 0);
assert.equal(magnet.n(82, 0.4), 0);
assert.equal(magnet.i(magnet.n(180, 50)), "left");
assert.equal(magnet.i(magnet.n(280, 50)), "right");
runtimeAssertions += 5;

const breakEven = loaded.get("learning-model-break-even-analysis");
assert.deepEqual(breakEven.i({ fixedCost: 400, variableCost: 12, price: 32 }), { fixedCost: 400, variableCost: 12, price: 32, contributionMargin: 20, breakEvenQuantity: 20, breakEvenRevenue: 640, hasBreakEven: true });
assert.deepEqual(breakEven.i({ fixedCost: 400, variableCost: 40, price: 5 }), { fixedCost: 400, variableCost: 40, price: 5, contributionMargin: -35, breakEvenQuantity: null, breakEvenRevenue: null, hasBreakEven: false });
assert.deepEqual(breakEven.o({ fixedCost: Number.NaN, variableCost: -4, price: 99 }), { fixedCost: 400, variableCost: 0, price: 60 });
runtimeAssertions += 3;

console.log(`${sourceAssertions} source assertions and ${runtimeAssertions} runtime assertions passed`);
