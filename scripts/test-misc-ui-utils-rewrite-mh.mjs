import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = path.join(root, "src/webview/assets");
const modules = [
  ["type-940292164259.js", "learning-model-climate-mitigation-wedges"],
  ["type-9eaaebe29f2e.js", "learning-model-reaction-order-plots"],
  ["type-19d8b437a2d9.js", "learning-model-continuous-uniform-distribution"],
  ["type-894614f7a446.js", "learning-model-biome-climatograph"],
  ["type-9a0c50e93ce3.js", "learning-model-sampling-without-replacement"],
  ["type-9a4e4be29b1b.js", "learning-model-selection-patterns"],
  ["type-2c1c76fd09a3.js", "learning-model-biological-ph-and-buffers"],
  ["type-7c6088477dd8.js", "learning-model-formal-charge"],
  ["type-502dfab37449.js", "learning-model-boolean-logic"],
  ["type-5d4a85edaa4f.js", "learning-model-periodic-trends"],
];

const expected = new Map([
  [
    "learning-model-climate-mitigation-wedges",
    {
      type: "CLIMATE_MITIGATION_WEDGES",
      version: 2,
      thumbnailAssetKey: "climate-mitigation-wedges-v1",
      parameters: {
        required_wedges: { kind: "integer", defaultValue: 7, min: 3, max: 12 },
        horizon_years: { kind: "integer", defaultValue: 50, min: 20, max: 100 },
      },
    },
  ],
  [
    "learning-model-reaction-order-plots",
    {
      type: "REACTION_ORDER_PLOTS",
      version: 2,
      thumbnailAssetKey: "reaction-order-plots-v1",
      parameters: {
        reaction_order: {
          kind: "enum",
          defaultValue: "first-order",
          allowedValues: ["zero-order", "first-order", "second-order"],
        },
      },
    },
  ],
  [
    "learning-model-continuous-uniform-distribution",
    {
      type: "CONTINUOUS_UNIFORM_DISTRIBUTION",
      version: 2,
      thumbnailAssetKey: "continuous-uniform-distribution-v1",
      parameters: {
        lower_bound: { kind: "number", defaultValue: 0, min: -20, max: 10 },
        upper_bound: { kind: "number", defaultValue: 15, min: 11, max: 40 },
      },
    },
  ],
  [
    "learning-model-biome-climatograph",
    {
      type: "BIOME_CLIMATOGRAPH",
      version: 2,
      thumbnailAssetKey: "biome-climatograph-v2",
      parameters: {
        mean_annual_temperature_c: {
          kind: "number",
          defaultValue: 18,
          min: -15,
          max: 30,
        },
        annual_precipitation_cm: {
          kind: "number",
          defaultValue: 100,
          min: 0,
          max: 450,
        },
      },
    },
  ],
  [
    "learning-model-sampling-without-replacement",
    {
      type: "SAMPLING_WITHOUT_REPLACEMENT",
      version: 3,
      thumbnailAssetKey: "sampling-without-replacement-v1",
      parameters: {
        category_a_count: { kind: "integer", defaultValue: 4, min: 1, max: 10 },
        category_b_count: { kind: "integer", defaultValue: 3, min: 1, max: 10 },
      },
    },
  ],
  [
    "learning-model-selection-patterns",
    {
      type: "SELECTION_PATTERNS",
      version: 2,
      thumbnailAssetKey: "selection-patterns-v1",
      parameters: {
        initial_selection_pattern: {
          kind: "enum",
          defaultValue: "stabilizing",
          allowedValues: ["stabilizing", "directional", "disruptive"],
        },
      },
    },
  ],
  [
    "learning-model-biological-ph-and-buffers",
    {
      type: "BIOLOGICAL_PH_AND_BUFFERS",
      version: 2,
      thumbnailAssetKey: "biological-ph-and-buffers-v1",
      canonicalFormula:
        "\\mathrm{pH}=\\mathrm{p}K_a+\\log_{10}\\!\\left(\\frac{[A^-]}{[HA]}\\right)",
      parameters: {
        pKa: { kind: "number", defaultValue: 7.2, min: 4.5, max: 9.5 },
      },
    },
  ],
  [
    "learning-model-formal-charge",
    {
      type: "FORMAL_CHARGE",
      version: 2,
      thumbnailAssetKey: "formal-charge-v1",
      parameters: {
        example: {
          kind: "enum",
          defaultValue: "carbon-dioxide-candidates",
          allowedValues: [
            "carbon-dioxide-candidates",
            "nitrite-resonance",
            "ammonium",
          ],
        },
      },
    },
  ],
  [
    "learning-model-boolean-logic",
    {
      type: "BOOLEAN_LOGIC",
      version: 1,
      thumbnailAssetKey: "boolean-logic-v1",
      parameters: {
        inputA: { kind: "boolean", defaultValue: true },
        inputB: { kind: "boolean", defaultValue: false },
        operator: {
          kind: "enum",
          defaultValue: "and",
          allowedValues: ["and", "or"],
        },
      },
    },
  ],
  [
    "learning-model-periodic-trends",
    {
      type: "PERIODIC_TRENDS",
      version: 2,
      thumbnailAssetKey: "periodic-trends-v1",
      parameters: {
        initial_trend: {
          kind: "enum",
          defaultValue: "atomic radius",
          allowedValues: [
            "atomic radius",
            "first ionization energy",
            "electronegativity",
          ],
        },
      },
    },
  ],
]);

const dependencies = (source, pattern) =>
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
    dependencies(original, /from "\.\/([^"]+)\.js"/gu),
    dependencies(recovered, /(?:from\s*|import\s*)["']@rchunk\/([^"']+)/gu),
  );
  assert.equal(
    (original.match(/import\(/gu) ?? []).length,
    (recovered.match(/import\(/gu) ?? []).length,
  );
  assert.equal(/\bany\b|@ts-expect-error/u.test(recovered), false);
  assert.ok(recovered.includes("Release chunk:"));
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
        name: "mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: name }) => ({
            path: name,
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

let runtimeAssertions = 0;
for (const [_asset, directory] of modules) {
  const module = await bundle(directory);
  assert.deepEqual(Object.keys(module).sort(), ["n", "t"]);
  module.t();
  const first = module.n;
  assert.deepEqual(
    first,
    expected.get(directory),
    `${directory} specification`,
  );
  module.t();
  assert.equal(module.n, first, `${directory} idempotent initialization`);
  runtimeAssertions += 3;
}

console.log(
  `${sourceAssertions} source assertions and ${runtimeAssertions} runtime assertions passed`,
);
