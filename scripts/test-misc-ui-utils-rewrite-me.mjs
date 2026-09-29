import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = path.join(root, "src/webview/assets");
const modules = [
  ["type-6ec40c0e5685.js", "learning-model-gram-stain"],
  ["type-df7c33e35927.js", "learning-model-permutation-formula"],
  ["type-e23de7285313.js", "learning-model-combination-formula"],
  ["type-f95346c939a7.js", "learning-model-roc-curve"],
  ["type-7ff60fd7b3ba.js", "learning-model-fahrenheit-celsius-scale"],
  ["type-251f9425afe7.js", "learning-model-direct-inverse-proportion"],
  ["type-eb0199ee4cef.js", "learning-model-long-division"],
  ["type-973549a4c4d1.js", "learning-model-classes-of-levers"],
  ["type-448ce06dc011.js", "learning-model-galvanic-cell"],
  ["extends-df342f7c2e8b.js", "extends"],
];

const dependencyNames = (source, pattern) =>
  [...source.matchAll(pattern)].map((match) =>
    match[1].replace(/-[a-f0-9]{12}$/u, ""),
  );

let sourceAssertions = 0;
for (const [asset, directory] of modules) {
  const original = fs.readFileSync(
    path.join(assetRoot, asset.replace(/\.js$/u, ".ts")),
    "utf8",
  );
  const recovered = fs.readFileSync(
    path.join(root, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  assert.deepEqual(
    dependencyNames(original, /from "\.\/([^"]+)\.js"/gu),
    dependencyNames(recovered, /(?:from\s*|import\s*)["']@rchunk\/([^"']+)/gu),
    `${directory} static dependencies`,
  );
  assert.equal(
    (original.match(/import\(/gu) ?? []).length,
    (recovered.match(/import\(/gu) ?? []).length,
    `${directory} dynamic dependencies`,
  );
  assert.equal(
    /\bany\b|@ts-expect-error/u.test(recovered),
    false,
    `${directory} type escapes`,
  );
  assert.ok(
    recovered.includes("Release chunk:"),
    `${directory} source provenance`,
  );
  sourceAssertions += 4;
}

const specifications = new Map([
  [
    "learning-model-gram-stain",
    {
      type: "GRAM_STAIN",
      version: 1,
      thumbnailAssetKey: "gram-stain-v1",
      parameters: {
        bacteriaType: {
          kind: "enum",
          defaultValue: "positive",
          allowedValues: ["positive", "negative"],
        },
      },
    },
  ],
  [
    "learning-model-permutation-formula",
    {
      type: "PERMUTATION_FORMULA",
      version: 1,
      thumbnailAssetKey: "permutation-formula-v1",
      parameters: {
        n: { kind: "integer", defaultValue: 6, min: 4, max: 8 },
        r: { kind: "integer", defaultValue: 3, min: 2, max: 4 },
      },
    },
  ],
  [
    "learning-model-combination-formula",
    {
      type: "COMBINATION_FORMULA",
      version: 2,
      thumbnailAssetKey: "combination-formula-v1",
      parameters: {
        n: { kind: "integer", defaultValue: 6, min: 4, max: 8 },
        r: { kind: "integer", defaultValue: 3, min: 2, max: 4 },
      },
    },
  ],
  [
    "learning-model-roc-curve",
    {
      type: "ROC_CURVE",
      version: 2,
      thumbnailAssetKey: "roc-curve-v1",
      parameters: {
        auroc: { kind: "number", defaultValue: 0.75, min: 0.5, max: 0.95 },
        threshold: { kind: "number", defaultValue: 0.5, min: 0, max: 1 },
      },
    },
  ],
  [
    "learning-model-fahrenheit-celsius-scale",
    {
      type: "FAHRENHEIT_CELSIUS_SCALE",
      version: 1,
      thumbnailAssetKey: "fahrenheit-celsius-scale-v1",
      canonicalFormula: "F = \\frac{9}{5}C + 32",
      parameters: {
        celsius: { kind: "number", defaultValue: 0, min: -40, max: 120 },
      },
    },
  ],
  [
    "learning-model-direct-inverse-proportion",
    {
      type: "DIRECT_INVERSE_PROPORTION",
      version: 1,
      thumbnailAssetKey: "direct-inverse-proportion-v1",
      canonicalFormula: "y = 2x,\\quad y = \\frac{2}{x}",
      parameters: {
        x: { kind: "number", defaultValue: 1, min: 0.5, max: 2.5 },
      },
    },
  ],
  [
    "learning-model-long-division",
    {
      type: "LONG_DIVISION",
      version: 1,
      thumbnailAssetKey: "long-division-v1",
      parameters: {
        dividend: { kind: "integer", defaultValue: 458, min: 1, max: 9999 },
        divisor: { kind: "integer", defaultValue: 3, min: 1, max: 99 },
      },
    },
  ],
  [
    "learning-model-classes-of-levers",
    {
      type: "CLASSES_OF_LEVERS",
      version: 2,
      thumbnailAssetKey: "classes-of-levers-v1",
      parameters: {
        leverClass: {
          kind: "enum",
          defaultValue: "first",
          allowedValues: ["first", "second", "third"],
        },
      },
    },
  ],
  [
    "learning-model-galvanic-cell",
    {
      type: "GALVANIC_CELL",
      version: 2,
      thumbnailAssetKey: "galvanic-cell-v2",
      parameters: {
        cell_pair: {
          kind: "enum",
          defaultValue: "zinc-copper",
          allowedValues: ["zinc-copper", "copper-silver"],
        },
      },
    },
  ],
]);

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
        name: "rchunk-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({
            path: modulePath.slice(8),
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
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}

const loaded = new Map();
let runtimeAssertions = 0;
for (const [_asset, directory] of modules) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  assert.deepEqual(
    Object.keys(module).sort(),
    ["n", "t"],
    `${directory} exports`,
  );
  runtimeAssertions += 1;
}

for (const [directory, expected] of specifications) {
  const module = loaded.get(directory);
  module.t();
  const first = module.n;
  assert.deepEqual(first, expected, `${directory} specification`);
  module.t();
  assert.equal(module.n, first, `${directory} idempotent initialization`);
  runtimeAssertions += 2;
}

const extendsModule = loaded.get("extends");
assert.equal(extendsModule.n(), undefined);
const inherited = { inherited: "ignored" };
const source = Object.assign(Object.create(inherited), {
  first: 1,
  overridden: "first",
});
const symbol = Symbol("copied");
const target = { seed: true, overridden: "seed" };
const result = extendsModule.t(target, source, null, {
  overridden: "second",
  [symbol]: 9,
});
assert.equal(result, target);
assert.deepEqual(result, {
  seed: true,
  first: 1,
  overridden: "second",
  [symbol]: 9,
});
assert.equal(Object.hasOwn(result, "inherited"), false);
assert.equal(result[symbol], 9);
assert.doesNotThrow(() => extendsModule.t({}, undefined));
runtimeAssertions += 6;

console.log(
  `${sourceAssertions} source assertions and ${runtimeAssertions} runtime assertions passed`,
);
