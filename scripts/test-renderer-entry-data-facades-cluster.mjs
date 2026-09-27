import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const calls = [];
const pdfNames = "AbortException AnnotationEditorLayer AnnotationEditorParamsType AnnotationEditorType AnnotationEditorUIManager AnnotationLayer AnnotationMode AnnotationType CSSConstants ColorPicker DOMSVGFactory DrawLayer FeatureTest GlobalWorkerOptions ImageKind InvalidPDFException MathClamp OPS OutputScale PDFDataRangeTransport PDFDateString PDFWorker PasswordResponses PermissionFlag PixelsPerInch RenderingCancelledException ResponseException SignatureExtractor SupportedImageMimeTypes TextLayer TouchManager Util VerbosityLevel XfaLayer applyOpacity build createValidAbsoluteUrl fetchData findContrastColor getDocument getFilenameFromUrl getPdfFilenameFromUrl getRGB getUuid getXfaPageViewport isDataScheme isPdfFile isValidExplicitDest noContextMenu normalizeUnicode renderRichText setLayerDimensions shadow stopEvent updateUrlHash version".split(" ");
globalThis.__entryFacadesTest = { calls, savedApi: { key: "api" }, savedStatus: { key: "status" }, note: { type: "note" }, writing: { type: "writing" } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "entry-facades-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => { const name = path.basename(importPath); let contents = "export {};"; if (name === "app-initial") contents = "export const FG=globalThis.__entryFacadesTest.savedApi;export const IG=globalThis.__entryFacadesTest.savedStatus;export const PG=()=>globalThis.__entryFacadesTest.calls.push('saved-init');export const Et=()=>globalThis.__entryFacadesTest.calls.push('app-init');export const Dt=async()=>({type:'app'});"; else if (name === "app-shared") contents = "export const N3=()=>({createRoot:()=>({render:v=>globalThis.__entryFacadesTest.calls.push(['render',v])})});"; else if (name === "version-history") contents = "export const n=()=>({type:'library-history'});export const t=()=>({type:'chat-history'});export const r=()=>globalThis.__entryFacadesTest.calls.push('history-init');"; else if (name === "library-cloud-file-preview") contents = "export const r=()=>globalThis.__entryFacadesTest.calls.push('cloud-init');"; else if (name === "modulepreload-polyfill") contents = "export const t=()=>globalThis.__entryFacadesTest.calls.push('preload-init');"; else if (name === "multiplayer-note") contents = "export const MultiplayerNote=globalThis.__entryFacadesTest.note;"; else if (name === "multiplayer-writing-block") contents = "export const MultiplayerWritingBlock=globalThis.__entryFacadesTest.writing;"; else if (name === "pdfjs-core") contents = pdfNames.map(exportName => `export const ${exportName}=${exportName === "GlobalWorkerOptions" ? "{workerSrc:'worker.js'}" : exportName === "getDocument" ? "value=>({document:value})" : JSON.stringify(exportName)}`).join(";"); return { contents, loader: "js" }; }); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }

// saved-entities-data: 4
const saved = await bundle("saved-entities-data");
assert.deepEqual(Object.keys(saved), ["savedEntitiesApi$", "savedEntityStatus$"]);
assert.equal(saved.savedEntitiesApi$.key, "api");
assert.equal(saved.savedEntityStatus$.key, "status");
assert.ok(calls.includes("saved-init"));

// file-preview-version-history: 4
const history = await bundle("file-preview-version-history");
assert.deepEqual(Object.keys(history), ["ChatGptFilePreviewVersionHistory", "LibraryFilePreviewVersionHistory"]);
assert.equal(history.ChatGptFilePreviewVersionHistory().type, "chat-history");
assert.equal(history.LibraryFilePreviewVersionHistory().type, "library-history");
assert.ok(calls.includes("history-init"));

// cloud-file-preview: 2
const cloud = await bundle("cloud-file-preview");
assert.deepEqual(Object.keys(cloud), ["t"]);
cloud.t();
assert.ok(calls.includes("cloud-init"));

// reset-image-library-state: 8
const reset = await bundle("reset-image-library-state");
assert.deepEqual(Object.keys(reset), ["n", "t"]);
let resetOptions;
reset.n({ resetQueries(options) { resetOptions = options; return "reset"; } }, ["one"]);
assert.deepEqual(resetOptions.queryKey, ["file", "image-src"]);
assert.equal(resetOptions.predicate({ queryKey: ["file", "image-src", "file-service://one", "chatgpt-conversation", null, "library-state"] }), true);
assert.equal(resetOptions.predicate({ queryKey: ["file", "image-src", "sediment://one", "chatgpt-conversation", null, "library-state"] }), true);
assert.equal(resetOptions.predicate({ queryKey: ["file", "image-src", "file-service://two", "chatgpt-conversation", null, "library-state"] }), false);
assert.equal(resetOptions.predicate({ queryKey: ["file", "image-src", "file-service://one", "other", null, "library-state"] }), false);
reset.n({ resetQueries(options) { resetOptions = options; } });
assert.equal(resetOptions.predicate({ queryKey: ["file", "image-src", "anything", "chatgpt-conversation", null, "library-state"] }), true);
assert.equal(typeof reset.t, "function");

// app-main: 2
const appMain = await bundle("app-main");
assert.deepEqual(Object.keys(appMain), []);
assert.ok(calls.includes("app-init"));

// index-entry: 3
const indexEntry = await bundle("index-entry");
assert.deepEqual(Object.keys(indexEntry), []);
assert.ok(calls.includes("preload-init"));
assert.equal(typeof indexEntry, "object");

// artifact-entry: 6
const artifact = await bundle("artifact-entry");
assert.deepEqual(Object.keys(artifact), ["n", "r", "t"]);
assert.equal(await artifact.n(), globalThis.__entryFacadesTest.note);
assert.equal(await artifact.r(), globalThis.__entryFacadesTest.writing);
assert.equal(typeof artifact.t, "function");
assert.doesNotThrow(() => artifact.t());
assert.equal((await artifact.n()).type, "note");

// portable-pdfjs-runtime: 8
const pdf = await bundle("portable-pdfjs-runtime");
assert.equal(Object.keys(pdf).length, pdfNames.length);
assert.deepEqual(Object.keys(pdf), [...pdfNames].sort());
assert.equal(pdf.GlobalWorkerOptions.workerSrc, "worker.js");
assert.equal(pdf.AbortException, "AbortException");
assert.equal(pdf.AnnotationEditorLayer, "AnnotationEditorLayer");
assert.equal(pdf.version, "version");
assert.deepEqual(pdf.getDocument({ data: new Uint8Array([1]) }), { document: { data: new Uint8Array([1]) } });
assert.equal(pdf.isPdfFile, "isPdfFile");

console.log("37 renderer entry and data facades cluster assertions passed");
