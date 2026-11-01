import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import * as acorn from "acorn";

const root = path.resolve(import.meta.dirname, "..");
const workerPath = path.join(root, ".reference/originals/main/worker.ts");
const preloadPath = path.join(root, ".reference/originals/main/browser-page-preload.ts");
const workerSource = await fs.readFile(workerPath, "utf8");
const preloadSource = await fs.readFile(preloadPath, "utf8");
let assertions = 0;

function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

const workerAst = acorn.parse(workerSource, { ecmaVersion: "latest", sourceType: "script" });
check(true, "worker source remains parseable");
acorn.parse(preloadSource, { ecmaVersion: "latest", sourceType: "script" });
check(true, "preload source remains parseable");

check(
  workerSource.match(/\.regex\(\/\^\[a-fA-F0-9\]\{64\}\$\/\)/g)?.length === 2,
  "both SHA-256 schemas retain the complete hexadecimal character class",
);
check(!workerSource.includes("a-fA-formatLocalBranchRef-9"), "corrupted ref-format replacement stays absent");
check(
  workerSource.includes('const { startParcelWatcher } = require("./worker/parcel-watcher-runtime");'),
  "worker imports the semantic Parcel watcher runtime",
);
check(workerSource.includes("return startParcelWatcher(e, t);"), "worker delegates watcher startup to the semantic runtime");
check(!workerSource.includes("var fDe = class"), "dead Parcel watcher class stays removed");
check(!workerSource.includes("async function pDe(e)"), "dead directory probe stays removed");
check(!workerSource.includes("async function M9(e)"), "dead missing-path probe stays removed");

for (const deadImport of [
  "parcel-watcher-options",
  "parcel-watcher-events",
  "parcel-watcher-paths",
  "parcel-watcher-errors",
]) {
  check(!workerSource.includes(`require("./worker/${deadImport}")`), `${deadImport} dead entry import stays removed`);
}

for (const deadDefinition of ["kpe = 67108864", "mxe = 6e4", "L8 = new Map()", "lSe = 60", "Q8 = new Map()", "Uwe = 100"]) {
  check(!workerSource.includes(deadDefinition), `${deadDefinition} zero-consumer residue stays removed`);
}

const topLevelDefinitions = new Set();
for (const node of workerAst.body) {
  if ((node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") && node.id) {
    topLevelDefinitions.add(node.id.name);
  }
  if (node.type === "VariableDeclaration") {
    for (const declaration of node.declarations) {
      if (declaration.id.type === "Identifier") topLevelDefinitions.add(declaration.id.name);
    }
  }
}
const referenceCounts = new Map([...topLevelDefinitions].map((name) => [name, 0]));
function countDefinitionReferences(node) {
  if (node == null || typeof node !== "object") return;
  if (node.type === "Identifier" && referenceCounts.has(node.name)) {
    referenceCounts.set(node.name, referenceCounts.get(node.name) + 1);
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === "start" || key === "end") continue;
    if (Array.isArray(value)) value.forEach(countDefinitionReferences);
    else countDefinitionReferences(value);
  }
}
countDefinitionReferences(workerAst);
const zeroConsumerDefinitions = [...referenceCounts]
  .filter(([, references]) => references === 1)
  .map(([name]) => name);
check(
  zeroConsumerDefinitions.length === 0,
  `worker has no top-level zero-consumer definitions: ${zeroConsumerDefinitions.join(", ")}`,
);

console.log(`test-worker-source-parse-integrity: ${assertions} assertions passed`);
