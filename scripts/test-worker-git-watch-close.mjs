import assert from "node:assert/strict";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const out = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "codex-git-watch-close-")), "watch-close.cjs");
await esbuild.build({ entryPoints: [path.resolve(import.meta.dirname, "../src/main/worker/git-watch-close.ts")], outfile: out, bundle: true, format: "cjs", platform: "node", target: "esnext", logLevel: "silent" });
const { closeGitRepoWatch } = createRequire(import.meta.url)(out);

const events = [];
const removed = [];
const repo = {};
let disposed = 0;
const current = { root: "/repo", commonDir: "/repo/.git", isReady: true, watcher: { dispose: async () => { disposed += 1; } } };
const dependencies = {
  getWatchKey: (root, host) => `${host.id}:${root}`,
  getCurrentWatch: () => current,
  getRepository: () => repo,
  invalidateRepository: (value) => { value.invalidated = true; },
  clearRepositoryCaches: (value) => { value.cleared = true; },
  removeWatch: (key) => removed.push(key),
  emit: (event) => events.push(event),
};
const host = { id: "local" };
const first = closeGitRepoWatch(current, host, true, dependencies);
const second = closeGitRepoWatch(current, host, true, dependencies);
assert.equal(first, second, "close is idempotent while disposal is pending");
await first;
assert.equal(disposed, 1);
assert.equal(current.isReady, false);
assert.equal(repo.invalidated, true);
assert.equal(repo.cleared, true);
assert.deepEqual(removed, ["local:/repo"]);
assert.equal(events.length, 1);
assert.equal(events[0].event.type, "git-repo-unwatched");

const quiet = { root: "/quiet", commonDir: "/quiet/.git", isReady: true, watcher: { dispose: async () => {} } };
await closeGitRepoWatch(quiet, host, false, { ...dependencies, getCurrentWatch: () => quiet });
assert.equal(events.length, 1, "emitEvent false suppresses unwatched event");
console.log("test-worker-git-watch-close: 8 assertions passed");
