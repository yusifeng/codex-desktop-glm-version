import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__libraryPreviewPrimitivesTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "library-preview-primitives-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__libraryPreviewPrimitivesTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function nodes(root) { const output = []; const visit = value => { if (value == null || typeof value !== "object") return; if (Array.isArray(value)) return value.forEach(visit); output.push(value); visit(value.props?.children); }; visit(root); return output; }
function find(root, predicate) { return nodes(root).find(predicate); }
function text(root) { return nodes(root).flatMap(node => typeof node.props?.children === "string" ? [node.props.children] : []).join(" "); }

// library-file-preview-loading: 3
const loading = await bundle("library-file-preview-loading");
assert.deepEqual(Object.keys(loading), ["n", "t"]);
const loadingUi = loading.t();
assert.equal(find(loadingUi, node => node.props?.role === "status").props.children, "Loading");
assert.match(loadingUi.props.className, /library-file-preview-loading/);

// library-file-display-title: 7
const title = await bundle("library-file-display-title");
assert.deepEqual(Object.keys(title), ["n", "t"]);
const intl = { formatMessage(descriptor, values = {}) { return descriptor.defaultMessage.replaceAll(/\{(\w+)\}/g, (_, key) => values[key] ?? ""); } };
assert.equal(title.t("Study.flashcards", "flashcards", intl), "Study Flashcards");
assert.equal(title.t("Study (2).flashcards", "flashcards", intl), "Study Flashcards (2)");
assert.equal(title.t("flashcards.flashcards", "flashcards", intl), "Flashcards");
assert.equal(title.t("Quiz.learningquiz", "learning_quiz", intl), "Quiz");
assert.equal(title.t("Note.md", "writing_block", intl), "Note");
assert.equal(title.t("Site.html", "site_preview", intl), "Site");

assertReleaseOwner("library-file-preview-kind");

// render-file-children: 6
const render = await bundle("render-file-children");
assert.deepEqual(Object.keys(render), ["n", "t"]);
const rendered = render.n({ file: { name: "a" }, renderHeaderPrefix: () => "prefix", renderHeaderMetadata: () => "metadata", lineAnnotations: [{ line: 4 }], renderAnnotation: annotation => `note-${annotation.line}`, renderGutterUtility: () => "gutter" });
assert.equal(find(rendered, node => node.props?.slot === "header-prefix").props.children, "prefix");
assert.equal(find(rendered, node => node.props?.slot === "header-metadata").props.children, "metadata");
assert.equal(find(rendered, node => node.props?.slot === "line-4").props.children, "note-4");
assert.equal(find(rendered, node => node.props?.slot === "gutter-utility-slot").props.children, "gutter");
assert.equal(find(render.n({ file: {}, renderCustomHeader: () => "custom" }), node => node.props?.slot === "header").props.children, "custom");

assertReleaseOwner("preview-layout");
assertReleaseOwner("option-carousel");

// open-in-library-item: 4
const open = await bundle("open-in-library-item");
assert.deepEqual(Object.keys(open), ["n", "t"]);
let opened;
const openUi = open.t({ libraryFileId: "file / 1", onOpen(pathname) { opened = pathname; } });
assert.equal(openUi.props.children, "Open in Library");
openUi.props.onClick();
assert.equal(opened, "/library/file/file%20%2F%201");
const disabledOpen = open.t({ libraryFileId: "x", disabled: true, onOpen() { opened = "bad"; } });
disabledOpen.props.onClick();
assert.notEqual(opened, "bad");

// library-file-download: 6
const download = await bundle("library-file-download");
assert.deepEqual(Object.keys(download), ["a", "i", "n", "r", "t"]);
const originalFetch = globalThis.fetch;
const requests = [];
globalThis.fetch = async (url, options) => { requests.push({ url, options }); return new Response("hello"); };
const file = { file_name: "note.txt", downloadUrl: "https://example.test/note", requestHeaders: { Authorization: "token" } };
assert.equal(await download.i(file), "hello");
assert.deepEqual([...await download.r(file)], [104, 101, 108, 108, 111]);
assert.equal(requests[0].url, file.downloadUrl);
assert.equal(requests[0].options.headers.Authorization, "token");
await assert.rejects(download.n({ file_name: "missing" }), /unavailable/);
globalThis.fetch = originalFetch;

console.log("44 library preview primitives cluster assertions passed");
