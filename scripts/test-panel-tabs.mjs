import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/panel-tabs/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const calls = { initialized: 0, invocations: [] };
const transferIds = (...args) => { calls.invocations.push(["transfer", args]); return ["tab-a", ...args]; };
const lastFocused = (...args) => { calls.invocations.push(["focused", args]); if (args[0] === "throw") throw new Error("focus failed"); return args[0] + ":last"; };
globalThis.__panelTabs = { calls, transferIds, lastFocused };
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) {
  build.onResolve({ filter: /^@rchunk\/app-initial$/ }, () => ({ path: "app-initial", namespace: "mock" }));
  build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "const s=globalThis.__panelTabs;export const lgt=s.transferIds;export const mgt=()=>{s.calls.initialized++};export const ugt=s.lastFocused;", loader: "js" }));
} }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
let assertions = 0;
const equal = (actual, expected) => { assertions++; assert.equal(actual, expected); };
const deepEqual = (actual, expected) => { assertions++; assert.deepEqual(actual, expected); };
const ok = (value) => { assertions++; assert.ok(value); };
deepEqual(Object.keys(module), ["getConversationBrowserTabIdsForTransfer", "getLastFocusedBrowserTabId"]);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
deepEqual([...source.matchAll(/from "@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["app-initial"]);
equal(calls.initialized, 1);
equal(module.getConversationBrowserTabIdsForTransfer, transferIds);
equal(module.getLastFocusedBrowserTabId, lastFocused);
deepEqual(module.getConversationBrowserTabIdsForTransfer("conversation-1", "tab-b"), ["tab-a", "conversation-1", "tab-b"]);
equal(module.getLastFocusedBrowserTabId("conversation-1"), "conversation-1:last");
deepEqual(calls.invocations, [["transfer", ["conversation-1", "tab-b"]], ["focused", ["conversation-1"]]]);
let thrown;
try { module.getLastFocusedBrowserTabId("throw"); } catch (error) { thrown = error; }
ok(thrown instanceof Error);
equal(thrown.message, "focus failed");
equal(calls.initialized, 1);
console.log("panel-tabs tests passed (" + assertions + " assertions)");
