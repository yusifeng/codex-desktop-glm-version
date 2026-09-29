import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "src/renderer/thread-context/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const output = path.join(root, ".tmp-test-thread-context.mjs");
let initialized = 0;
const values = Object.fromEntries(["Cyt", "Dyt", "Eyt", "Syt", "Tyt", "wyt", "xyt", "yyt"].map((name) => [name, { name }]));

await build({ entryPoints: [sourcePath], outfile: output, bundle: true, platform: "node", format: "esm", plugins: [{ name: "mocks", setup(buildApi) {
  buildApi.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath, namespace: "mock" }));
  buildApi.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ loader: "js", contents: "const values=globalThis.__threadContextValues; export const Cyt=values.Cyt,Dyt=values.Dyt,Eyt=values.Eyt,Syt=values.Syt,Tyt=values.Tyt,wyt=values.wyt,xyt=values.xyt,yyt=values.yyt; export const byt=()=>globalThis.__threadContextInitialized();" }));
} }] });
globalThis.__threadContextValues = values;
globalThis.__threadContextInitialized = () => { initialized += 1; };
const module = await import(pathToFileURL(output).href + "?t=" + Date.now());
fs.rmSync(output, { force: true });
delete globalThis.__threadContextValues;
delete globalThis.__threadContextInitialized;

assert.deepEqual([...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^\"]+)"/g)].map((match) => match[1]), ["app-initial"]);
assert.equal(initialized, 1);
assert.deepEqual(Object.keys(module).sort(), ["fileGitHostConfigByHostId$", "threadCodexHome$", "threadCwd$", "threadExecutorTarget$", "threadGitHostConfig$", "threadGitHostKey$", "threadHostConfig$", "threadHostId$"]);
assert.equal(module.fileGitHostConfigByHostId$, values.Cyt);
assert.equal(module.threadHostId$, values.Dyt);
assert.equal(module.threadHostConfig$, values.Eyt);
assert.equal(module.threadCwd$, values.Syt);
assert.equal(module.threadGitHostKey$, values.Tyt);
assert.equal(module.threadGitHostConfig$, values.wyt);
assert.equal(module.threadCodexHome$, values.xyt);
assert.equal(module.threadExecutorTarget$, values.yyt);
assert.equal(/(?:\bas\s+any\b|:\s*any\b|<any>)/.test(source), false);
assert.equal(/\bappInitialChunk\s*\./.test(source), false);
console.log("13 thread context assertions passed");
