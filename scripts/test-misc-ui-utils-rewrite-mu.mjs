import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.join(ROOT, "src/webview/assets");
const modules = [
  ["type-9cab42e2673f.js", "learning-model-lens-equation", ["n", "t"]],
  ["template-a78ebcc58f49.js", "learning-model-circle-circumference-template", ["a", "i", "n", "r", "t"]],
  ["type-b8a457382aa2.js", "learning-model-beer-lambert-law", ["n", "t"]],
  ["type-4e7d1b324604.js", "learning-model-linear-independence-discriminant", ["n", "t"]],
  ["type-2ba608a4bdee.js", "learning-model-resistors-in-series-equivalent", ["n", "t"]],
  ["type-edf05c1a49b7.js", "learning-model-polygon-interior-angle-sum", ["a", "i", "n", "r", "t"]],
  ["type-892c2b1ba446.js", "learning-model-ionic-formulas", ["n", "t"]],
  ["type-ff2ce34a0edd.js", "learning-model-charles-law", ["n", "t"]],
  ["type-a2cf34c518e9.js", "learning-model-entropy-of-phase-changes", ["n", "t"]],
  ["type-e9e5c33af31e.js", "learning-model-pythagorean-theorem", ["a", "i", "n", "o", "r", "t"]],
];

const dependencies = (source, expression) => [...source.matchAll(expression)].map((match) => match[1]);
let sourceAssertions = 0;
for (const [asset, directory] of modules) {
  const original = fs.readFileSync(path.join(ASSET_ROOT, asset.replace(/\.js$/, ".ts")), "utf8");
  const recovered = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  const originalDependencies = dependencies(original, /from "\.\/([^"/]+)-[a-f0-9]{12}\.js"/g);
  const recoveredDependencies = dependencies(recovered, /(?:from\s+|import\s*)["']@rchunk\/([^"']+)/g);
  assert.deepEqual(recoveredDependencies, originalDependencies, directory + " preserves static dependencies");
  assert.equal((original.match(/import\(/g) ?? []).length, (recovered.match(/import\(/g) ?? []).length, directory + " preserves dynamic imports");
  assert.equal(/\bany\b|@ts-expect-error|@ts-nocheck/.test(recovered), false, directory + " has no type escape hatch");
  sourceAssertions += 3;
}

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "mu-rchunk-mock",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath, namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "export {};", loader: "js" }));
      },
    }],
  });
  return import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64") + "#" + directory);
}

const loaded = new Map();
let runtimeAssertions = 0;
for (const [_asset, directory, expectedExports] of modules) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  assert.deepEqual(Object.keys(module).sort(), [...expectedExports].sort(), directory + " preserves compressed exports");
  runtimeAssertions += 1;
}

