#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";

const source = await fs.readFile("src/main/worker/git-ignore-source-watch-policy.ts", "utf8");
const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" });
const module = { exports: {} };
new Function("module", "exports", code)(module, module.exports);
const { haveSameGitIgnorePaths, shouldRestartGitIgnoreSourceWatch } = module.exports;

assert.equal(haveSameGitIgnorePaths(new Set(["a", "b"]), new Set(["b", "a"])), true);
assert.equal(haveSameGitIgnorePaths(new Set(["a"]), new Set(["a", "b"])), false);
assert.equal(haveSameGitIgnorePaths(new Set(["a"]), new Set(["b"])), false);
const inside = (api, candidate, root) => candidate === root || candidate.startsWith(`${root}/`);
const base = { pathApi: {}, retryTimer: null, sourcePath: "/repo/.gitignore", changedPaths: ["/repo/.gitignore"], isWithinPath: inside };
assert.equal(shouldRestartGitIgnoreSourceWatch(base), true);
assert.equal(shouldRestartGitIgnoreSourceWatch({ ...base, retryTimer: {} }), false);
assert.equal(shouldRestartGitIgnoreSourceWatch({ ...base, changedPaths: ["/repo/src/a.ts"] }), false);
console.log("6 worker git ignore-source watch policy assertions passed");
