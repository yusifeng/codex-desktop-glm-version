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
  [
    "restoration-c01e65520ca7.js",
    "restoration",
    ["rolldown-runtime", "app-initial"],
  ],
  [
    "type-6fdfb08a7fa3.js",
    "learning-model-trig-ratio-tangent",
    ["rolldown-runtime"],
  ],
  [
    "type-d31ca122ade1.js",
    "learning-model-mixing-solutions",
    ["rolldown-runtime"],
  ],
  [
    "type-d8ff967dcf16.js",
    "learning-model-kinematics-velocity",
    ["rolldown-runtime"],
  ],
  [
    "type-7a2e9c974468.js",
    "learning-model-sphere-volume",
    ["rolldown-runtime"],
  ],
  [
    "type-94076f401ee2.js",
    "learning-model-composite-perimeter-area",
    ["rolldown-runtime"],
  ],
  [
    "type-5b4bf103a88b.js",
    "learning-model-kinetic-energy",
    ["rolldown-runtime"],
  ],
  [
    "type-835190510733.js",
    "learning-model-energy-efficiency-sankey-diagram",
    ["rolldown-runtime"],
  ],
  [
    "type-f09422f3bf66.js",
    "learning-model-magnetic-field-direction-on-charge",
    ["rolldown-runtime"],
  ],
  ["type-8e1db5391d62.js", "learning-model-wave-speed", ["rolldown-runtime"]],
];
const sourceAliases = new Map([
  ["rolldown-runtime-2d059c5e81f4", "rolldown-runtime"],
  ["app-initial-51da50e6c6e3", "app-initial"],
]);
const sourceDependencies = (source) =>
  [...source.matchAll(/from "\.\/([^\"]+)\.js"/g)].map(
    (match) => sourceAliases.get(match[1]) ?? match[1],
  );
const recoveredDependencies = (source) =>
  [...source.matchAll(/(?:from\s*|import\s*)["']@rchunk\/([^"']+)/g)].map(
    (match) => match[1],
  );

let sourceAssertions = 0;
for (const [asset, directory, dependencies] of modules) {
  const original = fs.readFileSync(path.join(assetRoot, asset), "utf8");
  const recovered = fs.readFileSync(
    path.join(root, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  assert.deepEqual(
    sourceDependencies(original),
    dependencies,
    directory + " source dependencies",
  );
  assert.deepEqual(
    recoveredDependencies(recovered),
    dependencies,
    directory + " recovered dependencies",
  );
  assert.equal(
    (original.match(/import\(/g) ?? []).length,
    (recovered.match(/import\(/g) ?? []).length,
  );
  assert.equal(/\bany\b|@ts-expect-error/.test(recovered), false);
  assert.ok(recovered.includes("Release chunk: " + asset));
  sourceAssertions += 5;
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
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: modulePath }) => {
              if (modulePath === "@rchunk/app-initial") {
                return {
                  contents:
                    "export const wQt=Symbol.for('host-by-conversation');export const HZt=()=>globalThis.__msInitializers.push('subagents');",
                  loader: "js",
                };
              }
              return { contents: "export {};", loader: "js" };
            },
          );
        },
      },
    ],
  });
  const encoded = Buffer.from(result.outputFiles[0].text).toString("base64");
  return import("data:text/javascript;base64," + encoded + "#" + directory);
}

globalThis.__msInitializers = [];
const loaded = new Map();
let runtimeAssertions = 0;
for (const [_asset, directory] of modules) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  if (directory === "restoration") {
    assert.deepEqual(Object.keys(module), ["restoreSubagentsTabRoute"]);
  } else if (directory === "learning-model-sphere-volume") {
    assert.deepEqual(Object.keys(module).sort(), ["a", "i", "n", "r", "t"]);
  } else {
    assert.deepEqual(Object.keys(module).sort(), ["n", "t"]);
  }
  runtimeAssertions += 1;
}

