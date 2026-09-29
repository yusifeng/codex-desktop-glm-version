import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import esbuild from "esbuild";

const ROOT = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(ROOT, "src/renderer/xterm-output-panel/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
let sourceAssertions = 0;
const sourceAssert = (condition, message) => { sourceAssertions += 1; assert.ok(condition, message); };
const dependencies = [...source.matchAll(/@rchunk\/([^";]+)/g)].map((match) => match[1]);
sourceAssert(JSON.stringify(dependencies) === JSON.stringify(["rolldown-runtime","app-shared","app-initial","theme-font-family","theme-font-face-loader","xterm-window-zoom","terminal-panel-bootstrap"]), "exact static dependencies");
sourceAssert(!source.includes("import("), "no dynamic imports");
sourceAssert(!/\bany\b/.test(source), "no any");
sourceAssert(!/\w+Chunk\.[A-Za-z_$]/.test(source), "no direct namespace member consumption");
sourceAssert(/export \{ XtermOutputPanel \}/.test(source), "unique semantic export");
sourceAssert(source.includes("output.startsWith(previous)"), "incremental output path");
sourceAssert(source.includes("terminal.reset()"), "replacement output path");
sourceAssert(source.includes("ResizeObserver"), "resize fit path");

const state = globalThis.__xtermOutputPanelTest = {
  effects: [], layouts: [], refs: [], hookIndex: 0, frames: [], initializers: [], themes: [], fontLoads: [],
  modifierDetached: 0, observerDisconnected: 0, reader: null, terminal: null,
};
globalThis.requestAnimationFrame = (callback) => { state.frames.push(callback); return state.frames.length; };
globalThis.cancelAnimationFrame = () => undefined;
globalThis.ResizeObserver = class { constructor(callback) { this.callback = callback; } observe() { state.observer = this; } disconnect() { state.observerDisconnected += 1; } };

const outerElement = { id: "outer" };
const terminalElement = { id: "terminal" };
const React = {
  useEffect(effect) { state.effects.push(effect); },
  useEffectEvent(callback) { return callback; },
  useLayoutEffect(effect) { state.layouts.push(effect); },
  useRef(initial) { const index = state.hookIndex++; if (state.refs[index] == null) state.refs[index] = { current: index === 0 ? outerElement : index === 1 ? terminalElement : initial }; return state.refs[index]; },
};
const jsx = { jsx: (type, props, key) => ({ type, props, key }) };
class Terminal {
  constructor(options) { this.options = options; this.rows = 4; this.writes = []; this.addons = []; state.terminal = this; }
  dispose() { this.disposed = true; }
  loadAddon(addon) { this.addons.push(addon); }
  open(element) { this.element = element; }
  refresh(start, end) { this.refreshed = [start, end]; }
  reset() { this.resets = (this.resets ?? 0) + 1; this.writes = []; }
  scrollToBottom() { this.scrolls = (this.scrolls ?? 0) + 1; }
  write(output) { this.writes.push(output); }
}
class FitAddon { fit() { this.fits = (this.fits ?? 0) + 1; } }
class WebLinksAddon { constructor(handler) { this.handler = handler; } }
const marker = (name) => "() => globalThis.__xtermOutputPanelTest.initializers.push(" + JSON.stringify(name) + ")";
const mocks = {
  "rolldown-runtime": "export {};",
  "terminal-panel-bootstrap": "globalThis.__xtermOutputPanelTest.terminalPanelLoaded=true;",
  "app-shared": [
    "export const $3=" + marker("shared") + ";export const wL=" + marker("shared-links") + ";export const y_=" + marker("shared-theme") + ";",
    "export const Cz={lightChromeTheme:'light-setting',darkChromeTheme:'dark-setting',codeFontSize:'font-size'};",
    "export const I3=()=>globalThis.__xtermOutputPanelTest.jsx;export const e6=()=>globalThis.__xtermOutputPanelTest.React;",
    "export const x_=()=>({meta:true});",
  ].join("\n"),
  "app-initial": [
    "export const Vcn=" + marker("theme-state") + ";export const bk=" + marker("theme-config") + ";export const xW=" + marker("terminal-theme") + ";",
    "export const SW=()=> 'dark';export const CW=mode=>mode;",
    "export const Kcn=setting=>setting==='font-size'?13:setting;",
    "export const yk=(theme,mode)=>({name:theme,mode,fonts:{code:'JetBrains Mono',codeFace:'JetBrains Face'}});",
    "export const vk=(element,theme,mode)=>globalThis.__xtermOutputPanelTest.themes.push([element,theme,mode]);",
  ].join("\n"),
  "theme-font-family": "export const t=()=>true;",
  "theme-font-face-loader": "export const n=async face=>globalThis.__xtermOutputPanelTest.fontLoads.push(['face',face]);export const t=async(family,size)=>globalThis.__xtermOutputPanelTest.fontLoads.push(['font',family,size]);",
  "xterm-window-zoom": [
    "export const _=()=>({Terminal:globalThis.__xtermOutputPanelTest.Terminal});",
    "export const y=()=>({FitAddon:globalThis.__xtermOutputPanelTest.FitAddon});export const v=()=>({WebLinksAddon:globalThis.__xtermOutputPanelTest.WebLinksAddon});",
    "export const a=fonts=>fonts.code+', monospace';export const c=()=>true;export const d=theme=>({background:theme.mode});",
    "export const f=" + marker("xterm-theme") + ";export const p=" + marker("xterm-core") + ";export const s=" + marker("xterm-links") + ";export const u=" + marker("xterm-fit") + ";",
    "export const h={};export const m={};export const i=async(family,size)=>globalThis.__xtermOutputPanelTest.fontLoads.push(['prepare',family,size]);",
    "export const l=terminal=>terminal.writes.slice();export const n=()=>()=>{globalThis.__xtermOutputPanelTest.modifierDetached+=1};export const o=output=>'N:'+output;",
  ].join("\n"),
};
Object.assign(state, { React, jsx, Terminal, FitAddon, WebLinksAddon });
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: specifier }) => ({ path: specifier.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: name }) => ({ contents: mocks[name] ?? "export {};", loader: "js" })); } }] });
const out = path.join("/tmp", "xterm-output-panel-" + process.pid + ".mjs");
fs.writeFileSync(out, result.outputFiles[0].text);
const module = await import(pathToFileURL(out).href);
fs.unlinkSync(out);
let runtimeAssertions = 0;
const runtimeAssert = (actual, expected, message) => { runtimeAssertions += 1; assert.deepEqual(actual, expected, message); };

