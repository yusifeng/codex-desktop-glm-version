import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__popcornBridgeTest = {
  jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } },
  react: { useEffect(effect) { effect(); }, useRef(value) { return { current: value }; }, useState(initial) { let value = typeof initial === "function" ? initial() : initial; return [value, next => { value = typeof next === "function" ? next(value) : next; }]; } },
};
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "popcorn-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__popcornBridgeTest.jsx;export const e6=()=>globalThis.__popcornBridgeTest.react;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function findAll(node, predicate) { const values = []; walk(node, value => { if (predicate(value)) values.push(value); }); return values; }
function find(node, predicate) { return findAll(node, predicate)[0]; }
function text(node) { const values = []; const collect = value => { if (typeof value === "string") values.push(value); else if (value != null && typeof value === "object") { const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); } }; collect(node); return values.join(" "); }

// popcorn-presentation-panel: 13
const presentation = await bundle("popcorn-presentation-panel");
assert.deepEqual(Object.keys(presentation), ["PopcornElectronPresentationPanel"]);
let presentationController, presentationReady = 0, presentationInteractions = 0;
const presentationUi = presentation.PopcornElectronPresentationPanel({ initialSelectedSlideIdx: 1, initialZoom: 1.25, onControllerReady(controller) { presentationController = controller; }, onImportReady() { presentationReady++; }, onInteractionAttempt() { presentationInteractions++; }, slides: [{ id: "s1", title: "Intro" }, { id: "s2", title: "Roadmap" }], title: "Quarterly", footerContent: "Footer" });
assert.equal(presentationUi.props["data-testid"], "popcorn-electron-presentation-panel");
assert.equal(presentationUi.props["data-codex-popcorn-editor"], true);
assert.equal(presentationUi.props["data-theme"], "codex");
assert.match(text(presentationUi), /Quarterly/);
assert.match(text(presentationUi), /Roadmap/);
assert.match(text(presentationUi), /Footer/);
assert.equal(presentationReady, 1);
assert.equal(presentationController.getSelectedSlideIndex(), 1);
presentationController.selectSlide(0);
assert.equal(presentationController.getSelectedSlideIndex(), 0);
assert.equal(presentationInteractions, 1);
presentationController.setZoom(2);
assert.equal(presentationInteractions, 2);
assert.equal(presentationController.getZoom(), 2);
assert.equal(findAll(presentationUi, node => node.type === "button").length, 2);

// popcorn-workbook-panel: 13
const workbook = await bundle("popcorn-workbook-panel");
assert.deepEqual(Object.keys(workbook), ["PopcornElectronWorkbookPanel"]);
let workbookController, workbookReady = 0, workbookInteractions = 0;
const workbookUi = workbook.PopcornElectronWorkbookPanel({ initialSelectedAddress: "B2", onControllerReady(controller) { workbookController = controller; }, onImportReady() { workbookReady++; }, onInteractionAttempt() { workbookInteractions++; }, sheets: [{ id: "one", name: "Summary", cells: [["Revenue", 42]] }, { id: "two", name: "Data", cells: [[1, 2]] }], title: "Budget" });
assert.equal(workbookUi.props["data-testid"], "popcorn-electron-workbook-panel");
assert.equal(workbookUi.props["data-editing"], false);
assert.match(text(workbookUi), /Budget/);
assert.match(text(workbookUi), /Revenue/);
assert.match(text(workbookUi), /42/);
assert.equal(find(workbookUi, node => node.props?.role === "toolbar").props.children[0], "B2");
assert.equal(workbookReady, 1);
assert.equal(workbookController.getActiveSheetName(), "Summary");
workbookController.setActiveSheetName("Data");
assert.equal(workbookController.getActiveSheetName(), "Data");
workbookController.setSelectedAddress("C3");
workbookController.setZoom(1.5);
assert.equal(workbookInteractions, 3);
assert.equal(workbookController.getSelectedAddress(), "C3");
assert.equal(workbookController.getZoom(), 1.5);
assert.equal(findAll(workbookUi, node => node.type === "button").length, 2);
assert.equal(workbook.PopcornElectronWorkbookPanel({ toolbarHidden: true }).props.children[1], null);

// popcorn-document-panel: 14
const documentPanel = await bundle("popcorn-document-panel");
assert.deepEqual(Object.keys(documentPanel), ["PopcornElectronDocumentPanel"]);
let documentReady = 0, documentController, documentInteractions = 0, zoomControlValue;
const documentUi = documentPanel.PopcornElectronDocumentPanel({ documentProtoVersion: 4, enablePageNavigation: true, initialZoom: 1.1, navigationTarget: { pageNumber: 2, requestId: "nav-1" }, onControllerReady(controller) { documentController = controller; }, onImportReady() { documentReady++; }, onInteractionAttempt() { documentInteractions++; }, pages: [{ id: "p1", content: "First" }, { id: "p2", content: "Second" }], renderHeaderZoomControl(zoom) { zoomControlValue = zoom; return "Zoom"; }, title: "Proposal" });
assert.equal(documentUi.props["data-testid"], "popcorn-electron-document-panel");
assert.equal(documentUi.props["data-codex-popcorn-editor"], true);
assert.match(text(documentUi), /Proposal/);
assert.match(text(documentUi), /Second/);
assert.match(text(documentUi), /2 \/ 2/);
const documentMain = find(documentUi, node => node.type === "main");
assert.equal(documentMain.props["data-page-index"], 1);
assert.equal(documentMain.props["data-proto-version"], 4);
assert.equal(documentMain.props["data-zoom"], 1.1);
assert.equal(find(documentUi, node => node.type === "article").props["data-page-id"], "p2");
assert.equal(zoomControlValue, 1.1);
assert.equal(documentReady, 1);
assert.equal(documentController.getPageIndex(), 1);
documentController.goToPage(0);
documentController.setZoom(2);
assert.equal(documentController.getPageIndex(), 0);
assert.equal(documentController.getZoom(), 2);
assert.equal(documentInteractions, 2);
assert.match(text(documentPanel.PopcornElectronDocumentPanel({})), /Empty document/);
assert.equal(documentPanel.PopcornElectronDocumentPanel({ renderLayout: ({ panel }) => ({ type: "layout", props: { children: panel } }) }).type, "layout");

let importError;
workbook.PopcornElectronWorkbookPanel({ initialSourceBytes: new Uint8Array(), initialSourceFormat: "xlsx", onImportError(error) { importError = error; } });
assert.match(importError.message, /empty/);

console.log("48 Popcorn editor bridge cluster assertions passed");
