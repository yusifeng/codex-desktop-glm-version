import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "src/renderer/open-local-conversation-background-agent-entry/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const output = path.join(root, ".tmp-test-open-local-conversation-background-agent-entry.mjs");
const calls = [];
const tabType = { type: "background-agent" };

await build({ entryPoints: [sourcePath], outfile: output, bundle: true, platform: "node", format: "esm", plugins: [{ name: "mocks", setup(buildApi) {
  buildApi.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
  buildApi.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => {
    if (moduleName === "app-shared") return { loader: "js", contents: "export {};" };
    if (moduleName === "app-primary") return { loader: "js", contents: "export const Gr=(...args)=>globalThis.__backgroundEntry.call('hydrated',args);" };
    if (moduleName === "open-target") return { loader: "js", contents: "export const t=(...args)=>globalThis.__backgroundEntry.call('target',args);" };
    return { loader: "js", contents: "export const n=()=>globalThis.__backgroundEntry.call('initialize',[]); export const r=(...args)=>globalThis.__backgroundEntry.call('open',args); export const t=globalThis.__backgroundEntry.tabType;" };
  });
} }] });
globalThis.__backgroundEntry = { tabType, call(name, arguments_) { calls.push([name, arguments_]); return name + ":" + arguments_.join(","); } };
const module = await import(pathToFileURL(output).href + "?t=" + Date.now());
fs.rmSync(output, { force: true });

assert.deepEqual([...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^\"]+)"/g)].map((match) => match[1]), ["app-shared", "app-primary", "open-target", "open-local-conversation-background-agent"]);
assert.deepEqual(calls.shift(), ["initialize", []]);
assert.equal(module.backgroundAgentTabType, tabType);
assert.equal(module.getLocalConversationBackgroundAgentOpenTarget("thread"), "target:thread");
assert.equal(module.openHydratedLocalConversationSubagent("scope", "thread"), "hydrated:scope,thread");
assert.equal(module.openLocalConversationBackgroundAgent("scope", "thread"), "open:scope,thread");
assert.equal(/(?:\bas\s+any\b|:\s*any\b|<any>)/.test(source), false);
assert.equal(/\b(?:appPrimaryChunk|openTargetChunk|backgroundAgentChunk)\s*\./.test(source), false);
delete globalThis.__backgroundEntry;
console.log("8 background agent entry assertions passed");
