import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const models = {
  "learning-model-greenhouse-effect": ["n", "r", "t"],
  "learning-model-landfill-water-pathways": ["a", "c", "i", "n", "o", "r", "s", "t"],
  "learning-model-harmonic-wave": ["i", "n", "r", "t"],
  "learning-model-percent-of-whole": ["i", "n", "r", "t"],
  "learning-model-stereo-panning": ["n", "r", "t"],
  "learning-model-market-equilibrium": ["a", "i", "n", "o", "r", "t"],
  "learning-model-elimination-reactions": ["i", "n", "r", "t"],
  "learning-model-paper-chromatography": ["n", "r", "t"],
  "learning-model-odd-number-square-sum": ["i", "n", "r", "t"],
  "learning-model-molarity": ["a", "i", "n", "r", "t"],
};

let sourceAssertions = 0;
for (const [directory, exports] of Object.entries(models)) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  assert.deepEqual(
    [...source.matchAll(/(?:from|import)\s*(?:\([^)]*?from\s*)?["']@rchunk\/([^"']+)/g)].map((match) => match[1]),
    ["rolldown-runtime"],
  );
  assert.equal(/\bany\b|@ts-expect-error/.test(source), false);
  const exportLine = source.split("\n").find((line) => line.startsWith("export {"));
  assert.ok(exportLine);
  const aliases = [...exportLine.matchAll(/\bas ([A-Za-z_$][\w$]*)/g)].map((match) => match[1]).sort();
  assert.deepEqual(aliases, [...exports].sort());
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
        build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({ path: value.slice(8), namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "export {};", loader: "js" }));
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}

let runtimeAssertions = 0;
const greenhouse = await bundle("learning-model-greenhouse-effect");
assert.deepEqual(Object.keys(greenhouse).sort(), models["learning-model-greenhouse-effect"]);
assert.deepEqual(greenhouse.n({ greenhouseGasLevel: 125 }), { safeValues: { greenhouseGasLevel: 100 }, gasRatio: 1, retainedInfraredRatio: 0.72, escapingInfraredRatio: 0.28 });
assert.equal(greenhouse.n({ greenhouseGasLevel: Number.NaN }).safeValues.greenhouseGasLevel, 55);
runtimeAssertions += 3;

const landfill = await bundle("learning-model-landfill-water-pathways");
assert.deepEqual(Object.keys(landfill).sort(), models["learning-model-landfill-water-pathways"]);
assert.deepEqual(landfill.c({ waterEntry: 110, pathway: "gas" }), { waterEntry: 100, pathway: "gas" });
assert.equal(landfill.a("gas"), 1);
assert.equal(landfill.i(0.49), "leachate");
assert.deepEqual([landfill.o(19), landfill.o(20), landfill.o(65)], ["dry", "moderate", "heavy"]);
runtimeAssertions += 5;

const harmonic = await bundle("learning-model-harmonic-wave");
assert.deepEqual(Object.keys(harmonic).sort(), models["learning-model-harmonic-wave"]);
assert.deepEqual(harmonic.n({ fundamentalHz: 2, harmonicMagnitude: 0 }), { fundamentalHz: 2, harmonicHz: 4, harmonicMagnitude: 0, hasHarmonic: false });
const wave = harmonic.i(1, 2, 4);
assert.equal(wave.length, 5);
assert.ok(Math.abs(wave[1].y) < 1e-12);
runtimeAssertions += 4;

const percent = await bundle("learning-model-percent-of-whole");
assert.deepEqual(Object.keys(percent).sort(), models["learning-model-percent-of-whole"]);
assert.deepEqual(percent.n({ percent: 37.4 }), { percent: 37, highlightedParts: 37, totalParts: 100, decimal: 0.37, decimalLabel: "0.37" });
assert.equal(percent.i({ percent: -8 }).percent, 0);
runtimeAssertions += 3;

const stereo = await bundle("learning-model-stereo-panning");
assert.deepEqual(Object.keys(stereo).sort(), models["learning-model-stereo-panning"]);
assert.deepEqual(stereo.n({ pan: -100 }), { pan: -100, left: 1, right: 0, leftPercent: 100, rightPercent: 0, markerPercent: 0, isCenter: false, isFullLeft: true, isFullRight: false, strongerSide: "left" });
assert.equal(stereo.n({ pan: 500 }).pan, 100);
runtimeAssertions += 3;

const market = await bundle("learning-model-market-equilibrium");
assert.deepEqual(Object.keys(market).sort(), models["learning-model-market-equilibrium"]);
assert.deepEqual(market.r({ scenario: 3 }), { scenario: 3, demandShift: 3, supplyShift: 0, quantity: 9.5, rate: 11.5, reciprocalRate: 1 / 11.5 });
assert.equal(market.i(8, 2), 12);
assert.equal(market.a(8, 2), 8);
runtimeAssertions += 4;

const elimination = await bundle("learning-model-elimination-reactions");
assert.deepEqual(Object.keys(elimination).sort(), models["learning-model-elimination-reactions"]);
assert.deepEqual(elimination.r({ initial_conditions: "primary-strong-base-e2", stage: 9 }), { conditions: "primary-strong-base-e2", pathway: "E2", tertiary: false, stage: 2, maxStage: 2 });
assert.deepEqual(elimination.i({ stage: 3 }, "tertiary-strong-base-e2"), { stage: 1, initial_conditions: "tertiary-strong-base-e2" });
runtimeAssertions += 3;

const chromatography = await bundle("learning-model-paper-chromatography");
assert.deepEqual(Object.keys(chromatography).sort(), models["learning-model-paper-chromatography"]);
assert.deepEqual(chromatography.n({ example: "leaf pigments", development: 50, selectedComponent: 2 }), { example: "leaf pigments", development: 50, selectedComponent: 2, frontDistanceCm: 5, componentDistanceCm: 4, rf: 0.8, rfValues: [0.2, 0.5, 0.8] });
assert.equal(chromatography.n({ development: 0 }).development, 1);
runtimeAssertions += 3;

const oddNumbers = await bundle("learning-model-odd-number-square-sum");
assert.deepEqual(Object.keys(oddNumbers).sort(), models["learning-model-odd-number-square-sum"]);
assert.deepEqual(oddNumbers.n({ n: 4 }), { n: 4, newestOddNumber: 7, squareArea: 16, terms: [1, 3, 5, 7], sumLatex: "1+3+5+7=16=4^{2}" });
assert.equal(oddNumbers.i(99), 8);
runtimeAssertions += 3;

const molarity = await bundle("learning-model-molarity");
assert.deepEqual(Object.keys(molarity).sort(), models["learning-model-molarity"]);
assert.deepEqual(molarity.r({ moles: 1.2, volumeLiters: 0.8 }), { moles: 1.2, volumeLiters: 0.8, molarity: 1.4999999999999998, volumeMilliliters: 800 });
assert.deepEqual(molarity.a({ moles: 9, volumeLiters: 0 }), { moles: 2, volumeLiters: 0.5 });
runtimeAssertions += 3;

console.log(`${sourceAssertions} source assertions and ${runtimeAssertions} runtime assertions passed`);
