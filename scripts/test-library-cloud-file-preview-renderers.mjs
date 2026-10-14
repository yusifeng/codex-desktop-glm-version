import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
async function bundle(entryPoint) {
  const result = await esbuild.build({
    bundle: true, entryPoints: [path.join(root, entryPoint)], format: "esm", logLevel: "silent",
    platform: "node", target: "node22", write: false,
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${entryPoint}`);
}
const models = await bundle("src/renderer/library-cloud-file-preview/preview-render-model.ts");
const provider = await bundle("src/renderer/library-cloud-file-preview/provider-preview-policy.ts");
const binary = await bundle("src/renderer/library-cloud-file-preview/binary-preview-url.ts");

const project = (kind, content, overrides = {}) => models.projectLibraryPreviewRenderModel({
  binaryUrl: "blob:pdf", content, downloadUrl: "https://files.test/file", fileName: `file.${kind}`,
  kind, renderer: kind === "image" ? "image" : kind === "unsupported" ? "unsupported" : kind === "artifact" || kind === "pdf" ? "artifact" : "text-document",
  ...overrides,
});
assert.equal(project("artifact", new Uint8Array([1])).kind, "artifact");
assert.deepEqual(project("pdf", new Uint8Array([1])), { kind: "pdf", renderer: "artifact", source: "blob:pdf" });
assert.equal(project("image", null).source, "https://files.test/file");
assert.equal(project("html", "<h1>Hi</h1>").kind, "html");
assert.equal(project("markdown", "# Hi").kind, "markdown");
assert.equal(project("text", "hello").kind, "text");
assert.equal(project("text", "{}", { fileName: "data.json" }).kind, "json");
assert.equal(project("unsupported", null).kind, "unsupported");

assert.equal(provider.resolveProviderPreviewUrl({ provider: "google_drive", mimeType: "application/vnd.google-apps.document", sourceUrl: " https://docs.test/preview " }, true), "https://docs.test/preview");
assert.equal(provider.resolveProviderPreviewUrl({ provider: "google_drive", mimeType: "application/pdf", sourceUrl: "https://docs.test/pdf" }, true), null);
assert.equal(provider.resolveProviderPreviewUrl({ provider: "box", mimeType: "text/html", sourceUrl: "https://box.test" }, true), null);
assert.equal(provider.resolveProviderPreviewUrl({ provider: "google_drive", mimeType: "text/html", sourceUrl: "https://docs.test" }, false), null);

const created = [];
const revoked = [];
const published = [];
const controller = binary.createBinaryPreviewUrlController({
  createObjectUrl(bytes, mimeType) { const url = `blob:${created.length + 1}`; created.push([url, [...bytes], mimeType]); return url; },
  revokeObjectUrl(url) { revoked.push(url); },
});
const cleanupFirst = controller.update(new Uint8Array([1, 2]), "application/pdf", (url) => published.push(url));
assert.deepEqual(published, ["blob:1"]);
controller.update(new Uint8Array([3]), "application/pdf", (url) => published.push(url));
assert.deepEqual(revoked, ["blob:1"]);
cleanupFirst();
assert.deepEqual(revoked, ["blob:1"]);
controller.clear();
assert.deepEqual(revoked, ["blob:1", "blob:2"]);

globalThis.__libraryPreviewRendererTest = {
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
const result = await esbuild.build({
  bundle: true, entryPoints: [path.join(root, "src/renderer/library-cloud-file-preview/index.ts")],
  format: "esm", logLevel: "silent", platform: "node", target: "node22", write: false,
  plugins: [{ name: "preview-renderer-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath, namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents:
      importPath === "@rchunk/app-shared"
        ? "export const I3=()=>globalThis.__libraryPreviewRendererTest.jsx;export const e6=()=>globalThis.__libraryPreviewRendererTest.react;"
        : importPath === "@rchunk/library-file-download"
          ? "export const i=async()=>\"text\";export const r=async()=>new Uint8Array();export const t=async()=>{};"
          : importPath === "@rchunk/artifact-tab-content-electron"
            ? "export const a=props=>({type:'artifact',props});"
            : importPath === "@rchunk/library-json-preview"
              ? "export const LibraryJsonPreview=props=>({type:'json',props});"
              : importPath === "@rchunk/surface"
                ? "export const r=props=>({type:'markdown',props});"
                : "export {};", loader: "js" }));
  } }],
});
const entry = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#entry`);
const body = (overrides) => entry.i({ file: { downloadUrl: "https://files.test/source", fileId: "id", fileName: "file.txt", sizeBytes: 100, ...overrides.file }, preview: overrides.preview, previewKind: overrides.kind, googleWorkspaceIframePreviewEnabled: overrides.google });
assert.equal(body({ file: { fileName: "photo.png" }, kind: "image" }).props["data-preview-kind"], "image");
assert.equal(body({ file: { fileName: "page.html" }, kind: "html", preview: "<h1>Hi</h1>" }).type, "iframe");
assert.equal(body({ file: { fileName: "README.md" }, kind: "markdown", preview: "# Hi" }).props.children.type, "markdown");
assert.equal(body({ file: { fileName: "data.json" }, kind: "text", preview: "{}" }).type, "json");
assert.equal(body({ file: { fileName: "report.pdf" }, kind: "pdf", preview: "blob:provided" }).props.src, "blob:provided");
assert.equal(body({ file: { fileName: "doc", provider: "google_drive", mimeType: "application/vnd.google-apps.document", sourceUrl: "https://docs.test", downloadUrl: "https://docs.test" }, kind: "unsupported", google: true }).props["data-preview-renderer"], "provider");

console.log("22 library cloud file preview renderer assertions passed");
