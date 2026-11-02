import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return { type, props: props ?? {}, key }; } };
globalThis.__artifactControlsTest = { jsx, join(...values) { return values.filter(Boolean).join(" "); }, toolbar(props) { return { type: "toolbar", props }; }, action(props) { return { type: "action", props }; } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "artifact-controls-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => { const name = path.basename(importPath); const contents = name === "app-shared" ? "export const I3=()=>globalThis.__artifactControlsTest.jsx;export const m4=(...v)=>globalThis.__artifactControlsTest.join(...v);" : name === "popcorn-manual-edit-header-controls" ? "export const n=globalThis.__artifactControlsTest.toolbar;export const t=globalThis.__artifactControlsTest.action;" : "export {};"; return { contents, loader: "js" }; }); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
const childArray = node => Array.isArray(node?.props?.children) ? node.props.children : [node?.props?.children];

// presentation-annotation-coachmark: 6
const coachmark = await bundle("presentation-annotation-coachmark");
assert.deepEqual(Object.keys(coachmark), ["n", "t"]);
assert.equal(coachmark.t({ children: "deck", onDismiss() {}, open: false }).type, "Fragment");
let dismissed = 0;
const coach = coachmark.t({ children: "deck", onDismiss() { dismissed++; }, open: true });
assert.equal(coach.type, "section");
assert.equal(coach.props["aria-label"], "Add an annotation");
childArray(coach)[2].props.onClick();
assert.equal(dismissed, 1);
assert.equal(childArray(coach)[3], "deck");

// artifact-annotation-comment: 13
const annotations = await bundle("artifact-annotation-comment");
assert.deepEqual(Object.keys(annotations), ["a", "i", "n", "o", "r", "s", "t"]);
const payload = { annotationId: "a1", artifactKind: "presentation", body: "Move this", label: "Slide 1", target: { type: "presentation-region", x: 1 } };
const comment = annotations.t({ line: 4, path: "deck.pptx", payload, sourcePath: "src", title: "Deck" });
assert.equal(comment.position.line, 4);
assert.equal(comment.localArtifactAnnotationContext.annotationId, "a1");
assert.equal(comment.localArtifactAnnotationMetadata.target.type, "presentation-region");
assert.equal(annotations.t({ line: 1, path: "doc", payload: { ...payload, target: { type: "document-page-point" } } }), undefined);
const ordinary = { position: { line: 2 }, text: "normal" };
assert.deepEqual(annotations.n([comment, ordinary], "deck.pptx"), [comment]);
assert.deepEqual(annotations.n([comment], "other"), []);
assert.equal(annotations.i([comment])[0].body, "Move this");
assert.deepEqual(annotations.a({ currentComments: [], path: "deck.pptx", previousComments: [comment] }), ["a1"]);
assert.deepEqual(annotations.a({ currentComments: [comment], path: "deck.pptx", previousComments: [comment] }), []);
assert.deepEqual(annotations.s([comment, ordinary], "deck.pptx"), [ordinary]);
const ordinaryComments = [ordinary];
assert.equal(annotations.s(ordinaryComments, "deck.pptx"), ordinaryComments);
assert.equal(annotations.r([comment, ordinary]), 5);

// popcorn-manual-edit-header-controls: 10
const popcorn = await bundle("popcorn-manual-edit-header-controls");
assert.deepEqual(Object.keys(popcorn), ["a", "i", "n", "o", "r", "s", "t"]);
const surface = popcorn.o({ as: "button", className: "custom", children: "x" });
assert.equal(surface.type, "button");
assert.match(surface.props.className, /custom/);
assert.equal(surface.props["data-popcorn-header-surface"], "");
assert.equal(popcorn.r().props["data-popcorn-header-divider"], "");
assert.equal(popcorn.i({ title: "Deck" }).type, "div");
assert.equal(popcorn.n({ ariaLabel: "Tools", children: "items" }).props.role, "toolbar");
let actionClicks = 0;
const action = popcorn.t({ activeLabel: "Hide", label: "Show", onClick() { actionClicks++; }, pressed: true, children: "icon" });
assert.equal(action.props["aria-label"], "Hide");
assert.equal(action.props["aria-pressed"], true);
action.props.onClick();
assert.equal(actionClicks, 1);

assertReleaseOwner("binary-preview-source");

assertReleaseOwner("editor-header");

assertReleaseOwner("presentation-annotation-cursor-coachmark");

assertReleaseOwner("drawing-size-slider");

console.log("65 artifact annotation and editor controls cluster assertions passed");