const restoration = loaded.get("restoration");
assert.deepEqual(globalThis.__msInitializers, ["subagents"]);
let openCount = 0;
const nonLocalResult = await restoration.restoreSubagentsTabRoute(
  {
    revealAndFocus: true,
    descriptor: { tabId: "tab-1" },
    reason: "navigation",
    scope: {
      value: { routeKind: "cloud-thread", conversationId: "parent-1" },
      get: () => "host-1",
    },
  },
  "child-1",
  () => {
    openCount += 1;
    return "tab-1";
  },
);
assert.equal(nonLocalResult, false);
assert.equal(openCount, 0);
let capturedOptions;
const localScope = {
  value: { routeKind: "local-thread", conversationId: "parent-1" },
  get: (_signal, conversationId) => "host-for-" + conversationId,
};
const restored = await restoration.restoreSubagentsTabRoute(
  {
    revealAndFocus: false,
    descriptor: { tabId: "tab-7" },
    insertPosition: "after-active",
    reason: "persistence",
    scope: localScope,
  },
  "child-2",
  (_scope, options) => {
    capturedOptions = options;
    return Promise.resolve("tab-7");
  },
);
assert.equal(restored, true);
assert.deepEqual(capturedOptions, {
  revealAndFocus: false,
  deferHydrationUntilActivation: true,
  hostId: "host-for-parent-1",
  insertPosition: "after-active",
  openOverviewWhenSelectionUnavailable: true,
  parentConversationId: "parent-1",
  selectedConversationId: "child-2",
  tabId: "tab-7",
});
assert.equal(
  await restoration.restoreSubagentsTabRoute(
    { revealAndFocus: true, descriptor: { tabId: "tab-7" }, scope: localScope },
    null,
    () => "different-tab",
  ),
  false,
);
runtimeAssertions += 6;

const sphere = loaded.get("learning-model-sphere-volume");
assert.equal(sphere.i, undefined);
assert.equal(sphere.n, undefined);
assert.equal(sphere.r, undefined);
sphere.t();
assert.deepEqual(sphere.n, {
  type: "SPHERE_VOLUME",
  version: 2,
  thumbnailAssetKey: "sphere-volume-v1",
  canonicalFormula: "V = \\frac{4}{3}\\pi r^3",
  canonicalFormulaAliases: ["4/3pir^3=v", "4/3pir^3"],
  parameters: {
    radius: { kind: "number", defaultValue: 3, min: 0.01, max: 10_000 },
  },
});
assert.equal(sphere.i, undefined);
sphere.a();
assert.deepEqual(sphere.r, {
  label: "r",
  min: 0.5,
  max: 10,
  step: 0.1,
  defaultValue: 3,
  thumbnailDefaultValue: 10,
});
assert.deepEqual(sphere.i, { properties: { radius: sphere.r } });
const sphereIdentities = [sphere.i, sphere.n, sphere.r];
sphere.a();
sphere.t();
assert.deepEqual([sphere.i, sphere.n, sphere.r], sphereIdentities);
runtimeAssertions += 8;

