import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__paymentMethodEditorTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "payment-method-editor-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__paymentMethodEditorTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function nodes(root) { const output = []; const visit = value => { if (value == null || typeof value !== "object") return; output.push(value); const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(visit); else visit(children); }; visit(root); return output; }
function find(root, predicate) { return nodes(root).find(predicate); }
function text(root) { return nodes(root).flatMap(node => typeof node.props?.children === "string" ? [node.props.children] : []).join(" "); }

const addReleaseAssertions = assertReleaseOwner("add-payment-method");

const editReleaseAssertions = assertReleaseOwner("edit-payment-method");

console.log(`${addReleaseAssertions + editReleaseAssertions} payment method release assertions passed`);
