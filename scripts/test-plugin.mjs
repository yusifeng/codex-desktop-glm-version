import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/plugin/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
let sourceAssertions = 0;
const sourceCheck = (value, message) => { assert.ok(value, message); sourceAssertions += 1; };
const dependencies = new Set([...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map((match) => match[1]));
sourceCheck([...dependencies].join(",") === "app-initial", "keeps the sole app-initial dependency");
sourceCheck(!/import\s*\(/.test(source), "has no dynamic dependency");
sourceCheck(!/\bany\b/.test(source), "does not introduce an explicit unsafe type");
sourceCheck(!/\bappInitialChunk\s*\./.test(source), "does not consume a namespace member");

const state = (globalThis.__pluginEntryTest = { calls: [], error: null, initializations: 0, result: [] });
const result = await esbuild.build({
  entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "plugin-entry-mock", setup(build) {
    build.onResolve({ filter: /^@rchunk\/app-initial$/ }, () => ({ path: "app-initial", namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ loader: "js", contents: `
      const state=globalThis.__pluginEntryTest;
      export const Hv=()=>{state.initializations+=1;};
      export const Vv=async (...args)=>{state.calls.push(args);if(state.error!==null)throw state.error;return state.result;};
      state.action=Vv;
    ` }));
  } }],
});
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
let runtimeAssertions = 0;
const runtimeCheck = (value, message) => { assert.ok(value, message); runtimeAssertions += 1; };
runtimeCheck(Object.keys(module).join(",") === "getMcpExtensionContextMenuItems", "preserves the sole public export");
runtimeCheck(state.initializations === 1, "runs the entry initializer exactly once");
runtimeCheck(module.getMcpExtensionContextMenuItems === state.action, "re-exports the underlying action by identity");
const scope = { id: "scope" }; const input = { selection: "plugin" }; state.result = [{ id: "open" }];
runtimeCheck((await module.getMcpExtensionContextMenuItems(scope, input)) === state.result, "returns the action result unchanged");
runtimeCheck(state.calls[0][0] === scope && state.calls[0][1] === input, "forwards all arguments by identity");
const failure = new Error("menu failed"); state.error = failure;
await assert.rejects(module.getMcpExtensionContextMenuItems(scope, input), (error) => error === failure); runtimeAssertions += 1;
runtimeCheck(state.calls.length === 2, "delegates every attempted call");
console.log(`${sourceAssertions} source assertions, ${runtimeAssertions} runtime assertions passed for plugin`);
