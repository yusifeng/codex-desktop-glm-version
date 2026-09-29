import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = path.join(root, "src/webview/assets");
const modules = [
  ["type-b2f3bbb776a0.js", "learning-model-ghk-membrane-potential", ["n", "t"]],
  ["type-ff74ecd72106.js", "learning-model-oxygen-sag-curve", ["n", "t"]],
  ["type-5b3d00b051e8.js", "learning-model-photosynthesis", ["n", "t"]],
  ["type-5e07bdb97091.js", "learning-model-momentum", ["n", "t"]],
  [
    "type-ea91da6d3b05.js",
    "learning-model-element-vs-compound-vs-mixture",
    ["n", "t"],
  ],
  ["type-1a3e6eca2001.js", "learning-model-compound-interest", ["n", "t"]],
  [
    "type-85ee1f375ae5.js",
    "learning-model-chi-square-goodness-of-fit",
    ["n", "t"],
  ],
  ["type-a2f2d61e4f86.js", "learning-model-derivative-as-secant", ["n", "t"]],
  [
    "x-like-435c693d8722.js",
    "x-like-identifier-normalization",
    ["i", "n", "r", "t"],
  ],
  [
    "type-9c26345ce2cb.js",
    "learning-model-period-frequency-relation",
    ["n", "t"],
  ],
];
const expected = new Map([
  [
    "learning-model-ghk-membrane-potential",
    {
      type: "GHK_MEMBRANE_POTENTIAL",
      version: 1,
      thumbnailAssetKey: "ghk-membrane-potential-v1",
      canonicalFormula:
        "P_{\\mathrm{ion}}\\uparrow \\Rightarrow V_m \\to E_{\\mathrm{ion}}",
      parameters: {
        sodiumToPotassiumPermeabilityRatio: {
          kind: "number",
          defaultValue: 0.04,
          min: 0,
          max: 1,
        },
        chlorideToPotassiumPermeabilityRatio: {
          kind: "number",
          defaultValue: 0.45,
          min: 0,
          max: 1,
        },
      },
    },
  ],
  [
    "learning-model-oxygen-sag-curve",
    {
      type: "OXYGEN_SAG_CURVE",
      version: 2,
      thumbnailAssetKey: "oxygen-sag-curve-v1",
      parameters: {
        initial_ultimate_bod_mg_l: {
          kind: "number",
          defaultValue: 9,
          min: 4,
          max: 14,
        },
        initial_oxygen_deficit_mg_l: {
          kind: "number",
          defaultValue: 0.25,
          min: 0,
          max: 0.5,
        },
        deoxygenation_rate_per_day: {
          kind: "number",
          defaultValue: 0.25,
          min: 0.15,
          max: 0.35,
        },
        reaeration_rate_per_day: {
          kind: "number",
          defaultValue: 0.75,
          min: 0.35,
          max: 1.15,
        },
      },
    },
  ],
  [
    "learning-model-photosynthesis",
    {
      type: "PHOTOSYNTHESIS",
      version: 2,
      thumbnailAssetKey: "photosynthesis-v3",
      parameters: {
        lightIntensity: {
          kind: "enum",
          defaultValue: "low",
          allowedValues: ["low", "medium", "high"],
        },
        carbonDioxide: {
          kind: "enum",
          defaultValue: "low",
          allowedValues: ["low", "medium", "high"],
        },
        water: {
          kind: "enum",
          defaultValue: "low",
          allowedValues: ["low", "medium", "high"],
        },
      },
    },
  ],
  [
    "learning-model-momentum",
    {
      type: "MOMENTUM",
      version: 1,
      thumbnailAssetKey: "momentum-v1",
      canonicalFormula: "p = mv",
      canonicalFormulaAliases: ["v = p/m", "p=vm", "mv=p", "vm=p", "m=p/v"],
      parameters: {
        m1: { kind: "number", defaultValue: 4, min: 0.01, max: 10000 },
        m2: { kind: "number", defaultValue: 4, min: 0.01, max: 10000 },
        v: { kind: "number", defaultValue: 6, min: 0, max: 10000 },
      },
    },
  ],
  [
    "learning-model-element-vs-compound-vs-mixture",
    {
      type: "ELEMENT_VS_COMPOUND_VS_MIXTURE",
      version: 2,
      thumbnailAssetKey: "element-vs-compound-vs-mixture-v1",
      parameters: {
        initial_sample: {
          kind: "enum",
          defaultValue: "monatomic element",
          allowedValues: [
            "monatomic element",
            "diatomic element",
            "molecular compound",
            "mixture of elements",
            "mixture of element and compound",
            "mixture of compounds",
          ],
        },
      },
    },
  ],
  [
    "learning-model-compound-interest",
    {
      type: "COMPOUND_INTEREST",
      version: 5,
      thumbnailAssetKey: "compound-interest-v1",
      parameters: {
        mode: {
          kind: "enum",
          defaultValue: "lump_sum",
          allowedValues: ["lump_sum", "annuity_fv", "annuity_pv", "continuous"],
        },
        amount: {
          kind: "number",
          defaultValue: 1000,
          min: 0.01,
          max: 1000000000,
        },
        ratePercent: { kind: "number", defaultValue: 5, min: 0, max: 100 },
        periods: { kind: "number", defaultValue: 20, min: 0, max: 1000 },
      },
    },
  ],
  [
    "learning-model-chi-square-goodness-of-fit",
    {
      type: "CHI_SQUARE_GOODNESS_OF_FIT",
      version: 1,
      thumbnailAssetKey: "chi-square-goodness-of-fit-v1",
      canonicalFormula: "\\chi^2 = \\sum \\frac{(O_i-E_i)^2}{E_i}",
      parameters: {
        observedA: { kind: "integer", defaultValue: 18, min: 5, max: 60 },
        observedB: { kind: "integer", defaultValue: 22, min: 5, max: 60 },
        observedC: { kind: "integer", defaultValue: 27, min: 5, max: 60 },
        observedD: { kind: "integer", defaultValue: 33, min: 5, max: 60 },
      },
    },
  ],
  [
    "learning-model-derivative-as-secant",
    {
      type: "DERIVATIVE_AS_SECANT",
      version: 1,
      thumbnailAssetKey: "derivative-as-secant-v1",
      canonicalFormula: "f'(a)=\\lim_{h\\to0^+}\\frac{f(a+h)-f(a)}{h}",
      parameters: {
        functionExpression: {
          kind: "enum",
          defaultValue: "x^2",
          allowedValues: ["x^2", "x^3", "x^3-x", "sin(x)", "cos(x)", "e^x"],
        },
        xValue: { kind: "number", defaultValue: 1, min: -10, max: 10 },
        h: { kind: "number", defaultValue: 2, min: 0.05, max: 4 },
      },
    },
  ],
  [
    "learning-model-period-frequency-relation",
    {
      type: "PERIOD_FREQUENCY_RELATION",
      version: 1,
      thumbnailAssetKey: "period-frequency-relation-v1",
      canonicalFormula: "f = \\frac{1}{T}",
      canonicalFormulaAliases: [
        "T = \\frac{1}{f}",
        "T = 1 / f",
        "1/t=f",
        "1/f=t",
        "t=2pi/omega",
        "2pi/omega=t",
        "tau=60/nz",
        "60/nz=tau",
      ],
      parameters: {
        period: { kind: "number", defaultValue: 2, min: 0.01, max: 1000 },
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
const xlike = loaded.get("x-like-identifier-normalization");
xlike.r();
const tokens = [
  { type: "identifier", value: "x_12", start: 1 },
  { type: "identifier", value: "x" },
  { type: "identifier", value: "x_12" },
  { type: "identifier", value: "x_ab" },
  { type: "number", value: "x_3" },
];
assert.deepEqual([...xlike.t(tokens)], ["x_12", "x"]);
const none = [{ type: "identifier", value: "y" }];
assert.equal(xlike.i(none), none);
const alreadyX = [{ type: "identifier", value: "x" }];
assert.equal(xlike.i(alreadyX), alreadyX);
const single = [
  { type: "identifier", value: "x_7", start: 4 },
  { type: "operator", value: "+" },
  { type: "identifier", value: "x_7" },
  { type: "number", value: "x_7" },
];
const normalized = xlike.i(single);
assert.notEqual(normalized, single);
assert.deepEqual(normalized, [
  { type: "identifier", value: "x", start: 4 },
  { type: "operator", value: "+" },
  { type: "identifier", value: "x" },
  { type: "number", value: "x_7" },
]);
assert.equal(single[0].value, "x_7");
const multiple = [
  { type: "identifier", value: "x_1" },
  { type: "identifier", value: "x_2" },
];
assert.equal(xlike.i(multiple), multiple);
assert.equal(xlike.n([{ type: "identifier", value: "i" }]), true);
assert.equal(xlike.n([{ type: "number", value: "i" }]), false);
runtimeAssertions += 9;
console.log(
  `${sourceAssertions} source assertions and ${runtimeAssertions} runtime assertions passed`,
);
