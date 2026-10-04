#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, ".tmp-test-create-command-query-key.mjs");
await build({
  entryPoints: [path.join(root, "src/renderer/app-initial/runtime/create-command-query-key.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: output,
});
const { createCommandQueryKey } = await import(`${output}?test=${Date.now()}`);
assert.deepEqual(createCommandQueryKey("browser-use-origin-state-read"), ["vscode", "browser-use-origin-state-read"]);
assert.deepEqual(createCommandQueryKey("read", { hostId: "local" }), ["vscode", "read", JSON.stringify({ hostId: "local" })]);
assert.deepEqual(createCommandQueryKey("read", undefined, ["cache", 1]), ["vscode", "read", "cache", 1]);
console.log("3 app-initial command query-key assertions passed");
