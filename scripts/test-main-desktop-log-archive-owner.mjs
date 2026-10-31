import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/feedback/desktop-log-archive.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const fn = (name) => ast.body.find((node) => node.type === "FunctionDeclaration" && node.id?.name === name);
for (const name of ["createFeedbackArchive", "createDesktopLogArchive", "deleteDesktopLogArchive", "collectChromeNativeHostDiagnostics", "collectProcessMemoryDiagnostics"]) {
  assert.ok(fn(name), `${name} must exist`); assertions += 1;
}
equal(source.includes('import { getWindowsSystemDiagnostics } from "../platform/windows-account";'), true);
equal(source.includes("? getWindowsSystemDiagnostics()"), true);
equal(source.includes("collectWindowsSystemDiagnostics"), false);

const createNode = fn("createDesktopLogArchive");
let archiveResult = { archiveId: "archive-1", filePaths: ["one.tar.gz"] };
const createDesktopLogArchive = Function(
  "createFeedbackArchive",
  `${transpiled.code.slice(createNode.start, createNode.end)}; return createDesktopLogArchive;`,
)(async () => archiveResult);
equal(await createDesktopLogArchive(), archiveResult);
archiveResult = { archiveId: null, filePaths: [] };
equal(await createDesktopLogArchive(), null);

const deleteNode = fn("deleteDesktopLogArchive");
const archivesById = new Map([["archive-1", "/tmp/archive-1"]]);
const removed = [];
const deleteDesktopLogArchive = Function(
  "archivesById", "rm", "logger",
  `${transpiled.code.slice(deleteNode.start, deleteNode.end)}; return deleteDesktopLogArchive;`,
)(archivesById, async (path, options) => removed.push({ path, options }), () => ({ warning() {} }));
equal(await deleteDesktopLogArchive("missing"), false);
equal(await deleteDesktopLogArchive("archive-1"), true);
equal(archivesById.has("archive-1"), false);
equal(removed, [{ path: "/tmp/archive-1", options: { force: true, recursive: true } }]);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('const { createDesktopLogArchive: URe, deleteDesktopLogArchive: TV, createFeedbackArchive: wV } = require("./main-app/feedback/desktop-log-archive.js");'), true);
equal(main.includes("async function URe("), false);
equal(main.includes("async function TV("), false);
equal(main.includes("async function wV("), false);
equal(main.includes("exports.n = TV"), true);
equal(main.includes("exports.t = URe"), true);
console.log(`${assertions} main desktop log archive owner assertions passed`);
