import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import esbuild from "esbuild";

const ROOT = path.resolve(import.meta.dirname, "..");
const modules = {
  "chatgpt-content-reference-file-download": { dependencies: ["app-initial"], exports: ["fetchChatGptFileBlob"] },
  "chatgpt-mermaid-preview-entry": { dependencies: ["app-shared", "chatgpt-mermaid-preview-core"], exports: ["ChatGptMermaidPreview"] },
  "chatgpt-image-lightbox-entry": { dependencies: ["app-shared", "chatgpt-image-lightbox"], exports: ["ChatGptImageLightbox"] },
  "library-cloud-file-preview-entry": { dependencies: ["library-cloud-file-preview", "cloud-file-preview"], exports: ["LibraryCloudFilePreview"] },
  "artifact-tab-content-electron-entry": { dependencies: ["app-shared", "artifact-tab-content-electron"], exports: ["ArtifactPreviewPanel", "ArtifactTabContent"] },
  "open-artifact-side-panel-tab": { dependencies: ["app-initial"], exports: ["openArtifactSidePanelTab", "restoreArtifactSidePanelTab", "updateArtifactSidePanelTabOriginatingTurn"] },
  "pending-image-download": { dependencies: ["rolldown-runtime", "app-shared", "app-initial"], exports: ["resumePendingCheckoutImageDownload"] },
};
let sourceAssertions = 0;
for (const [name, expectation] of Object.entries(modules)) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", name, "index.ts"), "utf8");
  const dependencies = [...source.matchAll(/@rchunk\/([^";]+)/g)].map((match) => match[1]);
  sourceAssertions += 4 + expectation.exports.length;
  assert.deepEqual(dependencies, expectation.dependencies, name + " exact dependencies");
  assert.ok(!source.includes("import("), name + " no dynamic dependencies");
  assert.ok(!/\bany\b/.test(source), name + " no any");
  assert.ok(!/\w+Chunk\.[A-Za-z_$]/.test(source), name + " no direct namespace consumption");
  for (const exported of expectation.exports) assert.ok(source.includes(exported), name + " export " + exported);
}

const state = globalThis.__artifactPreviewEntryTest = { initializers: [] };
const mark = (name) => "()=>globalThis.__artifactPreviewEntryTest.initializers.push(" + JSON.stringify(name) + ")";
const mocks = {
  "rolldown-runtime": "export const n=f=>f;",
  "app-shared": [
    "export const g4=" + mark("schema") + ";export const q4=()=>({min(){return this},optional(){return this}});",
    "export const V4=()=>({});export const R4=value=>({optional:value});export const H4=value=>value;",
  ].join("\n"),
  "app-initial": [
    "export const TGt=(...args)=>['blob',...args];export const jGt=" + mark("file-download") + ";",
    "export const Glt=(...args)=>['update',...args];export const Hlt=" + mark("artifact-side-panel") + ";export const Ult=(...args)=>['open',...args];export const Wlt=(...args)=>['restore',...args];",
    "export const GGt=" + mark("image-download") + ";export const HGt=" + mark("image-checkout") + ";export const krt=" + mark("image-assets") + ";",
  ].join("\n"),
  "chatgpt-mermaid-preview-core": "export const n=" + mark("mermaid") + ";export const t='MermaidPreview';",
  "chatgpt-image-lightbox": "export const n=" + mark("lightbox") + ";export const t='ImageLightbox';",
  "library-cloud-file-preview": "export const n='LibraryCloudFilePreview';",
  "cloud-file-preview": "export const t=" + mark("cloud-preview") + ";",
  "artifact-tab-content-electron": "export const n='ArtifactTabContent';export const r=" + mark("artifact-tab") + ";export const t='ArtifactPreviewPanel';",
};
async function load(name) {
  state.initializers = [];
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", name, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: specifier }) => ({ path: specifier.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: dependency }) => ({ contents: mocks[dependency] ?? "export {};", loader: "js" })); } }] });
  const output = path.join("/tmp", name + "-" + process.pid + ".mjs");
  fs.writeFileSync(output, result.outputFiles[0].text);
  const loaded = await import(pathToFileURL(output).href + "?" + Date.now());
  fs.unlinkSync(output);
  return loaded;
}
let runtimeAssertions = 0;
const check = (actual, expected, message) => { runtimeAssertions += 1; assert.deepEqual(actual, expected, message); };
let loaded = await load("chatgpt-content-reference-file-download"); check(Object.keys(loaded), ["fetchChatGptFileBlob"], "file export"); check(state.initializers, ["file-download"], "file initializer");
loaded = await load("chatgpt-mermaid-preview-entry"); check(loaded.ChatGptMermaidPreview, "MermaidPreview", "mermaid export"); check(state.initializers, ["mermaid"], "mermaid initializer");
loaded = await load("chatgpt-image-lightbox-entry"); check(loaded.ChatGptImageLightbox, "ImageLightbox", "lightbox export"); check(state.initializers, ["lightbox"], "lightbox initializer");
loaded = await load("library-cloud-file-preview-entry"); check(loaded.LibraryCloudFilePreview, "LibraryCloudFilePreview", "cloud file export"); check(state.initializers, ["cloud-preview"], "cloud preview initializer");
loaded = await load("artifact-tab-content-electron-entry"); check(Object.values(loaded).sort(), ["ArtifactPreviewPanel", "ArtifactTabContent"].sort(), "artifact exports"); check(state.initializers, ["artifact-tab"], "artifact initializer");
loaded = await load("open-artifact-side-panel-tab"); check(Object.keys(loaded).sort(), ["openArtifactSidePanelTab", "restoreArtifactSidePanelTab", "updateArtifactSidePanelTabOriginatingTurn"].sort(), "side panel exports"); check(state.initializers, ["artifact-side-panel"], "side panel initializer");
loaded = await load("pending-image-download"); check(Object.keys(loaded), ["resumePendingCheckoutImageDownload"], "pending image export"); check(state.initializers, ["schema", "image-download", "image-assets", "image-checkout"], "pending image initializers"); check(await loaded.resumePendingCheckoutImageDownload({ hasPaidSubscription: true, intl: {}, signal: new AbortController().signal }), undefined, "pending image resume contract");

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
