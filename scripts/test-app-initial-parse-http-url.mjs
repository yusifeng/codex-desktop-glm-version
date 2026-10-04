#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, ".tmp-test-parse-http-url.mjs");
await build({
  entryPoints: [path.join(root, "src/renderer/app-initial/runtime/parse-http-url.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: output,
});
const { parseHttpUrl } = await import(`${output}?test=${Date.now()}`);
assert.equal(parseHttpUrl("https://example.com/path")?.hostname, "example.com");
assert.equal(parseHttpUrl("http://localhost:3000")?.port, "3000");
assert.equal(parseHttpUrl("ftp://example.com"), null);
assert.equal(parseHttpUrl("not a url"), null);
console.log("4 app-initial parseHttpUrl assertions passed");