const expectedSpecifications = new Map([
  [
    "learning-model-trig-ratio-tangent",
    {
      type: "TRIG_RATIO_TANGENT",
      version: 2,
      thumbnailAssetKey: "trig-ratio-tangent-v1",
      canonicalFormula:
        "\\tan(\\theta) = \\frac{\\sin(\\theta)}{\\cos(\\theta)}",
      canonicalFormulaAliases: [
        "\\tan x = \\frac{\\sin x}{\\cos x}",
        "\\tan(\\theta)=\\frac{opposite}{adjacent}",
      ],
      parameters: {
        angleDeg: { kind: "number", defaultValue: 35, min: 0.01, max: 89.99 },
        angleLabel: {
          kind: "enum",
          defaultValue: "θ",
          allowedValues: ["θ", "α", "β", "φ", "γ"],
        },
      },
    },
  ],
  [
    "learning-model-mixing-solutions",
    {
      type: "MIXING_SOLUTIONS",
      version: 1,
      thumbnailAssetKey: "mixing-solutions-v1",
      canonicalFormula: "C_{\\mathrm{mix}}=\\frac{C_1V_1+C_2V_2}{V_1+V_2}",
      parameters: {
        solution1VolumeLiters: {
          kind: "number",
          defaultValue: 0.8,
          min: 0.01,
          max: 1_000,
        },
        solution1ConcentrationMolesPerLiter: {
          kind: "number",
          defaultValue: 2,
          min: 0,
          max: 20,
        },
        solution2VolumeLiters: {
          kind: "number",
          defaultValue: 1.2,
          min: 0.01,
          max: 1_000,
        },
        solution2ConcentrationMolesPerLiter: {
          kind: "number",
          defaultValue: 0.5,
          min: 0,
          max: 20,
        },
      },
    },
  ],
  [
    "learning-model-kinematics-velocity",
    {
      type: "KINEMATICS_VELOCITY",
      version: 1,
      thumbnailAssetKey: "kinematics-velocity-v1",
      canonicalFormula: "v_f = v_i + at",
      canonicalFormulaAliases: ["v = u + at", "v = v_0 + at", "u + at = v"],
      parameters: {
        initialVelocityMetersPerSecond: {
          kind: "number",
          defaultValue: 2,
          min: -6,
          max: 10,
        },
        accelerationMetersPerSecondSquared: {
          kind: "number",
          defaultValue: 1,
          min: -2,
          max: 4,
        },
        timeSeconds: { kind: "number", defaultValue: 5, min: 1, max: 9 },
      },
    },
  ],
  [
    "learning-model-composite-perimeter-area",
    {
      type: "COMPOSITE_PERIMETER_AREA",
      version: 1,
      thumbnailAssetKey: "composite-perimeter-area-v2",
      parameters: {
        lowerWidth: { kind: "integer", defaultValue: 6, min: 4, max: 7 },
        lowerHeight: { kind: "integer", defaultValue: 3, min: 2, max: 4 },
        upperWidth: { kind: "integer", defaultValue: 3, min: 2, max: 3 },
        upperHeight: { kind: "integer", defaultValue: 2, min: 1, max: 3 },
        triangleRun: { kind: "integer", defaultValue: 4, min: 1, max: 4 },
        mode: {
          kind: "enum",
          defaultValue: "area",
          allowedValues: ["area", "perimeter"],
        },
      },
    },
  ],
  [
    "learning-model-kinetic-energy",
    {
      type: "KINETIC_ENERGY",
      version: 1,
      thumbnailAssetKey: "kinetic-energy-v1",
      canonicalFormula: "\\mathrm{KE} = \\frac{1}{2}mv^2",
      canonicalFormulaAliases: [
        "KE = \\frac{1}{2}mv^2",
        "K = \\frac{1}{2}mv^2",
        "KE = mv^2/2",
        "K = mv^2/2",
        "\\frac{1}{2}mv^2 = KE",
        "mv^2/2 = KE",
      ],
      parameters: {
        mass: { kind: "number", defaultValue: 5, min: 1, max: 9 },
        velocity: { kind: "number", defaultValue: 0, min: -10, max: 10 },
      },
    },
  ],
  [
    "learning-model-energy-efficiency-sankey-diagram",
    {
      type: "ENERGY_EFFICIENCY_SANKEY_DIAGRAM",
      version: 1,
      thumbnailAssetKey: "energy-efficiency-sankey-diagram-v1",
      canonicalFormula:
        "\\text{Efficiency}=\\frac{\\text{useful output}}{\\text{total input}}",
      parameters: {
        energy_system: {
          kind: "enum",
          defaultValue: "light bulb",
          allowedValues: ["light bulb", "electric motor", "car engine"],
        },
        input_energy_joules: {
          kind: "number",
          defaultValue: 100,
          min: 1,
          max: 10_000,
        },
        initial_efficiency_percent: {
          kind: "number",
          defaultValue: 40,
          min: 0,
          max: 100,
        },
      },
    },
  ],
  [
    "learning-model-magnetic-field-direction-on-charge",
    {
      type: "MAGNETIC_FIELD_DIRECTION_ON_CHARGE",
      version: 1,
      thumbnailAssetKey: "magnetic-field-direction-on-charge-v3",
      canonicalFormula: "\\vec F_B=q\\vec v\\times\\vec B",
      parameters: {
        velocityAngleDegrees: {
          kind: "number",
          defaultValue: 0,
          min: 0,
          max: 360,
        },
        fieldDirection: {
          kind: "enum",
          defaultValue: "into-page",
          allowedValues: ["into-page", "out-of-page"],
        },
        chargeSign: {
          kind: "enum",
          defaultValue: "positive",
          allowedValues: ["positive", "negative"],
        },
      },
    },
  ],
  [
    "learning-model-wave-speed",
    {
      type: "WAVE_SPEED",
      version: 1,
      thumbnailAssetKey: "wave-speed-v1",
      canonicalFormula: "v = f\\lambda",
      canonicalFormulaAliases: [
        "\\nu = \\frac{c}{\\lambda}",
        "v = f lambda",
        "v=flambda",
        "v=lambdaf",
        "flambda=v",
        "lambdaf=v",
        "f=v/lambda",
        "lambda=v/f",
      ],
      parameters: {
        frequency: { kind: "number", defaultValue: 2, min: 0.1, max: 20_000 },
        wavelength: { kind: "number", defaultValue: 3, min: 0.1, max: 10_000 },
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

delete globalThis.__msInitializers;
console.log(
  sourceAssertions +
    " source assertions and " +
    runtimeAssertions +
    " runtime assertions passed",
);
