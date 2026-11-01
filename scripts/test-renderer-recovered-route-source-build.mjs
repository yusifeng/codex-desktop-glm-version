import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { CHUNKS, REWRITTEN } from "./renderer-chunk-manifest.mjs";
import { collectConversationRouteClosure } from "./renderer-route-recovery.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = path.join(root, "src/renderer-recovered/conversation-route");
const manifest = JSON.parse(await fs.readFile(path.join(sourceDirectory, "manifest.json"), "utf8"));
const recovered = await collectConversationRouteClosure(sourceDirectory);
const recoveredModules = [...recovered].sort();

assert.equal(recovered.size, manifest.moduleCount, "route source closure matches its declared module count");
assert.deepEqual(recoveredModules, manifest.modules, "route source manifest contains the complete dependency closure");

const diskModules = (await fs.readdir(sourceDirectory)).filter((name) => name.endsWith(".js")).sort();
assert.deepEqual(diskModules, recoveredModules, "route source directory has neither missing nor orphaned JavaScript modules");

const compiledModules = await Promise.all(
  recoveredModules.map(async (name) => {
    const source = await fs.readFile(path.join(sourceDirectory, name), "utf8");
    return esbuild.transform(source, {
      target: "esnext",
      charset: "utf8",
      legalComments: "inline",
      format: "esm",
      loader: "js",
      sourcefile: name,
    });
  }),
);
assert.equal(compiledModules.length, recovered.size, "every recovered route source module compiles as ESM");

const buildSource = await fs.readFile(path.join(root, "scripts/build-renderer.mjs"), "utf8");
assert.match(buildSource, /esbuild\.transform\(source,\s*\{/, "renderer build compiles recovered route modules as source");
assert.doesNotMatch(buildSource, /fs\.copyFile\(/, "renderer build never copies published JavaScript into runtime output");
assert.doesNotMatch(buildSource, /\.reference\/app-original/, "renderer build has no release-tree runtime dependency");

const supersededDrafts = [...REWRITTEN].filter((name) => recovered.has(CHUNKS[name]));
assert.ok(supersededDrafts.length > 0, "recovered route graph supersedes incomplete semantic drafts");
assert.match(buildSource, /recoveredRouteChunks\.has\(CHUNKS\[name\]\)/, "superseded drafts are skipped instead of built and overwritten");

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
const uncoveredDrafts = structuralDrafts.filter(({ output }) => output == null || !recovered.has(output));
assert.deepEqual(uncoveredDrafts, [], "every structural component draft is superseded by a complete recovered source module");

console.log(`10 recovered route source-build assertions passed (${recovered.size} modules compiled, ${supersededDrafts.length} drafts skipped, ${structuralDrafts.length} structural drafts covered)`);
