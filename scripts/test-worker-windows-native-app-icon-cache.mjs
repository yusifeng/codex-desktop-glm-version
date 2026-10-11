import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "windows-native-app-icon-cache-"));
const output = path.join(tempDir, "cache.cjs");
await esbuild.build({ entryPoints: [path.join(root, "src/main/worker/windows-native-app-icon-cache.ts")], outfile: output, bundle: true, format: "cjs", platform: "node", target: "esnext", logLevel: "silent" });
const { createWindowsNativeAppIconCache } = createRequire(import.meta.url)(output);

let loads = 0;
let resolveIcon;
const cache = createWindowsNativeAppIconCache(() => {
  loads += 1;
  return new Promise((resolve) => { resolveIcon = resolve; });
}, 2);
const first = cache.get("C:\\Program Files\\App.exe");
assert.equal(cache.get("C:\\Program Files\\App.exe"), first);
assert.equal(loads, 1);
resolveIcon("icon");
assert.equal(await first, "icon");

let resolveOld;
let resolveNew;
let emptyLoads = 0;
const emptyCache = createWindowsNativeAppIconCache(() => {
  emptyLoads += 1;
  return new Promise((resolve) => { if (emptyLoads === 1) resolveOld = resolve; else resolveNew = resolve; });
}, 1);
emptyCache.get("empty");
await emptyCache.get("other", () => Promise.resolve("other"));
const replacement = emptyCache.get("empty");
resolveOld(null);
await Promise.resolve();
let replacementSettled = false;
replacement.then(() => { replacementSettled = true; });
await Promise.resolve();
assert.equal(replacementSettled, false);
resolveNew("icon");
assert.equal(await replacement, "icon");

let rejectLoads = 0;
const retryCache = createWindowsNativeAppIconCache(() => {
  rejectLoads += 1;
  return rejectLoads === 1 ? Promise.reject(new Error("failed")) : Promise.resolve("retry");
});
await assert.rejects(retryCache.get("retry"), /failed/);
assert.equal(await retryCache.get("retry"), "retry");
assert.equal(rejectLoads, 2);

let lruLoads = 0;
const lru = createWindowsNativeAppIconCache((key) => { lruLoads += 1; return Promise.resolve(key); }, 2);
await lru.get("a");
await lru.get("b");
await lru.get("a");
await lru.get("c");
await lru.get("b");
assert.equal(lruLoads, 4);

console.log("test-worker-windows-native-app-icon-cache: 8 assertions passed");