const expectedSpecifications = {
  "learning-model-lens-equation": { type: "LENS_EQUATION", version: 2, thumbnailAssetKey: "lens-equation-v1", canonicalFormula: "\\frac{1}{f} = \\frac{1}{d_o} + \\frac{1}{d_i}", canonicalFormulaAliases: ["\\frac{1}{f} = \\frac{1}{a} + \\frac{1}{b}", "1/f=1/do+1/di", "1/f=1/di+1/do", "1/f=1/b+1/a", "1/do+1/di=1/f", "1/di+1/do=1/f", "1/a+1/b=1/f", "1/b+1/a=1/f"], parameters: { objectDistance: { kind: "number", defaultValue: 32, min: 0.01, max: 10_000 }, focalLength: { kind: "number", defaultValue: 16, min: -10_000, max: 10_000 } } },
  "learning-model-circle-circumference-template": { type: "CIRCLE_CIRCUMFERENCE", version: 2, thumbnailAssetKey: "circle-circumference-v1", canonicalFormula: "C = 2\\pi r", canonicalFormulaAliases: ["2\\pi r = C", "C = \\pi d", "\\pi d = C", "r = \\frac{C}{2\\pi}", "d = \\frac{C}{\\pi}"], parameters: { radius: { kind: "number", defaultValue: 3, min: 0.01, max: 10_000 } } },
  "learning-model-beer-lambert-law": { type: "BEER_LAMBERT_LAW", version: 2, thumbnailAssetKey: "beer-lambert-law-v2", canonicalFormula: "A = \\varepsilon c l", canonicalFormulaAliases: ["A=\\varepsilon l c", "A = \\epsilon c l", "c = \\frac{A}{\\varepsilon l}", "l = \\frac{A}{\\varepsilon c}", "\\varepsilon = \\frac{A}{c l}"], parameters: { molarAbsorptivity: { kind: "number", defaultValue: 1.2, min: 0.01, max: 100_000 }, concentration: { kind: "number", defaultValue: 0.8, min: 0.01, max: 10 }, pathLength: { kind: "number", defaultValue: 1, min: 0.01, max: 100 } } },
  "learning-model-linear-independence-discriminant": { type: "LINEAR_INDEPENDENCE_DISCRIMINANT", version: 1, thumbnailAssetKey: "linear-independence-discriminant-v1", canonicalFormula: "A=\\left|\\det(\\mathbf{u},\\mathbf{v})\\right|", canonicalFormulaAliases: ["\\det(\\mathbf{u},\\mathbf{v})=u_xv_y-u_yv_x", "\\det(\\mathbf{u},\\mathbf{v})\\ne 0"], parameters: { uX: { kind: "number", defaultValue: 4, min: -20, max: 20 }, uY: { kind: "number", defaultValue: 1, min: -20, max: 20 }, vX: { kind: "number", defaultValue: 1, min: -20, max: 20 }, vY: { kind: "number", defaultValue: 3, min: -20, max: 20 } } },
  "learning-model-resistors-in-series-equivalent": { type: "RESISTORS_IN_SERIES_EQUIVALENT", version: 1, thumbnailAssetKey: "resistors-in-series-equivalent-v1", canonicalFormula: "R_{\\text{total}} = R_1 + R_2 + \\dots", canonicalFormulaAliases: ["R_{\\text{eq}} = R_1 + R_2 + R_3", "R_T = R_1 + R_2 + R_3", "R_{eq} = R_1 + R_2 + R_3"], parameters: { r1: { kind: "number", defaultValue: 8, min: 0.1, max: 100_000 }, r2: { kind: "number", defaultValue: 8, min: 0.1, max: 100_000 }, r3: { kind: "number", defaultValue: 8, min: 0.1, max: 100_000 }, voltage: { kind: "number", defaultValue: 12, min: 0, max: 1_000 } } },
  "learning-model-polygon-interior-angle-sum": { type: "POLYGON_INTERIOR_ANGLE_SUM", version: 1, thumbnailAssetKey: "polygon-interior-angle-sum-v1", canonicalFormula: "(n - 2)\\times 180^\\circ", canonicalFormulaAliases: ["(n - 2) \\times 180^\\circ", "S_n = (n - 2) \\cdot 180^\\circ", "S_n = (n - 2)(180^\\circ)", "S_n=(n-2)\\cdot(180)", "180^\\circ(n-2)"], parameters: { n: { kind: "number", defaultValue: 6, min: 3, max: 50 } } },
  "learning-model-ionic-formulas": { type: "IONIC_FORMULAS", version: 2, thumbnailAssetKey: "ionic-formulas-v2", parameters: { cation: { kind: "enum", defaultValue: "aluminum", allowedValues: ["sodium", "potassium", "silver", "magnesium", "calcium", "zinc", "barium", "aluminum", "iron_iii"] }, anion: { kind: "enum", defaultValue: "oxide", allowedValues: ["chloride", "fluoride", "bromide", "oxide", "sulfide", "nitride", "phosphide"] } } },
  "learning-model-charles-law": { type: "CHARLES_LAW", version: 2, thumbnailAssetKey: "charles-law-v1", canonicalFormula: "\\frac{V_1}{T_1} = \\frac{V_2}{T_2}", canonicalFormulaAliases: ["V_1/T_1 = V_2/T_2", "v1/t1=v2/t2", "v2/t2=v1/t1", "v/t=k", "k=v/t", "v=kt", "kt=v"], parameters: { v1: { kind: "number", defaultValue: 12, min: 0.01, max: 10_000 }, t1: { kind: "number", defaultValue: 300, min: 1, max: 5_000 }, v2: { kind: "number", defaultValue: 18, min: 0.01, max: 10_000 }, t2: { kind: "number", defaultValue: 450, min: 1, max: 5_000 }, solveFor: { kind: "enum", defaultValue: "v2", allowedValues: ["v1", "t1", "v2", "t2"] } } },
  "learning-model-entropy-of-phase-changes": { type: "ENTROPY_OF_PHASE_CHANGES", version: 2, thumbnailAssetKey: "entropy-of-phase-changes-v1", canonicalFormula: "\\Delta S_{\\mathrm{phase}}=\\frac{\\Delta H_{\\mathrm{phase}}}{T_{\\mathrm{phase}}}", parameters: { melting_temperature_k: { kind: "number", defaultValue: 273.15, min: 200, max: 350 }, boiling_temperature_k: { kind: "number", defaultValue: 373.15, min: 360, max: 650 }, molar_enthalpy_of_fusion_kj_per_mol: { kind: "number", defaultValue: 6.01, min: 2, max: 20 }, molar_enthalpy_of_vaporization_kj_per_mol: { kind: "number", defaultValue: 40.65, min: 20, max: 100 } } },
  "learning-model-pythagorean-theorem": { type: "PYTHAGOREAN_THEOREM", version: 2, thumbnailAssetKey: "pythagorean-v1", canonicalFormula: "a^2 + b^2 = c^2", canonicalFormulaAliases: ["c^2 = a^2 + b^2", "c = \\sqrt{a^2 + b^2}", "c = \\sqrt{(a^2 + b^2)}"], parameters: { a: { kind: "number", defaultValue: 15, min: 0.01, max: 10_000 }, b: { kind: "number", defaultValue: 15, min: 0.01, max: 10_000 } } },
};

