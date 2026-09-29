#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { CHUNKS } from "./renderer-chunk-manifest.mjs";

const readEntries = (suffix) => {
  const document = JSON.parse(fs.readFileSync(`docs/misc-ui-utils-audit-${suffix}.json`, "utf8"));
  return Array.isArray(document) ? document : document.entries;
};

const catalog = JSON.parse(fs.readFileSync("docs/renderer-app-chunks.json", "utf8"));
const trackedFiles = new Set(Object.values(CHUNKS));
const entries = ["a", "b", "c"].flatMap(readEntries);
const auditedFiles = new Set(entries.map(({ file }) => file));
const expectedFiles = catalog["misc-ui-utils"].filter((file) => auditedFiles.has(file));
const currentPendingFiles = catalog["misc-ui-utils"].filter((file) => !trackedFiles.has(file));
const allowedClassifications = new Set([
  "semantic-small",
  "semantic-business-logic",
  "aggregation-runtime",
  "generated-icon-or-data",
  "vendor-generated-preserve",
]);
const allowedActions = new Set(["rewrite", "preserve", "incremental-hub", "further-consumer-audit"]);

assert.equal(entries.length, 678);
assert.equal(new Set(entries.map(({ file }) => file)).size, entries.length);
assert.deepEqual(entries.map(({ file }) => file), expectedFiles);
assert.ok(currentPendingFiles.every((file) => auditedFiles.has(file)), "current pending files must remain inside the audited baseline");
for (const entry of entries) {
  assert.ok(allowedClassifications.has(entry.classification), `${entry.file}: classification`);
  assert.ok(allowedActions.has(entry.action), `${entry.file}: action`);
  assert.ok(typeof (entry.suggestedSemanticName ?? entry.semantic) === "string", `${entry.file}: semantic name`);
  assert.ok(typeof entry.reason === "string" && entry.reason.length > 0, `${entry.file}: reason`);
  assert.ok(Array.isArray(entry.imports) && Array.isArray(entry.dynamicImports) && Array.isArray(entry.exports));
}

const countBy = (field) => Object.fromEntries(
  [...new Set(entries.map((entry) => entry[field]))].sort().map((value) => [value, entries.filter((entry) => entry[field] === value).length]),
);
console.log(`misc-ui-utils audit validated: ${entries.length} ordered, unique records`);
console.log(`classifications: ${JSON.stringify(countBy("classification"))}`);
console.log(`actions: ${JSON.stringify(countBy("action"))}`);
