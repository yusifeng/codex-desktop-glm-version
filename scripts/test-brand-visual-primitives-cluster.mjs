import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__brandVisualTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "brand-visual-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__brandVisualTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function all(node, predicate) { const result = []; walk(node, value => { if (predicate(value)) result.push(value); }); return result; }

// google-logo: 9
const google = await bundle("google-logo");
assert.deepEqual(Object.keys(google), ["n", "t"]);
const googleUi = google.t({ className: "brand" });
assert.equal(googleUi.type, "svg");
assert.equal(googleUi.props.width, 24);
assert.equal(googleUi.props.height, 24);
assert.equal(googleUi.props.role, "img");
assert.equal(googleUi.props["aria-label"], "Google");
assert.equal(googleUi.props.className, "brand");
assert.equal(all(googleUi, node => node.type === "path").length, 4);
assert.equal(google.n(), undefined);

const colorIconReleaseAssertions = assertReleaseOwner("color-icon");

// animated-icon: 11
const animated = await bundle("animated-icon");
assert.deepEqual(Object.keys(animated), ["n", "t"]);
let ready = 0, completed = 0;
const animatedUi = animated.t({ animation: "loader", color: "red", loop: true, onReady() { ready++; }, onComplete() { completed++; } });
assert.equal(animatedUi.props["data-animation"], "loader");
assert.equal(animatedUi.props["data-animated"], true);
assert.equal(animatedUi.props["data-loop"], true);
assert.equal(find(animatedUi, node => node.type === "circle").props.r, 8);
assert.equal(find(animatedUi, node => node.type === "circle").props.stroke, "red");
animatedUi.props.ref();
assert.equal(ready, 1);
animatedUi.props.onAnimationEnd();
assert.equal(completed, 1);
assert.equal(animated.t({ animation: "hello", animated: false }).props["data-animated"], false);
assert.equal(animated.t({ animation: "memory", fallbackIcon: "fallback" }).props.children, "fallback");
assert.equal(animated.n(), undefined);

console.log(`20 brand visual primitive assertions and ${colorIconReleaseAssertions} color icon release assertions passed`);
