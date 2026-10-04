#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, ".tmp-test-parse-origin-pattern.mjs");
await build({
  entryPoints: [path.join(root, "src/renderer/app-initial/runtime/parse-origin-pattern.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: output,
});
const { parseOriginPattern } = await import(`${output}?test=${Date.now()}`);
assert.deepEqual(parseOriginPattern("Example.COM."), {
  canonicalPattern: "example.com",
  hostnamePattern: "example.com",
  kind: "exact",
});
assert.equal(parseOriginPattern("*.example.com")?.kind, "subdomains-only");
assert.equal(parseOriginPattern("**.example.com")?.kind, "apex-and-subdomains");
assert.equal(parseOriginPattern("bad[pattern]"), null);
console.log("4 app-initial parseOriginPattern assertions passed");
