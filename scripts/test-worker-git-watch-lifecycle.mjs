import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const dir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-git-watch-lifecycle-"));
const out = path.join(dir, "watch-lifecycle.cjs");
await esbuild.build({ entryPoints: [path.join(root, "src/main/worker/git-watch-lifecycle.ts")], outfile: out, bundle: true, format: "cjs", platform: "node", target: "esnext", logLevel: "silent" });
const { releaseGitRepoWatch } = createRequire(import.meta.url)(out);

let closes = 0;
const watch = { refCount: 2, startPromise: Promise.resolve() };
releaseGitRepoWatch(watch, () => { closes += 1; });
assert.equal(watch.refCount, 1);
assert.equal(closes, 0);
releaseGitRepoWatch(watch, () => { closes += 1; });
await Promise.resolve();
assert.equal(watch.refCount, 0);
assert.equal(closes, 1);

let rejectedClose = 0;
const rejected = { refCount: 1, startPromise: Promise.reject(new Error("setup failed")) };
releaseGitRepoWatch(rejected, () => { rejectedClose += 1; });
await rejected.startPromise.catch(() => {});
await Promise.resolve();
assert.equal(rejectedClose, 1);

let retainedClose = 0;
const retained = { refCount: 0, startPromise: Promise.resolve() };
releaseGitRepoWatch(retained, () => { retainedClose += 1; });
assert.equal(retainedClose, 0);
console.log("5 worker git watch lifecycle assertions passed");
