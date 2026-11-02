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

// annotation-comment-editor-card: 17
const annotation = await bundle("annotation-comment-editor-card");
assert.deepEqual(Object.keys(annotation), ["n", "t"]);
assert.equal(annotation.n(), undefined);
let mounted = 0; let adjusted = false;
const preview = annotation.t({ onMounted() { mounted++; }, onTweaksEditorOpenChange(value) { adjusted = value; }, session: { body: "Move this title", sessionId: "a1", surfaceMode: "preview" } });
assert.equal(preview.type, "article");
assert.equal(preview.props["data-session-id"], "a1");
assert.equal(children(preview)[0].props.children, "Move this title");
children(preview)[1].props.onClick();
assert.equal(adjusted, true);
assert.equal(mounted, 1);
let changed; let attached = false; let submitted;
const editor = annotation.t({ defaultCreateSubmitMode: "saved", onAttachmentPreviewOpenChange(value) { attached = value; }, onBodyChange(value) { changed = value; }, onSubmit(body, mode) { submitted = { body, mode }; }, session: { body: "Clarify", sessionId: "a2", surfaceMode: "composer" } });
assert.equal(editor.type, "form");
assert.equal(editor.props["data-annotation-editor"], "composer");
children(editor)[0].props.onChange({ currentTarget: { value: "Updated" } });
assert.equal(changed, "Updated");
children(editor)[1].props.onClick();
assert.equal(attached, true);
await children(editor).at(-1).props.onClick();
assert.deepEqual(submitted, { body: "Clarify", mode: "saved" });
let directBody;
const direct = annotation.t({ allowDirectSubmit: true, defaultCreateSubmitMode: "direct", onDirectSubmit(body) { directBody = body; }, session: { body: "Send now", sessionId: "a3", surfaceMode: "edit" } });
assert.equal(children(direct).at(-1).props.children, "Send");
await children(direct).at(-1).props.onClick();
assert.equal(directBody, "Send now");
const empty = annotation.t({ session: { body: "  ", sessionId: "a4", surfaceMode: "composer" } });
assert.equal(children(empty).at(-1).props.disabled, true);
assert.equal(children(empty)[0].props.autoFocus, true);
assert.equal(children(annotation.t({ showAdjustEntry: false, session: { body: "x", sessionId: "a5", surfaceMode: "preview" } }))[1], null);

assertReleaseOwner("artifact-viewer", [
  /@rchunk\/chatgpt-subagents-panel/,
  /pending-chatgpt-submit/,
  /export \{/,
]);

console.log("preview interaction surfaces and release owner assertions passed");
