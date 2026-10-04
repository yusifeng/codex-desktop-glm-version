#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, ".tmp-test-select-writable-configuration-layer.mjs");
await build({
  entryPoints: [path.join(root, "src/renderer/app-initial/runtime/select-writable-configuration-layer.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: output,
});
const { selectWritableConfigurationLayer } = await import(`${output}?test=${Date.now()}`);
const layers = [
  { name: { type: "system" }, id: "system" },
  { name: { type: "user" }, id: "first" },
  { name: { type: "project" }, id: "project" },
  { name: { type: "user" }, id: "last" },
];
assert.equal(selectWritableConfigurationLayer(layers)?.id, "last");
assert.equal(selectWritableConfigurationLayer([{ name: { type: "system" } }]), null);
assert.equal(selectWritableConfigurationLayer(null), null);
console.log("3 app-initial writable-layer assertions passed");
