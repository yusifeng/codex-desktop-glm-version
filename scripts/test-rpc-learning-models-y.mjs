import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");

const models = [
  ["model-b729a24f3575.js", "learning-model-er-diagram-relational-tables", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-f6632531dca6.js", "learning-model-hypergeometric-distribution", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-84d7b391405a.js", "learning-model-molecular-orbital-diagram", ["a", "i", "n", "o", "r", "t"]],
  ["model-af6d2214b8dd.js", "learning-model-boiling-point-elevation", ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-71af2c81ea03.js", "learning-model-metal-reactivity-series", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-fbf35e51044d.js", "learning-model-monohybrid-punnett-square", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-21c44dea4af5.js", "learning-model-microbial-tolerance-curve", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-fb1e0a186deb.js", "learning-model-confidence-vs-prediction-bands", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-76ebc088bb95.js", "learning-model-chi-square-distribution", ["a", "c", "d", "f", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-f675b47b1a69.js", "learning-model-shadow-price", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
];

const staticDependencies = (source, expression) => [...source.matchAll(expression)].map((match) => match[1]);

let sourceAssertions = 0;
for (const [asset, directory] of models) {
  const original = fs.readFileSync(path.join(ASSET_ROOT, asset), "utf8");
  const recovered = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  const originalDependencies = staticDependencies(original, /from "\.\/([^"]+)\.js"/g).map((dependency) => dependency.replace(/-[a-f0-9]{12}$/, ""));
  const recoveredDependencies = staticDependencies(recovered, /(?:from\s+|import\s*)["']@rchunk\/([^"']+)/g);
  assert.deepEqual(recoveredDependencies, originalDependencies, directory + " preserves static dependencies");
  assert.equal((original.match(/import\(/g) ?? []).length, 0, asset + " has no dynamic dependencies");
  assert.equal((recovered.match(/import\(/g) ?? []).length, 0, directory + " adds no dynamic dependencies");
  assert.equal(/\bany\b|@ts-expect-error/.test(recovered), false, directory + " has no escape hatches");
  sourceAssertions += 4;
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
      name: "rpc-learning-model-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath.slice(8), namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "export {};", loader: "js" }));
      },
    }],
  });
  const encoded = Buffer.from(result.outputFiles[0].text).toString("base64");
  return import("data:text/javascript;base64," + encoded + "#" + directory);
}

const loaded = new Map();
let runtimeAssertions = 0;
for (const [_asset, directory, exports] of models) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  assert.deepEqual(Object.keys(module).sort(), [...exports].sort(), directory + " preserves compressed exports");
  runtimeAssertions += 1;
}

const er = loaded.get("learning-model-er-diagram-relational-tables");
assert.deepEqual(er.s({ relationship_kind: "invalid", include_relationship_attribute: "yes", mappingStage: 99 }), { relationship_kind: "one-to-many", include_relationship_attribute: true, mappingStage: 2 });
assert.deepEqual(er.i({ mappingStage: 0 }), []);
assert.deepEqual(er.i({ mappingStage: 1 }).map((table) => table.name), ["Instructor", "Course"]);
const junctionTables = er.i({ relationship_kind: "many-to-many", include_relationship_attribute: true, mappingStage: 2 });
assert.deepEqual(junctionTables.map((table) => table.name), ["Instructor", "Course", "Teaches"]);
assert.deepEqual(junctionTables[2].columns.map((column) => column.name), ["inst_id", "course_id", "assigned_on"]);
assert.deepEqual(er.i({ relationship_kind: "one-to-one", mappingStage: 2 })[1].columns[2].badges, ["FK", "UNIQUE"]);
assert.deepEqual(er.a("many-to-many"), ["M", "N"]);
runtimeAssertions += 7;

