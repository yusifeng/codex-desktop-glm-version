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
    "type-bbf18f237f67.js",
    "learning-model-eigendirections",
    ["rolldown-runtime"],
  ],
  [
    "type-d4e64b7c7369.js",
    "learning-model-pascals-law-hydraulics",
    ["rolldown-runtime"],
  ],
  ["type-d8fc0e5b690c.js", "learning-model-unit-circle", ["rolldown-runtime"]],
  [
    "resistor-comparison-cc070edadd95.js",
    "resistor-comparison",
    ["rolldown-runtime"],
  ],
  [
    "u18-banner-logging-126c6aef16d2.js",
    "u18-banner-logging",
    ["rolldown-runtime", "app-initial", "settings-parental-presentation"],
  ],
  [
    "type-9f5bb286483b.js",
    "learning-model-hemoglobin-curve",
    ["rolldown-runtime"],
  ],
  [
    "type-b1c6d85108ef.js",
    "learning-model-newton-second-law",
    ["rolldown-runtime"],
  ],
  [
    "type-389cfab21292.js",
    "learning-model-photoelectric-energy-balance",
    ["rolldown-runtime"],
  ],
  [
    "type-99cca3d49ce0.js",
    "learning-model-abo-rh-transfusion-compatibility",
    ["rolldown-runtime"],
  ],
  [
    "type-df7152d06cac.js",
    "learning-model-pharmacokinetic-curve",
    ["rolldown-runtime"],
  ],
];
const sourceDependencyAliases = new Map([
  ["rolldown-runtime-2d059c5e81f4", "rolldown-runtime"],
  ["app-initial-51da50e6c6e3", "app-initial"],
  ["presentation-eeb7ac6fced2", "settings-parental-presentation"],
]);
const sourceDependencies = (source) =>
  [...source.matchAll(/from "\.\/([^\"]+)\.js"/g)].map(
    (match) => sourceDependencyAliases.get(match[1]) ?? match[1],
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
                    "export const Cpn=Symbol.for('u18.analytics');export const ypn=()=>globalThis.__mpInitializers.push('app-initial');",
                  loader: "js",
                };
              }
              if (modulePath === "@rchunk/settings-parental-presentation") {
                return {
                  contents:
                    "export const f=()=>globalThis.__mpInitializers.push('parental-presentation');export const p=(scope)=>scope.eligible;",
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

globalThis.__mpInitializers = [];
const loaded = new Map();
let runtimeAssertions = 0;
for (const [_asset, directory] of modules) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  runtimeAssertions += 1;
  if (directory === "resistor-comparison")
    assert.deepEqual(Object.keys(module).sort(), ["i", "n", "r", "t"]);
  else assert.deepEqual(Object.keys(module).sort(), ["n", "t"]);
}

const resistor = loaded.get("resistor-comparison");
assert.equal(resistor.n, undefined);
assert.equal(resistor.r, undefined);
assert.equal(resistor.t, undefined);
resistor.i();
assert.deepEqual(
  resistor.r(
    [-10, 5, 30],
    [
      { min: 0, max: 20 },
      { min: 2, max: 10 },
    ],
  ),
  [0, 0.25, 1],
);
assert.deepEqual(resistor.r([2, 8], [{ min: 5, max: 5 }]), [0, 0]);
assert.equal(resistor.t(-4, 2), 0);
assert.deepEqual(resistor.n([0, 2, 6], 2), [0, 0.5, 0.75]);
const resistorIdentities = [resistor.n, resistor.r, resistor.t];
resistor.i();
assert.deepEqual([resistor.n, resistor.r, resistor.t], resistorIdentities);
runtimeAssertions += 8;

const u18 = loaded.get("u18-banner-logging");
const events = [];
const scope = {
  eligible: false,
  get() {
    return {
      logU18ModelPolicyBannerEvent: (event, payload) =>
        events.push({ event, payload }),
    };
  },
};
u18.n(scope, { userId: "user-18" });
assert.equal(events.length, 0);
scope.eligible = true;
const originalDateNow = Date.now;
Date.now = () => 1_700_000_000_000;
u18.n(scope, { userId: "user-18" });
u18.n(scope, { userId: "user-18" }, "learn_more");
Date.now = originalDateNow;
assert.deepEqual(events, [
  {
    event: "U18 Model Policy Banner Shown",
    payload: {
      origin: "chat",
      user_id: "user-18",
      timestamp_ms: 1_700_000_000_000,
      timestamp_iso: "2023-11-14T22:13:20.000Z",
    },
  },
  {
    event: "U18 Model Policy Banner Clicked",
    payload: {
      origin: "chat",
      user_id: "user-18",
      timestamp_ms: 1_700_000_000_000,
      timestamp_iso: "2023-11-14T22:13:20.000Z",
      cta: "learn_more",
    },
  },
]);
u18.t();
assert.deepEqual(globalThis.__mpInitializers, [
  "app-initial",
  "parental-presentation",
]);
runtimeAssertions += 3;

const expectedSpecifications = new Map([
  [
    "learning-model-eigendirections",
    {
      type: "EIGENDIRECTIONS",
      version: 1,
      thumbnailAssetKey: "eigendirections-v1",
      canonicalFormula: "A\\mathbf{v}=\\lambda\\mathbf{v}",
      parameters: {
        a11: { kind: "number", defaultValue: 2, min: -2, max: 2 },
        a12: { kind: "number", defaultValue: 1, min: -2, max: 2 },
        a21: { kind: "number", defaultValue: 1, min: -2, max: 2 },
        a22: { kind: "number", defaultValue: 2, min: -2, max: 2 },
      },
    },
  ],
  [
    "learning-model-pascals-law-hydraulics",
    {
      type: "PASCALS_LAW_HYDRAULICS",
      version: 1,
      thumbnailAssetKey: "pascals-law-hydraulics-v2",
      canonicalFormula: "p = \\frac{F}{A}",
      parameters: {
        inputForceNewtons: {
          kind: "number",
          defaultValue: 100,
          min: 20,
          max: 200,
        },
        inputAreaSquareCentimeters: {
          kind: "number",
          defaultValue: 10,
          min: 5,
          max: 25,
        },
        outputAreaSquareCentimeters: {
          kind: "number",
          defaultValue: 50,
          min: 25,
          max: 100,
        },
      },
    },
  ],
  [
    "learning-model-unit-circle",
    {
      type: "UNIT_CIRCLE",
      version: 2,
      thumbnailAssetKey: "unit-circle-v1",
      canonicalFormula: "x^2 + y^2 = 1",
      canonicalFormulaAliases: [
        "1 = x^2 + y^2",
        "x^2 + y^2 = 1^2",
        "(x-0)^2 + (y+0)^2 = 1",
        "(\\cos\\theta, \\sin\\theta)",
      ],
      parameters: {
        angleDeg: {
          kind: "number",
          defaultValue: 45,
          min: -36_000,
          max: 36_000,
        },
      },
    },
  ],
  [
    "learning-model-hemoglobin-curve",
    {
      type: "HEMOGLOBIN_CURVE",
      version: 1,
      thumbnailAssetKey: "hemoglobin-curve-v1",
      parameters: {
        oxygenPartialPressureMmHg: {
          kind: "number",
          defaultValue: 40,
          min: 0,
          max: 120,
        },
        ph: { kind: "number", defaultValue: 7.4, min: 7.2, max: 7.6 },
        carbonDioxidePartialPressureMmHg: {
          kind: "number",
          defaultValue: 40,
          min: 20,
          max: 60,
        },
        temperatureCelsius: {
          kind: "number",
          defaultValue: 37,
          min: 35,
          max: 39,
        },
      },
    },
  ],
  [
    "learning-model-newton-second-law",
    {
      type: "NEWTON_SECOND_LAW",
      version: 2,
      thumbnailAssetKey: "newton-second-law-v1",
      canonicalFormula: "F_{\\mathrm{net}} = ma",
      canonicalFormulaAliases: ["F=ma", "a=F/m", "m=F/a"],
      parameters: {
        netForceNewtons: { kind: "number", defaultValue: 8, min: 2, max: 12 },
        massKilograms: { kind: "number", defaultValue: 2, min: 1, max: 4 },
      },
    },
  ],
  [
    "learning-model-photoelectric-energy-balance",
    {
      type: "PHOTOELECTRIC_ENERGY_BALANCE",
      version: 1,
      thumbnailAssetKey: "photoelectric-energy-balance-v1",
      canonicalFormula: "hf = \\phi + K_{\\max}",
      parameters: {
        frequencyTimes10To14Hertz: {
          kind: "number",
          defaultValue: 8,
          min: 3,
          max: 15,
        },
        intensityPercent: {
          kind: "number",
          defaultValue: 50,
          min: 10,
          max: 100,
        },
        workFunctionElectronVolts: {
          kind: "number",
          defaultValue: 2.3,
          min: 1.5,
          max: 6,
        },
      },
    },
  ],
  [
    "learning-model-abo-rh-transfusion-compatibility",
    {
      type: "ABO_RH_TRANSFUSION_COMPATIBILITY",
      version: 1,
      thumbnailAssetKey: "abo-rh-transfusion-compatibility-v1",
      parameters: {
        donorType: {
          kind: "enum",
          defaultValue: "A+",
          allowedValues: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
        },
        recipientType: {
          kind: "enum",
          defaultValue: "B-",
          allowedValues: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
        },
      },
    },
  ],
  [
    "learning-model-pharmacokinetic-curve",
    {
      type: "PHARMACOKINETIC_CURVE",
      version: 2,
      thumbnailAssetKey: "pharmacokinetic-curve-v1",
      parameters: {
        dose_mg: { kind: "number", defaultValue: 240, min: 80, max: 400 },
        elimination_half_life_hours: {
          kind: "number",
          defaultValue: 6,
          min: 2,
          max: 10,
        },
        minimum_effective_concentration: {
          kind: "number",
          defaultValue: 1.5,
          min: 0.8,
          max: 2.5,
        },
        minimum_toxic_concentration: {
          kind: "number",
          defaultValue: 5.5,
          min: 4,
          max: 8,
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

delete globalThis.__mpInitializers;
console.log(
  sourceAssertions +
    " source assertions and " +
    runtimeAssertions +
    " runtime assertions passed",
);