const specificationExport = new Map([
  ["learning-model-circle-circumference-template", "a"],
]);
for (const [directory, expected] of Object.entries(expectedSpecifications)) {
  const module = loaded.get(directory);
  const exportName = specificationExport.get(directory) ?? "n";
  const initializerName = directory === "learning-model-circle-circumference-template" ? "i" : "t";
  module[initializerName]();
  assert.deepEqual(module[exportName], expected, directory + " preserves manifest semantics");
  runtimeAssertions += 1;
}

const circle = loaded.get("learning-model-circle-circumference-template");
circle.r();
assert.deepEqual(circle.n, { label: "r", min: 0.5, max: 20, step: 0.1, defaultValue: 3, thumbnailDefaultValue: 3 });
assert.deepEqual(circle.t, { properties: { radius: circle.n } });

const polygon = loaded.get("learning-model-polygon-interior-angle-sum");
polygon.a();
assert.deepEqual(polygon.r, { label: "n", min: 3, max: 12, step: 1, defaultValue: 6 });
assert.deepEqual(polygon.i, { properties: { n: polygon.r } });

const pythagorean = loaded.get("learning-model-pythagorean-theorem");
pythagorean.o();
assert.deepEqual(pythagorean.r, { min: 5, max: 15, step: 0.1, label: "a", defaultValue: 15 });
assert.deepEqual(pythagorean.i, { min: 5, max: 15, step: 0.1, label: "b", defaultValue: 15 });
assert.deepEqual(pythagorean.a, { properties: { a: pythagorean.r, b: pythagorean.i } });
runtimeAssertions += 7;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
