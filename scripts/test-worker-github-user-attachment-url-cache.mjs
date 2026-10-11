import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "github-user-attachment-url-cache-"));
const output = path.join(tempDir, "cache.cjs");
await esbuild.build({ entryPoints: [path.join(root, "src/main/worker/github-user-attachment-url-cache.ts")], outfile: output, bundle: true, format: "cjs", platform: "node", target: "esnext", logLevel: "silent" });
const { createGithubUserAttachmentUrlCache } = createRequire(import.meta.url)(output);

let now = 1_000;
const cache = createGithubUserAttachmentUrlCache(() => now);
assert.equal(cache.getOrSet("asset", "first", 100_000), "first");
assert.equal(cache.getOrSet("asset", "second", 100_000), "first");
now = 40_001;
assert.equal(cache.getOrSet("asset", "third", 100_000), "third");
assert.equal(cache.getOrSet("other", "other-url", 50_000), "other-url");
now = 1_000;
assert.equal(cache.getOrSet("asset", "fourth", 200_000), "third");
console.log("test-worker-github-user-attachment-url-cache: 5 assertions passed");
