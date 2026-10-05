#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";

const source = await fs.readFile("src/main/worker/git-watch-acquire-policy.ts", "utf8");
const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" });
const module = { exports: {} };
new Function("module", "exports", code)(module, module.exports);
const { selectReusableGitWatch, shouldAcquireGitWatch } = module.exports;

assert.equal(shouldAcquireGitWatch(false), true);
assert.equal(shouldAcquireGitWatch(undefined), true);
assert.equal(shouldAcquireGitWatch(true), false);
const open = { closingPromise: undefined, refCount: 1 };
assert.equal(selectReusableGitWatch(open), open);
assert.equal(selectReusableGitWatch({ closingPromise: Promise.resolve() }), null);
assert.equal(selectReusableGitWatch(null), null);
console.log("6 worker git watch acquire policy assertions passed");
