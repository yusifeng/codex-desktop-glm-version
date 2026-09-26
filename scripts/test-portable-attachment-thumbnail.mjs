import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/portable-attachment-thumbnail/index.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "empty-renderer-chunks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, (args) => ({
        namespace: "empty-renderer-chunk",
        path: args.path,
      }));
      build.onLoad({ filter: /.*/, namespace: "empty-renderer-chunk" }, (args) => {
        if (args.path.endsWith("portable-thumbnail-pdf-runtime")) {
          return {
            contents: "export async function getPdfjs(){ return { GlobalWorkerOptions: { workerSrc: 'pdf.worker.js' } }; }",
            loader: "js",
          };
        }
        if (args.path.endsWith("portable-thumbnail-fonts")) {
          return {
            contents: "export async function ensurePopcornSpreadsheetFontsLoaded(){}",
            loader: "js",
          };
        }
        if (args.path.endsWith("portable-thumbnail-font-face-sources")) {
          return {
            contents: "export function getPopcornCarlitoFontFaceSourcesFromDocument(){ return []; }",
            loader: "js",
          };
        }
        return { contents: "export {};", loader: "js" };
      });
    },
  }],
});
const bundleDirectory = await mkdtemp(path.join(os.tmpdir(), "portable-thumbnail-test-"));
const bundlePath = path.join(bundleDirectory, "portable-attachment-thumbnail.mjs");
await writeFile(bundlePath, result.outputFiles[0].text);
const thumbnails = await import(pathToFileURL(bundlePath).href);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

const neverRead = async () => {
  throw new Error("readBytes should not run");
};
const activeController = new AbortController();
activeController.abort();
check(
  (await thumbnails.renderPortableAttachmentThumbnail({
    importKind: "pdf",
    readBytes: neverRead,
    signal: activeController.signal,
  })).dataUrl === null,
  "skips requests that are already aborted",
);

for (const importKind of [null, "ipynb", "tex"]) {
  const result = await thumbnails.renderPortableAttachmentThumbnail({
    importKind,
    readBytes: neverRead,
    signal: new AbortController().signal,
  });
  check(result.dataUrl === null && result.reason == null, `skips ${String(importKind)} imports`);
}

for (const size of [0, -1, Number.NaN, Infinity, 353]) {
  const result = await thumbnails.renderPortableAttachmentThumbnail({
    importKind: "pdf",
    readBytes: neverRead,
    signal: new AbortController().signal,
    size,
  });
  check(result.dataUrl === null && result.reason == null, `rejects invalid size ${String(size)}`);
}

const unsupported = await thumbnails.renderPortableAttachmentThumbnail({
  importKind: "pdf",
  readBytes: neverRead,
  signal: new AbortController().signal,
});
check(unsupported.reason === "unsupported", "reports unsupported browser primitives");

const previousWorker = globalThis.Worker;
const previousOffscreenCanvas = globalThis.OffscreenCanvas;
const previousFileReader = globalThis.FileReader;
const previousLocation = globalThis.location;
class MockWorker {}
class MockOffscreenCanvas {
  async convertToBlob() {
    return new Blob();
  }
}
globalThis.Worker = MockWorker;
globalThis.OffscreenCanvas = MockOffscreenCanvas;

const controllers = Array.from({ length: 17 }, () => new AbortController());
const blockedRead = () => new Promise(() => {});
const accepted = controllers.map((controller) =>
  thumbnails.renderPortableAttachmentThumbnail({
    importKind: "pdf",
    readBytes: blockedRead,
    signal: controller.signal,
    size: 64.4,
  })
);
const overloaded = await thumbnails.renderPortableAttachmentThumbnail({
  importKind: "pdf",
  readBytes: blockedRead,
  signal: new AbortController().signal,
});
check(overloaded.reason === "overloaded", "caps the pending queue at sixteen jobs");

for (const controller of controllers) controller.abort();
const canceled = await Promise.all(accepted);
check(canceled.every((result) => result.dataUrl === null), "resolves active and queued aborts");
check(canceled.every((result) => result.reason == null), "does not report aborts as render failures");

let postedRequest;
class SuccessWorker {
  onerror;
  onmessage;
  onmessageerror;

  postMessage(request) {
    postedRequest = request;
    queueMicrotask(() => this.onmessage?.({ data: new Blob(["png"]) }));
  }

  terminate() {}
}
class SuccessFileReader {
  onerror;
  onload;
  result = null;

  abort() {}

  readAsDataURL() {
    this.result = "data:image/png;base64,cG5n";
    queueMicrotask(() => this.onload?.());
  }
}
globalThis.Worker = SuccessWorker;
globalThis.FileReader = SuccessFileReader;
globalThis.location = { href: "https://example.test/composer" };
const rendered = await thumbnails.renderPortableAttachmentThumbnail({
  importKind: "pdf",
  readBytes: async () => new Uint8Array([1, 2, 3]),
  signal: new AbortController().signal,
  size: 64.6,
});
check(rendered.dataUrl === "data:image/png;base64,cG5n", "converts the worker Blob to a data URL");
check(rendered.byteLength === 3, "reports the source byte length");
check(postedRequest.size === 65, "rounds the requested thumbnail size");
check(postedRequest.pdfWorkerSrc === "pdf.worker.js", "forwards the PDF worker source");
check(postedRequest.resourceBaseUrl === globalThis.location.href, "forwards the resource base URL");

const empty = await thumbnails.renderPortableAttachmentThumbnail({
  importKind: "pdf",
  readBytes: async () => new Uint8Array(),
  signal: new AbortController().signal,
});
check(empty.byteLength === 0 && empty.dataUrl === null, "skips empty source files");
const tooLarge = await thumbnails.renderPortableAttachmentThumbnail({
  importKind: "pdf",
  readBytes: async () => Promise.reject({ byteLength: 41 * 1024 * 1024 }),
  signal: new AbortController().signal,
});
check(tooLarge.byteLength === 41 * 1024 * 1024, "preserves rejected source size metadata");

globalThis.Worker = previousWorker;
globalThis.OffscreenCanvas = previousOffscreenCanvas;
globalThis.FileReader = previousFileReader;
globalThis.location = previousLocation;
await rm(bundleDirectory, { force: true, recursive: true });

console.log(`portable attachment thumbnail behavior: ${assertions}/${assertions} assertions passed`);
