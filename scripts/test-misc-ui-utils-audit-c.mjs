import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHUNKS } from "./renderer-chunk-manifest.mjs";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptsDir, "..");
const inventory = JSON.parse(fs.readFileSync(path.join(root, "docs/renderer-app-chunks.json"), "utf8"));
const audit = JSON.parse(fs.readFileSync(path.join(root, "docs/misc-ui-utils-audit-c.json"), "utf8"));
const tracked = new Set(Object.values(CHUNKS));
const expectedFiles = inventory["misc-ui-utils"].filter((file) => !tracked.has(file)).slice(452, 678);
const classifications = new Set(["semantic-small", "semantic-business-logic", "aggregation-runtime", "generated-icon-or-data", "vendor-generated-preserve"]);
const actions = new Set(["rewrite", "preserve", "incremental-hub", "further-consumer-audit"]);

assert.equal(audit.category, "misc-ui-utils");
assert.equal(audit.batch, "C");
assert.deepEqual(audit.pendingIndexRange, [452, 677]);
assert.equal(audit.expectedCount, 226);
assert.equal(audit.entries.length, 226);
assert.deepEqual(audit.entries.map((entry) => entry.file), expectedFiles, "audit entries must retain pending source order");
assert.equal(new Set(audit.entries.map((entry) => entry.file)).size, 226, "audit entries must not contain duplicate files");

for (const entry of audit.entries) {
  const sourcePath = path.join(root, "src/webview/assets", entry.file.replace(/\.js$/, ".ts"));
  assert.ok(fs.existsSync(sourcePath), "missing source for " + entry.file);
  assert.equal(entry.bytes, Buffer.byteLength(fs.readFileSync(sourcePath)), "byte count mismatch for " + entry.file);
  assert.ok(Array.isArray(entry.imports), "imports must be an array for " + entry.file);
  assert.ok(Array.isArray(entry.dynamicImports), "dynamicImports must be an array for " + entry.file);
  assert.ok(Array.isArray(entry.exports), "exports must be an array for " + entry.file);
  assert.equal(new Set(entry.imports).size, entry.imports.length, "duplicate imports for " + entry.file);
  assert.equal(new Set(entry.dynamicImports).size, entry.dynamicImports.length, "duplicate dynamic imports for " + entry.file);
  assert.equal(new Set(entry.exports).size, entry.exports.length, "duplicate exports for " + entry.file);
  assert.ok(classifications.has(entry.classification), "invalid classification for " + entry.file);
  assert.ok(actions.has(entry.action), "invalid action for " + entry.file);
  assert.equal(typeof entry.suggestedSemanticName, "string");
  assert.ok(entry.suggestedSemanticName.length > 0, "missing semantic name for " + entry.file);
  assert.equal(typeof entry.reason, "string");
  assert.ok(entry.reason.length > 20, "missing substantive reason for " + entry.file);
}

console.log("misc-ui-utils audit C validated: 226 ordered entries");
