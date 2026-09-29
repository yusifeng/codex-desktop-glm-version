import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "src/renderer/chat-seat-access-screen-entry/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const output = path.join(root, ".tmp-test-chat-seat-access-screen-entry.mjs");
let initialized = 0;

await build({ entryPoints: [sourcePath], outfile: output, bundle: true, platform: "node", format: "esm", plugins: [{ name: "mocks", setup(buildApi) {
  buildApi.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
  buildApi.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({ loader: "js", contents: moduleName === "app-shared" ? "export {};" : "export const r=()=>{globalThis.__seatAccessInitialized++}; export const n=(props={})=>({type:'seat-access',props});" }));
} }] });
globalThis.__seatAccessInitialized = initialized;
const module = await import(pathToFileURL(output).href + "?t=" + Date.now());
fs.rmSync(output, { force: true });

assert.deepEqual([...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^\"]+)"/g)].map((match) => match[1]), ["app-shared", "conversation-screen"]);
assert.equal(globalThis.__seatAccessInitialized, 1);
assert.deepEqual(module.ChatSeatAccessScreen({ reason: "seat-required" }), { type: "seat-access", props: { reason: "seat-required" } });
assert.equal(/(?:\bas\s+any\b|:\s*any\b|<any>)/.test(source), false);
assert.equal(/\bconversationScreenChunk\s*\./.test(source), false);
delete globalThis.__seatAccessInitialized;
console.log("5 chat seat access screen assertions passed");
