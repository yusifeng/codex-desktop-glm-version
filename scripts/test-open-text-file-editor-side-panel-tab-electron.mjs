import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/open-text-file-editor-side-panel-tab-electron/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const calls = { initialized: 0, invocations: [] };
const open = (...args) => { calls.invocations.push(args); if (args[0] === "throw") throw new Error("open failed"); return { args, opened: true }; };
globalThis.__openTextFileEditorPanel = { calls, open };
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) {
  build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
  build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: module === "app-initial" ? "const s=globalThis.__openTextFileEditorPanel;export const Bst=()=>{s.calls.initialized++};export const Vst=s.open;" : "export {};", loader: "js" }));
} }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
let assertions = 0;
const equal = (actual, expected) => { assertions++; assert.equal(actual, expected); };
const deepEqual = (actual, expected) => { assertions++; assert.deepEqual(actual, expected); };
const ok = (value) => { assertions++; assert.ok(value); };
deepEqual(Object.keys(module), ["openTextFileEditorSidePanelTab"]);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
deepEqual([...source.matchAll(/(?:from )?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["app-shared", "app-initial"]);
equal(calls.initialized, 1);
equal(module.openTextFileEditorSidePanelTab, open);
const input = { filePath: "/tmp/example.ts", hostId: "local" };
deepEqual(module.openTextFileEditorSidePanelTab(input, { revealAndFocus: false }), { args: [input, { revealAndFocus: false }], opened: true });
deepEqual(calls.invocations, [[input, { revealAndFocus: false }]]);
let thrown;
try { module.openTextFileEditorSidePanelTab("throw"); } catch (error) { thrown = error; }
ok(thrown instanceof Error);
equal(thrown.message, "open failed");
equal(calls.initialized, 1);
console.log("open-text-file-editor-side-panel-tab-electron tests passed (" + assertions + " assertions)");
