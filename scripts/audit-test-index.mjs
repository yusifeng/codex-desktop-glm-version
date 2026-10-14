import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const scriptsDirectory = path.join(root, "scripts");
const indexPath = path.join(scriptsDirectory, "test-index.md");
const testFiles = fs
  .readdirSync(scriptsDirectory)
  .filter((file) => /^test-.*\.mjs$/.test(file))
  .sort();
const testFileSet = new Set(testFiles);
const index = fs.readFileSync(indexPath, "utf8");
const declaredTotal = Number(index.match(/^Total scripts: (\d+)\.$/m)?.[1]);
const references = [...index.matchAll(/\((?:\.\/)?(test-[^)]+\.mjs)\)/g)].map((match) => match[1]);
const referenceCounts = new Map();
for (const reference of references) {
  referenceCounts.set(reference, (referenceCounts.get(reference) ?? 0) + 1);
}

const missing = testFiles.filter((file) => !referenceCounts.has(file));
const stale = [...referenceCounts.keys()].filter((file) => !testFileSet.has(file)).sort();
const duplicates = [...referenceCounts.entries()]
  .filter(([, count]) => count > 1)
  .sort(([left], [right]) => left.localeCompare(right));
const failures = [];
if (declaredTotal !== testFiles.length) failures.push(`declared total ${declaredTotal} != actual ${testFiles.length}`);
if (missing.length > 0) failures.push(`missing (${missing.length}): ${missing.join(", ")}`);
if (stale.length > 0) failures.push(`stale (${stale.length}): ${stale.join(", ")}`);
if (duplicates.length > 0) {
  failures.push(`duplicates (${duplicates.length}): ${duplicates.map(([file, count]) => `${file} x${count}`).join(", ")}`);
}

if (failures.length > 0) {
  console.error(`test-index audit failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`test-index audit passed: ${testFiles.length} scripts, all uniquely indexed`);
}
