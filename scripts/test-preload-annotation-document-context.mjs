import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationDocumentContext } = require("../app/.vite/build/browser-page-preload/annotation-document-context.js");

const preloadSource = readFileSync(new URL("../src/main-recovered/browser-page-preload.ts", import.meta.url), "utf8");
const bundledPreload = readFileSync(new URL("../app/.vite/build/browser-page-preload.js", import.meta.url), "utf8");
assert.ok(
  preloadSource.indexOf(`require("./browser-page-preload/annotation-document-context")`) <
    preloadSource.indexOf("createAnnotationDocumentContext({"),
  "annotation runtime owners must be loaded before eager preload initializers invoke them",
);
assert.doesNotMatch(
  bundledPreload,
  /require\(["']\.\/browser-page-preload\//,
  "sandbox preload must inline semantic owners instead of requiring relative modules at runtime",
);
assert.match(
  bundledPreload,
  /installWebMcpProtocol:\s*\(\)\s*=>\s*installWebMcpProtocol/,
  "sandbox preload bundle must retain the WebMCP protocol owner's named export",
);
const interactionLayerFactory = preloadSource.indexOf("Ky = createAnnotationInteractionLayerComponent({");
const annotationRuntimeInitializer = preloadSource.indexOf("Sb = o(() => {");
const reactBinding = preloadSource.indexOf("(G = u(Bf(), 1))", annotationRuntimeInitializer);
assert.ok(
  annotationRuntimeInitializer >= 0 && reactBinding > annotationRuntimeInitializer && interactionLayerFactory > reactBinding,
  "annotation interaction components must be created after the lazy runtime initializes React bindings",
);
const controllerRegistryCall = preloadSource.indexOf("controllerRegistry = useAnnotationControllerRegistry({");
const controllerRegistryEnd = preloadSource.indexOf("}),\n    {", controllerRegistryCall);
const controllerRegistrySource = preloadSource.slice(controllerRegistryCall, controllerRegistryEnd);
const injectedControllerNames = [...new Set(controllerRegistrySource.match(/\bcreateAnnotation[A-Za-z0-9_]+/g) ?? [])];
for (const controllerName of injectedControllerNames) {
  assert.ok(
    preloadSource.slice(0, controllerRegistryCall).includes(controllerName),
    `controller registry dependency must be declared before use: ${controllerName}`,
  );
}

const normalizeText = (value) => typeof value === "string" && value.trim() ? value.replace(/\s+/g, " ").trim().slice(0, 2000) : undefined;
const google = (value) => String(value).includes("docs.google.com/document/") ? {} : null;
const calls = [];
const { AnnotationDocumentContext } = createAnnotationDocumentContext({
  parseGoogleDocsUrl: google,
  createGoogleDocsContext: (input) => ({ kind: "google-docs", ...input }),
  normalizeText,
  getDocument: (win) => win?.document ?? null,
  isHTMLElement: (value) => value?.nodeType === 1,
  isVisibleElement: () => true,
  rangeIntersectsRect: (_doc, node, rect) => calls.push([node.textContent, rect]) || true,
});

const input = { nodeType: 1, selectionStart: 1, selectionEnd: 4, value: " zero selected text " };
const win = { document: { activeElement: input }, getSelection: () => ({ toString: () => "  chosen\ntext " }) };
const context = new AnnotationDocumentContext("https://docs.google.com/document/d/a/edit");
assert.equal(context.isGoogleDocsPage(), true);
assert.equal(context.getWindowSelectionText(win), "chosen text");
assert.deepEqual(context.getElementDocumentContext({ documentTitle: " Doc ", elementWindow: win, fallbackWindow: win }), { kind: "google-docs", documentTitle: " Doc ", pageUrl: "https://docs.google.com/document/d/a/edit", selectedText: "chosen text", visibleText: undefined });
assert.equal(AnnotationDocumentContext.isGoogleDocsAnchor({ pageUrl: "https://docs.google.com/document/d/a" }), true);
assert.equal(context.getRegionDocumentContext({ documentTitle: "Doc", fallbackWindow: win, frameWindow: win, viewportRect: { x: 1 } }).selectedText, "chosen text");
assert.equal(new AnnotationDocumentContext("https://example.com").getRegionDocumentContext({ documentTitle: "Doc", fallbackWindow: win, frameWindow: win, viewportRect: {} }), undefined);

const textNode = { nodeType: 3, textContent: "visible text", parentElement: { nodeType: 1 } };
calls.length = 0;
const document = { body: {}, createTreeWalker: () => ({ nextNode: () => (calls.length ? null : textNode) }) };
const visible = context.getVisibleTextInViewportRect({ document }, { x: 0, y: 0 });
assert.equal(visible, "visible text");
assert.equal(calls.length, 1);
console.log(`${15 + injectedControllerNames.length} preload annotation document context assertions passed`);
