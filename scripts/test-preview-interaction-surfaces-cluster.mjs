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

// profile-site-details: 13
const profile = await bundle("profile-site-details");
assert.deepEqual(Object.keys(profile), ["ShowcaseSiteDetails"]);
let closed = 0; let opened; let copied;
const site = profile.ShowcaseSiteDetails({ creatorName: "Ada", onClose() { closed++; }, onCopyLink(url) { copied = url; return true; }, onOpenSite(url) { opened = url; }, site: { title: "Portfolio", thumbnail_url: "preview.png", open_url: "https://example.com" } });
assert.equal(site.type, "section");
assert.equal(site.props["aria-label"], "Site preview");
assert.equal(children(site)[0].props.children[1].props.children, "https://example.com · Ada");
assert.equal(children(site)[1].props.children.type, "img");
assert.equal(children(site)[1].props.children.props.alt, "Portfolio site preview");
const actions = children(site)[2].props.children;
await actions[0].props.onClick();
assert.equal(copied, "https://example.com");
actions[1].props.onClick();
assert.equal(opened, "https://example.com");
children(site)[0].props.children[2].props.onClick();
assert.equal(closed, 1);
const unavailable = profile.ShowcaseSiteDetails({ onClose() {}, site: { title: "Draft" } });
assert.equal(children(unavailable)[1].props.children.props["data-site-preview-fallback"], true);
assert.equal(children(unavailable)[2].props.children[0].props.disabled, true);
assert.equal(children(unavailable)[2].props.children[1].props.disabled, true);
assert.equal(children(unavailable)[0].props.children[1].props.children, "Draft");

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
