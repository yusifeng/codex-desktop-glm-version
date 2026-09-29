import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const models = [
  ["learning-model-acid-deposition", ["n", "r", "t"]],
  ["learning-model-carbonyl-addition", ["n", "r", "t"]],
  ["learning-model-saturated-solution", ["n", "t"]],
  ["learning-model-diminishing-marginal-utility", ["n", "r", "t"]],
  ["learning-model-integration-by-parts", ["a", "i", "n", "o", "r", "t"]],
  ["learning-model-hpa-axis", ["a", "i", "n", "r", "t"]],
  ["learning-model-conductometric-titration", ["a", "i", "n", "r", "t"]],
  ["learning-model-habitat-fragmentation", ["i", "n", "r", "t"]],
  ["learning-model-carbohydrate-structure", ["a", "i", "n", "o", "r", "t"]],
  ["learning-model-thyroid-feedback", ["a", "i", "n", "r", "t"]],
];

let assertions = 0;
const loaded = new Map();
for (const [name, expectedExports] of models) {
  const sourcePath = path.join(ROOT, "src/renderer", name, "index.ts");
  const source = fs.readFileSync(sourcePath, "utf8");
  const dependencies = [
    ...source.matchAll(/(?:from\s+|import\s+)["']@rchunk\/([^"']+)["']/g),
  ].map(match => match[1]);
  assert.deepEqual([...new Set(dependencies)].sort(), ["rolldown-runtime"]); assertions++;
  assert.doesNotMatch(source, /:\s*any\b|\bas\s+any\b|<any>|@ts-expect-error/); assertions++;

  const result = await esbuild.build({
    entryPoints: [sourcePath],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "mock-renderer-chunks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock-renderer-chunk",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock-renderer-chunk" }, () => ({
          loader: "js",
          contents: "export {};",
        }));
      },
    }],
  });
  const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
  assert.deepEqual(Object.keys(module).sort(), expectedExports); assertions++;
  loaded.set(name, module);
}

const acid = loaded.get("learning-model-acid-deposition");
acid.n();
assert.deepEqual(acid.t, { min: 0, max: 3, defaultValue: 0 }); assertions++;
assert.deepEqual(acid.r({ stageIndex: 2.6 }), { stageIndex: 3 }); assertions++;
assert.deepEqual(acid.r({ stageIndex: -9 }), { stageIndex: 0 }); assertions++;
assert.deepEqual(acid.r({ stageIndex: Number.NaN }), { stageIndex: 0 }); assertions++;

const carbonyl = loaded.get("learning-model-carbonyl-addition");
carbonyl.n();
assert.deepEqual(carbonyl.t, ["aldehyde", "ketone"]); assertions++;
assert.deepEqual(carbonyl.r({ substrate_class: "ketone", stage: 1.6 }), { substrateClass: "ketone", stage: 2 }); assertions++;
assert.deepEqual(carbonyl.r({ substrate_class: "ester", stage: 10 }), { substrateClass: "aldehyde", stage: 3 }); assertions++;

const saturated = loaded.get("learning-model-saturated-solution");
saturated.n();
assert.deepEqual(saturated.t({ soluteAddedGrams: 20 }), { addedGrams: 20, dissolvedGrams: 20, excessGrams: 0, isSaturated: false }); assertions++;
assert.deepEqual(saturated.t({ soluteAddedGrams: 60 }), { addedGrams: 60, dissolvedGrams: 36, excessGrams: 24, isSaturated: true }); assertions++;
assert.deepEqual(saturated.t({ soluteAddedGrams: 90 }), { addedGrams: 72, dissolvedGrams: 36, excessGrams: 36, isSaturated: true }); assertions++;
assert.deepEqual(saturated.t({}), { addedGrams: 48, dissolvedGrams: 36, excessGrams: 12, isSaturated: true }); assertions++;

const utility = loaded.get("learning-model-diminishing-marginal-utility");
utility.r();
assert.deepEqual(utility.t, [24, 19, 15, 11, 8, 6, 4, 0, -4]); assertions++;
assert.deepEqual(utility.n(3), { quantity: 3, marginalUtility: 15, totalUtility: 58, totals: [0, 24, 43, 58, 69, 77, 83, 87, 87, 83] }); assertions++;
assert.equal(utility.n(8).marginalUtility, 0); assertions++;
assert.equal(utility.n(99).quantity, 9); assertions++;

