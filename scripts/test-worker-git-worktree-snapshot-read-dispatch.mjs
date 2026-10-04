import assert from "node:assert/strict"; import fs from "node:fs/promises"; import * as esbuild from "esbuild";
const source = await fs.readFile("src/main/worker/git-worktree-snapshot-read-dispatch.ts", "utf8"); const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" }); const module = { exports: {} }; new Function("module", "exports", code)(module, module.exports);
const { dispatchWorktreeSnapshotRead } = module.exports; const deps = { snapshotRef: (roots, path) => `ref:${roots.join(",")}:${path}`, managedState: (roots, cwd, path) => `state:${roots.join(",")}:${cwd}:${path}` };
assert.equal(await dispatchWorktreeSnapshotRead("worktree-snapshot-ref", { candidateRoots: ["/a", "/b"], worktreePath: "/w" }, deps), "ref:/a,/b:/w");
assert.equal(await dispatchWorktreeSnapshotRead("managed-worktree-state", { candidateRoots: ["/a"], cwd: "/c", worktreePath: "/w" }, deps), "state:/a:/c:/w");
assert.equal(await dispatchWorktreeSnapshotRead("unknown", {}, deps), undefined);
console.log("worker Git worktree snapshot read dispatch tests passed (3 assertions)");
