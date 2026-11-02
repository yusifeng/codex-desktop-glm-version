import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const expectations = {
  "library-image-preview": { dependencies: ["rolldown-runtime","app-shared","app-initial","app-primary","library-cloud-file-preview","preview-layout","library-file-download","library-file-preview-loading","image-side-panel"], dynamicDependencies: [], exported: "export { LibraryImagePreview }" },
};
let sourceAssertions = 0; const sourceAssert = (condition, message) => { sourceAssertions += 1; assert.ok(condition, message); };
sourceAssertions += assertReleaseOwner("image-side-panel", [
  /panorama_load/,
  /Image comment surface/,
  /export \{[\s\S]*Zr as a,[\s\S]*Bo as t,[\s\S]*Ur as u/,
]);
for (const [name, expected] of Object.entries(expectations)) { const source = fs.readFileSync(path.join(ROOT, "src/renderer", name, "index.ts"), "utf8"); const dependencies = [...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map(match => match[1]); const dynamicDependencies = [...source.matchAll(/import\("@rchunk\/([^"/]+)"\)/g)].map(match => match[1]); sourceAssert(JSON.stringify(dependencies) === JSON.stringify(expected.dependencies), name + " exact dependencies"); sourceAssert(JSON.stringify(dynamicDependencies) === JSON.stringify(expected.dynamicDependencies), name + " exact dynamic dependencies"); sourceAssert(!/\bany\b/.test(source), name + " no any"); sourceAssert(!/\w+Chunk\.[A-Za-z_$]/.test(source), name + " no direct namespace access"); sourceAssert(source.includes(expected.exported), name + " exact exports"); }

const state = globalThis.__artifactImagePreviewTest = { initializers: [], setters: [], comments: [], deleted: [], zoom: [], listeners: {}, closes: 0, downloads: [], toasts: [], provider: null, asset: null };
const marker = name => "() => globalThis.__artifactImagePreviewTest.initializers.push(" + JSON.stringify(name) + ")";
const jsx = { Fragment: "Fragment", jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) }; state.jsx = jsx;
let hookValues = []; let hookCursor = 0;
const beginRender = (clear = false) => { if (clear) hookValues = []; hookCursor = 0; };
const React = { createContext: value => ({ value }), useCallback: callback => callback, useContext: context => context.value, useEffect(effect) { state.effects ??= []; state.effects.push(effect); }, useImperativeHandle() {}, useRef: initial => ({ current: initial }), useState(initial) { const index = hookCursor++; if (!(index in hookValues)) hookValues[index] = typeof initial === "function" ? initial() : initial; return [hookValues[index], next => { hookValues[index] = typeof next === "function" ? next(hookValues[index]) : next; state.setters.push(hookValues[index]); }]; } }; state.React = React;

async function load(name, mocks) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", name, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: specifier }) => ({ path: specifier.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: dependency }) => ({ contents: mocks[dependency] ?? "export {};", loader: "js" })); } }] }); const output = path.join("/tmp", name + "-" + process.pid + "-" + Math.random().toString(36).slice(2) + ".mjs"); fs.writeFileSync(output, result.outputFiles[0].text); const module = await import(pathToFileURL(output).href); fs.unlinkSync(output); return module; }
let runtimeAssertions = 0; const runtimeAssert = (actual, expected, message) => { runtimeAssertions += 1; assert.deepEqual(actual, expected, message); };

state.initializers = []; hookValues = []; state.effects = []; state.provider = { data: undefined, isError: false, isFetching: true, refetch() { state.providerRefetch = true; } }; state.asset = { dataUrl: null, src: null, isLoading: true, isError: false, refetch() { state.assetRefetch = true; } };
const libraryMocks = {
  "rolldown-runtime": "export {};",
  "app-shared": ["export const $3="+marker("shared")+";export const h4="+marker("editor")+";export const K2="+marker("compiler")+";export const FX="+marker("features")+";export const QI="+marker("state")+";export const lk="+marker("persistence")+";export const Zh="+marker("icons")+";","export const I3=()=>globalThis.__artifactImagePreviewTest.jsx;export const e6=()=>globalThis.__artifactImagePreviewTest.React;export const n4=()=>({formatMessage:d=>d.defaultMessage});export const ZI='scope';export const pk='toast';export const LX=()=>({get:signal=>signal==='toast'?{danger:message=>globalThis.__artifactImagePreviewTest.toasts.push(message)}:null});export const _L=()=>globalThis.__artifactImagePreviewTest.provider;"].join("\n"),
  "app-initial": "export const Aht=input=>input;export const BGt=async value=>value;export const WGt=()=>globalThis.__artifactImagePreviewTest.asset;export const bz=id=>id==='mounted'?'provider-1':null;",
  "app-primary": "export const Yd=async file=>({src:'resolved:'+file.file_id});",
  "library-cloud-file-preview": "export const i="+marker("cloud")+";export const c='CloudError';export const r='CloudHeader';export const s='CloudActions';export const t='CloudOverlay';",
  "preview-layout": "export const n="+marker("layout")+";export const t='PreviewLayout';",
  "library-file-download": "export const a="+marker("download")+";export const t=async file=>globalThis.__artifactImagePreviewTest.downloads.push(file.file_id);",
  "library-file-preview-loading": "export const n="+marker("loading")+";export const t='Loading';",
  "image-side-panel": "export const n="+marker("side")+";export const t='ImageSidePanel';",
};
const library = await load("library-image-preview", libraryMocks); runtimeAssert(Object.keys(library), ["LibraryImagePreview"], "library unique export"); runtimeAssert(state.initializers, ["shared","editor","compiler","features","state","persistence","icons","cloud","layout","download","loading","side"], "library initializer order");
const mountedFile = { id: "mounted", name: "Mountain.png", mime_type: "image/png", updated_at: 1 }; beginRender(true); let preview = library.LibraryImagePreview({ accountId: "account", file: mountedFile, onClose: () => { state.closes += 1; } }); runtimeAssert(preview.type, "PreviewLayout", "library layout root"); let sidePanel = preview.props.children.props.children; runtimeAssert(sidePanel.type, "ImageSidePanel", "library uses image side panel"); runtimeAssert(sidePanel.props.loadingContent.type, "Loading", "provider loading state"); runtimeAssert(sidePanel.props.attachmentSrc, "file-service://mounted", "provider attachment scheme");
state.provider = { data: { file_id: "file_abc", file_name: "Resolved.png", file_size_bytes: 12, mime_type: "image/png" }, isError: false, isFetching: false, refetch() {} }; state.asset = { dataUrl: "data:image/png;base64,x", src: "blob:image", isLoading: false, isError: false, refetch() {} }; beginRender(true); preview = library.LibraryImagePreview({ accountId: "account", file: mountedFile, onClose: () => { state.closes += 1; }, onShare: () => {} }); sidePanel = preview.props.children.props.children; runtimeAssert(sidePanel.props.src, "blob:image", "resolved asset source"); runtimeAssert(sidePanel.props.downloadSrc, "data:image/png;base64,x", "data URL preferred for download"); runtimeAssert(sidePanel.props.attachmentSrc, "sediment://file_abc", "sediment attachment scheme"); runtimeAssert(sidePanel.props.imageSource, "uploaded", "uploaded image classification"); runtimeAssert(sidePanel.props.renderHeaderTitle({ navigationDisabled: false }).type, "CloudHeader", "cloud header rendered"); runtimeAssert(sidePanel.props.renderHeaderActions({ isDownloadDisabled: false }).type, "CloudActions", "cloud actions rendered"); await sidePanel.props.onImageEditSubmit({ prompt: "brighten" }); runtimeAssert(state.closes, 1, "accepted edit closes preview"); await sidePanel.props.onDownloadClick(); runtimeAssert(state.downloads.at(-1), "file_abc", "download uses resolved file");
console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
