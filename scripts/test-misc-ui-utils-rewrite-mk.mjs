import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = path.join(root, "src/webview/assets");
const modules = [
  ["type-fff8bf6df8e9.js", "learning-model-simple-pendulum"],
  ["type-6f5ca4a9b344.js", "learning-model-free-fall"],
  ["type-1aff40f97e6c.js", "learning-model-gpp-vs-npp"],
  ["type-3ebb2891016a.js", "learning-model-inclined-plane-acceleration"],
  ["type-ba89e7f5dcc4.js", "learning-model-eye-prescription"],
  ["type-5afefdccef0f.js", "learning-model-ph-from-concentration"],
  ["type-bd9c85267933.js", "learning-model-mole-avogadro-number-visual"],
  ["type-b94332d030e5.js", "learning-model-cardiac-output-product"],
  ["type-e4a418c02712.js", "learning-model-electric-current-charge-flow"],
  ["type-b7a8fbf7a420.js", "learning-model-loop-break-control-flow"],
];
const expected = new Map([
  [
    "learning-model-simple-pendulum",
    {
      type: "SIMPLE_PENDULUM",
      version: 1,
      thumbnailAssetKey: "simple-pendulum-v1",
      canonicalFormula: "T \\approx 2\\pi\\sqrt{\\frac{L}{g}}",
      parameters: {
        lengthMeters: { kind: "number", defaultValue: 1.2, min: 0.5, max: 2 },
        startingAngleDegrees: {
          kind: "number",
          defaultValue: 35,
          min: 5,
          max: 60,
        },
      },
    },
  ],
  [
    "learning-model-free-fall",
    {
      type: "FREE_FALL",
      version: 1,
      thumbnailAssetKey: "free-fall-v1",
      canonicalFormula: "h(t) = h_0 + v_0t - \\frac{1}{2}gt^2",
      parameters: {
        initialHeightMeters: {
          kind: "number",
          defaultValue: 14,
          min: 4,
          max: 18,
        },
        initialVelocityMetersPerSecond: {
          kind: "number",
          defaultValue: 0,
          min: -8,
          max: 8,
        },
      },
    },
  ],
  [
    "learning-model-gpp-vs-npp",
    {
      type: "GPP_VS_NPP",
      version: 2,
      thumbnailAssetKey: "gpp-vs-npp-v3",
      canonicalFormula: "\\mathrm{NPP}=\\mathrm{GPP}-R_a",
      parameters: {
        gross_primary_productivity: {
          kind: "number",
          defaultValue: 240,
          min: 100,
          max: 400,
        },
        autotrophic_respiration: {
          kind: "number",
          defaultValue: 80,
          min: 0,
          max: 100,
        },
      },
    },
  ],
  [
    "learning-model-inclined-plane-acceleration",
    {
      type: "INCLINED_PLANE_ACCELERATION",
      version: 1,
      thumbnailAssetKey: "inclined-plane-acceleration-v1",
      canonicalFormula: "a = g \\sin \\theta",
      parameters: {
        planeAngleDegrees: {
          kind: "number",
          defaultValue: 30,
          min: 15,
          max: 45,
        },
        boxMassKilograms: { kind: "number", defaultValue: 4, min: 2, max: 6 },
      },
    },
  ],
  [
    "learning-model-eye-prescription",
    {
      type: "EYE_PRESCRIPTION",
      version: 1,
      thumbnailAssetKey: "eye-prescription-v1",
      parameters: {
        sphereDiopters: {
          kind: "number",
          defaultValue: 2.5,
          min: -10,
          max: 10,
        },
        cylinderDiopters: {
          kind: "number",
          defaultValue: -0.5,
          min: -6,
          max: 6,
        },
        axisDegrees: { kind: "number", defaultValue: 135, min: 0, max: 180 },
      },
    },
  ],
  [
    "learning-model-ph-from-concentration",
    {
      type: "PH_FROM_CONCENTRATION",
      version: 2,
      thumbnailAssetKey: "ph-from-concentration-v1",
      canonicalFormula: "\\mathrm{pH}=-\\log_{10}([\\mathrm{H_3O^+}])",
      parameters: {
        hydronium_concentration_molar: {
          kind: "number",
          defaultValue: 1e-7,
          min: 1e-12,
          max: 0.01,
        },
      },
    },
  ],
  [
    "learning-model-mole-avogadro-number-visual",
    {
      type: "MOLE_AVOGADRO_NUMBER_VISUAL",
      version: 1,
      thumbnailAssetKey: "mole-avogadro-number-visual-v1",
      parameters: {
        substance: {
          kind: "enum",
          defaultValue: "copper",
          allowedValues: ["carbon", "copper", "water"],
        },
        initial_moles: { kind: "number", defaultValue: 1, min: 0.25, max: 5 },
      },
    },
  ],
  [
    "learning-model-cardiac-output-product",
    {
      type: "CARDIAC_OUTPUT_PRODUCT",
      version: 2,
      thumbnailAssetKey: "cardiac-output-product-v3",
      canonicalFormula: "CO = HR \\times SV",
      parameters: {
        heartRateBeatsPerMinute: {
          kind: "number",
          defaultValue: 70,
          min: 40,
          max: 180,
        },
        strokeVolumeMilliliters: {
          kind: "number",
          defaultValue: 70,
          min: 30,
          max: 120,
        },
      },
    },
  ],
  [
    "learning-model-electric-current-charge-flow",
    {
      type: "ELECTRIC_CURRENT_CHARGE_FLOW",
      version: 1,
      thumbnailAssetKey: "electric-current-charge-flow-v2",
      canonicalFormula: "I = \\frac{Q}{t}",
      parameters: {
        packetRatePerSecond: {
          kind: "number",
          defaultValue: 4,
          min: 1,
          max: 8,
        },
        chargePerPacketCoulombs: {
          kind: "number",
          defaultValue: 1,
          min: 0.5,
          max: 3,
        },
      },
    },
  ],
  [
    "learning-model-loop-break-control-flow",
    {
      type: "LOOP_BREAK_CONTROL_FLOW",
      version: 3,
      thumbnailAssetKey: "loop-break-control-flow-v1",
      parameters: {
        loop_kind: {
          kind: "enum",
          defaultValue: "for",
          allowedValues: ["for", "while"],
        },
        loop_limit: { kind: "integer", defaultValue: 5, min: 3, max: 5 },
        break_value: { kind: "integer", defaultValue: 2, min: 1, max: 6 },
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
  assert.equal(module.n, first);
  runtimeAssertions += 3;
}
console.log(
  `${sourceAssertions} source assertions and ${runtimeAssertions} runtime assertions passed`,
);
