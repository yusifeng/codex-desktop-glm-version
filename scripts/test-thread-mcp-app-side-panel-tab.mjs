import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "src/renderer/thread-mcp-app-side-panel-tab/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const output = path.join(root, ".tmp-test-thread-mcp-app-side-panel-tab.mjs");
let initialized = 0;

await build({ entryPoints: [sourcePath], outfile: output, bundle: true, platform: "node", format: "esm", plugins: [{ name: "mocks", setup(buildApi) {
  buildApi.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
  buildApi.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({ loader: "js", contents: moduleName === "rolldown-runtime" ? "export const n=(factory)=>{let done=false;return()=>{if(!done){done=true;factory()}}};" : "export const $3=()=>{globalThis.__mcpPanel.initialized++}; export const I3=()=>globalThis.__mcpPanel.jsx;" }));
} }] });
globalThis.__mcpPanel = { initialized, jsx: { jsx(type, props) { return { type, props }; } } };
const module = await import(pathToFileURL(output).href + "?t=" + Date.now());
fs.rmSync(output, { force: true });

assert.deepEqual([...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^\"]+)"/g)].map((match) => match[1]), ["rolldown-runtime", "app-shared"]);
assert.equal(globalThis.__mcpPanel.initialized, 1);
const ref = () => {};
const view = module.McpAppThreadSidePanelTab({ onPanelElementChange: ref });
assert.equal(view.type, "div");
assert.equal(view.props.className, "relative h-full min-h-0");
assert.equal(view.props.children.type, "div");
assert.equal(view.props.children.props.ref, ref);
assert.equal(view.props.children.props["data-mcp-app-side-panel-frame-container"], "true");
assert.equal(view.props.children.props.className, "h-full min-h-0 w-full");
assert.equal(/(?:\bas\s+any\b|:\s*any\b|<any>)/.test(source), false);
assert.equal(/\b(?:runtimeChunk|appSharedChunk)\s*\./.test(source), false);
delete globalThis.__mcpPanel;
console.log("11 thread MCP panel assertions passed");
