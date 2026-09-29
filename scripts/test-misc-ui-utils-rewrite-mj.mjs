import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = path.resolve(
  root,
  "../chatgpt-desktop-src/app/webview/assets",
);
const modules = [
  ["thin-optics-509819bab7fc.js", "thin-optics"],
  ["escape-latex-text-77b4ee5f398b.js", "escape-latex-text"],
  ["type-48b2d5373e6f.js", "learning-model-atmospheric-pollution-plume"],
  ["type-94130cd0d6af.js", "learning-model-rgb-additive-mixing"],
  ["type-44949bae7160.js", "learning-model-linear-combination"],
  ["type-708888491b1d.js", "learning-model-likelihood-function"],
  ["type-bc00b8c55dd6.js", "learning-model-parallel-line"],
  ["type-603f86db5a64.js", "learning-model-divide-conquer-recurrence-tree"],
  ["type-bb80ea70b787.js", "learning-model-probability-tree"],
  ["type-221c87938b30.js", "learning-model-ideal-transformer"],
];

const dependencyNames = (source, pattern) =>
  [...source.matchAll(pattern)].map((match) =>
    match[1].replace(/-[a-f0-9]{12}$/, ""),
  );

let sourceAssertions = 0;
for (const [asset, directory] of modules) {
  const original = fs.readFileSync(path.join(assetRoot, asset), "utf8");
  const recovered = fs.readFileSync(
    path.join(root, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  assert.deepEqual(
    dependencyNames(original, /from "\.\/([^"]+)\.js"/g),
    dependencyNames(recovered, /(?:from\s*|import\s*)["']@rchunk\/([^"']+)/g),
    directory + " dependencies",
  );
  assert.equal(
    (original.match(/import\(/g) ?? []).length,
    (recovered.match(/import\(/g) ?? []).length,
  );
  assert.equal(/\bany\b|@ts-expect-error/.test(recovered), false);
  assert.ok(recovered.includes("Release chunk: " + asset));
  sourceAssertions += 4;
}

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(root, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "runtime-mock",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({
            path: modulePath,
            namespace: "mock",
          }));
          build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
            contents: "export {};",
            loader: "js",
          }));
        },
      },
    ],
  });
  const encoded = Buffer.from(result.outputFiles[0].text).toString("base64");
  return import("data:text/javascript;base64," + encoded + "#" + directory);
}

const loaded = new Map();
let runtimeAssertions = 0;
for (const [_asset, directory] of modules) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  assert.deepEqual(Object.keys(module).sort(), ["n", "t"]);
  runtimeAssertions += 1;
}

const thinOptics = loaded.get("thin-optics");
assert.equal(thinOptics.n, undefined);
thinOptics.t();
assert.deepEqual(thinOptics.n(30, 10), {
  objectDistance: 30,
  focalLength: 10,
  imageDistance: 15,
  magnification: -0.5,
  finiteImage: true,
});
assert.deepEqual(thinOptics.n(10, 10), {
  objectDistance: 10,
  focalLength: 10,
  imageDistance: Number.POSITIVE_INFINITY,
  magnification: 0,
  finiteImage: false,
});
assert.equal(thinOptics.n(10 + 5e-9, 10).finiteImage, false);
const thinOpticsIdentity = thinOptics.n;
thinOptics.t();
assert.equal(thinOptics.n, thinOpticsIdentity);
runtimeAssertions += 5;

const latex = loaded.get("escape-latex-text");
assert.equal(latex.t, undefined);
latex.n();
assert.equal(
  latex.t("\\{}$&#_%^~"),
  "\\text{\\textbackslash{}\\{\\}\\$\\&\\#\\_\\%\\textasciicircum{}\\textasciitilde{}}",
);
assert.equal(latex.t("plain text"), "\\text{plain text}");
const latexIdentity = latex.t;
latex.n();
assert.equal(latex.t, latexIdentity);
runtimeAssertions += 4;

