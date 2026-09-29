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
  ["type-e01a2e47390f.js", "learning-model-two-cable-static-equilibrium"],
  ["type-34ba530d4dd9.js", "learning-model-specific-heat"],
  ["type-b5d60db25e60.js", "learning-model-buffer-composition"],
  ["type-f409ad2953b1.js", "learning-model-piano-chord-chart"],
  ["type-9302b5a4f072.js", "learning-model-point-slope-line"],
  ["type-fa58981eb0e3.js", "learning-model-atherosclerosis"],
  ["type-d5b1a1a74ceb.js", "learning-model-mass-spectrum"],
  ["type-32a04963cef2.js", "learning-model-gibbs-free-energy"],
  ["type-a2c1e373aef7.js", "learning-model-plant-anatomy"],
  ["type-856560998265.js", "learning-model-electrolyte-conductivity"],
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
    dependencyNames(original, /from "\.\/([^\"]+)\.js"/g),
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
    "learning-model-two-cable-static-equilibrium",
    {
      type: "TWO_CABLE_STATIC_EQUILIBRIUM",
      version: 1,
      thumbnailAssetKey: "two-cable-static-equilibrium-v1",
      parameters: {
        leftAngleDegrees: {
          kind: "number",
          defaultValue: 45,
          min: 10,
          max: 80,
        },
        rightAngleDegrees: {
          kind: "number",
          defaultValue: 45,
          min: 10,
          max: 80,
        },
        weightNewtons: { kind: "number", defaultValue: 200, min: 50, max: 500 },
      },
    },
  ],
  [
    "learning-model-specific-heat",
    {
      type: "SPECIFIC_HEAT",
      version: 1,
      thumbnailAssetKey: "specific-heat-v2",
      canonicalFormula: "\\Delta T = \\frac{q}{mc}",
      parameters: {
        material: {
          kind: "enum",
          defaultValue: "water",
          allowedValues: ["copper", "sand", "water"],
        },
        heatKj: { kind: "number", defaultValue: 40, min: 0, max: 60 },
      },
    },
  ],
  [
    "learning-model-buffer-composition",
    {
      type: "BUFFER_COMPOSITION",
      version: 2,
      thumbnailAssetKey: "buffer-composition-v1",
      canonicalFormula:
        "\\mathrm{pH}=\\mathrm{p}K_a+\\log_{10}\\!\\left(\\frac{[A^-]}{[HA]}\\right)",
      parameters: {
        pKa: { kind: "number", defaultValue: 4.76, min: 2, max: 12 },
        baseToAcidRatio: {
          kind: "number",
          defaultValue: 1,
          min: 0.01,
          max: 100,
        },
      },
    },
  ],
  [
    "learning-model-piano-chord-chart",
    {
      type: "PIANO_CHORD_CHART",
      version: 2,
      thumbnailAssetKey: "piano-chord-chart-v2",
      parameters: {
        root_note: {
          kind: "enum",
          defaultValue: "C",
          allowedValues: [
            "C",
            "Db",
            "D",
            "Eb",
            "E",
            "F",
            "F#",
            "G",
            "Ab",
            "A",
            "Bb",
            "B",
          ],
        },
        quality: {
          kind: "enum",
          defaultValue: "major",
          allowedValues: ["major", "minor"],
        },
      },
    },
  ],
  [
    "learning-model-point-slope-line",
    {
      type: "POINT_SLOPE_LINE",
      version: 1,
      thumbnailAssetKey: "point-slope-line-v1",
      canonicalFormula: "y - y_1 = m(x - x_1)",
      parameters: {
        x1: { kind: "number", defaultValue: -3, min: -100, max: 100 },
        y1: { kind: "number", defaultValue: -2, min: -100, max: 100 },
        slope: { kind: "number", defaultValue: 0.75, min: -20, max: 20 },
      },
    },
  ],
  [
    "learning-model-atherosclerosis",
    {
      type: "ATHEROSCLEROSIS",
      version: 2,
      thumbnailAssetKey: "atherosclerosis-v3",
      parameters: {
        initial_stage: {
          kind: "enum",
          defaultValue: "established plaque",
          allowedValues: [
            "healthy artery",
            "fatty streak",
            "established plaque",
            "plaque rupture and thrombus",
          ],
        },
      },
    },
  ],
  [
    "learning-model-mass-spectrum",
    {
      type: "MASS_SPECTRUM",
      version: 2,
      thumbnailAssetKey: "mass-spectrum-v1",
      parameters: {
        example: {
          kind: "enum",
          defaultValue: "fragment-dominant",
          allowedValues: [
            "fragment-dominant",
            "molecular-ion-dominant",
            "chlorine-isotope-pattern",
            "bromine-isotope-pattern",
          ],
        },
      },
    },
  ],
  [
    "learning-model-gibbs-free-energy",
    {
      type: "GIBBS_FREE_ENERGY",
      version: 1,
      thumbnailAssetKey: "gibbs-free-energy-v1",
      canonicalFormula: "\\Delta G^\\circ=-RT\\ln K",
      canonicalFormulaAliases: ["\\Delta_{\\mathrm r}G^\\circ=-RT\\ln K"],
      parameters: {
        deltaGKilojoulesPerMole: {
          kind: "number",
          defaultValue: -20,
          min: -50,
          max: 50,
        },
      },
    },
  ],
  [
    "learning-model-plant-anatomy",
    {
      type: "PLANT_ANATOMY",
      version: 2,
      thumbnailAssetKey: "plant-anatomy-v3",
      parameters: {
        initial_organ: {
          kind: "enum",
          defaultValue: "root",
          allowedValues: ["root", "stem", "leaf"],
        },
        initial_transport_tissue: {
          kind: "enum",
          defaultValue: "xylem",
          allowedValues: ["xylem", "phloem"],
        },
      },
    },
  ],
  [
    "learning-model-electrolyte-conductivity",
    {
      type: "ELECTROLYTE_CONDUCTIVITY",
      version: 2,
      thumbnailAssetKey: "electrolyte-conductivity-v2",
      parameters: {
        initial_solution: {
          kind: "enum",
          defaultValue: "potassium-chloride",
          allowedValues: ["potassium-chloride", "acetic-acid", "ethanol"],
        },
        initial_concentration: {
          kind: "number",
          defaultValue: 0.6,
          min: 0.1,
          max: 1,
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
