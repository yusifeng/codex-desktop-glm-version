import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entryPoint = path.join(ROOT, "src/renderer/artifact-session-tab-content/index.ts");
const source = fs.readFileSync(entryPoint, "utf8");
let assertions = 0;
const equal = (actual, expected) => { assertions++; assert.equal(actual, expected); };
const deepEqual = (actual, expected) => { assertions++; assert.deepEqual(actual, expected); };
const ok = (value) => { assertions++; assert.ok(value); };

deepEqual([...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), [
  "rolldown-runtime", "app-shared", "app-initial", "artifact-presentation", "spreadsheet-editor", "app-primary",
  "draw-presence-label", "presentation-review-utils", "workbook-review-utils", "artifact-layout", "editor-header",
  "artifact-feedback-button", "open-in-button", "artifact-annotation-comment", "sidebar-panel", "pane-layout",
]);
deepEqual([...source.matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map((match) => match[1]), ["popcorn-presentation-panel", "popcorn-workbook-panel"]);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
equal(/\b[A-Z][A-Za-z]+Chunk\./.test(source), false);

const calls = { appends: [], lazyLoaders: [], opens: [], paneLayouts: [], subscriptions: [] };
let hookIndex = 0;
let hookValues = [];
const React = {
  Suspense: (props) => ({ type: "suspense", props }),
  lazy(loader) {
    const index = calls.lazyLoaders.length;
    calls.lazyLoaders.push(loader);
    return (props) => ({ type: index === 0 ? "presentation-panel" : "workbook-panel", props });
  },
  useState(initialValue) {
    const index = hookIndex++;
    if (!(index in hookValues)) hookValues[index] = typeof initialValue === "function" ? initialValue() : initialValue;
    return [hookValues[index], (value) => { hookValues[index] = typeof value === "function" ? value(hookValues[index]) : value; }];
  },
  useSyncExternalStore(subscribe, getSnapshot) { calls.subscriptions.push(subscribe(() => {})); return getSnapshot(); },
};
const jsx = {
  Fragment: Symbol("Fragment"),
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
const services = {};
globalThis.__artifactSession = { calls, jsx, React, services, gate: true };
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": "const x=globalThis.__artifactSession;export const e6=()=>x.React;export const I3=()=>x.jsx;export const n4=()=>({formatMessage:d=>d.defaultMessage});",
  "app-initial": "const x=globalThis.__artifactSession;export const ofn=()=>x.gate;export const pnt=x.services;",
  "artifact-layout": "export const t=props=>props.renderLayout?.({content:props.content,header:props.header})??({type:'artifact-layout',props});",
  "editor-header": "export const n=props=>({type:'comments-control',props});export const t=props=>({type:'editor-header',props});",
  "artifact-feedback-button": "export const t=props=>({type:'feedback-button',props});",
  "open-in-button": "export const t=props=>({type:'open-in-button',props});",
  "pane-layout": "const x=globalThis.__artifactSession;export const n=(slots,parts)=>{x.calls.paneLayouts.push([slots,parts]);return{type:'pane-layout',props:{slots,parts}}};",
  "popcorn-presentation-panel": "export const PopcornElectronPresentationPanel=props=>({type:'loaded-presentation-panel',props});",
  "popcorn-workbook-panel": "export const PopcornElectronWorkbookPanel=props=>({type:'loaded-workbook-panel',props});",
};
const result = await esbuild.build({
  entryPoints: [entryPoint], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "artifact-session-tab-content-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: name }) => ({ contents: mocks[name] ?? "export {};", loader: "js" }));
  } }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
deepEqual(Object.keys(module), ["ArtifactSessionTabContent"]);
equal(calls.lazyLoaders.length, 2);
equal((await calls.lazyLoaders[0]()).default({}).type, "loaded-presentation-panel");
equal((await calls.lazyLoaders[1]()).default({}).type, "loaded-workbook-panel");

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
function props(overrides = {}) {
  return { artifactRef: "artifact-1", hostId: "host-1", kind: "presentation", onClose() {}, reviewTools: { mode: "review" }, tabId: "tab-1", threadId: "thread-1", title: "Deck", ...overrides };
}
function render(overrides = {}) { hookIndex = 0; return module.ArtifactSessionTabContent(props(overrides)); }
function resetHooks() { hookValues = []; hookIndex = 0; }
function validRecord(kind = "presentation") { return { artifactRef: "artifact-1", checkpointCrdtState: [9], checkpointStateVersion: 0, initialArtifactProto: [1, 2], kind, stateVersion: 0, title: kind === "presentation" ? "Live deck" : "Live sheet", updates: [] }; }
async function settle() { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); }