const hypergeometric = loaded.get("learning-model-hypergeometric-distribution");
assert.deepEqual(hypergeometric.a({ population_size: 12, population_successes: 5, sample_size: 7, selected_successes: 3 }).selectedOutcome.successes, 3);
const hyperState = hypergeometric.a({ population_size: 12, population_successes: 5, sample_size: 7, selected_successes: 3 });
assert.deepEqual({ minimum: hyperState.minimumSuccesses, maximum: hyperState.maximumSuccesses, total: hyperState.totalSamples }, { minimum: 0, maximum: 5, total: 792 });
assert.ok(Math.abs(hyperState.expectedSuccesses - 35 / 12) < 1e-14);
assert.ok(Math.abs(hyperState.selectedOutcome.probability - 350 / 792) < 1e-14);
assert.deepEqual(hyperState.modes.map((outcome) => outcome.successes), [3]);
const constrainedHyper = hypergeometric.a({ population_size: 12, population_successes: 12, sample_size: 12, selected_successes: 0 });
assert.deepEqual({ selected: constrainedHyper.selected_successes, probability: constrainedHyper.selectedOutcome.probability }, { selected: 12, probability: 1 });
runtimeAssertions += 6;

const orbitals = loaded.get("learning-model-molecular-orbital-diagram");
assert.equal(orbitals.i("invalid"), "O2");
const oxygen = orbitals.n({ initial_molecule: "O2" });
assert.deepEqual({ ordering: oxygen.ordering, bondOrder: oxygen.bondOrder, unpaired: oxygen.unpairedElectrons }, { ordering: "late-2p", bondOrder: 2, unpaired: 2 });
const nitrogen = orbitals.n({ initial_molecule: "N2" });
assert.deepEqual({ ordering: nitrogen.ordering, bondOrder: nitrogen.bondOrder, unpaired: nitrogen.unpairedElectrons }, { ordering: "early-2p", bondOrder: 3, unpaired: 0 });
assert.equal(orbitals.n({ initial_molecule: "He2" }).bondOrder, 0);
assert.deepEqual(oxygen.levels.map((level) => level.id), ["sigma-s", "sigma-s-star", "sigma-p", "pi-p", "pi-p-star", "sigma-p-star"]);
runtimeAssertions += 5;

const boiling = loaded.get("learning-model-boiling-point-elevation");
assert.deepEqual(boiling.o({ solvent: "invalid", initial_solute_molality: 9, initial_particle_factor: -2 }), { solvent: "benzene", initial_solute_molality: 0.25, initial_particle_factor: 1 });
const benzene = boiling.i({ solvent: "benzene", initial_solute_molality: 0.15, initial_particle_factor: 2 });
assert.equal(benzene.particleMolality, 0.3);
assert.ok(benzene.solutionBoilingPointCelsius > benzene.pureBoilingPointCelsius);
assert.ok(Math.abs(benzene.diluteEstimateCelsius - 0.759) < 1e-14);
assert.ok(Math.abs(boiling.c(80.1, "benzene") - 1) < 1e-14);
assert.ok(Math.abs(boiling.s(benzene.solutionBoilingPointCelsius, benzene) - 1) < 1e-12);
runtimeAssertions += 6;

const metals = loaded.get("learning-model-metal-reactivity-series");
const zincCopper = metals.a({ initial_solid_metal: "zinc", initial_aqueous_metal: "copper" });
assert.equal(zincCopper.reacts, true);
assert.equal(zincCopper.equation, "\\mathrm{Zn}\\,(s)+\\mathrm{Cu}^{2+}\\,(aq)\\rightarrow\\mathrm{Zn}^{2+}\\,(aq)+\\mathrm{Cu}\\,(s)");
const copperZinc = metals.a({ initial_solid_metal: "copper", initial_aqueous_metal: "zinc" });
assert.equal(copperZinc.reacts, false);
assert.equal(copperZinc.equation.endsWith("\\;\\nrightarrow"), true);
assert.equal(metals.a({ initial_solid_metal: "copper", initial_aqueous_metal: "copper" }).sameMetal, true);
assert.equal(metals.a({ initial_solid_metal: "magnesium", initial_aqueous_metal: "silver" }).equation, "\\mathrm{Mg}\\,(s)+2\\mathrm{Ag}^{+}\\,(aq)\\rightarrow\\mathrm{Mg}^{2+}\\,(aq)+2\\mathrm{Ag}\\,(s)");
runtimeAssertions += 6;