runtimeAssert(Object.keys(module), ["XtermOutputPanel"], "unique export");
runtimeAssert(state.initializers, ["shared","shared-links","shared-theme","theme-state","theme-config","terminal-theme","xterm-core","xterm-theme","xterm-fit","xterm-links"], "initializer order");
runtimeAssert(state.terminalPanelLoaded, true, "terminal panel side effect");

state.hookIndex = 0;
const view = module.XtermOutputPanel({ output: "hello", onRenderedOutputReady(reader) { state.reader = reader; return () => { state.readerCleanup = reader(); }; } });
runtimeAssert(view.props["data-codex-xterm"], true, "xterm data attribute");
runtimeAssert(view.props.className, "relative flex h-full w-full flex-col", "outer layout");
runtimeAssert(view.props.children.props.children.props.ref.current, terminalElement, "terminal element ref");
runtimeAssert(state.layouts.length, 2, "two layout effects");
for (const effect of state.layouts) effect();
runtimeAssert(state.themes[0][2], "dark", "resolved theme applied");
runtimeAssert(state.effects.length, 4, "four passive effects");
const cleanups = state.effects.map((effect) => effect());
runtimeAssert(state.terminal.element, terminalElement, "terminal opened");
runtimeAssert(state.terminal.options.disableStdin, true, "read only terminal");
runtimeAssert(state.terminal.options.fontFamily, "JetBrains Mono, monospace", "code font family");
runtimeAssert(state.terminal.addons.length, 2, "fit and web links addons");
runtimeAssert(state.terminal.writes, ["N:hello"], "initial output normalized");
runtimeAssert(typeof state.reader, "function", "rendered output reader registered");
runtimeAssert(state.reader(), ["N:hello"], "reader serializes rendered output");
while (state.frames.length > 0) state.frames.shift()();
runtimeAssert(state.terminal.scrolls >= 1, true, "initial output scrolls to bottom");

state.effects = [];
state.layouts = [];
state.hookIndex = 0;
module.XtermOutputPanel({ output: "hello world" });
const incrementalCleanup = state.effects.at(-1)();
runtimeAssert(state.terminal.writes.at(-1), "N: world", "only appended suffix written");
runtimeAssert(state.terminal.resets ?? 0, 0, "append does not reset");
incrementalCleanup?.();

state.effects = [];
state.layouts = [];
state.hookIndex = 0;
module.XtermOutputPanel({ output: "replacement" });
state.effects.at(-1)();
runtimeAssert(state.terminal.resets, 1, "divergent output resets terminal");
runtimeAssert(state.terminal.writes, ["N:replacement"], "replacement output written");

cleanups[2]?.();
state.terminal.writes.push("after-dispose");
runtimeAssert(state.terminal.disposed, true, "terminal disposed on unmount");
runtimeAssert(state.observerDisconnected, 1, "resize observer disconnected");
runtimeAssert(state.modifierDetached, 1, "modifier handler detached");
runtimeAssert(state.reader(), ["N:replacement"], "reader cleanup snapshots output");

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
