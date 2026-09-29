import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = path.join(root, "src/webview/assets");
const modules = [
  ["type-96ed8dbb8a85.js", "learning-model-point-to-plane-distance"],
  ["type-d05467b5cc3d.js", "learning-model-balancing-equations"],
  ["type-e52ae9a5f679.js", "learning-model-mediation-indirect-effect"],
  ["type-dbcd7d4a7976.js", "learning-model-successive-percent-change"],
  ["type-3b03c35824de.js", "learning-model-centripetal-force-mvr"],
  ["type-32562c107c2d.js", "learning-model-tangent-segments-common-point"],
  ["type-86695f24afe6.js", "learning-model-add-fractions"],
  ["type-c3de85d12da6.js", "learning-model-accuracy-vs-precision-targets"],
  ["type-67623f2e9dfc.js", "learning-model-reaction-thermodynamics"],
  ["type-f80006839631.js", "learning-model-inflation-cpi"],
];
const expected = new Map([
  [
    "learning-model-point-to-plane-distance",
    {
      type: "POINT_TO_PLANE_DISTANCE",
      version: 2,
      thumbnailAssetKey: "point-to-plane-distance-v1",
      canonicalFormula: "d = PH",
      parameters: {
        pointX: { kind: "number", defaultValue: 1.5, min: -3, max: 3 },
        pointY: { kind: "number", defaultValue: 4, min: 2, max: 5.5 },
        planeAngleDegrees: {
          kind: "number",
          defaultValue: -10,
          min: -25,
          max: 25,
        },
      },
    },
  ],
  [
    "learning-model-balancing-equations",
    {
      type: "BALANCING_EQUATIONS",
      version: 2,
      thumbnailAssetKey: "balancing-equations-v2",
      parameters: {
        reaction_example: {
          kind: "enum",
          defaultValue: "hydrogen-and-oxygen-to-water",
          allowedValues: [
            "hydrogen-and-oxygen-to-water",
            "nitrogen-and-hydrogen-to-ammonia",
            "methane-combustion",
          ],
        },
      },
    },
  ],
  [
    "learning-model-mediation-indirect-effect",
    {
      type: "MEDIATION_INDIRECT_EFFECT",
      version: 1,
      thumbnailAssetKey: "mediation-indirect-effect-v1",
      canonicalFormula: "c = c^{\\prime} + a \\times b",
      parameters: {
        a: { kind: "number", defaultValue: 0.6, min: -1, max: 1 },
        b: { kind: "number", defaultValue: 0.5, min: -1, max: 1 },
        directEffect: { kind: "number", defaultValue: 0.2, min: -1, max: 1 },
      },
    },
  ],
  [
    "learning-model-successive-percent-change",
    {
      type: "SUCCESSIVE_PERCENT_CHANGE",
      version: 1,
      thumbnailAssetKey: "successive-percent-change-v1",
      canonicalFormula:
        "100\\left(1+\\frac{p_1}{100}\\right)\\left(1+\\frac{p_2}{100}\\right)",
      parameters: {
        firstChangePercent: {
          kind: "number",
          defaultValue: 50,
          min: -95,
          max: 100,
        },
        secondChangePercent: {
          kind: "number",
          defaultValue: -50,
          min: -100,
          max: 100,
        },
      },
    },
  ],
  [
    "learning-model-centripetal-force-mvr",
    {
      type: "CENTRIPETAL_FORCE_MVR",
      version: 2,
      thumbnailAssetKey: "centripetal-force-mvr-v1",
      canonicalFormula: "F_c = \\frac{mv^2}{r}",
      parameters: {
        massKilograms: { kind: "number", defaultValue: 2, min: 0.5, max: 5 },
        speedMetersPerSecond: {
          kind: "number",
          defaultValue: 4,
          min: 0,
          max: 8,
        },
        radiusMeters: { kind: "number", defaultValue: 2, min: 1, max: 5 },
      },
    },
  ],
  [
    "learning-model-tangent-segments-common-point",
    {
      type: "TANGENT_SEGMENTS_COMMON_POINT",
      version: 1,
      thumbnailAssetKey: "tangent-segments-common-point-v1",
      canonicalFormula: "PA = PB",
      parameters: {
        radius: { kind: "number", defaultValue: 3.5, min: 2.5, max: 4.5 },
        pointDistance: {
          kind: "number",
          defaultValue: 7.2,
          min: 5.8,
          max: 7.2,
        },
        pointAngleDeg: {
          kind: "number",
          defaultValue: 180,
          min: 145,
          max: 215,
        },
      },
    },
  ],
  [
    "learning-model-add-fractions",
    {
      type: "ADD_FRACTIONS",
      version: 2,
      thumbnailAssetKey: "add-fractions-v1",
      parameters: {
        firstNumerator: { kind: "integer", defaultValue: 1, min: 1, max: 4 },
        firstDenominator: { kind: "integer", defaultValue: 3, min: 2, max: 6 },
        secondNumerator: { kind: "integer", defaultValue: 3, min: 1, max: 4 },
        secondDenominator: { kind: "integer", defaultValue: 6, min: 2, max: 6 },
      },
    },
  ],
  [
    "learning-model-accuracy-vs-precision-targets",
    {
      type: "ACCURACY_VS_PRECISION_TARGETS",
      version: 1,
      thumbnailAssetKey: "accuracy-vs-precision-targets-v1",
      parameters: {
        meanPosition: {
          kind: "enum",
          defaultValue: "centered",
          allowedValues: ["centered", "offset"],
        },
        measurementSpread: {
          kind: "enum",
          defaultValue: "small",
          allowedValues: ["small", "large"],
        },
      },
    },
  ],
  [
    "learning-model-reaction-thermodynamics",
    {
      type: "REACTION_THERMODYNAMICS",
      version: 1,
      thumbnailAssetKey: "reaction-thermodynamics-v1",
      canonicalFormula:
        "\\Delta H = H_{\\mathrm{products}} - H_{\\mathrm{reactants}}",
      parameters: {
        activationEnergyKilojoulesPerMole: {
          kind: "number",
          defaultValue: 90,
          min: 50,
          max: 150,
        },
        enthalpyChangeKilojoulesPerMole: {
          kind: "number",
          defaultValue: -30,
          min: -60,
          max: 40,
        },
      },
    },
  ],
  [
    "learning-model-inflation-cpi",
    {
      type: "INFLATION_CPI",
      version: 2,
      thumbnailAssetKey: "inflation-cpi-v3",
      parameters: {
        earlier_cpi: { kind: "number", defaultValue: 120, min: 50, max: 300 },
        later_cpi: { kind: "number", defaultValue: 126, min: 50, max: 300 },
        comparison_interval: {
          kind: "enum",
          defaultValue: "twelve_months",
          allowedValues: ["one_month", "twelve_months"],
        },
      },
    },
  ],
]);
const deps = (source, pattern) =>
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
    deps(original, /from "\.\/([^"]+)\.js"/gu),
    deps(recovered, /(?:from\s*|import\s*)["']@rchunk\/([^"']+)/gu),
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
