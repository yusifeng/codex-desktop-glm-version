import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/portable-attachment-thumbnail-worker/index.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "esnext",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "thumbnail-worker-fixtures",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, (args) => ({
        namespace: "thumbnail-worker-fixture",
        path: args.path,
      }));
      build.onLoad({ filter: /.*/, namespace: "thumbnail-worker-fixture" }, (args) => {
        const name = args.path.slice("@rchunk/".length);
        const modules = {
          "thumbnail-worker-font-faces": `
            export async function installPopcornFontFaces() {}
          `,
          "thumbnail-worker-shape-presets": `
            export function installPresetShapeDefinitions() {}
          `,
          "thumbnail-worker-presentation-model": `
            export const Workbook = {
              fromCSV(text, options) { return { kind: "csv", text, separator: options?.separator ?? "," }; },
              load(value) { return { kind: "xlsx", value }; },
            };
            export const Presentation = {
              load() { return { slides: { items: [{ frame: { width: 400, height: 200 } }] } }; },
            };
            export async function drawSlideToCtx() {}
          `,
          "thumbnail-worker-workbook-renderer": `
            export function renderWorkbook(workbook, options) {
              return new Blob([workbook.kind + ":" + options.width + "x" + options.height + ":" + (workbook.separator ?? "")]);
            }
          `,
          "thumbnail-worker-walnut-reader": `
            export async function getPopcornWalnutReaderExports() {
              const extract = (bytes) => bytes;
              return {
                DocxReader: { ExtractDocxProto: extract },
                PptxReader: { ExtractSlidesProto: extract },
                XlsxReader: { ExtractXlsxProto: extract },
              };
            }
          `,
          "thumbnail-worker-presentation-proto": `
            export const Presentation = { decode(bytes) { return bytes; } };
          `,
          "thumbnail-worker-document-proto": `
            export const Document = { decode(bytes) { return bytes; } };
          `,
          "thumbnail-worker-document-model": `
            export const DocumentModel = {
              load() { return { pagePaintContext: { chartsById: {}, pageBackgroundFill: null, themeMap: {} } }; },
            };
          `,
          "thumbnail-worker-document-renderer": `
            export function layoutDocumentPages() { return [{ widthPx: 300, heightPx: 600 }]; }
            export async function preloadDocumentImageBitmaps() { return new Map(); }
            export function paintRenderedDocumentPage() {}
          `,
          "thumbnail-worker-spreadsheet-proto": `
            export const Workbook = { decode(bytes) { return bytes; } };
          `,
          "thumbnail-worker-pdf-runtime": `
            export const GlobalWorkerOptions = {};
            export function getDocument() {
              return {
                async destroy() {},
                promise: Promise.resolve({
                  async getPage() {
                    return {
                      getViewport({ scale }) { return { width: 400 * scale, height: 200 * scale }; },
                      render() { return { promise: Promise.resolve() }; },
                    };
                  },
                }),
              };
            }
          `,
        };
        return { contents: modules[name] ?? "export {};", loader: "js" };
      });
    },
  }],
});

const previousOnMessage = globalThis.onmessage;
const previousPostMessage = globalThis.postMessage;
const previousOffscreenCanvas = globalThis.OffscreenCanvas;
const previousWorker = globalThis.Worker;

class MockCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  async convertToBlob() {
    return new Blob([`${this.width}x${this.height}`], { type: "image/png" });
  }

  getContext() {
    return { scale() {} };
  }
}

class MockWorker {
  terminate() {}
}

globalThis.OffscreenCanvas = MockCanvas;
globalThis.Worker = MockWorker;

let resolvePostedMessage;
globalThis.postMessage = (message) => {
  resolvePostedMessage?.(message);
  resolvePostedMessage = undefined;
};

const bundleDirectory = await mkdtemp(path.join(os.tmpdir(), "thumbnail-worker-test-"));
const bundlePath = path.join(bundleDirectory, "portable-attachment-thumbnail-worker.mjs");
await writeFile(bundlePath, result.outputFiles[0].text);
await import(pathToFileURL(bundlePath).href);

function render(importKind, overrides = {}) {
  return new Promise((resolve) => {
    resolvePostedMessage = resolve;
    globalThis.onmessage({
      data: {
        bytes: new TextEncoder().encode("a,b"),
        fonts: [],
        importKind,
        pdfWorkerSrc: "pdf.worker.js",
        resourceBaseUrl: "https://example.test/assets/",
        size: 160,
        ...overrides,
      },
    });
  });
}

let assertions = 0;
async function checkBlob(result, expected, message) {
  assert.ok(result instanceof Blob, message);
  assert.equal(await result.text(), expected, message);
  assertions += 1;
}

await checkBlob(await render("csv"), "csv:160x90:,", "renders CSV through the workbook renderer");
await checkBlob(await render("tsv"), "csv:160x90:\t", "passes the TSV separator");
await checkBlob(await render("pptx", { size: 100 }), "100x50", "fits the first slide into the thumbnail");
await checkBlob(await render("docx", { size: 120 }), "60x120", "fits the first document page");
await checkBlob(await render("xlsx"), "xlsx:160x90:", "renders XLSX through the workbook renderer");
await checkBlob(await render("pdf", { size: 100 }), "100x50", "renders the first PDF page");

assert.equal(await render("ipynb"), null, "returns null for notebook imports");
assertions += 1;
assert.equal(await render("tex"), null, "returns null for TeX imports");
assertions += 1;
assert.equal(
  await render("pdf", { pdfWorkerSrc: undefined }),
  null,
  "converts renderer failures to null",
);
assertions += 1;

globalThis.onmessage = previousOnMessage;
globalThis.postMessage = previousPostMessage;
globalThis.OffscreenCanvas = previousOffscreenCanvas;
globalThis.Worker = previousWorker;
await rm(bundleDirectory, { force: true, recursive: true });

console.log(`portable attachment thumbnail worker: ${assertions}/${assertions} assertions passed`);
