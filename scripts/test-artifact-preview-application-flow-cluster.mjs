import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__artifactPreviewFlowTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } }, react: { useEffect(effect) { return effect(); }, useState(initial) { return [typeof initial === "function" ? initial() : initial, () => {}]; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "artifact-preview-flow-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => { let contents = "export {};"; if (importPath === "app-shared") contents = "export const I3=()=>globalThis.__artifactPreviewFlowTest.jsx;export const e6=()=>globalThis.__artifactPreviewFlowTest.react;"; else if (importPath === "library-file-download") contents = "export const i=async()=>\"text\";export const r=async()=>new Uint8Array();export const t=async()=>{};"; else if (importPath === "artifact-tab-content-electron") contents = "export const n=props=>({type:'artifact',props});"; else if (importPath === "library-json-preview") contents = "export const LibraryJsonPreview=props=>({type:'json',props});"; return { contents, loader: "js" }; }); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function all(node, predicate) { const result = []; walk(node, value => { if (predicate(value)) result.push(value); }); return result; }
function text(node) { const parts = []; const collect = value => { if (typeof value === "string" || typeof value === "number") parts.push(String(value)); else if (value != null && typeof value === "object") { const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); } }; collect(node); return parts.join(" "); }

const lightboxReleaseAssertions = assertReleaseOwner("chatgpt-image-lightbox");
const favoriteReleaseAssertions = assertReleaseOwner("chatgpt-generated-image-favorite");

assertReleaseOwner("presentation");

assertReleaseOwner("saved-memory-history");

assertReleaseOwner("artifact-preview-header");

// multiplayer-note: 6
const note = await bundle("multiplayer-note");
assert.deepEqual(Object.keys(note), ["MultiplayerNote"]);
assert.equal(find(note.MultiplayerNote({ isLoading: true, onClose() {} }), node => node.props?.role === "status").props.children, "Loading note");
assert.equal(find(note.MultiplayerNote({ error: "Denied", onClose() {} }), node => node.props?.role === "alert").props.children, "Denied");
let noteClosed = 0;
const noteUi = note.MultiplayerNote({ content: "Shared content", name: "Team note", onClose() { noteClosed++; } });
assert.equal(noteUi.props["aria-label"], "Team note");
assert.match(text(noteUi), /Shared content/);
find(noteUi, node => node.props?.children === "Close").props.onClick();
assert.equal(noteClosed, 1);

assertReleaseOwner("library-cloud-file-preview");

assertReleaseOwner("open-image-preview");

console.log("artifact preview application flow and release owner assertions passed");
