import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-worktree-resolution-dispatch-"));
const output = path.join(tempDir, "git-worktree-resolution-dispatch.cjs");
await esbuild.build({ entryPoints: [path.join(root, "src/main/worker/git-worktree-resolution-dispatch.ts")], outfile: output, bundle: true, format: "cjs", platform: "node", target: "esnext", logLevel: "silent" });
const { dispatchWorktreeResolutionRequest } = createRequire(import.meta.url)(output);

const params = { cwd: "/repo", conversationId: "thread-1" };
let received;
const deps = { resolveWorktreeForThread: async (value) => { received = value; return { worktreeGitRoot: "/repo/.worktree" }; } };
assert.deepEqual(await dispatchWorktreeResolutionRequest("resolve-worktree-for-thread", params, deps), { handled: true, result: { worktreeGitRoot: "/repo/.worktree" } });
assert.equal(received, params);
assert.deepEqual(await dispatchWorktreeResolutionRequest("unknown", params, deps), { handled: false, result: undefined });
console.log("test-worker-git-worktree-resolution-dispatch: 3 assertions passed");
