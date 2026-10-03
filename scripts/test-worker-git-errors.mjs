#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";

const source = await fs.readFile("src/main/worker/git-errors.ts", "utf8");
const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" });
const module = { exports: {} };
new Function("module", "exports", code)(module, module.exports);
const { classifyGitError, gitSubcommand } = module.exports;
assert.equal(classifyGitError("fatal: not a git repository"), "repository_missing");
assert.equal(classifyGitError("fatal: Authentication failed for origin"), "authentication");
assert.equal(classifyGitError("nothing recognizable"), "unknown");
assert.equal(gitSubcommand(["git", "-c", "x=y", "status"], 1), "status");
assert.equal(gitSubcommand(["git", "--wat"], 1), "other");
console.log("5 worker git error assertions passed");
