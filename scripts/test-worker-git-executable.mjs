#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";

const source = await fs.readFile("src/main/worker/git-executable.ts", "utf8");
const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" });
const module = { exports: {} };
new Function("module", "exports", code)(module, module.exports);
const { getEnvironmentValue, hasPathOverride, mergeProcessEnvironment, rewriteGitCommandForWindows } = module.exports;

assert.equal(getEnvironmentValue({ Path: "x", PATH: "y", ComSpec: " cmd.exe " }, "path"), "y");
assert.equal(hasPathOverride({ Path: "x" }), true);
assert.deepEqual(mergeProcessEnvironment({ PATH: "custom", HOME: "h" }, { Path: "system", HOME: "old" }), { PATH: "custom", HOME: "h" });
assert.deepEqual(rewriteGitCommandForWindows(["git", "status"], undefined, true, { platform: "win32" }), ["git", "status"]);
assert.deepEqual(rewriteGitCommandForWindows(["echo", "x"], undefined, false, { platform: "linux" }), ["echo", "x"]);
const calls = [];
const rewritten = rewriteGitCommandForWindows(["git", "status"], { PATH: "custom", ComSpec: "custom-cmd" }, false, {
  platform: "win32",
  spawnSync(command, args) {
    calls.push({ command, args });
    return { status: 0, stdout: "C:\\Git\\cmd\\git.cmd\n" };
  },
  whereCommand: "where.exe",
});
assert.deepEqual(rewritten, ["custom-cmd", "/d", "/s", "/c", "C:\\Git\\cmd\\git.cmd", "status"]);
assert.equal(calls.length, 2);
console.log("6 worker git executable assertions passed");
