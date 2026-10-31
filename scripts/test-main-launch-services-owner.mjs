import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/mac/launch-services.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const fn = (name) => ast.body.find((node) => node.type === "FunctionDeclaration" && node.id?.name === name);
const slice = (name) => { const node = fn(name); assert.ok(node); assertions += 1; return transpiled.code.slice(node.start, node.end); };

const calls = [];
const schema = { parse: (value) => value };
const listApplicationsForFile = Function(
  "invokeHelper", "applicationListSchema",
  `${slice("listApplicationsForFile")}; return listApplicationsForFile;`,
)(async (...args) => { calls.push(args); return ["app"]; }, schema);
equal(await listApplicationsForFile("/tmp/document.txt"), ["app"]);
equal(calls, [[['/tmp/document.txt'], schema]]);

const notifyDownloadComplete = Function(
  "invokeHelper", "literalSchema",
  `${slice("notifyDownloadComplete")}; return notifyDownloadComplete;`,
)(async (...args) => { calls.push(args); return true; }, (value) => ({ literal: value }));
equal(await notifyDownloadComplete("/tmp/download.zip"), undefined);
equal(calls.at(-1), [["notify-download-complete", "/tmp/download.zip"], { literal: true }]);

const exportsSource = source.slice(source.indexOf("export {"));
equal(exportsSource.includes("listApplicationsForFile"), true);
equal(exportsSource.includes("appForBundleId"), true);
equal(exportsSource.includes("listWebUrlHandlers"), true);
equal(exportsSource.includes("notifyDownloadComplete"), true);
equal(exportsSource.includes("setAppIcon"), true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('listApplicationsForFile: Nj'), true);
equal(main.includes("appForBundleId: Pj"), true);
equal(main.includes("listWebUrlHandlers: Fj"), true);
equal(main.includes("notifyDownloadComplete: Ij"), true);
equal(main.includes("setAppIcon: Lj"), true);
equal(main.includes("async function Nj("), false);
equal(main.includes("async function Pj("), false);
equal(main.includes("async function Fj("), false);
equal(main.includes("async function Ij("), false);
equal(main.includes("function Lj("), false);
equal(main.includes("function zj("), false);
equal(main.includes("{ listApplicationsForFile: Nj }"), true);
equal(main.includes("showItemInFolder: Ij"), true);
console.log(`${assertions} main launch services owner assertions passed`);
