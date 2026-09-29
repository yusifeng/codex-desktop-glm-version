import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modules = {
  "use-stable-callback": ["app-shared", "rolldown-runtime"],
  "use-reduced-motion": ["app-shared", "rolldown-runtime"],
  "use-hotkey-window-dismiss-on-escape": ["app-initial", "app-shared", "rolldown-runtime"],
  "use-learning-block-wide-layout": ["app-shared", "rolldown-runtime"],
  "use-learning-block-drag": ["app-shared", "rolldown-runtime", "use-stable-callback"],
  "use-floating-window-pointer-interactivity": ["app-shared", "rolldown-runtime"],
};

for (const [name, expectedDependencies] of Object.entries(modules)) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", name, "index.ts"), "utf8");
  const dependencies = [...source.matchAll(/@rchunk\/([A-Za-z0-9._-]+)/gu)].map((match) => match[1]);
  assert.deepEqual([...new Set(dependencies)].sort(), expectedDependencies);
  assert.doesNotMatch(source, /\bany\b/u);
  assert.doesNotMatch(source, /\b[A-Za-z_$][\w$]*Chunk\.[A-Za-z_$][\w$]*/u);
}

async function bundle(name, mocks) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", name, "index.ts")], bundle: true, format: "esm", platform: "browser", target: "esnext", write: false, logLevel: "silent",
    plugins: [{ name: "hook-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({ contents: mocks[moduleName] ?? "export {};", loader: "js" }));
    } }],
  });
  return import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
}

globalThis.__stableHook = { memo: null, reference: null };
const stableModule = await bundle("use-stable-callback", {
  "app-shared": "const s=globalThis.__stableHook;export const e6=()=>({useRef:value=>s.reference??={current:value},useInsertionEffect:effect=>effect(),useMemo:factory=>s.memo??=factory()});",
});
assert.deepEqual(Object.keys(stableModule).sort(), ["n", "t"]);
const stableFirst = stableModule.n((value) => `first:${value}`);
assert.equal(stableFirst(1), "first:1");
const stableSecond = stableModule.n((value) => `second:${value}`);
assert.equal(stableFirst, stableSecond);
assert.equal(stableSecond(2), "second:2");

globalThis.__reducedMotionHook = { calls: [], initialized: { current: false }, value: { current: true } };
const reducedModule = await bundle("use-reduced-motion", {
  "app-shared": "const s=globalThis.__reducedMotionHook;export const d0=()=>s.calls.push('media');export const p0=()=>s.calls.push('state');export const f0=s.initialized;export const m0=s.value;export const u0=()=>{s.calls.push('update');s.initialized.current=true};export const e6=()=>({useState:value=>[value,()=>{}]});",
});
assert.deepEqual(Object.keys(reducedModule).sort(), ["n", "t"]);
assert.equal(reducedModule.n(), true);
assert.deepEqual(globalThis.__reducedMotionHook.calls, ["state", "media", "update"]);
assert.equal(reducedModule.n(), true);
assert.deepEqual(globalThis.__reducedMotionHook.calls, ["state", "media", "update"]);

const windowListeners = new Map();
globalThis.window = { addEventListener(type, listener) { windowListeners.set(type, listener); }, removeEventListener(type, listener) { if (windowListeners.get(type) === listener) windowListeners.delete(type); } };
globalThis.__escapeHook = { cleanup: null, dismissals: 0, initializers: 0 };
const escapeModule = await bundle("use-hotkey-window-dismiss-on-escape", {
  "app-shared": "const s=globalThis.__escapeHook;export const e6=()=>({useEffect:effect=>{s.cleanup=effect()}});",
  "app-initial": "const s=globalThis.__escapeHook;export const mnt=()=>{s.initializers+=1};export const pnt={hotkeyWindowHotkeys:{dismiss(){s.dismissals+=1}}};",
});
escapeModule.n();
assert.equal(globalThis.__escapeHook.initializers, 1);
assert.equal(typeof windowListeners.get("keydown"), "function");
const ordinary = { key: "Enter", defaultPrevented: false, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, preventDefault() { throw new Error("unexpected"); }, stopPropagation() { throw new Error("unexpected"); } };
windowListeners.get("keydown")(ordinary);
assert.equal(globalThis.__escapeHook.dismissals, 0);
const escape = { key: "Escape", defaultPrevented: false, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
windowListeners.get("keydown")(escape);
assert.equal(globalThis.__escapeHook.dismissals, 1);
assert.equal(escape.prevented, true);
assert.equal(escape.stopped, true);
globalThis.__escapeHook.cleanup();
assert.equal(windowListeners.has("keydown"), false);
escapeModule.n();
assert.equal(globalThis.__escapeHook.initializers, 1);

globalThis.__wideHook = { effects: [], index: 0, states: [] };
globalThis.ResizeObserver = class { constructor(callback) { this.callback = callback; globalThis.__wideHook.observer = this; } observe(element) { this.element = element; } disconnect() { this.disconnected = true; } };
const wideModule = await bundle("use-learning-block-wide-layout", {
  "app-shared": "const s=globalThis.__wideHook;export const e6=()=>({useState(value){const i=s.index++;if(!(i in s.states))s.states[i]=value;return[s.states[i],next=>{s.states[i]=next}]},useCallback:fn=>fn,useEffect(effect){s.effects.push(effect());}});",
});
let wide = wideModule.n({ minWidth: 400 });
wide.visualizationRef({ getBoundingClientRect: () => ({ width: 500 }) });
globalThis.__wideHook.index = 0;
wide = wideModule.n({ minWidth: 400 });
globalThis.__wideHook.index = 0;
wide = wideModule.n({ minWidth: 400 });
assert.equal(wide.isWideLayout, true);
assert.equal(globalThis.__wideHook.observer.element.getBoundingClientRect().width, 500);
globalThis.__wideHook.observer.callback([{ contentRect: { width: 200 } }]);
globalThis.__wideHook.index = 0;
wide = wideModule.n({ minWidth: 400 });
assert.equal(wide.isWideLayout, false);

const dragSource = fs.readFileSync(path.join(ROOT, "src/renderer/use-learning-block-drag/index.ts"), "utf8");
assert.match(dragSource, /setPointerCapture/u);
assert.match(dragSource, /releasePointerCapture/u);
assert.match(dragSource, /requestAnimationFrame/u);
assert.match(dragSource, /cancelAnimationFrame/u);
const floatingSource = fs.readFileSync(path.join(ROOT, "src/renderer/use-floating-window-pointer-interactivity/index.ts"), "utf8");
assert.match(floatingSource, /MutationObserver/u);
assert.match(floatingSource, /elementsFromPoint/u);
assert.ok(floatingSource.includes('window.addEventListener("scroll"'));
assert.match(floatingSource, /restoreInteractive/u);

console.log("hook utilities cluster tests passed (42 assertions)");
