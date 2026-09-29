import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");
const models = [
  [
    "model-9ce2e0b98e4f.js",
    "learning-model-insertion-sort",
    ["a", "c", "i", "l", "n", "o", "r", "s", "t"],
  ],
  [
    "model-cde8f9761457.js",
    "learning-model-vsepr-geometry",
    ["a", "c", "i", "n", "o", "r", "s", "t"],
  ],
  [
    "model-86d466c7f97d.js",
    "learning-model-riemann-sum",
    ["a", "c", "d", "f", "i", "l", "n", "o", "p", "r", "s", "t", "u"],
  ],
  [
    "model-a6184aabc0d8.js",
    "learning-model-action-potential-voltage",
    ["a", "c", "i", "n", "o", "r", "s", "t"],
  ],
  [
    "model-4513eb800a0e.js",
    "learning-model-merge-sort",
    ["a", "i", "n", "o", "r", "t"],
  ],
  [
    "model-2e9de4cfd2c8.js",
    "learning-model-numerical-integration-methods",
    ["a", "c", "d", "f", "i", "l", "n", "o", "p", "r", "s", "t", "u"],
  ],
  [
    "model-fe380b24f817.js",
    "learning-model-insulin-deficiency-vs-resistance",
    ["a", "c", "i", "l", "n", "o", "r", "s", "t"],
  ],
];
const dependencies = (source, pattern) =>
  [...source.matchAll(pattern)].map((match) => match[1]);
let sourceAssertions = 0;
for (const [asset, directory] of models) {
  const original = fs.readFileSync(path.join(ASSET_ROOT, asset), "utf8"),
    recovered = fs.readFileSync(
      path.join(ROOT, "src/renderer", directory, "index.ts"),
      "utf8",
    ),
    originalDependencies = dependencies(
      original,
      /from "\.\/([^"]+)\.js"/g,
    ).map((value) => value.replace(/-[a-f0-9]{12}$/, "")),
    recoveredDependencies = dependencies(
      recovered,
    /(?:from\s*|import\s*)["']@rchunk\/([^"']+)/g,
    );
  assert.deepEqual(
    recoveredDependencies,
    originalDependencies,
    directory + " dependencies",
  );
  assert.equal(
    (original.match(/import\(/g) ?? []).length,
    (recovered.match(/import\(/g) ?? []).length,
    directory + " dynamic imports",
  );
  assert.equal(
    /\bany\b|@ts-expect-error/.test(recovered),
    false,
    directory + " type escape",
  );
  assert.ok(recovered.length > 700, directory + " semantic implementation");
  sourceAssertions += 4;
}
const mock = (name) =>
  name === "build-graph-data"
    ? `export const a=()=>{};export const n=(expression,x)=>{const token=Array.isArray(expression)?expression[0]:expression;const source=token.source.split("^").join("**").replace(/pi/g,"Math.PI");return Function("x","return ("+source+")")(x)};`
    : name === "tokenize-math-block"
      ? `export const n=()=>{};export const r=source=>[{type:"number",source:source.replace(/^y=/,"")}];export const t=()=>[];`
      : name === "null-throws"
        ? `export const n=()=>{};export const t=value=>{if(value==null)throw Error("null");return value};`
        : name === "numerical-integration"
          ? `export const t=()=>{};export const n=source=>({integrand:source,hasUnsupportedLetter:false});`
          : name === "app-shared"
            ? `export const G2=messages=>messages;export const K2=()=>{};`
            : `export {};`;
async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
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
          build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({
            path: modulePath.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: name }) => ({ contents: mock(name), loader: "js" }),
          );
        },
      },
    ],
  });
  return import(
    "data:text/javascript;base64," +
      Buffer.from(result.outputFiles[0].text).toString("base64") +
      "#" +
      directory
  );
}
const loaded = new Map();
let runtimeAssertions = 0;
for (const [_asset, directory, exports] of models) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  assert.deepEqual(
    Object.keys(module).sort(),
    [...exports].sort(),
    directory + " exports",
  );
  runtimeAssertions += 1;
}
const insertion = loaded.get("learning-model-insertion-sort"),
  insertionState = insertion.n({ ...insertion.r(), step: 999 });
