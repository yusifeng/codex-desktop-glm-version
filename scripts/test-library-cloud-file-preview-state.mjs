import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import * as esbuild from "esbuild";

const sourcePath = new URL("../src/renderer/library-cloud-file-preview/preview-state.ts", import.meta.url).pathname;
const built = await esbuild.build({
  bundle: true,
  entryPoints: [sourcePath],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const module = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
const decide = (input) => module.resolveLibraryPreviewDecision({ kind: "unsupported", ...input });

assert.equal(module.MAX_RICH_PREVIEW_BYTES, 40 * 1024 * 1024);
assert.deepEqual(decide({ isLoading: true }), { canAsk: false, renderer: "none", state: "loading" });
assert.deepEqual(decide({ error: "offline" }), { canAsk: false, renderer: "none", state: "error" });
assert.deepEqual(decide({ kind: "image", sizeBytes: module.MAX_RICH_PREVIEW_BYTES + 1 }), { canAsk: true, renderer: "unsupported", state: "too-large" });
assert.deepEqual(decide({ kind: "image", sizeBytes: null }), { canAsk: true, renderer: "unsupported", state: "missing-size" });
assert.deepEqual(decide({ kind: "image", sizeBytes: 20, imagePreviewIsPending: true }), { canAsk: false, renderer: "none", state: "loading" });
assert.deepEqual(decide({ kind: "image", sizeBytes: 20, imagePreviewIsError: true }), { canAsk: true, renderer: "unsupported", state: "image-error" });
assert.deepEqual(decide({ kind: "image", sizeBytes: 20 }), { canAsk: false, renderer: "none", state: "hidden" });
assert.deepEqual(decide({ kind: "image", sizeBytes: 20, hasPreview: true }), { canAsk: true, renderer: "image", state: "ready" });
assert.deepEqual(decide({ kind: "pdf" }), { canAsk: true, renderer: "artifact", state: "ready" });
assert.deepEqual(decide({ kind: "markdown" }), { canAsk: true, renderer: "text-document", state: "ready" });
assert.deepEqual(decide({}), { canAsk: true, renderer: "unsupported", state: "unsupported" });
assert.equal(module.inferLibraryPreviewKind({ fileName: "photo.bin", mimeType: "image/png" }), "image");
assert.equal(module.inferLibraryPreviewKind({ fileName: "report.PDF" }), "pdf");
assert.equal(module.inferLibraryPreviewKind({ fileName: "table.csv" }), "artifact");
assert.equal(module.inferLibraryPreviewKind({ fileName: "README.md" }), "markdown");
assert.equal(module.inferLibraryPreviewKind({ fileName: "index.html" }), "html");
assert.equal(module.inferLibraryPreviewKind({ fileName: "main.ts" }), "text");
assert.equal(module.inferLibraryPreviewKind({ fileName: "archive.zip" }), "unsupported");

globalThis.__libraryCloudPreviewTest = {
  jsx: {
    Fragment: "Fragment",
    jsx(type, props) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {} }; },
    jsxs(type, props) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {} }; },
  },
  react: {
    useEffect(effect) { return effect(); },
    useState(initial) { return [typeof initial === "function" ? initial() : initial, () => {}]; },
  },
};
const previewEntry = new URL("../src/renderer/library-cloud-file-preview/index.ts", import.meta.url).pathname;
const entryBuild = await esbuild.build({
  bundle: true,
  entryPoints: [previewEntry],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  plugins: [{
    name: "library-cloud-preview-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path }) => ({ namespace: "mock", path }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path }) => ({
        contents: path === "@rchunk/app-shared"
          ? "export const I3=()=>globalThis.__libraryCloudPreviewTest.jsx;export const e6=()=>globalThis.__libraryCloudPreviewTest.react;"
          : path === "@rchunk/library-file-download"
            ? "export const i=async()=>\"text\";export const r=async()=>new Uint8Array();export const t=async()=>{};"
            : path === "@rchunk/artifact-tab-content-electron"
              ? "export const n=props=>({type:'artifact',props});"
              : path === "@rchunk/library-json-preview"
                ? "export const LibraryJsonPreview=props=>({type:'json',props});"
                : "export {};",
        loader: "js",
      }));
    },
  }],
  target: "node22",
  write: false,
});
const entry = await import(`data:text/javascript;base64,${Buffer.from(entryBuild.outputFiles[0].text).toString("base64")}#entry`);
function find(node, predicate) {
  if (node == null || typeof node !== "object") return null;
  if (predicate(node)) return node;
  const children = node.props?.children;
  if (Array.isArray(children)) for (const child of children.flat(Infinity)) { const found = find(child, predicate); if (found != null) return found; }
  return find(children, predicate);
}
const routeFile = (overrides = {}) => ({
  cloudFile: { fileId: "file-1", id: "library-1", name: "report.pdf", sizeBytes: 100, ...overrides },
});
const pdfPreview = entry.n({ item: routeFile(), preview: "PDF content" });
assert.equal(pdfPreview.props["data-preview-kind"], "pdf");
assert.equal(pdfPreview.props["data-preview-state"], "ready");
assert.equal(find(pdfPreview, node => node.props?.["data-preview-renderer"] === "artifact")?.props["data-preview-renderer"], "artifact");
const textPreview = entry.n({ item: routeFile({ name: "notes.md" }), preview: "Markdown" });
assert.equal(find(textPreview, node => node.props?.["data-preview-renderer"] === "text-document")?.props["data-preview-renderer"], "text-document");
const imageError = entry.n({ item: routeFile({ mimeType: "image/png", name: "photo.png" }), imagePreviewIsError: true });
assert.equal(imageError.props["data-preview-state"], "image-error");

console.log("24 library cloud file preview state and entry assertions passed");
