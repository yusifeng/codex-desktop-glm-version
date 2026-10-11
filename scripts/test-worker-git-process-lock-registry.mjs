import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "git-process-lock-registry-"));
const output = path.join(tempDir, "registry.cjs");
await esbuild.build({ entryPoints: [path.join(root, "src/main/worker/git-process-lock-registry.ts")], outfile: output, bundle: true, format: "cjs", platform: "node", target: "esnext", logLevel: "silent" });
const { createGitProcessLockRegistry } = createRequire(import.meta.url)(output);

const registry = createGitProcessLockRegistry();
const first = await registry.acquire("repo", Date.now() + 1000);
assert.ok(first);
let trackedResolve;
first.track(new Promise((resolve) => { trackedResolve = resolve; }));
first.close();
let secondReady = false;
const secondPromise = registry.acquire("repo", Date.now() + 1000).then((lease) => { secondReady = lease != null; return lease; });
await Promise.resolve();
assert.equal(secondReady, false);
trackedResolve();
const second = await secondPromise;
assert.ok(second);
second.close();

const controller = new AbortController();
const held = await registry.acquire("abort", Date.now() + 1000);
const blocked = registry.acquire("abort", Date.now() + 1000, controller.signal);
controller.abort();
assert.equal(await blocked, null);
held.close();
assert.equal(await registry.acquire("abort", Date.now() + 1000) != null, true);

const timeoutHeld = await registry.acquire("timeout", Date.now() + 1000);
assert.equal(await registry.acquire("timeout", Date.now() + 5), null);
timeoutHeld.close();
console.log("test-worker-git-process-lock-registry: 7 assertions passed");
