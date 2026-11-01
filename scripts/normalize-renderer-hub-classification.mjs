#!/usr/bin/env node
// Removes duplicate top-level hub classification records without reformatting
// the large evidence file.  When historical batches disagree, prefer the
// record whose sourceSymbol matches the current public export table; among
// exact matches, prefer a semantic owner over a preserved classification.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLASSIFICATIONS = path.join(ROOT, "docs/renderer-hub-line-classification.json");
const HUBS = {
  "app-shared": "app-shared-7b9edc1bfb7f.ts",
  "app-initial": "app-initial-51da50e6c6e3.ts",
  "app-primary": "app-primary-d66705000d76.ts",
};

function exportMap(hub) {
  const source = fs.readFileSync(path.join(ROOT, "src/webview/assets", HUBS[hub]), "utf8");
  const start = Math.max(source.lastIndexOf("export{"), source.lastIndexOf("export {"));
  return new Map(
    [...source.slice(start).matchAll(/(?<![A-Za-z0-9_$])([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)(?![A-Za-z0-9_$])/g)]
      .map((match) => [match[2], match[1]]),
  );
}

function objectRanges(source) {
  const ranges = [];
  let depth = 0;
  let start = -1;
  let quote = null;
  let escaped = false;
  for (let index = 0; index < source.length; index++) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"') {
      quote = character;
      continue;
    }
    if (character === "{") {
      if (depth === 1) start = index;
      depth++;
    } else if (character === "}") {
      depth--;
      if (depth === 1 && start >= 0) {
        ranges.push({ start, end: index + 1 });
        start = -1;
      }
    } else if (character === "[") depth++;
    else if (character === "]") depth--;
  }
  return ranges;
}

const source = fs.readFileSync(CLASSIFICATIONS, "utf8");
const ranges = objectRanges(source).map((range) => ({
  ...range,
  entry: JSON.parse(source.slice(range.start, range.end)),
}));
const mappings = Object.fromEntries(Object.keys(HUBS).map((hub) => [hub, exportMap(hub)]));
const hubLines = Object.fromEntries(
  Object.entries(HUBS).map(([hub, file]) => [
    hub,
    fs.readFileSync(path.join(ROOT, "src/webview/assets", file), "utf8").split("\n"),
  ]),
);
const groups = new Map();
for (const range of ranges) {
  const key = `${range.entry.hub}:${range.entry.alias}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(range);
}

const removals = [];
let duplicateKeys = 0;
for (const entries of groups.values()) {
  if (entries.length === 1) continue;
  duplicateKeys++;
  const actual = mappings[entries[0].entry.hub]?.get(entries[0].entry.alias);
  const ranked = [...entries].sort((left, right) => {
    const score = (item) =>
      (item.entry.sourceSymbol === actual ? 2 : 0) +
      (item.entry.classification === "semantic-business-logic" ? 1 : 0);
    return score(right) - score(left) || left.start - right.start;
  });
  const keep = ranked[0];
  removals.push(...entries.filter((entry) => entry !== keep));
}

console.log(`${ranges.length} records, ${groups.size} unique keys, ${duplicateKeys} duplicate keys, ${removals.length} duplicate records`);
if (process.argv.includes("--write") && removals.length > 0) {
  let output = source;
  for (const removal of removals.sort((left, right) => right.start - left.start)) {
    let start = removal.start;
    let end = removal.end;
    let cursor = end;
    while (/\s/.test(output[cursor] ?? "")) cursor++;
    if (output[cursor] === ",") {
      end = cursor + 1;
    } else {
      cursor = start - 1;
      while (/\s/.test(output[cursor] ?? "")) cursor--;
      if (output[cursor] !== ",") throw new Error(`cannot remove duplicate at ${start}`);
      start = cursor;
    }
    output = output.slice(0, start) + output.slice(end);
  }
  JSON.parse(output);
  fs.writeFileSync(CLASSIFICATIONS, output);
  console.log(`removed ${removals.length} duplicate records`);
}

if (process.argv.includes("--repair-semantic-ranges")) {
  let output = fs.readFileSync(CLASSIFICATIONS, "utf8");
  const repairs = [];
  for (const range of objectRanges(output)) {
    const entry = JSON.parse(output.slice(range.start, range.end));
    if (entry.classification !== "semantic-business-logic") continue;
    const lines = hubLines[entry.hub];
    const escaped = entry.sourceSymbol.replaceAll("$", "\\$");
    const pattern = new RegExp(`^(?:async\\s+)?(?:function|class|var|let|const)\\s+${escaped}(?![A-Za-z0-9_$])`);
    const current = lines.slice(entry.startLine - 1, entry.endLine).join("\n");
    const identifier = new RegExp(`(?<![A-Za-z0-9_$])${escaped}(?![A-Za-z0-9_$])`);
    if (identifier.test(current)) continue;
    const definitionIndex = lines.findIndex((line) => pattern.test(line.trimStart()));
    if (definitionIndex < 0) throw new Error(`cannot locate semantic definition ${entry.hub}:${entry.alias} -> ${entry.sourceSymbol}`);
    const span = entry.endLine - entry.startLine;
    const objectSource = output.slice(range.start, range.end)
      .replace(/("startLine"\s*:\s*)\d+/, `$1${definitionIndex + 1}`)
      .replace(/("endLine"\s*:\s*)\d+/, `$1${definitionIndex + 1 + span}`);
    repairs.push({ start: range.start, end: range.end, value: objectSource });
  }
  for (const repair of repairs.sort((left, right) => right.start - left.start)) {
    output = output.slice(0, repair.start) + repair.value + output.slice(repair.end);
  }
  JSON.parse(output);
  fs.writeFileSync(CLASSIFICATIONS, output);
  console.log(`repaired ${repairs.length} semantic source ranges`);
}
