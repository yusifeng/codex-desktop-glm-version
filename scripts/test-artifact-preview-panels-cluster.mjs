import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
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

// notebook-preview-panel: 12
const notebook = await bundle("notebook-preview-panel");
assert.deepEqual(Object.keys(notebook), ["NotebookPreviewPanel"]);
let notebookDownloaded = 0, notebookClosed = 0;
const notebookUi = notebook.NotebookPreviewPanel({ title: "Analysis", onDownload() { notebookDownloaded++; }, onClose() { notebookClosed++; }, cells: [{ id: "m", cellType: "markdown", source: ["# ", "Summary"] }, { id: "c", cellType: "code", executionCount: 3, source: "print(1)", outputs: ["1", { value: 2 }] }] });
assert.match(text(notebookUi), /Analysis/);
assert.equal(findAll(notebookUi, node => node.type === "li").length, 2);
assert.equal(find(notebookUi, node => node.props?.["data-cell-type"] === "markdown").props.children[1].props.children, "# Summary");
assert.match(text(notebookUi), /\[3\]/);
assert.equal(findAll(notebookUi, node => node.props?.["data-notebook-output"]).length, 2);
assert.match(text(notebookUi), /"value": 2/);
byText(notebookUi, "Download").props.onClick();
assert.equal(notebookDownloaded, 1);
byText(notebookUi, "Close").props.onClick();
assert.equal(notebookClosed, 1);
assert.match(text(notebook.NotebookPreviewPanel({ isLoading: true })), /Loading notebook/);
const notebookError = notebook.NotebookPreviewPanel({ error: "Cannot load", onRetry() { notebookDownloaded++; } });
assert.equal(find(notebookError, node => node.props?.role === "alert").type, "div");
byText(notebookError, "Retry").props.onClick();
assert.equal(notebookDownloaded, 2);

// docx-preview-panel: 14
const docx = await bundle("docx-preview-panel");
assert.deepEqual(Object.keys(docx), ["DocxPreviewPanel"]);
let docxPage, docxZoom, docxOpened, docxDownloaded = 0;
const docxUi = docx.DocxPreviewPanel({ currentPage: 2, fileName: "report.docx", libraryFileId: "lib-1", onDownload() { docxDownloaded++; }, onOpenInLibrary(id) { docxOpened = id; }, onPageChange(page) { docxPage = page; }, onZoomChange(zoom) { docxZoom = zoom; }, pages: [{ id: "p1", text: "First" }, { id: "p2", text: "Second" }], zoom: 125 });
assert.equal(docxUi.props["data-docx-preview"], true);
assert.match(text(docxUi), /report.docx/);
assert.match(text(docxUi), /Second/);
assert.match(text(docxUi), /2 \/ 2/);
assert.equal(find(docxUi, node => node.props?.["data-page-id"] === "p2").props["aria-label"], "Page 2");
assert.equal(byText(docxUi, "Next").props.disabled, true);
byText(docxUi, "Previous").props.onClick();
assert.equal(docxPage, 1);
byText(docxUi, "Zoom in").props.onClick();
assert.equal(docxZoom, 135);
byText(docxUi, "Open in library").props.onClick();
assert.equal(docxOpened, "lib-1");
byText(docxUi, "Download").props.onClick();
assert.equal(docxDownloaded, 1);
assert.match(text(docx.DocxPreviewPanel({ isLoading: true })), /Loading document/);
assert.match(text(docx.DocxPreviewPanel({ error: "Broken" })), /Broken/);
assert.match(text(docx.DocxPreviewPanel({})), /No document preview/);

// pdf-preview-panel: 14
const pdf = await bundle("pdf-preview-panel");
assert.deepEqual(Object.keys(pdf), ["PdfPreviewPanel"]);
let pdfPage, pdfZoom, pdfClosed = 0;
const pdfUi = pdf.PdfPreviewPanel({ currentPage: 1, onClose() { pdfClosed++; }, onPageChange(page) { pdfPage = page; }, onZoomChange(zoom) { pdfZoom = zoom; }, pages: [{ id: "one", src: "one.png", width: 600, height: 800 }, { id: "two", src: "two.png" }], title: "Paper", zoom: 90 });
assert.equal(pdfUi.props["data-pdf-preview"], true);
assert.match(text(pdfUi), /Paper/);
assert.match(text(pdfUi), /1 \/ 2/);
const pdfImage = find(pdfUi, node => node.type === "img");
assert.equal(pdfImage.props.src, "one.png");
assert.equal(pdfImage.props.alt, "Page 1");
assert.equal(pdfImage.props.width, 600);
assert.equal(byText(pdfUi, "Previous").props.disabled, true);
byText(pdfUi, "Next").props.onClick();
assert.equal(pdfPage, 2);
byText(pdfUi, "Zoom out").props.onClick();
assert.equal(pdfZoom, 80);
byText(pdfUi, "Close").props.onClick();
assert.equal(pdfClosed, 1);
assert.match(text(pdf.PdfPreviewPanel({ isLoading: true })), /Loading PDF/);
assert.match(text(pdf.PdfPreviewPanel({ error: "Unreadable" })), /Unreadable/);
assert.match(text(pdf.PdfPreviewPanel({})), /No PDF preview/);

console.log("49 artifact preview panel cluster assertions passed");
