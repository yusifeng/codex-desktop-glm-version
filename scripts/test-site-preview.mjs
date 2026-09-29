import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = { analytics: [], closed: 0, opened: [], shared: [], windowListeners: new Map() };
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
const React = {
  useEffect(effect) { effect(); },
  useImperativeHandle(ref, create) { if (ref) ref.current = create(); },
  useRef(value) { return { current: value }; },
  useState(value) {
    let current = typeof value === "function" ? value() : value;
    return [current, (next) => { current = typeof next === "function" ? next(current) : next; }];
  },
};
globalThis.window = {
  addEventListener(event, listener) { state.windowListeners.set(event, listener); },
  removeEventListener(event) { state.windowListeners.delete(event); },
};
globalThis.__sitePreview = { React, jsx, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "export const $3=()=>{};export const I3=()=>globalThis.__sitePreview.jsx;export const e6=()=>globalThis.__sitePreview.React;",
    "export const ZI='app-scope';export const LX=()=>({kind:'scope'});",
    "export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});",
    "export const Y2=props=>({type:'message',props});export const Yh=props=>({type:'button',props});",
  ].join("\n"),
  "app-initial": [
    "const state=globalThis.__sitePreview.state;",
    "export const Oin=(resource,current)=>({url:current??resource.url??'https://demo.chatgpt.site'});",
    "export const Oft=options=>state.opened.push(options);",
    "export const Pan=(_scope,event)=>state.analytics.push(event);",
  ].join("\n"),
  "app-primary": "export {};",
  "artifact-annotation-batch-controls": "export const r=()=>{};export const t=props=>({type:'annotation-controls',props});",
  "appgen-access": "export const s=()=>{};export const t=()=>true;",
  "open-appgen-share-dialog": "export const t=()=>{};export const n=(_scope,projectId,options)=>globalThis.__sitePreview.state.shared.push({projectId,options});",
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/site-preview/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "site-preview-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
    },
  }],
});
const preview = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(preview), ["SitePreview"]);

const controlsRef = { current: null };
const view = preview.SitePreview({
  controlsRef,
  onClose() { state.closed += 1; },
  resource: {
    currentLiveUrl: "https://demo.chatgpt.site/page",
    projectId: "project-1",
    publishedRevision: 7,
    title: "Demo Site",
  },
});
assert.equal(view.type, "div");
assert.equal(view.key, 7);
const header = view.props.children[0];
const body = view.props.children[1];
assert.equal(header.type, "header");
assert.equal(header.props.children[1].props.children, "Demo Site");
const iframe = body.props.children[2];
assert.equal(iframe.type, "iframe");
assert.equal(iframe.props.src, "/sites/project-1/preview");
assert.equal(iframe.props.title, "Demo Site");
assert.equal(iframe.props.referrerPolicy, "no-referrer");
assert.equal(body.props.children[0].props.role, "status");
const navigationButtons = header.props.children[0].props.children;
assert.equal(navigationButtons[0].props.disabled, true);
assert.equal(navigationButtons[1].props.disabled, true);
header.props.children[1].props.onClick();
assert.equal(state.opened[0].href, "https://demo.chatgpt.site/page");
assert.equal(state.opened[0].openTarget, "external-browser");
const actionButtons = header.props.children[2].props.children;
assert.equal(actionButtons[0].props["aria-label"], "Annotate");
actionButtons[1].props.onClick();
assert.deepEqual(state.shared[0], { projectId: "project-1", options: { source: "in-app-browser" } });
actionButtons[2].props.onClick();
assert.equal(state.closed, 1);
let confirmed = 0;
assert.equal(controlsRef.current.confirmAction(() => { confirmed += 1; }), true);
assert.equal(confirmed, 1);
navigationButtons[2].props.onClick();
assert.equal(state.analytics.length, 2);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " site preview assertions passed");
