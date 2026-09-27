import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHUNKS, INCREMENTAL_HUBS } from "./renderer-chunk-manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RENDERER = path.join(ROOT, "src/renderer");
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "types" ? [] : walk(target);
    return entry.isFile() && /\.tsx?$/.test(entry.name) ? [target] : [];
  });
}

const rendererSources = walk(RENDERER).map((file) => [file, fs.readFileSync(file, "utf8")]);
function inspectHub(name) {
  const chunk = CHUNKS[name];
  const source = fs.readFileSync(path.join(ROOT, "src/webview/assets", chunk.replace(/\.js$/, ".ts")), "utf8");
  const exportBlock = source.slice(source.lastIndexOf("export {"));
  const imports = rendererSources.flatMap(([file, rendererSource]) => [...rendererSource.matchAll(new RegExp(`import\\s+([^;]+?)\\s+from\\s+["']@rchunk/${name}["']|import\\s+["']@rchunk/${name}["']`, "g"))].map((match) => ({ file, clause: match[1] })));
  return { chunk, exportCount: [...exportBlock.matchAll(/\b[A-Za-z_$][\w$]*\s+as\s+[A-Za-z_$][\w$]*/g)].length, imports, strategy: INCREMENTAL_HUBS.get(name) };
}

const artifactSource = inspectHub("artifact-source-bootstrap");
assert.equal(artifactSource.strategy, "typed-consumer-surface");
assert.equal(typeof artifactSource.chunk, "string");
assert.equal(artifactSource.exportCount, 79);
assert.ok(artifactSource.imports.length > 0 && artifactSource.imports.every((item) => item.clause == null));
const textUnderline = inspectHub("text-underline-icon");
assert.equal(textUnderline.strategy, "typed-consumer-surface");
assert.equal(typeof textUnderline.chunk, "string");
assert.equal(textUnderline.exportCount, 37);
assert.ok(textUnderline.imports.length > 0 && textUnderline.imports.every((item) => item.clause == null));
const surfaceStyle = inspectHub("popcorn-electron-surface-style");
assert.equal(surfaceStyle.strategy, "typed-consumer-surface");
assert.equal(typeof surfaceStyle.chunk, "string");
assert.equal(surfaceStyle.exportCount, 65);
assert.ok(surfaceStyle.imports.length > 0 && surfaceStyle.imports.every((item) => item.clause == null));

const importedSetup = inspectHub("use-imported-setup-opportunity");
assert.equal(importedSetup.strategy, "typed-consumer-surface");
assert.equal(typeof importedSetup.chunk, "string");
assert.equal(importedSetup.exportCount, 74);
assert.ok(importedSetup.imports.some((item) => item.clause?.includes("* as importedSetupChunk")));
const checklistSource = fs.readFileSync(path.join(RENDERER, "sidebar-onboarding-checklist/index.ts"), "utf8");
assert.match(checklistSource, /ft:\s*resolveImportedSetupLabel[\s\S]*pt:\s*projectImportedSetupItems/);
const declarationSource = fs.readFileSync(path.join(RENDERER, "types/rchunk-modules.d.ts"), "utf8");
const importedSetupDeclaration = declarationSource.slice(declarationSource.indexOf('declare module "@rchunk/use-imported-setup-opportunity"'), declarationSource.indexOf('declare module "@rchunk/sidebar-onboarding-checklist"'));
assert.doesNotMatch(importedSetupDeclaration, /\bany\b/);

const checkoutSession = inspectHub("checkout-session");
assert.equal(checkoutSession.strategy, "typed-consumer-surface");
assert.equal(typeof checkoutSession.chunk, "string");
assert.equal(checkoutSession.exportCount, 60);
assert.ok(checkoutSession.imports.length > 0 && checkoutSession.imports.every((item) => item.clause == null));

console.log("22 renderer incremental hub assertions passed");
