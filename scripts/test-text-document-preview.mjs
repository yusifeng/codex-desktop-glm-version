import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entryPoint = path.join(ROOT, "src/renderer/text-document-preview/index.ts");
const source = fs.readFileSync(entryPoint, "utf8");
let assertions = 0;
const equal = (actual, expected) => { assertions++; assert.equal(actual, expected); };
const deepEqual = (actual, expected) => { assertions++; assert.deepEqual(actual, expected); };
const ok = (value) => { assertions++; assert.ok(value); };

deepEqual([...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), [
  "rolldown-runtime", "app-shared", "app-initial", "editor-header", "open-in-library-item",
  "header-content-fade", "surface", "lazy-version-history", "editor-header-controls",
]);
deepEqual([...source.matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map((match) => match[1]), []);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
equal(/\b[A-Z][A-Za-z]+Chunk\./.test(source), false);

const calls = { downloads: [], mutations: [], queries: [], reads: [], refetches: 0, toasts: [] };
const scenario = { query: null, mutationPending: false };
const jsx = {
  Fragment: Symbol("Fragment"),
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
const workspaceFiles = {
  async read(request) { calls.reads.push(request); return { text: "# Loaded" }; },
  async downloadCopy(request) { calls.downloads.push(request); },
};
globalThis.__textPreview = { calls, jsx, scenario, workspaceFiles };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const x=globalThis.__textPreview;",
    "export const I3=()=>x.jsx;",
    "export const LX=()=>({get:()=>({danger:(message,options)=>x.calls.toasts.push([message,options])})});",
    "export const _L=options=>{x.calls.queries.push(options);return x.scenario.query??{data:undefined,error:null,isError:false,isFetching:true,isLoading:true,isPending:true,isSuccess:false,status:'pending',refetch:async()=>{x.calls.refetches++;return x.scenario.query;}};};",
    "export const iL=options=>{x.calls.mutations.push(options);return{data:undefined,error:null,isError:false,isIdle:true,isPending:x.scenario.mutationPending,isSuccess:false,status:'idle',variables:undefined,mutate:()=>options.mutationFn().catch(error=>options.onError?.(error)),mutateAsync:()=>options.mutationFn(),reset(){}};};",
    "export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});",
    "export const pk={};",
  ].join(""),
  "app-initial": "const x=globalThis.__textPreview;export const $en={};export const pnt={workspaceFiles:x.workspaceFiles};",
  "editor-header": "export const t=props=>({type:'editor-header',props});",
  "open-in-library-item": "export const t=props=>({type:'open-in-library',props});",
  "header-content-fade": "export const r=props=>({type:'library-breadcrumb',props});export const t=kind=>'fade-'+kind;",
  "surface": "export const r=props=>({type:'markdown-surface',props});",
  "lazy-version-history": "export const t=props=>({type:'version-history',props});",
  "editor-header-controls": "export const t={annotationControl:null,commentsControl:null,editingControls:null,navigationControl:null,supplementalActions:null,zoomControl:null};",
};
const result = await esbuild.build({
  entryPoints: [entryPoint], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "text-document-preview-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: name }) => ({ contents: mocks[name] ?? "export {};", loader: "js" }));
  } }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
deepEqual(Object.keys(module), ["ChatGptTextDocumentPreview"]);

function find(node, predicate) {
  if (node == null || typeof node !== "object") return null;
  if (predicate(node)) return node;
  const children = Array.isArray(node.props?.children) ? node.props.children : [node.props?.children];
  for (const child of children) {
    if (Array.isArray(child)) { for (const nested of child) { const found = find(nested, predicate); if (found) return found; } }
    else { const found = find(child, predicate); if (found) return found; }
  }
  return null;
}
function render(overrides = {}) {
  return module.ChatGptTextDocumentPreview({
    hostId: "host-1", onClose() { calls.closed = true; }, path: "/tmp/note.md", previewKind: "markdown", tabId: "tab-1", title: "note.md", ...overrides,
  });
}
function queryResult(overrides = {}) {
  return { data: undefined, error: null, isError: false, isFetching: false, isLoading: false, isPending: false, isSuccess: true, status: "success", refetch: async () => { calls.refetches++; return scenario.query; }, ...overrides };
}

scenario.query = queryResult({ data: "# Hello" });
let view = render({ libraryFile: { libraryFileId: "lib-1" }, providerFile: { id: "provider-1", name: "Drive" } });
equal(view.type, "section");
const header = find(view, (node) => node.type === "editor-header");
ok(header);
equal(header.props.contentFade, "fade-text-document");
equal(header.props.downloadPending, false);
equal(header.props.tabId, "tab-1");
ok(find(header.props.actions, (node) => node.type === "open-in-library"));
ok(find(header.props.actions, (node) => node.type === "version-history"));
ok(find(header.props.actions, (node) => node.type === "library-breadcrumb"));
const markdown = find(view, (node) => node.type === "markdown-surface");
equal(markdown.props.markdown, "# Hello");
equal(markdown.props.enableMetadataPreview, true);
equal(header.props.controls.supplementalActions.props["data-provider-file"], "provider-1");

scenario.query = queryResult({ data: "plain text" });
view = render({ previewKind: "text" });
ok(find(view, (node) => node.type === "div" && node.props.children === "plain text"));
equal(find(view, (node) => node.type === "markdown-surface"), null);

scenario.query = queryResult({ data: undefined, isFetching: true, isLoading: true, isPending: true, isSuccess: false, status: "pending" });
view = render();
const loading = find(view, (node) => node.props?.["aria-busy"] === true);
equal(loading.props.children, "Loading note…");

scenario.query = queryResult({ data: undefined, error: new Error("read"), isError: true, isSuccess: false, status: "error" });
view = render();
ok(find(view, (node) => node.props?.children === "Couldn’t load this note"));
const retry = find(view, (node) => node.type === "button" && node.props.children === "Retry");
retry.props.onClick();
equal(calls.refetches, 1);

const queryOptions = calls.queries.at(-1);
equal(queryOptions.queryKey[0], "chatgpt-text-document-preview");
equal(queryOptions.gcTime, 0);
equal(queryOptions.retry, false);
equal(queryOptions.staleTime, 0);
equal(await queryOptions.queryFn(), "# Loaded");
deepEqual(calls.reads.at(-1), { hostId: "host-1", maxBytes: 10485760, path: "/tmp/note.md", representation: "text" });
workspaceFiles.read = async () => ({ blob: new TextEncoder().encode("decoded") });
equal(await queryOptions.queryFn(), "decoded");

scenario.query = queryResult({ data: "ok" });
view = render();
find(view, (node) => node.type === "editor-header").props.onDownload();
await Promise.resolve();
deepEqual(calls.downloads.at(-1), { fileName: "note.md", hostId: "host-1", path: "/tmp/note.md" });
let customDownloads = 0;
view = render({ onDownload() { customDownloads++; } });
find(view, (node) => node.type === "editor-header").props.onDownload();
await Promise.resolve();
equal(customDownloads, 1);
const mutation = calls.mutations.at(-1);
mutation.onError(new Error("download"));
equal(calls.toasts.at(-1)[0], "Couldn’t download this file");
equal(calls.toasts.at(-1)[1].errorAnalytics.toastId, "chatgptTextDocumentPreview.downloadFailed");

console.log(`text-document-preview tests passed (${assertions} assertions)`);