const punnett = loaded.get("learning-model-monohybrid-punnett-square");
assert.deepEqual(punnett.a("Parents: rr and RR"), { parentOne: "rr", parentTwo: "RR" });
assert.deepEqual(punnett.c({ parentOne: "rR", parentTwo: "bad" }), { parentOne: "Rr", parentTwo: "Rr" });
assert.equal(punnett.i({ parentOne: "RR", parentTwo: "rr" }), "RR x rr");
const mixedCross = punnett.r({ parentOne: "Rr", parentTwo: "Rr" });
assert.deepEqual(mixedCross.outcomes, [{ genotype: "RR", count: 1, probability: 0.25 }, { genotype: "Rr", count: 2, probability: 0.5 }, { genotype: "rr", count: 1, probability: 0.25 }]);
assert.deepEqual({ dominant: mixedCross.dominantPhenotypeProbability, recessive: mixedCross.recessivePhenotypeProbability }, { dominant: 0.75, recessive: 0.25 });
assert.equal(punnett.o(1 / 3), "33.3%");
runtimeAssertions += 6;

const microbes = loaded.get("learning-model-microbial-tolerance-curve");
assert.deepEqual(microbes.s({ microbial_group: "invalid", temperature_c: 999 }), { microbial_group: "mesophile", temperature_c: 110 });
assert.equal(microbes.a("mesophile").length, 97);
const mesophileOptimum = microbes.i({ microbial_group: "mesophile", temperature_c: 35 });
assert.equal(mesophileOptimum.position, "optimum");
assert.equal(mesophileOptimum.relativeGrowth, 1);
assert.equal(microbes.i({ microbial_group: "mesophile", temperature_c: 10 }).relativeGrowth, 0);
assert.equal(microbes.i({ microbial_group: "thermophile", temperature_c: 65 }).bestAdaptedGroup, "thermophile");
runtimeAssertions += 6;

const bands = loaded.get("learning-model-confidence-vs-prediction-bands");
assert.deepEqual(bands.a({ confidence_level: "invalid", selectedX: 99, sampleSize: 11 }), { confidence_level: "95%", selectedX: 10, sampleSize: 30 });
const bandState = bands.r({ confidence_level: "95%", selectedX: 5, sampleSize: 30 });
assert.equal(bandState.observed.length, 30);
assert.equal(bandState.confidenceUpper.length, 81);
assert.ok(bandState.predictionHalfWidth > bandState.confidenceHalfWidth);
assert.equal(bandState.fittedAtX, 5);
const smallSample = bands.r({ confidence_level: "95%", selectedX: 5, sampleSize: 12 });
const largeSample = bands.r({ confidence_level: "95%", selectedX: 5, sampleSize: 100 });
assert.ok(largeSample.confidenceHalfWidth < smallSample.confidenceHalfWidth);
runtimeAssertions += 6;

const chiSquare = loaded.get("learning-model-chi-square-distribution");
assert.deepEqual(chiSquare.u({ degrees_of_freedom: 99, observed_value: -1 }), { degrees_of_freedom: 20, observed_value: 0 });
assert.equal(chiSquare.s(2)[0].y, 0.5);
assert.equal(chiSquare.s(5).length, 241);
assert.equal(chiSquare.c(11.1, 5).length, 123);
const chiTwo = chiSquare.o({ degrees_of_freedom: 2, observed_value: 2 });
assert.ok(Math.abs(chiTwo.upperTailProbability - Math.exp(-1)) < 1e-14);
assert.ok(Math.abs(chiTwo.densityAtObserved - Math.exp(-1) / 2) < 1e-14);
runtimeAssertions += 6;

const shadow = loaded.get("learning-model-shadow-price");
assert.deepEqual(shadow.s({ resourceLimit: 99 }), { resourceLimit: 18 });
const baseShadow = shadow.i({ resourceLimit: 12 });
assert.deepEqual(baseShadow.optimum, { x: 4, y: 4 });
assert.equal(baseShadow.maximumProfit, 28);
assert.equal(baseShadow.shadowPrice, 5 / 3);
const expandedShadow = shadow.i({ resourceLimit: 18 });
assert.deepEqual(expandedShadow.optimum, { x: 2, y: 8 });
assert.equal(expandedShadow.maximumProfit, 38);
assert.deepEqual(shadow.a({ a: 2, b: 1, c: 12 }, { xMin: 0, xMax: 10, yMin: 0, yMax: 10 }), { from: { x: 6, y: 0 }, to: { x: 1, y: 10 } });
runtimeAssertions += 7;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
