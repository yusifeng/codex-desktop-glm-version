#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, ".tmp-test-parse-git-remote-url.mjs");
await build({ entryPoints: [path.join(root, "src/renderer/app-shared/runtime/parse-git-remote-url.ts")], bundle: true, format: "esm", platform: "node", outfile: output });
const { parseGitRemoteUrl } = await import(`${output}?test=${Date.now()}`);
assert.deepEqual(parseGitRemoteUrl("https://github.com/openai/codex.git"), { host: "github.com", owner: "openai", repo: "codex" });
assert.deepEqual(parseGitRemoteUrl("git@gitlab.com:group/subgroup/repo.git"), { host: "gitlab.com", owner: "group/subgroup", repo: "repo" });
assert.equal(parseGitRemoteUrl("C:\\work\\repo"), null);
assert.equal(parseGitRemoteUrl("not-a-remote"), null);
console.log("4 app-shared Git remote assertions passed");
