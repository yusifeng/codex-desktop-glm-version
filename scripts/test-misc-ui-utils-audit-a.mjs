import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHUNKS } from "./renderer-chunk-manifest.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceList = JSON.parse(
  fs.readFileSync(path.join(root, "docs/renderer-app-chunks.json"), "utf8"),
);
const audit = JSON.parse(
  fs.readFileSync(path.join(root, "docs/misc-ui-utils-audit-a.json"), "utf8"),
);
const tracked = new Set(Object.values(CHUNKS));
const expectedFiles = sourceList["misc-ui-utils"]
  .filter((file) => !tracked.has(file))
  .slice(0, 226);
const requiredFields = [
  "file",
  "bytes",
  "imports",
  "dynamicImports",
  "exports",
  "classification",
  "suggestedSemanticName",
  "action",
  "reason",
];
const classifications = new Set([
  "semantic-small",
  "semantic-business-logic",
  "aggregation-runtime",
  "generated-icon-or-data",
  "vendor-generated-preserve",
]);
const actions = new Set([
  "rewrite",
  "preserve",
  "incremental-hub",
  "further-consumer-audit",
]);
const dynamicImportsFrom = (source) =>
  [...source.matchAll(/import\(\s*[`"']\.\/([^`"']+)[`"']\s*\)/g)].map(
    (match) => match[1],
  );

assert.equal(audit.expectedCount, 226);
assert.deepEqual(audit.pendingIndexRange, [0, 225]);
assert.equal(audit.entries.length, 226);
assert.deepEqual(
  audit.entries.map((entry) => entry.file),
  expectedFiles,
  "audit must cover pending misc-ui-utils indices 0..225 in source order",
);
assert.equal(new Set(expectedFiles).size, expectedFiles.length, "source batch has duplicate files");
assert.equal(
  new Set(audit.entries.map((entry) => entry.file)).size,
  audit.entries.length,
  "audit has duplicate files",
);
assert.equal(
  new Set(audit.entries.map((entry) => entry.suggestedSemanticName)).size,
  audit.entries.length,
  "suggested semantic names must be unique",
);
for (const entry of audit.entries) {
  for (const field of requiredFields) assert.ok(field in entry, `${entry.file} lacks ${field}`);
  const sourcePath = path.join(
    root,
    "src/webview/assets",
    entry.file.replace(/\.js$/, ".ts"),
  );
  assert.ok(fs.existsSync(sourcePath), `${entry.file} source is missing`);
  assert.equal(fs.statSync(sourcePath).size, entry.bytes, `${entry.file} byte count changed`);
  const source = fs.readFileSync(sourcePath, "utf8");
  assert.ok(Array.isArray(entry.imports), `${entry.file} imports must be an array`);
  assert.ok(Array.isArray(entry.dynamicImports), `${entry.file} dynamicImports must be an array`);
  assert.deepEqual(
    entry.dynamicImports,
    dynamicImportsFrom(source),
    `${entry.file} dynamic imports changed`,
  );
  assert.ok(Array.isArray(entry.exports), `${entry.file} exports must be an array`);
  assert.ok(classifications.has(entry.classification), `${entry.file} classification is invalid`);
  assert.ok(actions.has(entry.action), `${entry.file} action is invalid`);
  assert.ok(entry.suggestedSemanticName.length > 0, `${entry.file} semantic name is empty`);
  assert.ok(entry.reason.length >= 40, `${entry.file} reason is too short`);
}
console.log("misc-ui-utils audit A: 226 entries validated");
