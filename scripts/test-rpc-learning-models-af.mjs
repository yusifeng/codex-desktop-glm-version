import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.resolve(ROOT, "../chatgpt-desktop-src/app/webview/assets");
const models = [
];
const dependencies = (source, expression) => [...source.matchAll(expression)].map(match => match[1]);
const approximatelyEqual = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} ≈ ${expected}`);
let sourceAssertions = 0;
for (const [asset, directory] of models) {
  const original = fs.readFileSync(path.join(ASSET_ROOT, asset), "utf8");
  const recovered = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  const originalDependencies = dependencies(original, /from "\.\/([^"]+)\.js"/g).map(dependency => dependency.replace(/-[a-f0-9]{12}$/, ""));
  const recoveredDependencies = dependencies(recovered, /(?:from\s+|import\s*)["']@rchunk\/([^"']+)/g);
  assert.deepEqual(recoveredDependencies, originalDependencies);
  assert.equal((original.match(/import\(/g) ?? []).length, 0);
  assert.equal((recovered.match(/import\(/g) ?? []).length, 0);
  assert.equal(/\bany\b|@ts-expect-error/.test(recovered), false);
  sourceAssertions += 4;
}
async function bundle(directory) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: modulePath }) => ({ contents: modulePath === "app-shared" ? "export const G2 = value => value; export const K2 = () => {};" : "export {};", loader: "js" }));
  } }] });
  return import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64") + "#" + directory);
}
const loaded = new Map(); let runtimeAssertions = 0;
for (const [_asset, directory, expected] of models) { const module = await bundle(directory); loaded.set(directory, module); assert.deepEqual(Object.keys(module).sort(), [...expected].sort()); runtimeAssertions += 1; }











sourceAssertions += assertReleaseOwner("learning-model-array-queue-front-rear");
sourceAssertions += assertReleaseOwner("learning-model-binary-heap-operations");
sourceAssertions += assertReleaseOwner("learning-model-double-entry-transaction-effects");
sourceAssertions += assertReleaseOwner("learning-model-food-web");

sourceAssertions += assertReleaseOwner("learning-model-pcr-cycle");
sourceAssertions += assertReleaseOwner("learning-model-one-sample-t-test");
sourceAssertions += assertReleaseOwner("learning-model-sampling-distribution");
sourceAssertions += assertReleaseOwner("learning-model-rational-limits-at-infinity");
sourceAssertions += assertReleaseOwner("learning-model-mean-value-theorem");
sourceAssertions += assertReleaseOwner("learning-model-synthetic-division");
console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
