import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/debug/export-logs.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const functionNode = (name) => ast.body.find((node) => node.type === "FunctionDeclaration" && node.id?.name === name);
for (const name of ["collectLogFiles", "mergeAndWrite", "exportLogs"]) {
  assert.ok(functionNode(name), `${name} must exist`);
  assertions += 1;
}
const timestampNode = functionNode("lineTimestampMs");
const mergeNode = functionNode("mergeAndWrite");
const contents = new Map([
  ["a.log", "2026-10-31T10:00:00Z second\nuntimed-a\n"],
  ["b.log", "2026-10-31T09:00:00Z first\nuntimed-b\n"],
]);
const mergeAndWrite = Function(
  "readFile", "exportLogsLogger",
  `${transpiled.code.slice(timestampNode.start, timestampNode.end)}\n${transpiled.code.slice(mergeNode.start, mergeNode.end)}; return mergeAndWrite;`,
)(async (path) => contents.get(path), () => ({ error() {} }));
equal(await mergeAndWrite(["b.log", "a.log"]), [
  "2026-10-31T09:00:00Z first",
  "2026-10-31T10:00:00Z second",
  "untimed-a",
  "untimed-b",
  "",
].join("\n"));
equal(await mergeAndWrite([]), "");

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
for (const name of ["HN", "Dje", "Oje", "kje", "Aje", "jje", "Mje", "Nje", "Pje", "Fje", "Ije", "Lje", "Rje"]) {
  equal(new RegExp(`\\b${name}\\b`).test(main), false);
}
equal(main.includes("var zje = DebugService,"), true);
console.log(`${assertions} main export logs owner assertions passed`);
