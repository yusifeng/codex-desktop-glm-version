import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "src/renderer/mermaid-editable-preview/index.ts");
const source = fs.readFileSync(SOURCE, "utf8");
assert.deepEqual([...new Set([...source.matchAll(/@rchunk\/([^"]+)/g)].map(match => match[1]))].sort(), ["app-initial", "app-shared", "image", "mermaid-code-editor", "rolldown-runtime"]);
assert.deepEqual([...source.matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map(match => match[1]), ["mermaid-code-editor"]);
assert.equal(/\bany\b/.test(source), false);
assert.equal(/import \* as/.test(source), false);
const runtime = { cursor: 0, effects: [], init: [], states: [], refs: [], rendered: [], toast: [], downloads: [], loadDeps: null };
const React = { useCallback(callback) { runtime.cursor += 1; return callback; }, useEffect(effect) { runtime.cursor += 1; runtime.effects.push(effect); }, useId() { runtime.cursor += 1; return "mermaid:1"; }, useRef(value) { const index = runtime.cursor++; runtime.refs[index] ??= { current: value }; return runtime.refs[index]; }, useState(value) { const index = runtime.cursor++; if (!(index in runtime.states)) runtime.states[index] = typeof value === "function" ? value() : value; return [runtime.states[index], next => { runtime.states[index] = typeof next === "function" ? next(runtime.states[index]) : next; }]; } };
const jsx = { jsx(type, props, key) { return { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return { type, props: props ?? {}, key }; } };
globalThis.document = { createElement() { return { content: { querySelector() { return { src: "rendered.svg" }; } }, innerHTML: "" }; } };
globalThis.__mermaidEditable = { React, jsx, runtime };
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": ["const x=globalThis.__mermaidEditable;", "export const H3=()=>x.runtime.init.push('preload');export const I3=()=>x.jsx;export const Jm=loader=>{x.runtime.lazyLoader=loader;return 'MermaidCodeEditor'};export const V3=async(load,deps)=>{x.runtime.loadDeps=deps;return load()};export const __=callback=>callback;export const ck=()=>({danger:(message)=>x.runtime.toast.push(message)});export const e6=()=>x.React;export const fg=()=>false;export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});"].join("\n"),
  "app-initial": ["const x=globalThis.__mermaidEditable;", "export const Art=async value=>{x.runtime.downloads.push(value);return true};export const Nat='LoadingRow';export const Pat=()=>x.runtime.init.push('loading');export const Trt=()=>x.runtime.init.push('lightbox');export const wrt='ImageLightbox';"].join("\n"),
  image: ["const x=globalThis.__mermaidEditable;", "export const a=()=>x.runtime.init.push('image');export const c=()=>({accent:'blue'});export const i='MermaidSvgRenderer';export const n=element=>element?{src:element.src,width:640,height:480}:null;export const s={accent:'default'};export const t=async src=>'png:'+src;export const u=async input=>{x.runtime.rendered.push(input);if(x.runtime.renderFailure)throw new Error('render');return '<svg />'};"].join("\n"),
  "mermaid-code-editor": "export const MermaidCodeEditor='LoadedEditor';",
};
const build = await esbuild.build({ entryPoints: [SOURCE], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, args => ({ path: args.path.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, args => ({ contents: mocks[args.path] ?? "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(build.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["MermaidEditablePreview"]);
assert.deepEqual(runtime.init, ["image", "loading", "lightbox", "preload"]);
const changes = [];
const props = { alt: "Diagram", code: "graph TD", downloadAriaLabel: "Download", image: { src: "initial.svg", width: 320, height: 200 }, onCodeChange: value => changes.push(value), onOpenChange() {} };
function render(overrides = {}) { runtime.cursor = 0; runtime.effects = []; return module.MermaidEditablePreview({ ...props, ...overrides }); }
let view = render();
assert.equal(view.type, "ImageLightbox");
assert.equal(view.props.src, "initial.svg");
assert.equal(view.props.showDownload, true);
assert.equal(view.props.toolbarLeadingAction.label, "Edit Code");
await view.props.toolbarLeadingAction.onClick();
view = render();
assert.equal(view.props.showDownload, false);
assert.equal(view.props.previewContent.props.children.type, "MermaidCodeEditor");
view.props.previewContent.props.children.props.onChange("graph LR");
assert.deepEqual(changes, ["graph LR"]);
view = render();
await view.props.toolbarLeadingAction.onClick();
view = render();
assert.equal(runtime.rendered.at(-1).source, "graph LR");
assert.equal(view.props.showZoomControls, true);
assert.equal(view.props.src, "rendered.svg");
view.props.onDownload();
await new Promise(resolve => setTimeout(resolve, 0));
assert.deepEqual(runtime.downloads.at(-1), { downloadSrc: "png:rendered.svg", suggestedFilename: "mermaid-diagram.png" });
assert.equal(view.props.zoomableContent.content.type, "MermaidSvgRenderer");
assert.equal(runtime.loadDeps, null);
await runtime.lazyLoader();
assert.equal(runtime.loadDeps[0], "./editor-586a9e08096d.js");
runtime.cursor = 0; runtime.effects = []; runtime.refs = []; runtime.states = []; runtime.renderFailure = true;
view = render({ image: null });
assert.equal(view.props.toolbarLeadingAction.label, "View Diagram");
await view.props.toolbarLeadingAction.onClick();
view = render({ image: null });
assert.equal(view.props.previewContent.props.children.props.role, "alert");
assert.equal(view.props.showDownload, false);
const count = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(count + " mermaid editable preview assertions passed");