let view = render();
ok(find(view.props.content, (node) => node.props?.children === "Live Artifact Sessions aren’t available in this app host."));

let committed;
let flush;
const subscription = {
  async append(update) { calls.appends.push(update); return { stateVersion: 1 }; },
  markDirty() { calls.markedDirty = true; },
  async readAsset() { return [7, 8]; },
};
services.artifactSessions = {
  async open(request, onCommitted, flushFromHost) { calls.opens.push(request); committed = onCommitted; flush = flushFromHost; return { record: validRecord(), subscription }; },
};
resetHooks();
view = render({ renderSlots: { slot: true } });
equal(view.type, "pane-layout");
ok(find(view.props.parts.content, (node) => node.props?.["aria-busy"] === true));
await settle();
view = render({ renderSlots: { slot: true } });
deepEqual(calls.opens[0], { artifactRef: "artifact-1", threadId: "thread-1" });
ok(find(view, (node) => node.type === "presentation-panel"));
equal(calls.paneLayouts.length > 0, true);
const panel = find(view, (node) => node.type === "presentation-panel");
const renderedHeader = panel.props.renderHeader({ zoomControl: "zoom" });
equal(renderedHeader.type, "editor-header");
equal(renderedHeader.props.actions.type, "open-in-button");
equal(renderedHeader.props.commentsControl.type, "comments-control");
equal(panel.props.title, "Live deck");
equal(panel.props.annotationsEnabled, true);
equal(panel.props.initialSourceBytes[0], 1);
equal(panel.props.initialCrdtState[0], 9);
panel.props.onCrdtUpdate([3, 4]);
await settle();
equal(calls.markedDirty, true);
equal(calls.appends.length, 1);
equal(calls.appends[0].bytes[0], 3);
const assets = await panel.props.resolveImageHydrationAssets([{ assetId: "asset-1", contentType: "image/png", uri: "artifact-session-asset:sha256:" + "a".repeat(64) }]);
equal(assets[0].data[0], 7);
committed({ stateVersion: 2, update: { bytes: [5], originId: "remote", stateVersion: 2, updateId: "remote-1" } });
view = render({ renderSlots: { slot: true } });
equal(find(view, (node) => node.type === "presentation-panel").props.externalCrdtUpdates.at(-1)[0], 5);
await flush();

services.artifactSessions = { async open() { throw new Error("offline"); } };
resetHooks();
view = render();
await settle();
view = render();
equal(view.props.content.props.children[0], "Couldn’t open this live slide deck");
ok(find(view.props.content, (node) => node.type === "button" && node.props.children === "Try again"));

services.artifactSessions = { async open() { return { record: { ...validRecord(), artifactRef: "wrong" }, subscription }; } };
resetHooks();
render();
await settle();
view = render();
equal(view.props.content.props.children[0], "Couldn’t open this live slide deck");
equal(find(view.props.content, (node) => node.type === "button" && node.props.children === "Try again"), null);

services.artifactSessions = { async open() { return { record: validRecord("spreadsheet"), subscription }; } };
resetHooks();
render({ kind: "spreadsheet" });
await settle();
view = render({ kind: "spreadsheet" });
ok(find(view, (node) => node.type === "workbook-panel"));
equal(find(view, (node) => node.type === "workbook-panel").props.toolbarHidden, false);
globalThis.__artifactSession.gate = false;
resetHooks();
render({ kind: "spreadsheet" });
await settle();
view = render({ kind: "spreadsheet" });
equal(find(view, (node) => node.type === "comments-control"), null);
equal(find(view, (node) => node.type === "workbook-panel").props.annotationsEnabled, false);

console.log(`artifact-session-tab-content tests passed (${assertions} assertions)`);
