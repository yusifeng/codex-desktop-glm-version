import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const dir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-git-init-path-policy-"));
const out = path.join(dir, "policy.cjs");
await esbuild.build({
  entryPoints: [path.join(root, "src/main/worker/git-init-watcher-path-policy.ts")],
  outfile: out,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "esnext",
  logLevel: "silent",
});
const { shouldCheckGitInitPath } = createRequire(import.meta.url)(out);

assert.equal(shouldCheckGitInitPath([], "/repo/.git", "/"), true);
assert.equal(shouldCheckGitInitPath(undefined, "/repo/.git", "/"), true);
assert.equal(shouldCheckGitInitPath(["/repo/.git"], "/repo/.git", "/"), true);
assert.equal(shouldCheckGitInitPath(["/repo/.git/index"], "/repo/.git", "/"), true);
assert.equal(shouldCheckGitInitPath(["/repo/src/file.ts"], "/repo/.git", "/"), false);
assert.equal(shouldCheckGitInitPath(["/repo/.git-other"], "/repo/.git", "/"), false);
assert.equal(shouldCheckGitInitPath(["C:\\repo\\.git\\HEAD"], "C:\\repo\\.git", "\\"), true);
console.log("7 worker git init watcher path policy assertions passed");
