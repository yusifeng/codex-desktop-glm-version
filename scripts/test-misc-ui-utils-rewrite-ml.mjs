import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.join(ROOT, "src/webview/assets");
const modules = [
  ["type-d22103ac12d0.js", "learning-model-selection-sort", ["n", "t"]],
  ["type-f76de9a47b83.js", "learning-model-logistic-regression", ["n", "t"]],
  ["type-50c9fc73ec1d.js", "learning-model-distributive-property", ["n", "t"]],
  ["type-bd561e5dd245.js", "learning-model-cohens-d", ["n", "t"]],
  ["type-49e9f66a2d98.js", "learning-model-foil-binomial", ["n", "t"]],
  ["type-39f5bace963c.js", "learning-model-perpendicular-line", ["n", "t"]],
  ["type-419e85f400c3.js", "learning-model-filling-rates", ["n", "t"]],
  ["type-33287eb94059.js", "learning-model-central-limit-theorem", ["n", "t"]],
  ["type-ad01baf2ce65.js", "learning-model-homogeneous-ode-roots", ["n", "t"]],
  ["type-85e042e70c11.js", "learning-model-bomb-calorimetry", ["n", "t"]],
];

const dependencies = (source, expression) => [...source.matchAll(expression)].map((match) => match[1]);
let sourceAssertions = 0;
for (const [asset, directory] of modules) {
  const original = fs.readFileSync(path.join(ASSET_ROOT, asset.replace(/\.js$/, ".ts")), "utf8");
  const recovered = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  const originalDependencies = dependencies(original, /from "\.\/([^"/]+)-[a-f0-9]{12}\.js"/g);
  const recoveredDependencies = dependencies(recovered, /(?:from\s+|import\s*)["']@rchunk\/([^"']+)/g);
  assert.deepEqual(recoveredDependencies, originalDependencies, directory + " preserves static dependencies");
  assert.equal((original.match(/import\(/g) ?? []).length, (recovered.match(/import\(/g) ?? []).length, directory + " preserves dynamic imports");
  assert.equal(/\bany\b|@ts-expect-error|@ts-nocheck/.test(recovered), false, directory + " has no type escape hatch");
  sourceAssertions += 3;
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
      name: "ml-rchunk-mock",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath, namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "export {};", loader: "js" }));
      },
    }],
  });
  return import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64") + "#" + directory);
}

const loaded = new Map();
let runtimeAssertions = 0;
for (const [_asset, directory, expectedExports] of modules) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  assert.deepEqual(Object.keys(module).sort(), [...expectedExports].sort(), directory + " preserves compressed exports");
  runtimeAssertions += 1;
}

const expectedSpecifications = {
  "learning-model-selection-sort": { type: "SELECTION_SORT", version: 1, thumbnailAssetKey: "selection-sort-v1", parameters: { order: { kind: "enum", defaultValue: "6,3,8,2,7,1,5,4", allowedValues: ["6,3,8,2,7,1,5,4", "8,7,6,5,4,3,2,1", "1,2,3,4,5,6,7,8", "4,1,7,3,8,5,2,6"] } } },
  "learning-model-logistic-regression": { type: "LOGISTIC_REGRESSION", version: 2, thumbnailAssetKey: "logistic-regression-v1", canonicalFormula: "P(Y=1\\mid x)=\\frac{1}{1+e^{-(\\beta_0+\\beta_1x)}}", parameters: { intercept: { kind: "number", defaultValue: -0.5, min: -2, max: 2 }, coefficient: { kind: "number", defaultValue: 1.2, min: -2.5, max: 2.5 } } },
  "learning-model-distributive-property": { type: "DISTRIBUTIVE_PROPERTY", version: 2, thumbnailAssetKey: "distributive-property-v1", canonicalFormula: "a(b+c)=ab+ac", parameters: { a: { kind: "integer", defaultValue: 8, min: 2, max: 8 }, b: { kind: "integer", defaultValue: 7, min: 2, max: 8 }, c: { kind: "integer", defaultValue: 7, min: 2, max: 8 } } },
  "learning-model-cohens-d": { type: "COHENS_D", version: 1, thumbnailAssetKey: "cohens-d-v1", canonicalFormula: "d = \\frac{\\bar{x}_2 - \\bar{x}_1}{s_{\\mathrm{pooled}}}", parameters: { initial_mean_difference: { kind: "number", defaultValue: 0.8, min: -4, max: 4 }, pooled_standard_deviation: { kind: "number", defaultValue: 1, min: 0.75, max: 2 } } },
  "learning-model-foil-binomial": { type: "FOIL_BINOMIAL", version: 2, thumbnailAssetKey: "foil-binomial-v1", parameters: { a: { kind: "number", defaultValue: 1, min: -12, max: 12 }, b: { kind: "number", defaultValue: 3, min: -12, max: 12 }, c: { kind: "number", defaultValue: 1, min: -12, max: 12 }, d: { kind: "number", defaultValue: 2, min: -12, max: 12 } } },
  "learning-model-perpendicular-line": { type: "PERPENDICULAR_LINE", version: 2, thumbnailAssetKey: "perpendicular-line-v1", parameters: { slope: { kind: "number", defaultValue: 2, min: -10_000, max: 10_000, multipleOf: 0.0001 }, intercept: { kind: "number", defaultValue: 1, min: -10_000, max: 10_000 }, perpendicularIntercept: { kind: "number", defaultValue: -2, min: -10_000, max: 10_000 } } },
  "learning-model-filling-rates": { type: "FILLING_RATES", version: 1, thumbnailAssetKey: "filling-rates-v2", canonicalFormula: "r_{\\mathrm{net}}=r_{\\mathrm{in}}-r_{\\mathrm{out}}", parameters: { inflowRateLitersPerMinute: { kind: "number", defaultValue: 6, min: 0, max: 8 }, outflowRateLitersPerMinute: { kind: "number", defaultValue: 2, min: 0, max: 8 } } },
  "learning-model-central-limit-theorem": { type: "CENTRAL_LIMIT_THEOREM", version: 3, thumbnailAssetKey: "central-limit-theorem-v1", parameters: { population_shape: { kind: "enum", defaultValue: "right-skewed", allowedValues: ["right-skewed", "uniform", "bimodal", "normal"] }, sample_size: { kind: "integer", defaultValue: 5, min: 1, max: 100 } } },
  "learning-model-homogeneous-ode-roots": { type: "HOMOGENEOUS_ODE_ROOTS", version: 1, thumbnailAssetKey: "homogenous-ode-roots-v1", canonicalFormula: "ay''+by'+cy=0", parameters: { a: { kind: "number", defaultValue: 1, min: 0.1, max: 100 }, b: { kind: "number", defaultValue: 2, min: -10_000, max: 10_000 }, c: { kind: "number", defaultValue: 5, min: -10_000, max: 10_000 } } },
  "learning-model-bomb-calorimetry": { type: "BOMB_CALORIMETRY", version: 2, thumbnailAssetKey: "bomb-calorimetry-v3", parameters: { sample_mass_g: { kind: "number", defaultValue: 1, min: 0.25, max: 2 }, combustion_energy_kj_per_g: { kind: "number", defaultValue: 24, min: 15, max: 35 }, calorimeter_heat_capacity_kj_per_k: { kind: "number", defaultValue: 12, min: 8, max: 25 } } },
};
for (const [directory, expected] of Object.entries(expectedSpecifications)) {
  const module = loaded.get(directory);
  module.t();
  assert.deepEqual(module.n, expected, directory + " preserves manifest semantics");
  runtimeAssertions += 1;
}

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
