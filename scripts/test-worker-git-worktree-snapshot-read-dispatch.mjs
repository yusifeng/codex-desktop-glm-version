import assert from "node:assert/strict"; import fs from "node:fs/promises"; import * as esbuild from "esbuild"; import os from "node:os"; import path from "node:path"; import { createRequire } from "node:module";
const dir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-snapshot-read-dispatch-")); const output = path.join(dir, "dispatch.cjs"); await esbuild.build({ entryPoints: ["src/main/worker/git-worktree-snapshot-read-dispatch.ts"], outfile: output, bundle: true, format: "cjs", platform: "node", target: "esnext", logLevel: "silent" }); const module = { exports: createRequire(import.meta.url)(output) };
const { dispatchWorktreeSnapshotRead } = module.exports; const deps = { snapshotRef: (roots, path) => `ref:${roots.join(",")}:${path}`, managedState: (roots, cwd, path) => `state:${roots.join(",")}:${cwd}:${path}` };
assert.equal(await dispatchWorktreeSnapshotRead("worktree-snapshot-ref", { candidateRoots: ["/a", "/b"], worktreePath: "/w" }, deps), "ref:/a,/b:/w");
assert.equal(await dispatchWorktreeSnapshotRead("managed-worktree-state", { candidateRoots: ["/a"], cwd: "/c", worktreePath: "/w" }, deps), "state:/a:/c:/w");
assert.equal(await dispatchWorktreeSnapshotRead("unknown", {}, deps), undefined);
console.log("worker Git worktree snapshot read dispatch tests passed (3 assertions)");
