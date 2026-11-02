import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { CHUNKS, IMPORT_ALIASES, REWRITTEN } from "./renderer-chunk-manifest.mjs";
import {
  EXACT_ROUTE_SOURCE_OWNERS,
  RECONSTRUCTED_ROUTE_CORE,
  PROMOTED_ROUTE_DEPENDENCIES,
  PRESERVED_ROUTE_SOURCE_OUTPUTS,
  ROUTE_COMPATIBILITY_BOUNDARIES,
  SEMANTIC_ROUTE_OVERRIDES,
  collectConversationRouteClosure,
} from "./renderer-route-recovery.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = path.join(root, "src/renderer-recovered/conversation-route");
const releaseDirectory = path.join(root, ".reference/app-original/webview/assets");
function exportNames(source) {
  return [...source.matchAll(/export\s*\{([\s\S]*?)\};/g)]
    .flatMap((match) => match[1].split(","))
    .map((entry) => entry.trim().match(/(?:\bas\s+)?([\w$]+)$/)?.[1])
    .filter(Boolean)
    .sort();
}
const manifest = JSON.parse(await fs.readFile(path.join(sourceDirectory, "manifest.json"), "utf8"));
const recovered = await collectConversationRouteClosure(sourceDirectory);
const recoveredModules = [...recovered].sort();

assert.equal(recovered.size, manifest.moduleCount, "route source closure matches its declared module count");
assert.deepEqual(recoveredModules, manifest.modules, "route source manifest contains the complete dependency closure");

const diskModules = (await fs.readdir(sourceDirectory)).filter((name) => name.endsWith(".js")).sort();
assert.deepEqual(diskModules, recoveredModules, "route source directory has neither missing nor orphaned JavaScript modules");
assert.deepEqual(
  recoveredModules,
  [...ROUTE_COMPATIBILITY_BOUNDARIES.keys()].sort(),
  "route compatibility closure contains only reviewed vendor or generated boundaries",
);
assert.ok(
  [...ROUTE_COMPATIBILITY_BOUNDARIES.values()].every((reason) => /^(vendor|generated):/.test(reason)),
  "every route compatibility boundary has a vendor or generated reason",
);

const compiledModules = await Promise.all(
  recoveredModules.map(async (name) => {
    const source = await fs.readFile(path.join(sourceDirectory, name), "utf8");
    const transformed = await esbuild.transform(source, {
      target: "esnext",
      charset: "utf8",
      legalComments: "inline",
      format: "esm",
      loader: "js",
      sourcefile: name,
    });
    const output = name.replace(/\.ts$/, ".js");
    const releaseSource = await fs.readFile(path.join(releaseDirectory, output), "utf8");
    assert.deepEqual(
      exportNames(transformed.code),
      exportNames(releaseSource),
      `${output} preserves its published export ABI`,
    );
    return transformed;
  }),
);
assert.equal(compiledModules.length, recovered.size, "every recovered route source module compiles as ESM");

const preservedDirectory = path.join(root, "src/renderer-preserved/route-runtime");
const preservedManifest = JSON.parse(
  await fs.readFile(path.join(preservedDirectory, "manifest.json"), "utf8"),
);
const preservedOutputs = [...preservedManifest.outputs].sort();
assert.equal(
  preservedManifest.moduleCount,
  preservedOutputs.length,
  "preserved route manifest count matches its outputs",
);
assert.deepEqual(
  preservedOutputs,
  [...PRESERVED_ROUTE_SOURCE_OUTPUTS].sort(),
  "preserved route manifest matches the reviewed source-owner inventory",
);
const preservedSourceFiles = (await fs.readdir(preservedDirectory))
  .filter((name) => name.endsWith(".ts"))
  .sort();
assert.deepEqual(
  preservedSourceFiles,
  preservedOutputs.map((output) => output.replace(/\.js$/, ".ts")).sort(),
  "every preserved route output has exactly one TypeScript source",
);
const preservedCompiled = await Promise.all(
  preservedSourceFiles.map(async (name) => {
    const source = await fs.readFile(path.join(preservedDirectory, name), "utf8");
    assert.match(source, /^\/\/ @ts-nocheck -- preserved third-party or generated route boundary\./);
    return esbuild.transform(source, {
      target: "esnext",
      charset: "utf8",
      legalComments: "inline",
      format: "esm",
      loader: "ts",
      sourcefile: name,
    });
  }),
);
assert.equal(
  preservedCompiled.length,
  PRESERVED_ROUTE_SOURCE_OUTPUTS.size,
  "every preserved vendor/generated boundary compiles from TypeScript",
);

