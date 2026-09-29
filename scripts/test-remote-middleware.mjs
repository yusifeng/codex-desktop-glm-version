import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = { baseUrl: "https://cdn.example.test", disabled: false, initialized: 0, loads: [], fail: new Set(), errors: [], increments: [] };
Object.defineProperty(globalThis, "window", { value: { alphaMiddleware: { name: "alpha" }, betaMiddleware: null, gammaMiddleware: { name: "gamma" } }, configurable: true });
globalThis.__remoteMiddleware = state;
const mocks = {
  "rolldown-runtime": "export {};", "app-shared": "export {};",
  "load-script": "const s=globalThis.__remoteMiddleware;export const a=()=>s.baseUrl;export const m=()=>s.disabled;export const o=()=>{s.initialized+=1};export const n=async url=>{s.loads.push(url);for(const name of s.fail)if(url.includes(name))throw new Error('load failed')};",
};
const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer/remote-middleware/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, metafile: true, logLevel: "silent", plugins: [{ name: "remote-middleware-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["remoteMiddlewares"]);
assert.equal(state.initialized, 1);
const source = fs.readFileSync(path.join(ROOT, "src/renderer/remote-middleware/index.ts"), "utf8");
assert.deepEqual([...new Set([...source.matchAll(/(?:from\s+|import\s+)["']@rchunk\/([^"']+)["']/g)].map((match) => match[1]))], ["rolldown-runtime", "app-shared", "load-script"]);

const logger = { log(level, reason) { state.errors.push({ level, reason }); }, stats: { increment(metric) { state.increments.push(metric); } } };
state.disabled = true;
assert.deepEqual(await module.remoteMiddlewares(logger, { enabledMiddleware: { alpha: true } }), []);
assert.deepEqual(state.loads, []);
state.disabled = false;
let loaded = await module.remoteMiddlewares(logger, { enabledMiddleware: { "@segment/alpha": true, beta: false, gamma: true } });
assert.deepEqual(loaded, [{ name: "alpha" }, { name: "gamma" }]);
assert.deepEqual(state.loads, ["https://cdn.example.test/middleware/alpha/latest/alpha.js.gz", "https://cdn.example.test/middleware/gamma/latest/gamma.js.gz"]);
state.loads.length = 0; state.fail.add("gamma");
loaded = await module.remoteMiddlewares(logger, { enabledMiddleware: { beta: true, gamma: true } });
assert.deepEqual(loaded, []);
assert.equal(state.errors.length, 1);
assert.equal(state.errors[0].level, "error");
assert.deepEqual(state.increments, ["failed_remote_middleware"]);
state.loads.length = 0; state.fail.clear();
loaded = await module.remoteMiddlewares(logger, { enabledMiddleware: { alpha: true } }, true);
assert.deepEqual(loaded, [{ name: "alpha" }]);
assert.equal(state.loads[0], "https://cdn.example.test/middleware/YWxwaGE/latest/YWxwaGE.js.gz");
assert.equal(state.loads[0].includes("="), false);
assert.deepEqual(await module.remoteMiddlewares(logger, {}), []);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " remote middleware assertions passed");
