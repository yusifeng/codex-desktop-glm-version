import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-worktree-handoff-dispatch-"));
const output = path.join(tempDir, "handoff.cjs");
await esbuild.build({ entryPoints: [path.join(root, "src/main/worker/git-worktree-handoff-dispatch.ts")], outfile: output, bundle: true, format: "cjs", platform: "node", target: "esnext", logLevel: "silent" });
const { moveThreadToLocal, moveThreadToHostWorktree, cleanupHostHandoffTransfer } = createRequire(import.meta.url)(output);
const events = [];
const invalidations = [];
const host = { id: "local" };
const deps = {
  host,
  gitManager: {
    invalidateUntrackedPathsCache: value => invalidations.push(["untracked", value]),
    invalidateShortLivedGitReadCaches: value => invalidations.push(["short", value]),
  },
  signal: new AbortController().signal,
  emit: value => events.push(value),
  moveToLocal: async (_params, options) => { options.onProgress("copy", "started"); return { success: true }; },
  moveToWorktree: async () => ({ success: true }),
  moveToHostWorktree: async (_params, options) => { options.onProgress("handoff", "done"); return { success: true }; },
  createExecutionHost: config => ({ id: config.id }),
  cleanupHostTransfer: async (rolloutPath, sourceHost) => events.push({ rolloutPath, sourceHost }),
};
assert.deepEqual(await moveThreadToLocal({ operationId: "op" }, "request", deps), { success: true });
assert.deepEqual(events[0].event, { type: "thread-handoff-progress", operationId: "op", direction: "to-local", step: "copy", status: "started" });
assert.deepEqual(await moveThreadToHostWorktree({ destinationHostConfig: { id: "remote" } }, "request-2", deps), { success: true });
assert.deepEqual(invalidations, [["untracked", { id: "remote" }], ["short", { id: "remote" }]]);
assert.deepEqual(await cleanupHostHandoffTransfer({ rolloutPath: "/tmp/rollout" }, deps), { success: true });
assert.equal(events.at(-1).rolloutPath, "/tmp/rollout");
console.log("test-worker-git-worktree-handoff-dispatch: 6 assertions passed");