const expectedSpecifications = new Map([
  [
    "learning-model-atmospheric-pollution-plume",
    {
      type: "ATMOSPHERIC_POLLUTION_PLUME",
      version: 3,
      thumbnailAssetKey: "atmospheric-pollution-plume-v2",
      parameters: {
        initial_plume_regime: {
          kind: "enum",
          defaultValue: "looping",
          allowedValues: [
            "looping",
            "coning",
            "fanning",
            "lofting",
            "fumigation",
            "trapping",
          ],
        },
      },
    },
  ],
  [
    "learning-model-rgb-additive-mixing",
    {
      type: "RGB_ADDITIVE_MIXING",
      version: 1,
      thumbnailAssetKey: "rgb-additive-mixing-v1",
      parameters: {
        red: { kind: "integer", defaultValue: 255, min: 0, max: 255 },
        green: { kind: "integer", defaultValue: 255, min: 0, max: 255 },
        blue: { kind: "integer", defaultValue: 255, min: 0, max: 255 },
      },
    },
  ],
  [
    "learning-model-linear-combination",
    {
      type: "LINEAR_COMBINATION",
      version: 1,
      thumbnailAssetKey: "linear-combination-v1",
      canonicalFormula: "\\vec{w}=a\\vec{u}+b\\vec{v}",
      parameters: {
        coefficientA: { kind: "number", defaultValue: 1, min: -2, max: 2 },
        coefficientB: { kind: "number", defaultValue: 1, min: -2, max: 2 },
      },
    },
  ],
  [
    "learning-model-likelihood-function",
    {
      type: "LIKELIHOOD_FUNCTION",
      version: 1,
      thumbnailAssetKey: "likelihood-function-v1",
      canonicalFormula: "L(p\\mid k,n) \\propto p^k(1-p)^{n-k}",
      parameters: {
        successes: { kind: "integer", defaultValue: 3, min: 0, max: 48 },
        trials: { kind: "integer", defaultValue: 12, min: 12, max: 48 },
      },
    },
  ],
  [
    "learning-model-parallel-line",
    {
      type: "PARALLEL_LINE",
      version: 1,
      thumbnailAssetKey: "parallel-line-v1",
      parameters: {
        slope: { kind: "number", defaultValue: 0.6, min: -1, max: 1 },
        referenceIntercept: {
          kind: "number",
          defaultValue: 0,
          min: -4,
          max: 4,
        },
        comparisonIntercept: {
          kind: "number",
          defaultValue: 3,
          min: -4,
          max: 4,
        },
      },
    },
  ],
  [
    "learning-model-divide-conquer-recurrence-tree",
    {
      type: "DIVIDE_CONQUER_RECURRENCE_TREE",
      version: 1,
      thumbnailAssetKey: "divide-conquer-recurrence-tree-v1",
      parameters: {
        recurrence_example: {
          kind: "enum",
          defaultValue: "T(n) = 2T(n/2) + n",
          allowedValues: [
            "T(n) = 2T(n/2) + 1",
            "T(n) = 2T(n/2) + n",
            "T(n) = 2T(n/2) + n^2",
          ],
        },
      },
    },
  ],
  [
    "learning-model-probability-tree",
    {
      type: "PROBABILITY_TREE",
      version: 2,
      thumbnailAssetKey: "probability-tree-v1",
      parameters: {
        first_outcome_count: {
          kind: "integer",
          defaultValue: 3,
          min: 1,
          max: 12,
        },
        second_outcome_count: {
          kind: "integer",
          defaultValue: 8,
          min: 1,
          max: 12,
        },
        with_replacement: { kind: "boolean", defaultValue: false },
      },
    },
  ],
  [
    "learning-model-ideal-transformer",
    {
      type: "IDEAL_TRANSFORMER",
      version: 1,
      thumbnailAssetKey: "ideal-transformer-v2",
      canonicalFormula: "\\frac{V_s}{V_p}=\\frac{N_s}{N_p}",
      parameters: {
        turnsRatio: { kind: "number", defaultValue: 2, min: 0.1, max: 10 },
        loadResistanceOhms: {
          kind: "number",
          defaultValue: 30,
          min: 1,
          max: 10_000,
        },
      },
    },
  ],
]);

for (const [directory, expected] of expectedSpecifications) {
  const module = loaded.get(directory);
  assert.equal(module.n, undefined, directory + " before initialization");
  module.t();
  assert.deepEqual(module.n, expected);
  const identity = module.n;
  module.t();
  assert.equal(module.n, identity, directory + " idempotent initialization");
  runtimeAssertions += 3;
}

console.log(
  sourceAssertions +
    " source assertions and " +
    runtimeAssertions +
    " runtime assertions passed",
);
