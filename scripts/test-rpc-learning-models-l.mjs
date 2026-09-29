import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");

const models = [
  ["model-ed067671e3fb.js", "learning-model-musical-tempo-markings", ["a", "i", "n", "r", "t"]],
  ["model-18526f90a546.js", "learning-model-empirical-rule", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-96e3711e4510.js", "learning-model-sql-group-by", ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["model-b0c57c4c50ba.js", "learning-model-electron-transport-chain", ["a", "i", "n", "r", "t"]],
  ["model-e7c8cc43e8df.js", "learning-model-gpcr-signaling", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-68069144a19f.js", "learning-model-gay-lussacs-law", ["a", "i", "n", "r", "t"]],
  ["model-6e9bbef00f51.js", "learning-model-multiplication-as-repeated-addition", ["a", "i", "n", "o", "r", "s", "t"]],
  ["model-9acbe8f8d181.js", "learning-model-acid-base-speciation", ["a", "c", "i", "n", "o", "r", "s", "t"]],
  ["model-d86232dd9f20.js", "learning-model-stoichiometric-mole-ratios", ["a", "c", "i", "l", "n", "o", "r", "s", "t"]],
  ["model-456ae69d4c49.js", "learning-model-conjugated-dienes-diels-alder", ["a", "i", "n", "o", "r", "s", "t"]],
];

const dependencies = (source, expression) => [...source.matchAll(expression)].map((match) => match[1]);

let sourceAssertions = 0;
for (const [asset, directory] of models) {
  const original = fs.readFileSync(path.join(ASSET_ROOT, asset), "utf8");
  const recovered = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  const originalDependencies = dependencies(original, /from "\.\/([^"]+)\.js"/g).map((dependency) => dependency.replace(/-[a-f0-9]{12}$/, ""));
  const recoveredDependencies = dependencies(recovered, /(?:from\s+|import\s*)["']@rchunk\/([^"']+)/g);
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
for (const [_asset, directory, expectedExports] of models) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  assert.deepEqual(Object.keys(module).sort(), [...expectedExports].sort(), directory + " preserves compressed exports");
  runtimeAssertions += 1;
}

const tempo = loaded.get("learning-model-musical-tempo-markings");
assert.equal(tempo.a("andante"), 92);
assert.deepEqual(tempo.i("presto"), { tempo_marking: "presto", bpm: 188 });
assert.deepEqual(tempo.n({ tempo_marking: "largo", bpm: 60 }), { tempo_marking: "largo", bpm: 60, selected: { marking: "largo", min: 40, max: 60 }, matches: [{ marking: "largo", min: 40, max: 60 }, { marking: "adagio", min: 60, max: 80 }], selectedMatches: true });
assert.deepEqual(tempo.n({ tempo_marking: "invalid", bpm: 500 }), { tempo_marking: "andante", bpm: 208, selected: { marking: "andante", min: 76, max: 108 }, matches: [{ marking: "presto", min: 168, max: 208 }], selectedMatches: false });
runtimeAssertions += 4;

const empirical = loaded.get("learning-model-empirical-rule");
assert.deepEqual(empirical.a({ mean: Number.POSITIVE_INFINITY, standard_deviation: 0, interval: 4 }), { mean: 100, standard_deviation: 0.1, interval: 3 });
const empiricalState = empirical.r({ mean: 100, standard_deviation: 15, interval: 2 });
assert.deepEqual({ central: empiricalState.central, outside: empiricalState.outside, tail: empiricalState.tail, lower: empiricalState.lower, upper: empiricalState.upper }, { central: 95, outside: 5, tail: 2.5, lower: 70, upper: 130 });
assert.deepEqual(empiricalState.boundaries, [-3, -2, -1, 0, 1, 2, 3].map((distance) => ({ distance, value: 100 + distance * 15 })));
assert.equal(empirical.s.type, "EMPIRICAL_RULE");
runtimeAssertions += 4;

const sql = loaded.get("learning-model-sql-group-by");
assert.deepEqual(sql.c({ groupBy: "invalid" }), { groupBy: "country" });
assert.deepEqual(sql.o(sql.t, "country"), [{ key: "UAE", count: 1, rowIndexes: [0] }, { key: "UK", count: 2, rowIndexes: [1, 2] }, { key: "USA", count: 2, rowIndexes: [3, 4] }]);
assert.deepEqual(sql.o(sql.t, "age")[0], { key: "22", count: 2, rowIndexes: [0, 1] });
assert.equal(sql.i("country"), "SELECT country, COUNT(*) AS customer_count\nFROM customers\nGROUP BY country;");
runtimeAssertions += 4;

const transport = loaded.get("learning-model-electron-transport-chain");
assert.deepEqual(transport.a({ stageIndex: 20 }), { stageIndex: 5 });
assert.deepEqual(transport.r({ stageIndex: 3 }), { safeValues: { stageIndex: 3 }, stage: "oxygenReduction", stageNumber: 4, focus: "oxygen", animation: "oxygenReduction", highlightLocation: false, showElectronEntry: true, showFullElectronPath: true, showPumps: true, showWaterFormation: true, showGradient: false, showAtpSynthesis: false, upperProtonCount: 7 });
assert.equal(transport.r({ stageIndex: 5 }).upperProtonCount, 9);
assert.equal(transport.t, 6);
runtimeAssertions += 4;

const gpcr = loaded.get("learning-model-gpcr-signaling");
assert.deepEqual(gpcr.s({ pathway: "invalid", stage: 99 }), { pathway: "Gs", stage: 3 });
assert.equal(gpcr.a(1.6), "Gq");
assert.equal(gpcr.o("Gi"), 1);
assert.deepEqual(gpcr.r({ pathway: "Gq", stage: 2 }), { pathway: "Gq", stage: 2, ligandBound: true, exchanged: true, separated: true, signaling: true, resetting: false, effector: "plc-beta", outcome: "ip3-and-dag" });
assert.equal(gpcr.r({ pathway: "Gi", stage: 0 }).outcome, "camp-decreases");
runtimeAssertions += 5;

const gayLussac = loaded.get("learning-model-gay-lussacs-law");
assert.deepEqual(gayLussac.n({ initial_temperature_k: 300, initial_pressure_kpa: 100, finalTemperatureK: 450 }), { initial_temperature_k: 300, initial_pressure_kpa: 100, finalTemperatureK: 450, pressurePerKelvin: 1 / 3, finalPressureKpa: 150, temperatureRatio: 1.5, direction: "heating" });
assert.equal(gayLussac.n({ initial_temperature_k: 300, initial_pressure_kpa: 100, finalTemperatureK: 300 }).direction, "unchanged");
assert.deepEqual(gayLussac.n({ initial_temperature_k: 1, initial_pressure_kpa: 999, finalTemperatureK: 0 }), { initial_temperature_k: 250, initial_pressure_kpa: 160, finalTemperatureK: 150, pressurePerKelvin: 0.64, finalPressureKpa: 96, temperatureRatio: 0.6, direction: "cooling" });
assert.equal(gayLussac.a.canonicalFormula, "\\frac{P_1}{T_1}=\\frac{P_2}{T_2}");
runtimeAssertions += 4;

const repeated = loaded.get("learning-model-multiplication-as-repeated-addition");
assert.deepEqual(repeated.a({ groupCount: -2, itemsPerGroup: 20 }), { groupCount: 1, itemsPerGroup: 6 });
assert.deepEqual(repeated.r({ groupCount: 4, itemsPerGroup: 3 }), { safeValues: { groupCount: 4, itemsPerGroup: 3 }, total: 12, relationshipLatex: "3 + 3 + 3 + 3 = 4 \\times 3 = 12" });
assert.equal(repeated.s.type, "MULTIPLICATION_AS_REPEATED_ADDITION");
runtimeAssertions += 3;

const acidBase = loaded.get("learning-model-acid-base-speciation");
assert.deepEqual(acidBase.i({ pKa1: -2, pKa2: 20, pH: 20 }).pKa1, 0);
const neutralFractions = acidBase.i({ pKa1: 6.35, pKa2: 10.33, pH: 7 }).fractions;
assert.ok(Math.abs(neutralFractions.h2a + neutralFractions.ha + neutralFractions.a - 1) < 1e-14);
assert.equal(acidBase.i({ pKa1: 6.35, pKa2: 10.33, pH: 0 }).predominant, "H2A");
assert.equal(acidBase.i({ pKa1: 6.35, pKa2: 10.33, pH: 14 }).predominant, "A2-");
assert.deepEqual({ length: acidBase.a(6.35, 10.33, "ha").length, firstX: acidBase.a(6.35, 10.33, "ha")[0].x, lastX: acidBase.a(6.35, 10.33, "ha")[280].x }, { length: 281, firstX: 0, lastX: 14 });
runtimeAssertions += 5;

const stoichiometry = loaded.get("learning-model-stoichiometric-mole-ratios");
assert.deepEqual(stoichiometry.s({ reactionExtentMoles: 8, selectedSpecies: "invalid" }), { reactionExtentMoles: 5, selectedSpecies: "h2" });
assert.deepEqual(stoichiometry.i(1.5), { h2: 3, o2: 1.5, h2o: 3 });
assert.deepEqual(stoichiometry.r("h2"), { min: 1, max: 10, step: 1 });
assert.equal(stoichiometry.a("o2", 3), 3);
assert.equal(stoichiometry.l.canonicalFormula, "2\\mathrm{H_2} + \\mathrm{O_2} \\rightarrow 2\\mathrm{H_2O}");
runtimeAssertions += 5;

const dielsAlder = loaded.get("learning-model-conjugated-dienes-diels-alder");
assert.deepEqual(dielsAlder.n(), { conformation: "s-cis", example: "butadiene-and-ethene", stage: 1 });
assert.deepEqual(dielsAlder.t({ conformation: "s-trans", example: "butadiene-and-maleic-anhydride", stage: 2 }), { conformation: "s-trans", example: "butadiene-and-maleic-anhydride", product: "cyclohexene anhydride", stage: 0 });
assert.deepEqual(dielsAlder.t({ conformation: "invalid", example: "invalid", stage: 9 }), { conformation: "s-cis", example: "butadiene-and-ethene", product: "cyclohexene", stage: 2 });
assert.deepEqual(dielsAlder.i({ example: "butadiene-and-ethene", stage: 2 }, "s-trans"), { example: "butadiene-and-ethene", stage: 0, conformation: "s-trans" });
assert.deepEqual(dielsAlder.a({ example: "butadiene-and-ethene", conformation: "s-trans", stage: 0 }, 2), { example: "butadiene-and-ethene", conformation: "s-cis", stage: 2 });
runtimeAssertions += 5;

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
