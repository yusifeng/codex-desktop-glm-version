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
  ["type-2a7d2e0bc5c2.js", "learning-model-lcm", ["n", "t"]],
  ["type-a2fa2066a9f8.js", "learning-model-gcd", ["n", "t"]],
  [
    "type-661332749edd.js",
    "learning-model-catalyst-activation-energy",
    ["n", "t"],
  ],
  [
    "type-d9aefcd7f05e.js",
    "learning-model-singly-linked-list-pointers",
    ["n", "t"],
  ],
  ["usd-5d2c7710cf01.js", "usd-currency-formatter", ["n", "t"]],
  [
    "type-6fafbd960065.js",
    "learning-model-hybridization-sigma-pi-bonds",
    ["n", "t"],
  ],
  [
    "type-ee21e9db5696.js",
    "learning-model-discrete-event-queue-simulation",
    ["n", "t"],
  ],
  [
    "type-37bbc177d1c1.js",
    "learning-model-derivative-product-rule",
    ["n", "t"],
  ],
  [
    "math-d32c9f1b6861.js",
    "math",
    ["a", "c", "d", "f", "i", "l", "n", "o", "p", "r", "s", "t", "u"],
  ],
  [
    "type-8ea75e03943c.js",
    "learning-model-current-to-magnetic-field-direction",
    ["n", "t"],
  ],
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
    `${directory} dependencies`,
  );
  assert.equal(
    (original.match(/import\(/g) ?? []).length,
    (recovered.match(/import\(/g) ?? []).length,
  );
  assert.equal(/\bany\b|@ts-expect-error/.test(recovered), false);
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
const expectedSpecifications = new Map([
  [
    "learning-model-lcm",
    {
      type: "LCM",
      version: 2,
      thumbnailAssetKey: "lcm-v1",
      parameters: {
        first_number: { kind: "integer", defaultValue: 4, min: 1, max: 12 },
        second_number: { kind: "integer", defaultValue: 6, min: 1, max: 12 },
      },
    },
  ],
  [
    "learning-model-gcd",
    {
      type: "GCD",
      version: 1,
      thumbnailAssetKey: "gcd-v1",
      parameters: {
        first_number: { kind: "integer", defaultValue: 18, min: 2, max: 24 },
        second_number: { kind: "integer", defaultValue: 12, min: 2, max: 24 },
      },
    },
  ],
  [
    "learning-model-catalyst-activation-energy",
    {
      type: "CATALYST_ACTIVATION_ENERGY",
      version: 1,
      thumbnailAssetKey: "catalyst-activation-energy-v1",
      parameters: {
        catalystEffectivenessPercent: {
          kind: "number",
          defaultValue: 50,
          min: 0,
          max: 100,
        },
      },
    },
  ],
  [
    "learning-model-singly-linked-list-pointers",
    {
      type: "SINGLY_LINKED_LIST_POINTERS",
      version: 1,
      thumbnailAssetKey: "singly-linked-list-pointers-v1",
      parameters: {
        operation: {
          kind: "enum",
          defaultValue: "insert",
          allowedValues: ["insert", "delete"],
        },
      },
    },
  ],
  [
    "learning-model-hybridization-sigma-pi-bonds",
    {
      type: "HYBRIDIZATION_SIGMA_PI_BONDS",
      version: 1,
      thumbnailAssetKey: "hybridization-sigma-pi-bonds-v2",
      parameters: {
        hybridization: {
          kind: "enum",
          defaultValue: "sp2",
          allowedValues: ["sp3", "sp2", "sp"],
        },
      },
    },
  ],
  [
    "learning-model-discrete-event-queue-simulation",
    {
      type: "DISCRETE_EVENT_QUEUE_SIMULATION",
      version: 3,
      thumbnailAssetKey: "discrete-event-queue-simulation-v1",
      parameters: {
        workload: {
          kind: "enum",
          defaultValue: "bursty",
          allowedValues: ["spaced", "bursty"],
        },
      },
    },
  ],
  [
    "learning-model-derivative-product-rule",
    {
      type: "DERIVATIVE_PRODUCT_RULE",
      version: 1,
      thumbnailAssetKey: "derivative-product-rule-v1",
      canonicalFormula: "(fg)' = f'g + fg'",
      parameters: {
        deltaX: { kind: "number", defaultValue: 2, min: 0.05, max: 2 },
      },
    },
  ],
  [
    "learning-model-current-to-magnetic-field-direction",
    {
      type: "CURRENT_TO_MAGNETIC_FIELD_DIRECTION",
      version: 1,
      thumbnailAssetKey: "current-to-magnetic-field-direction-v3",
      parameters: {
        currentDirection: {
          kind: "enum",
          defaultValue: "up",
          allowedValues: ["up", "down"],
        },
      },
    },
  ],
]);
for (const [directory, expected] of expectedSpecifications) {
  const module = loaded.get(directory);
  assert.equal(module.n, undefined, `${directory} before initialization`);
  module.t();
  assert.deepEqual(module.n, expected);
  const identity = module.n;
  module.t();
  assert.equal(module.n, identity, `${directory} idempotent initialization`);
  runtimeAssertions += 3;
}
const usd = loaded.get("usd-currency-formatter");
const calls = [];
const formatter = {
  formatNumber(value, options) {
    calls.push({ value, options });
    return `${value}:${options.notation}`;
  },
};
assert.equal(usd.t(1234, formatter, true), "1234:compact");
assert.deepEqual(calls.at(-1).options, {
  style: "currency",
  currency: "USD",
  notation: "compact",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  maximumSignificantDigits: undefined,
});
assert.equal(usd.t(0.005, formatter), "0.005:standard");
assert.equal(calls.at(-1).options.maximumSignificantDigits, 3);
runtimeAssertions += 4;
const math = loaded.get("math");
assert.equal(math.n(2), 0);
assert.equal(math.n(-2), Math.PI);
assert.equal(math.r(2), Math.PI / 2);
assert.equal(math.r(-2), -Math.PI / 2);
assert.equal(math.a(Math.PI), -1);
assert.equal(math.c(3, 7), 7);
assert.equal(math.d(Math.PI / 2), 1);
assert.equal(math.f(9), 3);
assert.equal(math.i(1, 0), Math.PI / 2);
assert.equal(math.l(3, 7), 3);
assert.equal(math.t(-9), 9);
assert.equal(math.u, Math.PI);
assert.equal(math.p, 2 * Math.PI);
assert.equal(math.s, Math.PI / 2);
assert.equal(math.o, 1e-12);
runtimeAssertions += 15;
console.log(
  `${sourceAssertions} source assertions and ${runtimeAssertions} runtime assertions passed`,
);
