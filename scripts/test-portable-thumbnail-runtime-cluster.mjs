import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resetState() {
  globalThis.__thumbnailRuntimeTest = { effects: [], fontLoads: [], initializers: [], installed: [], metricChanges: 0, pdfRequests: [], stateUpdates: [] };
  return globalThis.__thumbnailRuntimeTest;
}

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "thumbnail-runtime-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({ path: value.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => {
        if (value === "app-shared") return { contents: `
          const state=globalThis.__thumbnailRuntimeTest;
          const React={
            useState:(initial)=>[initial,(value)=>state.stateUpdates.push(value)],
            useEffect:(effect,deps)=>{state.effects.push(deps);const cleanup=effect();if(cleanup)state.cleanup=cleanup},
          };
          export const $3=()=>state.initializers.push("compiler"),e6=()=>React;
        `, loader: "js" };
        if (value === "portable-thumbnail-font-metrics") return { contents: `
          const state=globalThis.__thumbnailRuntimeTest;
          export const c=()=>{state.metricChanges+=1},i=()=>state.initializers.push("font-metrics");
        `, loader: "js" };
        if (value === "thumbnail-worker-font-metrics") return { contents: `export const s=()=>{globalThis.__thumbnailRuntimeTest.metricChanges+=1};`, loader: "js" };
        if (value === "portable-thumbnail-font-face-source-runtime") return { contents: `
          const state=globalThis.__thumbnailRuntimeTest;
          export const r=()=>state.initializers.push("font-sources"),t=()=>[{family:"Carlito",style:"normal",weight:"400",src:"/carlito.woff2",format:"woff2"}],
            i=async(sources)=>{state.installed.push(sources)},n=()=>({});
        `, loader: "js" };
        if (value === "portable-pdfjs-runtime") return { contents: `
          const state=globalThis.__thumbnailRuntimeTest;
          export const GlobalWorkerOptions={workerSrc:""};
          export const getDocument=({data})=>{state.pdfRequests.push(data);return {promise:Promise.resolve({numPages:2,destroyed:false,destroy(){this.destroyed=true},getPage:async()=>({getViewport:()=>({height:600,width:800})})})}};
        `, loader: "js" };
        return { contents: "export {};", loader: "js" };
      });
    }}],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${Math.random()}`);
}

function fontRule(properties) {
  return { type: 5, style: { getPropertyValue: (name) => properties[name] ?? "" } };
}

assertReleaseOwner("portable-thumbnail-font-face-source-runtime");
assertReleaseOwner("thumbnail-worker-font-faces");

// portable-thumbnail-font-runtime: memoized two-weight document preload and readiness.
let state = resetState();
globalThis.document = { fonts: { load: async (font) => { state.fontLoads.push(font); return []; } } };
const fontRuntime = await bundle("portable-thumbnail-font-runtime");
fontRuntime.r();
assert.deepEqual(state.initializers, ["font-sources"]);
assert.equal(fontRuntime.t(), false);
const firstLoad = fontRuntime.n();
const secondLoad = fontRuntime.n();
assert.equal(firstLoad, secondLoad);
await firstLoad;
assert.deepEqual(state.fontLoads, ["400 16px Carlito", "700 16px Carlito"]);
assert.equal(state.installed.length, 1);
assert.equal(state.installed[0][0].family, "Carlito");
assert.equal(fontRuntime.t(), true);

// portable-thumbnail-pdf-document: browser-only loading, worker setup and hook lifecycle.
state = resetState();
delete globalThis.window;
const pdf = await bundle("portable-thumbnail-pdf-document");
await assert.rejects(pdf.t(), /only be loaded in the browser/);
globalThis.window = { atob: (value) => Buffer.from(value, "base64").toString("binary") };
const pdfRuntime = await pdf.t();
assert.match(pdfRuntime.GlobalWorkerOptions.workerSrc, /pdf\.worker\.min-2ac0aeeaff32\.mjs$/);
const sameRuntime = await pdf.t();
assert.equal(sameRuntime, pdfRuntime);
pdf.n();
assert.deepEqual(state.initializers, ["compiler"]);
const initial = pdf.r({ fileDataUrl: `data:application/pdf;base64,${Buffer.from("pdf").toString("base64")}` });
assert.equal(initial.loadState, "loading");
assert.equal(initial.numPages, 0);
assert.equal(initial.pdfDocument, null);
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(state.pdfRequests.length, 1);
assert.deepEqual([...state.pdfRequests[0]], [...Buffer.from("pdf")]);
assert.ok(state.stateUpdates.includes("ready"));
assert.ok(state.stateUpdates.includes(2));
assert.deepEqual(state.stateUpdates.find((value) => value?.width === 800), { height: 600, width: 800 });

console.log("41 portable thumbnail runtime cluster assertions passed");
