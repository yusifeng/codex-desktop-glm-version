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
  ["type-4ea25b9db993.js", "learning-model-soil-texture-triangle"],
  ["type-6637f6f4ce37.js", "learning-model-half-full-adder-logic"],
  ["type-fec75962c1bf.js", "learning-model-decibel-safety"],
  ["type-402ae30c42ae.js", "learning-model-energy-pyramid"],
  ["type-ee3c6146db4d.js", "learning-model-lytic-vs-lysogenic-virus-cycle"],
  ["type-9e89df8b418e.js", "learning-model-intermolecular-forces"],
  ["type-9acfe2203543.js", "learning-model-water-phase-diagram"],
  ["type-b2315d4b532d.js", "learning-model-randomized-experiment"],
  ["type-eccf29c88c2c.js", "learning-model-vapor-pressure"],
  ["type-895220240c77.js", "learning-model-age-structure-pyramid"],
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

const expectedSpecifications = new Map([
  [
    "learning-model-soil-texture-triangle",
    {
      type: "SOIL_TEXTURE_TRIANGLE",
      version: 1,
      thumbnailAssetKey: "soil-texture-triangle-v1",
      parameters: {
        sand_percent: { kind: "number", defaultValue: 40, min: 0, max: 100 },
        clay_percent: { kind: "number", defaultValue: 20, min: 0, max: 100 },
      },
    },
  ],
  [
    "learning-model-half-full-adder-logic",
    {
      type: "HALF_FULL_ADDER_LOGIC",
      version: 2,
      thumbnailAssetKey: "half-full-adder-logic-v1",
      parameters: {
        a: { kind: "boolean", defaultValue: true },
        b: { kind: "boolean", defaultValue: false },
        carryIn: { kind: "boolean", defaultValue: true },
      },
    },
  ],
  [
    "learning-model-decibel-safety",
    {
      type: "DECIBEL_SAFETY",
      version: 3,
      thumbnailAssetKey: "decibel-safety-v1",
      parameters: {
        sound_level_dba: {
          kind: "number",
          defaultValue: 85,
          min: 82,
          max: 100,
        },
        exposure_duration_minutes: {
          kind: "integer",
          defaultValue: 480,
          min: 0,
          max: 960,
        },
      },
    },
  ],
  [
    "learning-model-energy-pyramid",
    {
      type: "ENERGY_PYRAMID",
      version: 3,
      thumbnailAssetKey: "energy-pyramid-v2",
      parameters: {
        producer_energy: {
          kind: "number",
          defaultValue: 10_000,
          min: 1_000,
          max: 100_000,
        },
        transfer_efficiency_percent: {
          kind: "number",
          defaultValue: 10,
          min: 5,
          max: 20,
        },
      },
    },
  ],
  [
    "learning-model-lytic-vs-lysogenic-virus-cycle",
    {
      type: "LYTIC_VS_LYSOGENIC_VIRUS_CYCLE",
      version: 2,
      thumbnailAssetKey: "lytic-vs-lysogenic-virus-cycle-v2",
      parameters: {
        initial_pathway: {
          kind: "enum",
          defaultValue: "lytic",
          allowedValues: ["lytic", "lysogenic"],
        },
      },
    },
  ],
  [
    "learning-model-intermolecular-forces",
    {
      type: "INTERMOLECULAR_FORCES",
      version: 1,
      thumbnailAssetKey: "intermolecular-forces-v2",
      parameters: {
        initial_example: {
          kind: "enum",
          defaultValue: "water",
          allowedValues: ["methane", "hydrogen chloride", "water"],
        },
      },
    },
  ],
  [
    "learning-model-water-phase-diagram",
    {
      type: "WATER_PHASE_DIAGRAM",
      version: 2,
      thumbnailAssetKey: "water-phase-diagram-v1",
      parameters: {
        temperature_c: { kind: "number", defaultValue: 25, min: -80, max: 450 },
        pressure_kpa: {
          kind: "number",
          defaultValue: 101.325,
          min: 0.001,
          max: 50_000,
        },
      },
    },
  ],
  [
    "learning-model-randomized-experiment",
    {
      type: "RANDOMIZED_EXPERIMENT",
      version: 2,
      thumbnailAssetKey: "randomized-experiment-v1",
      parameters: {
        experimental_units: {
          kind: "integer",
          defaultValue: 16,
          min: 6,
          max: 30,
        },
        treatment_effect: {
          kind: "number",
          defaultValue: 8,
          min: -20,
          max: 20,
        },
      },
    },
  ],
  [
    "learning-model-vapor-pressure",
    {
      type: "VAPOR_PRESSURE",
      version: 3,
      thumbnailAssetKey: "vapor-pressure-v1",
      parameters: {
        initial_temperature_c: {
          kind: "number",
          defaultValue: 25,
          min: 0,
          max: 60,
        },
        surrounding_pressure_kpa: {
          kind: "number",
          defaultValue: 101.325,
          min: 40,
          max: 160,
        },
      },
    },
  ],
  [
    "learning-model-age-structure-pyramid",
    {
      type: "AGE_STRUCTURE_PYRAMID",
      version: 3,
      thumbnailAssetKey: "age-structure-pyramid-v1",
      parameters: {
        initial_pattern: {
          kind: "enum",
          defaultValue: "expansive",
          allowedValues: ["expansive", "stationary", "constrictive"],
        },
      },
    },
  ],
]);

let runtimeAssertions = 0;
for (const [_asset, directory] of modules) {
  const module = await bundle(directory);
  assert.deepEqual(Object.keys(module).sort(), ["n", "t"]);
  assert.equal(module.n, undefined, directory + " before initialization");
  module.t();
  assert.deepEqual(module.n, expectedSpecifications.get(directory));
  const identity = module.n;
  module.t();
  assert.equal(module.n, identity, directory + " idempotent initialization");
  runtimeAssertions += 4;
}

console.log(
  sourceAssertions +
    " source assertions and " +
    runtimeAssertions +
    " runtime assertions passed",
);
