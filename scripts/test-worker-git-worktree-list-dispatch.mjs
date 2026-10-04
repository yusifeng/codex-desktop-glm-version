import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-worktree-list-dispatch-"));
const output = path.join(tempDir, "git-worktree-list-dispatch.cjs");
await esbuild.build({ entryPoints: [path.join(root, "src/main/worker/git-worktree-list-dispatch.ts")], outfile: output, bundle: true, format: "cjs", platform: "node", target: "esnext", logLevel: "silent" });
const { dispatchWorktreeListRequest } = createRequire(import.meta.url)(output);

const signal = new AbortController().signal;
const host = { id: "local" };
let received;
const deps = { host, signal, listWorktrees: async (...args) => { received = args; return { worktrees: ["/repo"] }; } };
assert.deepEqual(await dispatchWorktreeListRequest("list-worktrees", { cwd: "/repo" }, deps), { handled: true, result: { worktrees: ["/repo"] } });
assert.deepEqual(received, ["/repo", host, signal]);
assert.deepEqual(await dispatchWorktreeListRequest("unknown", { cwd: "/repo" }, deps), { handled: false, result: undefined });
console.log("test-worker-git-worktree-list-dispatch: 3 assertions passed");
