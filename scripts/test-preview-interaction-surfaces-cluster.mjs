import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
globalThis.__previewSurfaceTest = { jsx };
async function bundle(directory) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "preview-surface-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__previewSurfaceTest.jsx;" : "export {};", loader: "js" })); } }] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}
const children = node => Array.isArray(node?.props?.children) ? node.props.children : [node?.props?.children];

assertReleaseOwner("profile-site-details");

assertReleaseOwner("annotation-comment-editor-card", [
  /@rchunk\/design-editor-state/,
  /@rchunk\/wheel-swipe-gesture/,
  /export \{ za as n, Vi as t \}/,
]);

assertReleaseOwner("artifact-viewer", [
  /@rchunk\/chatgpt-subagents-panel/,
  /pending-chatgpt-submit/,
  /export \{/,
]);

assertReleaseOwner("design-editor-state");

console.log("preview interaction surfaces and release owner assertions passed");
