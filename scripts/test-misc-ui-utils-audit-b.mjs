import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHUNKS } from "./renderer-chunk-manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/renderer-app-chunks.json"), "utf8"))["misc-ui-utils"];
const audit = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/misc-ui-utils-audit-b.json"), "utf8"));
const tracked = new Set(Object.values(CHUNKS));
const expected = catalog.filter(file => !tracked.has(file)).slice(226, 452);
const fields = ["file", "bytes", "imports", "dynamicImports", "exports", "classification", "semantic", "action", "reason"];
const classifications = new Set(["semantic-small", "semantic-business-logic", "aggregation-runtime", "generated-icon-or-data", "vendor-generated-preserve"]);
const actions = new Set(["rewrite", "preserve", "incremental-hub", "further-consumer-audit"]);

assert.equal(audit.length, 226);
assert.deepEqual(audit.map(entry => entry.file), expected);
assert.equal(new Set(audit.map(entry => entry.file)).size, audit.length);
for (const entry of audit) {
  assert.deepEqual(Object.keys(entry), fields);
  const source = path.join(ROOT, "src/webview/assets", entry.file.replace(/.js$/, ".ts"));
  assert.equal(fs.existsSync(source), true, entry.file + " source exists");
  assert.equal(entry.bytes, fs.statSync(source).size, entry.file + " byte count");
  assert.equal(Array.isArray(entry.imports), true);
  assert.equal(Array.isArray(entry.dynamicImports), true);
  assert.equal(Array.isArray(entry.exports), true);
  assert.equal(entry.imports.every(value => typeof value === "string"), true);
  assert.equal(entry.dynamicImports.every(value => typeof value === "string"), true);
  assert.equal(entry.exports.every(value => typeof value === "string"), true);
  assert.equal(classifications.has(entry.classification), true, entry.file + " classification");
  assert.equal(actions.has(entry.action), true, entry.file + " action");
  assert.equal(typeof entry.semantic === "string" && entry.semantic.length > 0, true);
  assert.equal(typeof entry.reason === "string" && entry.reason.length >= 40, true);
}
console.log("misc-ui-utils audit B validated: " + audit.length + " ordered, unique records");
