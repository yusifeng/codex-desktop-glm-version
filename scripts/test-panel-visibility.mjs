import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/panel-visibility/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const calls = { activated: [], closed: [], initialized: [], shown: [], cleared: [], ensured: [] };
const signals = { bottomActive: Symbol("bottom-active"), bottomOpen: Symbol("bottom-open"), layout: Symbol("layout"), rightActive: Symbol("right-active"), rightEnabled: Symbol("right-enabled"), rightOpen: Symbol("right-open"), rightTabs: Symbol("right-tabs") };
const config = { conversationId: "conversation-1", preferred: "right", fallback: "right", target: null, activeBrowserTabId: "browser-active", ensured: true, lastFocused: "browser-last" };
globalThis.__panelVisibility = { calls, signals, config };
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) {
  build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
  build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => {
    if (module === "app-primary") return { contents: "const s=globalThis.__panelVisibility;export const Af=()=>s.calls.initialized.push('helpers');export const Df=()=>s.config.preferred;export const Of=()=>s.config.fallback;", loader: "js" };
    if (module !== "app-initial") return { contents: "export {};", loader: "js" };
    const initializers = { Ebt: "state", Fgt: "routing", Wvt: "side-panel", Yen: "tabs", _gt: "actions", _vt: "selection", mgt: "browser-tabs", nlt: "layout", qbt: "right-panel" };
    const initExports = Object.entries(initializers).map(([alias, name]) => "export const " + alias + "=()=>s.calls.initialized.push('" + name + "');").join("");
    return { contents: "const s=globalThis.__panelVisibility;" + initExports + "export const Bgt=(...a)=>s.calls.activated.push(a);export const Ibt=s.signals.layout;export const Jen=t=>t?.browserTabId??null;export const Ken=()=>s.config.conversationId;export const Vvt={activeTab$:s.signals.bottomActive};export const Xen=t=>t?.type==='browser';export const _bt=s.signals.rightOpen;export const dgt=()=>s.config.target;export const fvt=(...a)=>s.calls.shown.push(a);export const ggt={getBrowserUseActiveBrowserTabId:()=>s.config.activeBrowserTabId};export const mbt=s.signals.bottomOpen;export const pvt=(...a)=>s.calls.closed.push(a);export const qvt={activeTab$:s.signals.rightActive,tabs$:s.signals.rightTabs};export const rlt=(...a)=>{s.calls.ensured.push(a);return s.config.ensured};export const tlt=id=>id==null?null:'resolved-'+id;export const ugt=()=>s.config.lastFocused;export const vbt=s.signals.rightEnabled;export const ygt=(...a)=>s.calls.cleared.push(a);", loader: "js" };
  });
} }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
let assertions = 0;
const equal = (actual, expected) => { assertions++; assert.equal(actual, expected); };
const deepEqual = (actual, expected) => { assertions++; assert.deepEqual(actual, expected); };
const createScope = (values) => ({ get: (signal) => values.get(signal) });
const baseValues = () => new Map([[signals.bottomActive, null], [signals.bottomOpen, false], [signals.layout, "layout"], [signals.rightActive, null], [signals.rightEnabled, true], [signals.rightOpen, false], [signals.rightTabs, []]]);

deepEqual(Object.keys(module), ["n", "t"]);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
deepEqual([...source.matchAll(/(?:from )?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["rolldown-runtime", "app-initial", "app-primary"]);
module.t(); module.t();
deepEqual(calls.initialized, ["right-panel", "side-panel", "state", "actions", "routing", "selection", "layout", "browser-tabs", "tabs", "helpers"]);

const closeValues = baseValues();
closeValues.set(signals.rightActive, { type: "browser", tabId: "tab-1", browserTabId: "browser-1" });
closeValues.set(signals.rightOpen, true);
module.n(createScope(closeValues), { browserTabId: "browser-1", open: false, source: "button" });
equal(calls.closed.length, 1);
equal(calls.closed[0][1], "right");
deepEqual(calls.cleared[0], ["conversation-1", "resolved-browser-1"]);

config.target = { target: "bottom", browserTabId: "browser-bottom", tab: { tabId: "bottom-tab" } };
const bottomValues = baseValues();
module.n(createScope(bottomValues), { browserTabId: "browser-bottom", open: true, initiator: "user" });
deepEqual(calls.activated.at(-1), ["conversation-1", "browser-bottom", { initiator: "user", source: undefined }]);
equal(calls.shown.at(-1)[1], "bottom");
equal(calls.shown.at(-1)[2], "bottom-tab");

config.target = null;
config.preferred = "right";
const rightValues = baseValues();
rightValues.set(signals.rightTabs, [{ type: "browser", tabId: "tab-old", browserTabId: "browser-old" }, { type: "browser", tabId: "tab-new", browserTabId: "browser-new" }]);
module.n(createScope(rightValues), { open: true, source: "menu" });
equal(calls.shown.at(-1)[1], "right");
equal(calls.shown.at(-1)[2], "tab-new");
equal(calls.activated.at(-1)[1], "browser-new");

const createValues = baseValues();
module.n(createScope(createValues), { browserTabId: "missing", open: true });
equal(calls.ensured.length, 1);
deepEqual(calls.ensured[0][1], { browserTabId: "resolved-resolved-missing" });
equal(calls.activated.at(-1)[1], "browser-last");
console.log("panel-visibility tests passed (" + assertions + " assertions)");
