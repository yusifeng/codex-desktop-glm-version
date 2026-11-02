import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__artifactPreviewTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "artifact-preview-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__artifactPreviewTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function findAll(node, predicate) { const values = []; walk(node, value => { if (predicate(value)) values.push(value); }); return values; }
function find(node, predicate) { return findAll(node, predicate)[0]; }
function byText(node, value) { return find(node, candidate => candidate.props?.children === value); }
function text(node) { const values = []; const collect = value => { if (typeof value === "string") values.push(value); else if (typeof value === "number") values.push(String(value)); else if (value != null && typeof value === "object") { const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); } }; collect(node); return values.join(" "); }

// library-json-preview: 9
const jsonPreview = await bundle("library-json-preview");
assert.deepEqual(Object.keys(jsonPreview), ["LibraryJsonPreview"]);
const validJson = jsonPreview.LibraryJsonPreview({ content: '{"ok":true}', fileName: "data.json" });
assert.equal(validJson.props["data-json-valid"], true);
assert.equal(validJson.props["aria-label"], "data.json JSON preview");
assert.match(text(validJson), /Valid JSON/);
assert.equal(find(validJson, node => node.type === "code").props["data-language"], "json");
assert.equal(find(validJson, node => node.type === "code").props.children, '{"ok":true}');
let stopped = 0;
validJson.props.onKeyDown({ stopPropagation() { stopped++; } });
assert.equal(stopped, 1);
const invalidJson = jsonPreview.LibraryJsonPreview({ content: "{", fileName: "bad.json" });
assert.equal(invalidJson.props["data-json-valid"], false);
assert.match(text(invalidJson), /Invalid JSON/);

assertReleaseOwner("notebook-preview-panel");

assertReleaseOwner("docx-preview-panel", [/export \{ [A-Za-z_$][\w$]* as DocxPreviewPanel \}/]);
assertReleaseOwner("pdf-preview-panel", [/export \{ [A-Za-z_$][\w$]* as PdfPreviewPanel \}/]);

console.log("artifact preview panel cluster and release owners passed");
