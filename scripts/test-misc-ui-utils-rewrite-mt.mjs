import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = path.join(root, "src/webview/assets");
const modules = [
  ["type-568af520e20e.js", "learning-model-weight-force", ["n", "t"]],
  ["type-8a9437331f93.js", "learning-model-lung-gas-gradient", ["n", "t"]],
  [
    "type-a9d2bd86b24e.js",
    "learning-model-capillary-starling-forces",
    ["n", "t"],
  ],
  [
    "template-dc2706837280.js",
    "learning-model-surface-area-sphere-template",
    ["a", "i", "n", "r", "t"],
  ],
  [
    "template-97cafe2997c3.js",
    "learning-model-circle-area-template",
    ["a", "i", "n", "r", "t"],
  ],
  [
    "type-dd4d43aba596.js",
    "learning-model-mass-density-volume-relation",
    ["n", "t"],
  ],
  ["type-dc0d0206de54.js", "learning-model-mirror-equation", ["n", "t"]],
  ["type-cb89af0c10e5.js", "learning-model-standard-score-z", ["n", "t"]],
  ["type-facf186bb1fa.js", "learning-model-concentration-cell", ["n", "t"]],
  ["type-08ab5fc42dc6.js", "learning-model-function-composition", ["n", "t"]],
];
const expected = new Map([
  [
    "learning-model-weight-force",
    {
      type: "WEIGHT_FORCE",
      version: 1,
      thumbnailAssetKey: "weight-force-v1",
      canonicalFormula: "F_g = mg",
      canonicalFormulaAliases: [
        "F_G = m g",
        "w = mg",
        "F_g = m\\,g",
        "P = m \\cdot g",
        "F_g = m \\cdot g",
        "F_g = m \\times g",
        "m = \\frac{F_g}{g}",
        "g = \\frac{F_g}{m}",
      ],
      parameters: {
        mass: { kind: "number", defaultValue: 8, min: 0.01, max: 10000 },
        gravity: { kind: "number", defaultValue: 9.8, min: 0, max: 10000 },
      },
    },
  ],
  [
    "learning-model-lung-gas-gradient",
    {
      type: "LUNG_GAS_GRADIENT",
      version: 1,
      thumbnailAssetKey: "lung-gas-gradient-v1",
      parameters: {
        alveolarOxygenPartialPressureMmHg: {
          kind: "number",
          defaultValue: 100,
          min: 0,
          max: 300,
        },
        bloodOxygenPartialPressureMmHg: {
          kind: "number",
          defaultValue: 40,
          min: 0,
          max: 300,
        },
        alveolarCarbonDioxidePartialPressureMmHg: {
          kind: "number",
          defaultValue: 40,
          min: 0,
          max: 150,
        },
        bloodCarbonDioxidePartialPressureMmHg: {
          kind: "number",
          defaultValue: 45,
          min: 0,
          max: 150,
        },
      },
    },
  ],
  [
    "learning-model-capillary-starling-forces",
    {
      type: "CAPILLARY_STARLING_FORCES",
      version: 1,
      thumbnailAssetKey: "capillary-starling-forces-v3",
      canonicalFormula: "J_v=K_f[(P_c-P_i)-\\sigma(\\pi_c-\\pi_i)]",
      parameters: {
        initial_scenario: {
          kind: "enum",
          defaultValue: "typical-systemic-capillary",
          allowedValues: [
            "typical-systemic-capillary",
            "raised-capillary-hydrostatic-pressure",
            "reduced-plasma-oncotic-pressure",
            "raised-interstitial-oncotic-pressure",
            "raised-interstitial-hydrostatic-pressure",
          ],
        },
      },
    },
  ],
  [
    "learning-model-mass-density-volume-relation",
    {
      type: "MASS_DENSITY_VOLUME_RELATION",
      version: 2,
      thumbnailAssetKey: "mass-density-volume-relation-v1",
      canonicalFormula: "\\rho = \\frac{m}{V}",
      canonicalFormulaAliases: [
        "m = \\rho V",
        "rho = m / V",
        "rho=m/v",
        "d=m/v",
        "m=rho v",
        "m=dv",
        "v=m/rho",
        "v=m/d",
        "m/v=rho",
        "m/v=d",
      ],
      parameters: {
        mass: { kind: "number", defaultValue: 12, min: 0.01, max: 10000 },
        volume: { kind: "number", defaultValue: 5, min: 0.01, max: 10000 },
      },
    },
  ],
  [
    "learning-model-mirror-equation",
    {
      type: "MIRROR_EQUATION",
      version: 2,
      thumbnailAssetKey: "mirror-equation-v1",
      canonicalFormula: "\\frac{1}{f} = \\frac{1}{u} + \\frac{1}{v}",
      canonicalFormulaAliases: [
        "\\frac{1}{f} = \\frac{1}{a} + \\frac{1}{b}",
        "1/f=1/v+1/u",
        "1/f=1/b+1/a",
        "1/u+1/v=1/f",
        "1/v+1/u=1/f",
        "1/a+1/b=1/f",
        "1/b+1/a=1/f",
      ],
      parameters: {
        objectDistance: {
          kind: "number",
          defaultValue: 28,
          min: 0.01,
          max: 10000,
        },
        focalLength: {
          kind: "number",
          defaultValue: 14,
          min: -10000,
          max: 10000,
        },
      },
    },
  ],
  [
    "learning-model-standard-score-z",
    {
      type: "STANDARD_SCORE_Z",
      version: 2,
      thumbnailAssetKey: "standard-score-z-v1",
      canonicalFormula: "z = \\frac{x - \\mu}{\\sigma}",
      canonicalFormulaAliases: [
        "z = \\frac{x - \\bar{x}}{s}",
        "z = \\frac{\\bar{x} - \\mu_0}{\\sigma / \\sqrt{n}}",
        "z = \\frac{\\bar{x} - \\mu0}{\\sigma / \\sqrt{n}}",
      ],
      parameters: {
        x: { kind: "number", defaultValue: 1.2, min: -10000, max: 10000 },
        mu: { kind: "number", defaultValue: 0, min: -10000, max: 10000 },
        sigma: { kind: "number", defaultValue: 1, min: 0.01, max: 10000 },
      },
    },
  ],
  [
    "learning-model-concentration-cell",
    {
      type: "CONCENTRATION_CELL",
      version: 2,
      thumbnailAssetKey: "concentration-cell-v1",
      canonicalFormula:
        "E_{\\mathrm{cell}}=\\frac{0.0592\\,\\mathrm{V}}{z}\\log_{10}\\!\\left(\\frac{c_{\\mathrm{high}}}{c_{\\mathrm{low}}}\\right)",
      parameters: {
        initial_dilute_concentration_molar: {
          kind: "number",
          defaultValue: 0.001,
          min: 0.0001,
          max: 0.001,
        },
        initial_concentrated_concentration_molar: {
          kind: "number",
          defaultValue: 0.1,
          min: 0.001,
          max: 0.1,
        },
        ion_charge: { kind: "integer", defaultValue: 2, min: 1, max: 3 },
      },
    },
  ],
  [
    "learning-model-function-composition",
    {
      type: "FUNCTION_COMPOSITION",
      version: 1,
      thumbnailAssetKey: "function-composition-v1",
      parameters: {
        input_value: { kind: "number", defaultValue: 2, min: -10, max: 10 },
        g_operation: {
          kind: "enum",
          defaultValue: "add 2",
          allowedValues: ["add 2", "multiply by 3", "square", "negate"],
        },
        f_operation: {
          kind: "enum",
          defaultValue: "multiply by 3",
          allowedValues: ["add 2", "multiply by 3", "square", "negate"],
        },
        composition_order: {
          kind: "enum",
          defaultValue: "g_then_f",
          allowedValues: ["g_then_f", "f_then_g"],
        },
      },
    },
  ],
]);
const templates = new Map([
  [
    "learning-model-surface-area-sphere-template",
    {
      specification: {
        type: "SURFACE_AREA_SPHERE",
        version: 2,
        thumbnailAssetKey: "surface-area-sphere-v1",
        canonicalFormula: "S = 4\\pi r^2",
        canonicalFormulaAliases: [
          "S = 4\\pi r^2;",
          "a=4pir^2",
          "4pir^2=a",
          "4pir^2=s",
          "4pir^2",
        ],
        parameters: {
          radius: { kind: "number", defaultValue: 3, min: 0.01, max: 10000 },
        },
      },
      controlExport: "t",
      templateExport: "n",
    },
  ],
  [
    "learning-model-circle-area-template",
    {
      specification: {
        type: "CIRCLE_AREA",
        version: 2,
        thumbnailAssetKey: "circle-area-v1",
        canonicalFormula: "A = \\pi r^2",
        canonicalFormulaAliases: [
          "A = \\frac{\\pi d^2}{4}",
          "\\pi r^2",
          "\\frac{\\pi d^2}{4}",
          "pir^2=a",
          "pid^2/4=a",
        ],
        parameters: {
          radius: { kind: "number", defaultValue: 3, min: 0.01, max: 10000 },
        },
      },
      controlExport: "n",
      templateExport: "t",
    },
  ],
]);
const radiusControl = {
  label: "r",
  min: 0.5,
  max: 10,
  step: 0.1,
  defaultValue: 3,
  thumbnailDefaultValue: 10,
};
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
  assert.ok(recovered.includes(`Release chunk: ${asset}`));
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

const loaded = new Map();
let runtimeAssertions = 0;
for (const [_asset, directory, exports] of modules) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  assert.deepEqual(Object.keys(module).sort(), [...exports].sort());
  runtimeAssertions += 1;
}
for (const [directory, specification] of expected) {
  const module = loaded.get(directory);
  module.t();
  const first = module.n;
  assert.deepEqual(first, specification, `${directory} specification`);
  module.t();
  assert.equal(module.n, first);
  runtimeAssertions += 2;
}
for (const [directory, definition] of templates) {
  const module = loaded.get(directory);
  module.i();
  const firstSpecification = module.a;
  assert.deepEqual(module.a, definition.specification);
  module.i();
  assert.equal(module.a, firstSpecification);

  module.r();
  const control = module[definition.controlExport];
  const template = module[definition.templateExport];
  assert.deepEqual(control, radiusControl);
  assert.deepEqual(template, { properties: { radius: radiusControl } });
  assert.equal(template.properties.radius, control);
  module.r();
  assert.equal(module[definition.controlExport], control);
  assert.equal(module[definition.templateExport], template);
  runtimeAssertions += 7;
}

console.log(
  `${sourceAssertions} source assertions and ${runtimeAssertions} runtime assertions passed`,
);