const integration = loaded.get("learning-model-integration-by-parts");
integration.r();
assert.deepEqual(integration.n, { min: 0, max: 4, step: 1 }); assertions++;
assert.equal(integration.t, 5); assertions++;
assert.equal(integration.a(3.7), 4); assertions++;
assert.equal(integration.a("3"), 0); assertions++;
assert.deepEqual(integration.o({}), { stage: 0 }); assertions++;
assert.deepEqual(integration.i({}, { presentationMode: "thumbnail" }), { stage: 4 }); assertions++;

const hpa = loaded.get("learning-model-hpa-axis");
hpa.i();
assert.deepEqual(hpa.t, ["stressor", "crh", "acth", "cortisol", "feedback"]); assertions++;
assert.deepEqual(hpa.a({ stepIndex: 2.6 }), { stepIndex: 3 }); assertions++;
assert.equal(hpa.r({ stepIndex: 10 }), "feedback"); assertions++;
assert.equal(hpa.r({ stepIndex: Number.NaN }), "stressor"); assertions++;

const titration = loaded.get("learning-model-conductometric-titration");
titration.a();
assert.equal(titration.t, 2.4); assertions++;
assert.ok(Math.abs(titration.i(0) - 7.2) < Number.EPSILON * 8); assertions++;
assert.equal(titration.i(20), 2.4); assertions++;
assert.equal(titration.i(40), 6.4); assertions++;
assert.deepEqual(titration.r({ addedVolumeMl: 20 }), { addedVolumeMl: 20, conductivity: 2.4, regime: "equivalence" }); assertions++;
const clampedTitration = titration.r({ addedVolumeMl: -4 });
assert.equal(clampedTitration.addedVolumeMl, 0); assertions++;
assert.ok(Math.abs(clampedTitration.conductivity - 7.2) < Number.EPSILON * 8); assertions++;
assert.equal(clampedTitration.regime, "before"); assertions++;

const habitat = loaded.get("learning-model-habitat-fragmentation");
habitat.r();
assert.deepEqual(habitat.t, { stage: 0, corridor: false }); assertions++;
assert.deepEqual(habitat.i({ stage: "1.4", corridor: 1 }), { stage: 1, corridor: false }); assertions++;
assert.deepEqual(habitat.n({ stage: 0 }), { stage: 0, corridor: false, connected: true, patchCount: 1 }); assertions++;
assert.deepEqual(habitat.n({ stage: 2, corridor: false }), { stage: 2, corridor: false, connected: false, patchCount: 4 }); assertions++;
assert.deepEqual(habitat.n({ stage: 2, corridor: true }), { stage: 2, corridor: true, connected: true, patchCount: 4 }); assertions++;

const carbohydrate = loaded.get("learning-model-carbohydrate-structure");
carbohydrate.i();
assert.equal(carbohydrate.a("glycogen"), "glycogen"); assertions++;
assert.equal(carbohydrate.a("fructose"), "amylopectin"); assertions++;
assert.equal(carbohydrate.o(1.7), 2); assertions++;
assert.equal(carbohydrate.n("amylopectin"), 1); assertions++;
assert.equal(carbohydrate.n("cellulose"), 2); assertions++;
assert.equal(carbohydrate.r("glycogen", 1), "glycogen"); assertions++;
assert.equal(carbohydrate.r("maltose", 0), "maltose"); assertions++;
assert.equal(carbohydrate.r("glucose", 2), "cellulose"); assertions++;

const thyroid = loaded.get("learning-model-thyroid-feedback");
thyroid.i();
assert.deepEqual(thyroid.t, ["trh-release", "tsh-release", "thyroid-output", "restored-feedback"]); assertions++;
assert.deepEqual(thyroid.a({ stepIndex: 1.8 }), { stepIndex: 2 }); assertions++;
assert.equal(thyroid.r({ stepIndex: -4 }), "trh-release"); assertions++;
assert.equal(thyroid.r({ stepIndex: 99 }), "restored-feedback"); assertions++;

console.log(`rpc-learning-models-a: ${assertions} assertions passed`);