assert.deepEqual(
  insertionState.frame.items.map((item) => item.value),
  [2, 3, 4, 5, 6, 7, 8],
);
assert.equal(insertionState.frame.phase, "complete");
assert.equal(insertion.a(insertionState.frames, 0) > 0, true);
assert.equal(insertion.i(insertionState.frame, "source-1").value, 7);
assert.deepEqual(
  Object.values(insertion.s(insertion.r(), () => 0)).slice(0, 7),
  [3, 8, 2, 6, 4, 5, 7],
);
runtimeAssertions += 5;
const vsepr = loaded.get("learning-model-vsepr-geometry");
assert.equal(vsepr.r(4, 2), "AX4E2");
assert.deepEqual(vsepr.o({ configuration: "AX3E2" }), {
  configuration: "AX3E2",
  bonds: 3,
  lonePairs: 2,
});
assert.equal(
  vsepr.i({ configuration: "AX4E2" }).molecularGeometry,
  "square-planar",
);
assert.equal(vsepr.n(3), 3);
runtimeAssertions += 4;
const riemann = loaded.get("learning-model-riemann-sum");
riemann.d();
const riemannResult = riemann.r({
  integrand: "x^2",
  lowerBound: 0,
  upperBound: 2,
  subintervalCount: 4,
  riemannVariant: "middle",
});
assert.equal(riemannResult.estimate, 2.625);
assert.ok(Math.abs(riemannResult.exactValue - 8 / 3) < 1e-8);
assert.equal(riemann.n("left riemann f(x)=x n=5").riemannVariant, "left");
assert.deepEqual(riemann.s({ lowerBound: 3, upperBound: -1 }), [3, -1]);
runtimeAssertions += 4;
const formatter = { formatMessage: (message) => message.defaultMessage },
  action = loaded.get("learning-model-action-potential-voltage");
action.s();
const peak = action.r({ stage: 4 });
assert.equal(peak.activeStage.id, "peak");
assert.equal(peak.activeStage.representativeVoltage, 40);
assert.equal(action.a(peak.activeStage, formatter), "Peak");
assert.equal(
  action.i(peak.activeStage, formatter),
  "Sodium entry stops and potassium begins to leave.",
);
assert.equal(action.n.length, 35);
runtimeAssertions += 5;
const merge = loaded.get("learning-model-merge-sort"),
  mergeState = merge.t({ ...merge.n(), activeCount: 7, step: 999 });
assert.deepEqual(
  mergeState.frame.output.map((item) => item.value),
  [9, 12, 18, 27, 31, 38, 43],
);
assert.equal(mergeState.frame.phase, "complete");
assert.equal(mergeState.splitRows.at(-1).length, 7);
assert.deepEqual(
  Object.values(merge.i({ ...merge.n(), activeCount: 7 }, () => 0)).slice(0, 7),
  [12, 27, 43, 9, 31, 18, 38],
);
runtimeAssertions += 4;
const methods = loaded.get("learning-model-numerical-integration-methods");
methods.d();
assert.equal(
  methods.p({ method: "simpson", subintervalCount: 5 }).subintervalCount,
  6,
);
const simpson = methods.r({
  integrand: "x^2",
  lowerBound: 0,
  upperBound: 2,
  method: "simpson",
  subintervalCount: 4,
});
assert.ok(Math.abs(simpson.estimate - 8 / 3) < 1e-9);
const trapezoid = methods.r({
  integrand: "x^2",
  lowerBound: 0,
  upperBound: 2,
  method: "trapezoidal",
  subintervalCount: 4,
});
assert.equal(trapezoid.estimate, 2.75);
assert.equal(
  methods.n("Simpson \\int_0^2 x^2 dx using 5 subintervals").method,
  "simpson",
);
runtimeAssertions += 4;
const insulin = loaded.get("learning-model-insulin-deficiency-vs-resistance");
assert.deepEqual(insulin.l({ condition: "bad", checkpoint: 99 }), {
  condition: "normal",
  checkpoint: 0,
});
assert.deepEqual(insulin.c("resistance"), {
  insulinCount: 4,
  signalStrength: 0.42,
  membraneGlut4Count: 2,
  uptakeCount: 2,
  bloodGlucoseCount: 4,
  firstDivergence: 2,
});
assert.equal(insulin.o(formatter, "deficiency"), "Insulin deficiency");
assert.equal(insulin.a(formatter, 4), "Glucose uptake");
assert.ok(insulin.i(formatter, "resistance", 2).includes("weakly"));
runtimeAssertions += 5;
console.log(
  `${sourceAssertions} source assertions and ${runtimeAssertions} runtime assertions passed`,
);
