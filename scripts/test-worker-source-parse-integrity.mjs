import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import * as acorn from "acorn";

const root = path.resolve(import.meta.dirname, "..");
const originalsDirectory = path.join(root, ".reference/originals/main");
const originalFiles = (await fs.readdir(originalsDirectory)).filter((file) => file.endsWith(".ts")).sort();
const parsedOriginals = new Map();
let assertions = 0;

function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

for (const file of originalFiles) {
  const source = await fs.readFile(path.join(originalsDirectory, file), "utf8");
  const ast = acorn.parse(source, { ecmaVersion: "latest", sourceType: "script" });
  parsedOriginals.set(file, { ast, source });
  check(true, `${file} remains parseable`);
}

const { source: workerSource } = parsedOriginals.get("worker.ts");

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

function findTopLevelZeroConsumerDefinitions(ast) {
  const topLevelDefinitions = new Set();
  for (const node of ast.body) {
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
  countDefinitionReferences(ast);
  return [...referenceCounts]
    .filter(([, references]) => references === 1)
    .map(([name]) => name)
    .sort();
}

const expectedVendorInitializers = ["Dj", "Qfe", "Zfe", "fp", "pp", "up"];
for (const [file, { ast }] of parsedOriginals) {
  const actual = findTopLevelZeroConsumerDefinitions(ast);
  const expected = file === "main-C-Mhak1n.ts" ? expectedVendorInitializers : [];
  check(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${file} zero-consumer definitions match reviewed vendor initializers: ${actual.join(", ")}`,
  );
}

console.log(`test-worker-source-parse-integrity: ${assertions} assertions passed`);
