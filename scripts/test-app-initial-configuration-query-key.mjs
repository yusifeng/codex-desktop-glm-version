#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, ".tmp-test-configuration-query-key.mjs");
await build({
  entryPoints: [path.join(root, "src/renderer/app-initial/runtime/configuration-query-key.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: output,
});
const { configurationQueryKey } = await import(`${output}?test=${Date.now()}`);
assert.deepEqual(configurationQueryKey, ["config", "user"]);
assert.equal(Object.isFrozen(configurationQueryKey), false);
console.log("2 app-initial configuration query-key assertions passed");
