import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/legacy-video-plugins/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
let sourceAssertions = 0;
const sourceCheck = (value, message) => { assert.ok(value, message); sourceAssertions += 1; };
const staticDependencies = new Set([...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map((match) => match[1]));
const dynamicDependencies = new Set([...source.matchAll(/import\("@rchunk\/([^"/]+)"\)/g)].map((match) => match[1]));
sourceCheck([...staticDependencies].sort().join(",") === "app-shared,rolldown-runtime", "preserves both static dependencies");
sourceCheck([...dynamicDependencies].join(",") === "legacy-video-plugins-runtime", "preserves the UMD runtime as a lazy dependency");
sourceCheck(source.includes("./index.umd-4af9c310b668.js") && source.includes("./rolldown-runtime-2d059c5e81f4.js"), "preserves published preload filenames");
sourceCheck(!/\bany\b/.test(source), "does not introduce an explicit unsafe type");
sourceCheck(!/\b(?:appSharedChunk|runtimeChunk)\s*\./.test(source), "does not consume namespace members");

const state = (globalThis.__legacyVideoPluginsTest = { initializers: [], preloadCalls: [], plugins: { VimeoAnalytics: "vimeo", YouTubeAnalytics: "youtube" } });
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": `
    const state=globalThis.__legacyVideoPluginsTest;
    export const H3=()=>state.initializers.push("preload");
    export const p4=()=>state.initializers.push("async-runtime");
    export const V3=async(loader,dependencies,importerUrl)=>{state.preloadCalls.push({dependencies,importerUrl});return loader();};
  `,
  "legacy-video-plugins-runtime": "export default globalThis.__legacyVideoPluginsTest.plugins;",
};
const result = await esbuild.build({
  entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", define: { "import.meta.url": JSON.stringify("file:///renderer/legacy-video-plugins.js") },
  plugins: [{ name: "legacy-video-plugin-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ loader: "js", contents: mocks[importPath] ?? "export {};" }));
  } }],
});
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
let runtimeAssertions = 0;
const runtimeCheck = (value, message) => { assert.ok(value, message); runtimeAssertions += 1; };
runtimeCheck(Object.keys(module).join(",") === "loadLegacyVideoPlugins", "preserves the sole public export");
runtimeCheck(state.initializers.join(",") === "async-runtime,preload", "initializes loader dependencies in published order");
const target = { id: "analytics" }; const returnValue = await module.loadLegacyVideoPlugins(target);
runtimeCheck(returnValue === undefined, "resolves without a return payload");
runtimeCheck(target._plugins === state.plugins, "installs the lazy plugin bundle on the target");
runtimeCheck(state.preloadCalls.length === 1, "uses the preload helper once per load");
runtimeCheck(state.preloadCalls[0].dependencies.join(",") === "./index.umd-4af9c310b668.js,./rolldown-runtime-2d059c5e81f4.js", "passes the published preload dependency list");
runtimeCheck(state.preloadCalls[0].importerUrl === "file:///renderer/legacy-video-plugins.js", "passes the importer URL to preload resolution");
const secondTarget = {}; await module.loadLegacyVideoPlugins(secondTarget); runtimeCheck(secondTarget._plugins === state.plugins && state.preloadCalls.length === 2, "loads independently for each target");
console.log(`${sourceAssertions} source assertions, ${runtimeAssertions} runtime assertions passed for legacy video plugins`);