const semanticNamesByOutput = new Map();
for (const semanticName of REWRITTEN) {
  const output = CHUNKS[semanticName];
  if (output != null && !semanticNamesByOutput.has(output)) semanticNamesByOutput.set(output, semanticName);
}
const missingPromotedDependencies = [];
for (const output of PROMOTED_ROUTE_DEPENDENCIES) {
  const semanticName = semanticNamesByOutput.get(output);
  if (semanticName == null) continue;
  const source = await fs.readFile(path.join(root, "src/renderer", semanticName, "index.ts"), "utf8");
  for (const match of source.matchAll(/@rchunk\/([A-Za-z0-9_$-]+)/g)) {
    const dependency = CHUNKS[match[1]] ?? IMPORT_ALIASES[match[1]];
    if (dependency == null) continue;
    const dependencySemanticName = semanticNamesByOutput.get(dependency);
    const hasSemanticOwner = dependencySemanticName != null && !recovered.has(dependency);
    const hasTransformOwner = await fs
      .access(path.join(root, "src/webview/assets", dependency.replace(/\.js$/, ".ts")))
      .then(() => true, () => false);
    if (!hasSemanticOwner && !hasTransformOwner && !recovered.has(dependency) && !RECONSTRUCTED_ROUTE_CORE.has(dependency)) {
      missingPromotedDependencies.push(`${output} -> ${dependency}`);
    }
  }
}
assert.deepEqual(
  missingPromotedDependencies,
  [],
  "semantic route overrides have a checked-in owner for every static chunk dependency",
);

const buildSource = await fs.readFile(path.join(root, "scripts/build-renderer.mjs"), "utf8");
assert.match(buildSource, /esbuild\.transform\(source,\s*\{/, "renderer build compiles recovered route modules as source");
assert.match(
  buildSource,
  /preserved vendor\/generated route sources/,
  "renderer build compiles preserved route boundaries from checked-in TypeScript",
);
assert.doesNotMatch(buildSource, /fs\.copyFile\(/, "renderer build never copies published JavaScript into runtime output");
assert.doesNotMatch(buildSource, /\.reference\/app-original/, "renderer build has no release-tree runtime dependency");
const aggregateBuildSource = await fs.readFile(path.join(root, "scripts/build.mjs"), "utf8");
assert.match(
  aggregateBuildSource,
  /await import\("\.\/build-renderer\.mjs"\)/,
  "aggregate build finishes with semantic renderer emission",
);

assert.equal(EXACT_ROUTE_SOURCE_OWNERS.size, 0, "renderer source recovery has no exact route owners");
assert.doesNotMatch(buildSource, /exactOutput|"exact\.js"/, "renderer build has no exact-owner escape hatch");
assert.match(buildSource, /\^@exact-chunk/, "renderer build externalizes exact route dependencies");

const supersededDrafts = [...REWRITTEN].filter((name) => recovered.has(CHUNKS[name]));
const unreviewedSupersededDrafts = supersededDrafts.filter(
  (name) => !ROUTE_COMPATIBILITY_BOUNDARIES.has(CHUNKS[name]),
);
assert.deepEqual(
  unreviewedSupersededDrafts,
  [],
  "only reviewed vendor or generated boundaries may supersede a semantic draft",
);

const rendererDirectory = path.join(root, "src/renderer");
const structuralDrafts = [];
for (const entry of await fs.readdir(rendererDirectory, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
  const file = path.join(entry.parentPath, entry.name);
  const source = await fs.readFile(file, "utf8");
  if (!/ThreadViewNode|interface\s+ViewNode|return\s+\{\s*kind:[\s\S]{0,200}?props:/.test(source)) continue;
  const semanticName = path.relative(rendererDirectory, file).split(path.sep)[0];
  structuralDrafts.push({ file, output: CHUNKS[semanticName] });
}
const uncoveredDrafts = structuralDrafts.filter(
  ({ output }) => output == null || !recovered.has(output),
);
assert.deepEqual(uncoveredDrafts, [], "no structural component draft remains in a runtime source owner");

console.log(
  `recovered route source-build assertions passed (${recovered.size} compatibility modules, ${PRESERVED_ROUTE_SOURCE_OUTPUTS.size} preserved TypeScript boundaries, ${EXACT_ROUTE_SOURCE_OWNERS.size} exact owners, ${structuralDrafts.length} structural drafts covered)`,
);
