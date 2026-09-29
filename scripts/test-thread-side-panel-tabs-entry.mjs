import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "src/renderer/thread-side-panel-tabs-entry/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const output = path.join(root, ".tmp-test-thread-side-panel-tabs-entry.mjs");
const calls = [];
const tabType = { timeline: "timeline" };

await build({ entryPoints: [sourcePath], outfile: output, bundle: true, platform: "node", format: "esm", plugins: [{ name: "mocks", setup(buildApi) {
  buildApi.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
  buildApi.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({ loader: "js", contents: moduleName === "app-initial" ? "export const Zen=globalThis.__threadSidePanel.tabType; export const Act=(...args)=>globalThis.__threadSidePanel.call('id',args); export const Mct=(...args)=>globalThis.__threadSidePanel.call('open-mcp',args); export const kct=(...args)=>globalThis.__threadSidePanel.call('close-mcp',args);" : "export const t=()=>globalThis.__threadSidePanel.call('initialize',[]); export const n=(...args)=>globalThis.__threadSidePanel.call('sandbox',args); export const r=(...args)=>globalThis.__threadSidePanel.call('timeline',args);" }));
} }] });
globalThis.__threadSidePanel = { tabType, call(name, arguments_) { calls.push([name, arguments_]); return name + ":" + arguments_.join(","); } };
const module = await import(pathToFileURL(output).href + "?t=" + Date.now());
fs.rmSync(output, { force: true });

assert.deepEqual([...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^\"]+)"/g)].map((match) => match[1]), ["app-initial", "thread-side-panel-tabs"]);
assert.deepEqual(calls.shift(), ["initialize", []]);
assert.equal(module.THREAD_SIDE_PANEL_TAB, tabType);
assert.equal(module.getThreadMcpAppSidePanelTabId("thread", "app"), "id:thread,app");
assert.equal(module.openThreadMcpAppSidePanelTab("scope", "thread"), "open-mcp:scope,thread");
assert.equal(module.closeThreadMcpAppSidePanelTab("scope", "thread"), "close-mcp:scope,thread");
assert.equal(module.openSessionSandboxSidePanel("scope", "thread"), "sandbox:scope,thread");
assert.equal(module.openThreadTimelineSidePanel("scope", "thread"), "timeline:scope,thread");
assert.equal(/(?:\bas\s+any\b|:\s*any\b|<any>)/.test(source), false);
assert.equal(/\b(?:appInitialChunk|threadSidePanelTabsChunk)\s*\./.test(source), false);
delete globalThis.__threadSidePanel;
console.log("10 thread side panel tab assertions passed");
